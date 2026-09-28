import type {
  AuthorizePaymentInput,
  AuthorizePaymentOutput,
  CancelPaymentInput,
  CancelPaymentOutput,
  CapturePaymentInput,
  CapturePaymentOutput,
  DeletePaymentInput,
  DeletePaymentOutput,
  GetPaymentStatusInput,
  GetPaymentStatusOutput,
  InitiatePaymentInput,
  InitiatePaymentOutput,
  ProviderWebhookPayload,
  RefundPaymentInput,
  RefundPaymentOutput,
  RetrievePaymentInput,
  RetrievePaymentOutput,
  UpdatePaymentInput,
  UpdatePaymentOutput,
  WebhookActionResult,
} from "@medusajs/framework/types"
import {
  AbstractPaymentProvider,
  BigNumber,
  MedusaError,
  PaymentActions,
  PaymentSessionStatus,
} from "@medusajs/framework/utils"
import {
  MercadoPagoConfig,
  Payment,
  PaymentRefund,
  Preference,
  WebhookSignatureValidator,
} from "mercadopago"
import type { PaymentResponse } from "mercadopago/dist/clients/payment/commonTypes"
import type { PreferenceRequest } from "mercadopago/dist/clients/preference/commonTypes"

type MercadoPagoOptions = {
  accessToken: string
  webhookSecret?: string
  notificationUrl?: string
  storefrontUrl?: string
}

type MercadoPagoData = Record<string, unknown> & {
  session_id?: string
  preference_id?: string
  payment_id?: string
  init_point?: string
  sandbox_init_point?: string
  payment_status?: string
}

class MercadoPagoPaymentProviderService extends AbstractPaymentProvider<MercadoPagoOptions> {
  static identifier = "mercadopago"

  protected preferenceClient_: Preference
  protected paymentClient_: Payment
  protected refundClient_: PaymentRefund

