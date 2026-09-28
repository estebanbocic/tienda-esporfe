import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { updateRegionsWorkflow } from "@medusajs/medusa/core-flows"

const PROVIDER_ID = "pp_mercadopago_mercadopago"

export default async function enableMercadoPago({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data: regions } = await query.graph({
    entity: "region",
    fields: ["id", "name", "currency_code"],
    filters: { currency_code: "clp" },
  })

  if (!regions.length) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      "No se encontró una región configurada en CLP"
    )
  }

  await updateRegionsWorkflow(container).run({
    input: {
      selector: { id: regions.map((region) => region.id) },
      update: { payment_providers: [PROVIDER_ID] },
    },
  })

  logger.info(
    `Mercado Pago habilitado en: ${regions.map((region) => region.name).join(", ")}`
  )
}
