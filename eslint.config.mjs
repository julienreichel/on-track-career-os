// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs';

// Constants for code quality rules
const MAX_NESTING_DEPTH = 4;
const MAX_FUNCTION_PARAMETERS = 4;

export default withNuxt(
  {
    rules: {
      // Allow single-word component names for pages, layouts, app.vue, and components in subfolders
      'vue/multi-word-component-names': [
        'error',
        {
          ignores: [
            'default',
            'empty',
            'error',
            'index',
            'login',
            'new',
            'print',
            '[id]',
            '[...slug]',
            // Components in cv/render subfolder
            'Block',
            'Editor',
          ],
        },
      ],

      // Code Quality Rules
      complexity: ['error', { max: 16 }], // Limit cyclomatic complexity
      'max-depth': ['error', MAX_NESTING_DEPTH], // Limit nesting depth
      'max-lines-per-function': ['error', { max: 100, skipBlankLines: true, skipComments: true }],
      'max-params': ['error', MAX_FUNCTION_PARAMETERS], // Limit function parameters
      'no-magic-numbers': [
        'warn',
        {
          ignore: [0, 1, -1],
          ignoreArrayIndexes: true,
          ignoreDefaultValues: true,
        },
      ],

      // TypeScript specific rules (non-type-aware)
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],

      // Vue specific rules
      'vue/max-attributes-per-line': ['error', { singleline: 5, multiline: 1 }],
      'vue/component-name-in-template-casing': [
        'error',
        'PascalCase',
        {
          registeredComponentsOnly: false,
          ignores: ['/^U[A-Z]/', '/^u-/', 'authenticator'],
        },
      ],
      'vue/require-default-prop': 'error',
      'vue/require-prop-types': 'error',

      // General best practices
      'no-var': 'error',
      'prefer-const': 'error',
      'prefer-arrow-callback': 'error',
      'arrow-spacing': 'error',
      eqeqeq: ['error', 'always'],
      'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
      'prefer-promise-reject-errors': 'off',
    },
  },
  // Relaxed rules for test files
  {
    files: ['test/**/*.{ts,js}', '**/*.test.{ts,js}', '**/*.spec.{ts,js}'],
    rules: {
      // Allow much longer functions in tests (comprehensive test suites)
      'max-lines-per-function': ['error', { max: 500, skipBlankLines: true, skipComments: true }],
      complexity: ['error', { max: 30 }],

      // Allow more magic numbers in tests (test data, expectations, etc.)
      'no-magic-numbers': 'off',

      // Allow more parameters for test setup functions
      'max-params': 'off',

      // Tests can be deeply nested (describe > describe > it > expect)
      'max-depth': 'off',

      // Allow any types in tests for mocking
      '@typescript-eslint/no-explicit-any': 'off',
    },
  }
);
