import type { MedusaContainer } from "@medusajs/framework"
import {
  ContainerRegistrationKeys,
  MedusaError,
  ModuleRegistrationName,
  Modules,
} from "@medusajs/framework/utils"
import {
  createApiKeysWorkflow,
  createRegionsWorkflow,
  createSalesChannelsWorkflow,
  createShippingOptionsWorkflow,
  createStockLocationsWorkflow,
  createStoresWorkflow,
  createTaxRatesWorkflow,
  createTaxRegionsWorkflow,
  linkSalesChannelsToApiKeyWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
} from "@medusajs/medusa/core-flows"

const SANTIAGO_RATE = Number(process.env.SHIPPING_SANTIAGO_RATE_CLP ?? 3500)
const REGIONS_RATE = Number(process.env.SHIPPING_REGIONS_RATE_CLP ?? 7000)

const REGION_CODES = [
  "cl-ap",
  "cl-ta",
  "cl-an",
  "cl-at",
  "cl-co",
  "cl-vs",
  "cl-li",
  "cl-ml",
  "cl-nb",
  "cl-bi",
  "cl-ar",
  "cl-lr",
  "cl-ll",
  "cl-ai",
  "cl-ma",
] as const

export default async function seedEsPorFe({
  container,
}: {
  container: MedusaContainer
}) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const link = container.resolve(ContainerRegistrationKeys.LINK)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const fulfillmentService = container.resolve(
    ModuleRegistrationName.FULFILLMENT
  )

  logger.info("Configurando tienda Es Por Fé para Chile...")

  const {
    result: [salesChannel],
  } = await createSalesChannelsWorkflow(container).run({
    input: {
      salesChannelsData: [
        {
          name: "Tienda online Es Por Fé",
          description: "Canal de ventas del storefront chileno",
        },
      ],
    },
  })

  const {
    result: [publishableApiKey],
  } = await createApiKeysWorkflow(container).run({
    input: {
      api_keys: [
        {
          title: "Storefront Es Por Fé",
          type: "publishable",
          created_by: "",
        },
      ],
    },
  })

  await linkSalesChannelsToApiKeyWorkflow(container).run({
    input: {
      id: publishableApiKey.id,
      add: [salesChannel.id],
    },
  })

  await createStoresWorkflow(container).run({
    input: {
      stores: [
        {
          name: "Es Por Fé",
          supported_currencies: [
            {
              currency_code: "clp",
              is_default: true,
              is_tax_inclusive: true,
            },
          ],
          default_sales_channel_id: salesChannel.id,
        },
      ],
    },
  })

  const {
    result: [region],
  } = await createRegionsWorkflow(container).run({
    input: {
      regions: [
        {
          name: "Chile",
          currency_code: "clp",
          countries: ["cl"],
          payment_providers: [
            process.env.MERCADOPAGO_ACCESS_TOKEN
              ? "pp_mercadopago_mercadopago"
              : "pp_system_default",
          ],
          is_tax_inclusive: true,
        },
      ],
    },
  })

  const {
    result: [taxRegion],
  } = await createTaxRegionsWorkflow(container).run({
    input: [
      {
        country_code: "cl",
        provider_id: "tp_system",
      },
    ],
  })

  await createTaxRatesWorkflow(container).run({
    input: [
      {
        tax_region_id: taxRegion.id,
        name: "IVA Chile",
        code: "IVA-CL-19",
        rate: 19,
        is_default: true,
      },
    ],
  })

  const {
    result: [stockLocation],
  } = await createStockLocationsWorkflow(container).run({
    input: {
      locations: [
        {
          name: "Bodega Es Por Fé",
          address: {
            city: "Santiago",
            province: "cl-rm",
            country_code: "CL",
            address_1: "",
          },
        },
      ],
    },
  })

  await link.create({
    [Modules.STOCK_LOCATION]: {
      stock_location_id: stockLocation.id,
    },
    [Modules.FULFILLMENT]: {
      fulfillment_provider_id: "manual_manual",
    },
  })

  const fulfillmentSet = await fulfillmentService.createFulfillmentSets({
    name: "Despachos Es Por Fé",
    type: "shipping",
    service_zones: [
      {
        name: "Santiago",
        geo_zones: [
          {
            type: "province",
            country_code: "cl",
            province_code: "cl-rm",
          },
        ],
      },
      {
        name: "Regiones de Chile",
        geo_zones: REGION_CODES.map((provinceCode) => ({
          type: "province" as const,
          country_code: "cl",
          province_code: provinceCode,
        })),
      },
    ],
  })

  await link.create({
    [Modules.STOCK_LOCATION]: {
      stock_location_id: stockLocation.id,
    },
    [Modules.FULFILLMENT]: {
      fulfillment_set_id: fulfillmentSet.id,
    },
  })

  const { data: shippingProfiles } = await query.graph({
    entity: "shipping_profile",
    fields: ["id"],
  })
  const shippingProfile = shippingProfiles[0]

  if (!shippingProfile) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      "No se encontró el perfil de despacho predeterminado"
    )
  }

  const commonRules = [
    {
      attribute: "enabled_in_store",
      value: "true",
      operator: "eq" as const,
    },
    {
      attribute: "is_return",
      value: "false",
      operator: "eq" as const,
    },
  ]

  await createShippingOptionsWorkflow(container).run({
    input: [
      {
        name: "Despacho en Santiago",
        price_type: "flat",
        provider_id: "manual_manual",
        service_zone_id: fulfillmentSet.service_zones[0].id,
        shipping_profile_id: shippingProfile.id,
        type: {
          label: "Despacho en Santiago",
          description: "Tarifa fija para la Región Metropolitana",
          code: "santiago-flat",
        },
        prices: [{ region_id: region.id, amount: SANTIAGO_RATE }],
        rules: commonRules,
      },
      {
        name: "Despacho a regiones",
        price_type: "flat",
        provider_id: "manual_manual",
        service_zone_id: fulfillmentSet.service_zones[1].id,
        shipping_profile_id: shippingProfile.id,
        type: {
          label: "Despacho a regiones",
          description: "Tarifa fija para las otras 15 regiones de Chile",
          code: "regions-flat",
        },
        prices: [{ region_id: region.id, amount: REGIONS_RATE }],
        rules: commonRules,
      },
    ],
  })

  await linkSalesChannelsToStockLocationWorkflow(container).run({
    input: {
      id: stockLocation.id,
      add: [salesChannel.id],
    },
  })

  logger.info(
    `Tienda chilena configurada: Santiago $${SANTIAGO_RATE}, regiones $${REGIONS_RATE}`
  )
  logger.info(`Publishable API key: ${publishableApiKey.token}`)
}
