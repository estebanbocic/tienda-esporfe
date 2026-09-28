import { loadEnv, defineConfig } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET,
      cookieSecret: process.env.COOKIE_SECRET,
    },
  },
  modules: process.env.MERCADOPAGO_ACCESS_TOKEN
    ? [
        {
          resolve: "@medusajs/medusa/payment",
          options: {
            providers: [
              {
                resolve: "./src/modules/mercadopago-payment",
                id: "mercadopago",
                options: {
                  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
                  webhookSecret: process.env.MERCADOPAGO_WEBHOOK_SECRET,
                  notificationUrl: process.env.MERCADOPAGO_NOTIFICATION_URL,
                  storefrontUrl:
                    process.env.MERCADOPAGO_RETURN_URL ??
                    process.env.STOREFRONT_URL,
                },
              },
            ],
          },
        },
      ]
    : [],
})
