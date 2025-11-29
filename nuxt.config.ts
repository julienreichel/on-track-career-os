// https://nuxt.com/docs/api/configuration/nuxt-config
import { resolve } from 'node:path';

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  // Use src/ as the source directory for Nuxt
  srcDir: 'src/',

  modules: [
    '@nuxt/eslint',
    '@nuxt/test-utils',
    '@nuxt/ui',
    '@nuxtjs/i18n',
    '@nuxt/test-utils/module',
  ],
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

  alias: {
    '@amplify': resolve(__dirname, './amplify'),
  },
});
