// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs';

export default withNuxt({
  rules: {
    // Allow single-word component names for pages, layouts, and app.vue
    'vue/multi-word-component-names': [
      'error',
      {
        ignores: ['default', 'empty', 'error', 'index', 'login', '[id]', '[...slug]'],
      },
    ],
  },
});
