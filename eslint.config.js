// @ts-check
import { globalIgnores } from 'eslint/config'
import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import angular from 'angular-eslint'
import prettier from 'eslint-config-prettier'


export default tseslint.config(
  // MUST come first: shared/dist exists immediately after `npm install` (shared's prepare
  // hook builds it), and ESLint's only default ignores are node_modules/ and .git/.
  globalIgnores([
    '**/dist/**',
    '**/out-tsc/**',
    '**/coverage/**',
    'client/.angular/**',
    '**/node_modules/**',
  ]),

  // Every TypeScript file in the repo.
  {
    files: ['**/*.ts'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
    },
  },

  // Express 5 footguns, banned at the linter rather than in a comment nobody reads.
  {
    files: ['server/**/*.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: "CallExpression[callee.object.name='res'][callee.property.name='send']",
          message:
            'Use respond.ok()/created()/noContent(). In Express 5, res.send(200) sends the BODY 200 instead of setting the status.',
        },
        {
          selector: "AssignmentExpression[left.object.name='req'][left.property.name='query']",
          message:
            'req.query is getter-only in Express 5. Validation middleware writes coerced output to req.valid.',
        },
      ],
    },
  },

  // Angular: TS sources and HTML templates are linted by different processors.
  {
    files: ['client/**/*.ts'],
    extends: [...angular.configs.tsRecommended],
    processor: angular.processInlineTemplates,
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        { type: 'attribute', prefix: 'app', style: 'camelCase' },
      ],
      '@angular-eslint/component-selector': [
        'error',
        { type: 'element', prefix: 'app', style: 'kebab-case' },
      ],
    },
  },
  {
    files: ['client/**/*.html'],
    extends: [...angular.configs.templateRecommended, ...angular.configs.templateAccessibility],
  },

  // Node scripts are plain JS.
  {
    files: ['scripts/**/*.mjs', '*.js'],
    extends: [js.configs.recommended],
    languageOptions: {
      globals: {
        process: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        URL: 'readonly',
        Buffer: 'readonly',
      },
    },
  },

  prettier,
);