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
    jwtSecret: process.env.JWT_SECRET,
    databaseUrl: process.env.DATABASE_URL,
    public: {
      wsUrl: process.env.NUXT_PUBLIC_WS_URL || "ws://localhost:1234",
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
