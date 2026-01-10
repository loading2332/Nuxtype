// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },

  modules: [
    "@nuxtjs/tailwindcss",
    "shadcn-nuxt",
  ],

  shadcn: {
    prefix: "",
    componentDir: "./app/components/ui",
  },

  runtimeConfig: {
    jwtSecret: process.env.NUXT_JWT_SECRET || process.env.JWT_SECRET,
    databaseUrl: process.env.DATABASE_URL,
    // R2 Configuration (Private)
    r2: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      bucketName: process.env.R2_BUCKET_NAME,
      endpoint: process.env.R2_ENDPOINT,
      publicDomain: process.env.R2_PUBLIC_DOMAIN,
    },
    public: {
      wsUrl: process.env.NUXT_PUBLIC_WS_URL || "ws://localhost:1234",
      r2PublicDomain: process.env.R2_PUBLIC_DOMAIN,
    },
  },

  hooks: {
    "components:dirs": (dirs) => {
      for (const dir of dirs) {
        if (typeof dir === "object") {
          dir.extensions = ["vue"]
        }
      }
    },
  },
})
