// https://nuxt.com/docs/api/configuration/nuxt-config
import { resolve } from 'node:path';

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  // Use src/ as the source directory for Nuxt
  srcDir: 'src/',

  modules: ['@nuxt/eslint', '@nuxt/test-utils', '@nuxt/ui'],
  ssr: false, // Disable server-side rendering
  alias: {
    '@amplify': resolve(__dirname, './amplify'),
  },
  imports: {
    presets: [
      {
        from: 'vue-i18n',
        imports: ['useI18n'],
      },
    ],
  },
});
