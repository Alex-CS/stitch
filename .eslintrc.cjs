/* eslint-env node */
module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  plugins: [
    'import',
  ],
  extends: [
    'plugin:@typescript-eslint/recommended',
    'plugin:vue/vue3-recommended', // https://v3.vuejs.org/style-guide/#style-guide
    'airbnb-typescript/base', // https://airbnb.io/javascript/
  ],

  parser: 'vue-eslint-parser',
  parserOptions: {
    ecmaVersion: 2018,
    parser: '@typescript-eslint/parser',
    sourceType: 'module',
    project: 'tsconfig.json',
    tsconfigRootDir: '.',
    extraFileExtensions: [
      '.vue',
    ],
  },

  settings: {
    'import/resolver': {
      typescript: {
        // always try to resolve types under `<root>@types` directory even it doesn't contain any source code,
        // like `@types/unist`
        alwaysTryTypes: true,
      },
    },
  },

  // See the docs for a rule by going to https://eslint.org/docs/rules/<rule>
  // For `import/<rule>`: https://github.com/benmosher/eslint-plugin-import/blob/master/docs/rules/<rule>.md
  // For `vue/<rule>`: https://eslint.vuejs.org/rules/<rule>.html
  rules: {

    // Disabled Rules ---------------------------------------------------------
    '@typescript-eslint/no-explicit-any': 0,
    camelcase: 0,
    'global-require': 0,
    'no-underscore-dangle': 0,
    'import/prefer-default-export': 0,
    // 'object-curly-newline': 0,

    // De-escalated rules
    'consistent-return': 1,
    'prefer-destructuring': 1,
    'no-param-reassign': [
      'warn',
      {
        props: true,
        ignorePropertyModificationsFor: [
          'acc', // for reduce accumulators
          'accumulator', // for reduce accumulators
          'e', // for e.returnvalue
          'ctx', // for Koa routing
          'context', // for Koa routing
          'req', // for Express requests
          'request', // for Express requests
          'res', // for Express responses
          'response', // for Express responses
        ],
      },
    ],

    // Customized Basic Rules -------------------------------------------------
    eqeqeq: [
      'error',
      'always',
      {
        null: 'ignore',
      },
    ],
    'func-names': [
      'error',
      'always',
    ],
    'implicit-arrow-linebreak': [
      'error',
      'beside',
    ],
    'no-unused-vars': [
      'error',
      {
        args: 'after-used',
        argsIgnorePattern: '^\\w$', // Allow single-character unused args
        ignoreRestSiblings: true,
      },
    ],
    'lines-between-class-members': [
      'error',
      'always',
      {
        exceptAfterSingleLine: true,
      },
    ],
    'max-len': [
      'error',
      100, // length
      2, // tab size
      {
        // Ignore these because it may be impractical to chop them across lines
        // (though you should still try if you can)
        ignoreUrls: true,
        ignoreComments: true,
        ignoreRegExpLiterals: true,
        ignoreStrings: true,
        ignoreTemplateLiterals: true,
      },
    ],

    // Vue Rules --------------------------------------------------------------
    'vue/max-len': [
      'error',
      {
        code: 100,
        // Allow html attributes to be long because they can be tricky to chop down
        ignoreHTMLAttributeValues: true,
        // Shadow the same values from the built-in max-len rule
        ignoreUrls: true,
        ignoreComments: true,
        ignoreRegExpLiterals: true,
        ignoreStrings: true,
        ignoreTemplateLiterals: true,
      },
    ],
    'vue/match-component-file-name': [
      'error',
      {
        extensions: [
          '.vue',
        ],
      },
    ],
    'vue/component-definition-name-casing': [
      'error',
      'PascalCase',
    ],
    'vue/component-name-in-template-casing': [
      'error',
      'PascalCase',
    ],
    'vue/component-tags-order': [
      'error',
      {
        order: [
          'script',
          'template',
          'style',
        ],
      },
    ],
    'vue/max-attributes-per-line': [
      'error',
      {
        singleline: 2,
        multiline: 1,
      },
    ],
    'vue/html-button-has-type': [
      'error',
      {
        button: true,
        submit: true,
        reset: true,
      },
    ],
    'vue/no-boolean-default': [
      'error',
    ],
    'vue/no-duplicate-attr-inheritance': [
      'error',
    ],
    'vue/no-potential-component-option-typo': [
      'error',
    ],
    'vue/no-reserved-component-names': [
      'error',
      {
        disallowVueBuiltInComponents: true,
        disallowVue3BuiltInComponents: true,
      },
    ],
    'vue/no-restricted-custom-event': [
      'error',
      {
        event: 'input',
        message: 'If you intend a prop for v-model, it should be "update:modelValue" in Vue 3.',
        suggest: 'update:modelValue',
      },
      {
        event: 'change',
        message: `
          "change" is a native event name and shadowing it could lead to duplicate fires.
          See https://github.com/vuejs/vue-next/issues/813#issuecomment-597695080
        `,
        suggest: 'update',
      },
      {
        event: 'click',
        message: `
          "click" is a native event name and shadowing it could lead to duplicate fires.
          Either listen to the native event, or use a more specific custom event.
          See https://github.com/vuejs/vue-next/issues/813#issuecomment-597695080
        `,
      },
      // TODO: add more common native events
    ],
    'vue/no-useless-v-bind': [
      'error',
    ],
    'vue/padding-line-between-blocks': [
      'error',
      'always',
    ],
    'vue/require-name-property': [
      'error',
    ],
    'vue/v-on-function-call': [
      'error',
      'never',
    ],
    'vue/valid-next-tick': [
      'error',
    ],

    // Import Rules -----------------------------------------------------------
    'import/order': [
      'error',
      {
        groups: [
          'builtin', // Node.js built-in modules.
          'external', // Libraries from `node_modules`
          'internal', // Aliases or anything resolved relative to the js base path
          'parent', // paths starting with `../`
          'sibling', // paths starting with `./`
        ],
        // Require blank lines _between_ groups and _allow_ them within a group,
        // (i.e. if a group is starting to get big and there's some logical subgroups)
        'newlines-between': 'always-and-inside-groups',
        alphabetize: { // Ensure a predictable order of imports with their groups
          order: 'asc',
          caseInsensitive: true,
        },
      },
    ],
    'import/newline-after-import': [
      'error',
      {
        count: 2,
      },
    ],
    'no-multiple-empty-lines': [
      'error',
      {
        max: 2,
        maxEOF: 0, // Technically 1, but that's enforced by 'eol-last'
      },
    ],

    // Only allow on dev
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'off',
  },
  reportUnusedDisableDirectives: true,
  overrides: [
  ],
};