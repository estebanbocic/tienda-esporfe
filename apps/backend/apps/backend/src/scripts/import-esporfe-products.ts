import type { ExecArgs } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  MedusaError,
  ProductStatus,
} from "@medusajs/framework/utils"
import {
  createInventoryLevelsWorkflow,
  createProductCategoriesWorkflow,
  createProductOptionsWorkflow,
  createProductsWorkflow,
} from "@medusajs/medusa/core-flows"
import catalog from "../data/esporfe-products.json"

type CatalogProduct = (typeof catalog)[number]

export default async function importEsPorFeProducts({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const storefrontUrl = (process.env.STOREFRONT_URL ?? "http://localhost:4321").replace(
    /\/$/,
    ""
  )

  const { data: salesChannels } = await query.graph({
    entity: "sales_channel",
    fields: ["id", "name"],
  })
  const { data: shippingProfiles } = await query.graph({
    entity: "shipping_profile",
    fields: ["id"],
  })
  const { data: stockLocations } = await query.graph({
    entity: "stock_location",
    fields: ["id", "name"],
  })

  const salesChannel = salesChannels.find(
    (channel) => channel.name === "Tienda online Es Por Fé"
  )
  const shippingProfile = shippingProfiles[0]
  const stockLocation = stockLocations.find(
    (location) => location.name === "Bodega Es Por Fé"
  )

  if (!salesChannel || !shippingProfile || !stockLocation) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      "Falta el canal, perfil de despacho o bodega. Ejecuta primero las migraciones."
    )
  }

  const categoryNames = [...new Set(catalog.map((product) => product.category))]
  const { data: existingCategories } = await query.graph({
    entity: "product_category",
    fields: ["id", "name"],
  })
  const missingCategories = categoryNames.filter(
    (name) => !existingCategories.some((category) => category.name === name)
  )

  if (missingCategories.length) {
    await createProductCategoriesWorkflow(container).run({
      input: {
        product_categories: missingCategories.map((name) => ({
          name,
          is_active: true,
        })),
      },
    })
  }

  const { data: categories } = await query.graph({
    entity: "product_category",
    fields: ["id", "name"],
  })

  const { data: existingOptions } = await query.graph({
    entity: "product_option",
    fields: ["id", "title", "values.value"],
  })
  let formatOptionId = existingOptions.find(
    (option) => option.title === "Formato"
  )?.id

  if (!formatOptionId) {
    const { result } = await createProductOptionsWorkflow(container).run({
      input: {
        product_options: [
          {
            title: "Formato",
            values: ["Único"],
          },
        ],
      },
    })
    formatOptionId = result[0]?.id
  }

  if (!formatOptionId) {
    throw new MedusaError(
      MedusaError.Types.UNEXPECTED_STATE,
      "No se pudo crear la opción de producto Formato"
    )
  }

  const { data: existingProducts } = await query.graph({
    entity: "product",
    fields: ["handle"],
  })
  const existingHandles = new Set(
    existingProducts.map((product) => product.handle).filter(Boolean)
  )
  const productsToCreate = catalog.filter(
    (product) => !existingHandles.has(product.handle)
  )

  if (!productsToCreate.length) {
    logger.info("Los 19 productos de Es Por Fé ya están importados")
    return
  }

  await createProductsWorkflow(container).run({
    input: {
      products: productsToCreate.map((product) => {
        const category = categories.find(
          (candidate) => candidate.name === product.category
        )
        const imageUrl = `${storefrontUrl}/products/${product.image}`

        return {
          title: product.title,
          handle: product.handle,
          description: product.description,
          status: ProductStatus.PUBLISHED,
          thumbnail: imageUrl,
          images: [{ url: imageUrl }],
          shipping_profile_id: shippingProfile.id,
          category_ids: category ? [category.id] : [],
          sales_channels: [{ id: salesChannel.id }],
          options: [{ id: formatOptionId }],
          variants: [
            {
              title: "Formato único",
              sku: product.sku,
              manage_inventory: true,
              allow_backorder: false,
              options: {
                Formato: "Único",
              },
              prices: [
                {
                  currency_code: "clp",
                  amount: product.price,
                },
              ],
              metadata: {
                source: "Stock es por fe.xlsx",
                imported_stock: product.stock,
              },
            },
          ],
          metadata: {
            source: "Stock es por fe.xlsx",
            source_sku: product.sku,
          },
        }
      }),
    },
  })

  const stockBySku = new Map(
    productsToCreate.map((product) => [product.sku, product.stock])
  )
  const { data: variants } = await query.graph({
    entity: "product_variant",
    fields: ["sku", "inventory_items.inventory_item_id"],
    filters: {
      sku: productsToCreate.map((product) => product.sku),
    },
  })

  const inventoryLevels = variants.flatMap((variant) => {
    const quantity = variant.sku ? stockBySku.get(variant.sku) : undefined

    return (variant.inventory_items ?? []).flatMap((inventoryItem) =>
      inventoryItem?.inventory_item_id
        ? [
            {
              location_id: stockLocation.id,
              inventory_item_id: inventoryItem.inventory_item_id,
              stocked_quantity: quantity ?? 0,
            },
          ]
        : []
    )
  })

  if (inventoryLevels.length) {
    await createInventoryLevelsWorkflow(container).run({
      input: {
        inventory_levels: inventoryLevels,
      },
    })
  }

  const importedStock = productsToCreate.reduce(
    (total: number, product: CatalogProduct) => total + product.stock,
    0
  )

  logger.info(
    `Importados ${productsToCreate.length} productos y ${importedStock} unidades de stock`
  )
}