  static validateOptions(options: MercadoPagoOptions) {
    if (!options.accessToken) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "MERCADOPAGO_ACCESS_TOKEN es obligatorio"
      )
    }
  }

  constructor(container: Record<string, unknown>, options: MercadoPagoOptions) {
    super(container, options)

    const client = new MercadoPagoConfig({
      accessToken: options.accessToken,
      options: { timeout: 10000, maxRetries: 2 },
    })

    this.preferenceClient_ = new Preference(client)
    this.paymentClient_ = new Payment(client)
    this.refundClient_ = new PaymentRefund(client)
  }

  private amountToNumber(amount: InitiatePaymentInput["amount"]) {
    return new BigNumber(amount).numeric
  }

  private preferenceBody(
    amount: InitiatePaymentInput["amount"],
    currencyCode: string,
    data: MercadoPagoData,
    context?: InitiatePaymentInput["context"]
  ): PreferenceRequest {
    const sessionId = data.session_id
    if (!sessionId) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "La sesión de pago de Medusa no tiene identificador"
      )
    }

    const storefrontUrl = this.config.storefrontUrl?.replace(/\/$/, "")
    if (!storefrontUrl) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "STOREFRONT_URL es obligatorio para Mercado Pago"
      )
    }

    const body: PreferenceRequest = {
      items: [
        {
          id: sessionId,
          title: "Pedido Es Por Fé",
          quantity: 1,
          unit_price: this.amountToNumber(amount),
          currency_id: currencyCode.toUpperCase(),
        },
      ],
      external_reference: sessionId,
      back_urls: {
        success: `${storefrontUrl}/pago/exito/`,
        pending: `${storefrontUrl}/pago/pendiente/`,
        failure: `${storefrontUrl}/pago/error/`,
      },
      auto_return: "approved",
      payer: context?.customer
        ? {
            email: context.customer.email,
            name: context.customer.first_name ?? undefined,
            surname: context.customer.last_name ?? undefined,
          }
        : undefined,
      statement_descriptor: "ES POR FE",
    }

    if (this.config.notificationUrl) {
      body.notification_url = this.config.notificationUrl
    }

    return body
  }

  private statusFromPayment(status?: string): PaymentSessionStatus {
    switch (status) {
      case "approved":
        return PaymentSessionStatus.CAPTURED
      case "pending":
      case "in_process":
      case "in_mediation":
        return PaymentSessionStatus.PENDING_AUTHORIZATION
      case "cancelled":
      case "refunded":
      case "charged_back":
        return PaymentSessionStatus.CANCELED
      case "rejected":
        return PaymentSessionStatus.ERROR
      default:
        return PaymentSessionStatus.PENDING
    }
  }

  private paymentData(payment: PaymentResponse, current: MercadoPagoData) {
    return {
      ...current,
      payment_id: payment.id ? String(payment.id) : current.payment_id,
      payment_status: payment.status,
      payment_status_detail: payment.status_detail,
      transaction_amount: payment.transaction_amount,
      external_reference: payment.external_reference,
    }
  }

  private async findPayment(data?: Record<string, unknown>) {
    const current = (data ?? {}) as MercadoPagoData
    if (current.payment_id) {
      return this.paymentClient_.get({ id: current.payment_id })
    }

    if (!current.session_id) {
      return undefined
    }

    const result = await this.paymentClient_.search({
      options: {
        external_reference: current.session_id,
        sort: "date_created",
        criteria: "desc",
        limit: 1,
      },
    })
    const paymentId = result.results?.[0]?.id

    return paymentId ? this.paymentClient_.get({ id: paymentId }) : undefined
  }

  async initiatePayment({
    amount,
    currency_code,
    data,
    context,
  }: InitiatePaymentInput): Promise<InitiatePaymentOutput> {
    const current = (data ?? {}) as MercadoPagoData
    const preference = await this.preferenceClient_.create({
      body: this.preferenceBody(amount, currency_code, current, context),
      requestOptions: { idempotencyKey: context?.idempotency_key },
    })

    if (!preference.id || !preference.init_point) {
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        "Mercado Pago no devolvió una URL de pago"
      )
    }

    return {
      id: preference.id,
      status: PaymentSessionStatus.PENDING,
      data: {
        ...current,
        preference_id: preference.id,
        init_point: preference.init_point,
        sandbox_init_point: preference.sandbox_init_point,
      },
    }
  }

  async updatePayment({
    amount,
    currency_code,
    data,
    context,
  }: UpdatePaymentInput): Promise<UpdatePaymentOutput> {
    const current = (data ?? {}) as MercadoPagoData
    if (!current.preference_id) {
      return this.initiatePayment({ amount, currency_code, data, context })
    }

    const preference = await this.preferenceClient_.update({
      id: current.preference_id,
      updatePreferenceRequest: this.preferenceBody(
        amount,
        currency_code,
        current,
        context
      ),
      requestOptions: { idempotencyKey: context?.idempotency_key },
    })

    return {
      status: PaymentSessionStatus.PENDING,
      data: {
        ...current,
        init_point: preference.init_point ?? current.init_point,
        sandbox_init_point:
          preference.sandbox_init_point ?? current.sandbox_init_point,
      },
    }
  }

  async getPaymentStatus({ data }: GetPaymentStatusInput): Promise<GetPaymentStatusOutput> {
    const payment = await this.findPayment(data)
    if (!payment) {
      return { status: PaymentSessionStatus.PENDING, data }
    }

    return {
      status: this.statusFromPayment(payment.status),
      data: this.paymentData(payment, (data ?? {}) as MercadoPagoData),
    }
  }

  async authorizePayment(input: AuthorizePaymentInput): Promise<AuthorizePaymentOutput> {
    return this.getPaymentStatus(input)
  }

  async capturePayment({ data }: CapturePaymentInput): Promise<CapturePaymentOutput> {
    const payment = await this.findPayment(data)
    return {
      data: payment
        ? this.paymentData(payment, (data ?? {}) as MercadoPagoData)
        : data,
    }
  }

  async retrievePayment({ data }: RetrievePaymentInput): Promise<RetrievePaymentOutput> {
    const payment = await this.findPayment(data)
    return {
      data: payment
        ? this.paymentData(payment, (data ?? {}) as MercadoPagoData)
        : data,
    }
  }

  async cancelPayment({
    data,
    context,
  }: CancelPaymentInput): Promise<CancelPaymentOutput> {
    const payment = await this.findPayment(data)
    if (!payment?.id || !["pending", "in_process"].includes(payment.status ?? "")) {
      return { data }
    }

    const canceled = await this.paymentClient_.cancel({
      id: payment.id,
      requestOptions: { idempotencyKey: context?.idempotency_key },
    })
    return {
      data: this.paymentData(canceled, (data ?? {}) as MercadoPagoData),
    }
  }

  async deletePayment(input: DeletePaymentInput): Promise<DeletePaymentOutput> {
    return this.cancelPayment(input)
  }

  async refundPayment({
    amount,
    data,
    context,
  }: RefundPaymentInput): Promise<RefundPaymentOutput> {
    const payment = await this.findPayment(data)
    if (!payment?.id) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "No existe un pago de Mercado Pago para reembolsar"
      )
    }

    const refund = await this.refundClient_.create({
      payment_id: payment.id,
      body: { amount: this.amountToNumber(amount) },
      requestOptions: { idempotencyKey: context?.idempotency_key },
    })

    return {
      data: {
        ...(data ?? {}),
        last_refund_id: refund.id,
        last_refund_amount: refund.amount,
      },
    }
  }

  async getWebhookActionAndData({
    data,
    headers,
  }: ProviderWebhookPayload["payload"]): Promise<WebhookActionResult> {
    const event = data as {
      action?: string
      type?: string
      data?: { id?: string | number }
    }
    const paymentId = event.data?.id

    if (event.type !== "payment" || !paymentId) {
      return { action: PaymentActions.NOT_SUPPORTED }
    }

    if (!this.config.webhookSecret) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "MERCADOPAGO_WEBHOOK_SECRET es obligatorio para procesar webhooks"
      )
    }

    WebhookSignatureValidator.validate({
      xSignature: headers["x-signature"] as string | string[] | undefined,
      xRequestId: headers["x-request-id"] as string | string[] | undefined,
      dataId: String(paymentId),
      secret: this.config.webhookSecret,
      toleranceSeconds: 300,
    })

    const payment = await this.paymentClient_.get({ id: paymentId })
    if (!payment.external_reference || payment.transaction_amount === undefined) {
      return { action: PaymentActions.NOT_SUPPORTED }
    }

    const action = (() => {
      switch (payment.status) {
        case "approved":
          return PaymentActions.SUCCESSFUL
        case "pending":
        case "in_process":
        case "in_mediation":
          return PaymentActions.PENDING_AUTHORIZATION
        case "rejected":
          return PaymentActions.FAILED
        case "cancelled":
        case "refunded":
        case "charged_back":
          return PaymentActions.CANCELED
        default:
          return PaymentActions.NOT_SUPPORTED
      }
    })()

    if (action === PaymentActions.NOT_SUPPORTED) {
      return { action }
    }

    return {
      action,
      data: {
        session_id: payment.external_reference,
        amount: new BigNumber(payment.transaction_amount),
      },
    }
  }
}

export default MercadoPagoPaymentProviderService
