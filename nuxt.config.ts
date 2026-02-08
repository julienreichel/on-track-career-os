// https://nuxt.com/docs/api/configuration/nuxt-config
import { resolve } from 'node:path';

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  // Use src/ as the source directory for Nuxt
  srcDir: 'src/',

  modules: ['@nuxt/eslint', '@nuxt/ui', '@nuxtjs/i18n'],
  ssr: false, // Disable server-side rendering
  css: ['~/assets/css/main.css'],

  i18n: {
    locales: [
      {
        code: 'en',
        file: 'en.json',
        name: 'English',
      },
    ],
    langDir: '../i18n/locales',
    defaultLocale: 'en',
    strategy: 'no_prefix',
  },

  runtimeConfig: {
    public: {
      posthogPublicKey: process.env.PUBLIC_POSTHOG_KEY || '',
      posthogHost: process.env.PUBLIC_POSTHOG_HOST || 'https://eu.i.posthog.com',
      posthogDefaults: process.env.PUBLIC_POSTHOG_DEFAULTS || '2025-11-30',
    },
  },

  alias: {
    '@amplify': resolve(__dirname, './amplify'),
  },

  typescript: {
    tsConfig: {
      exclude: ['../test/**', '../test-results/**', '../playwright-report/**', '../coverage/**'],
    },
  },
});
