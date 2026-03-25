module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    project: './tsconfig.json',
  },
  plugins: ['@typescript-eslint'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  env: {
    node: true,
    browser: true,
    es2022: true,
  },
  rules: {
    // Enforce consistent naming
    'no-unused-vars': 'off', // Handled by @typescript-eslint
    '@typescript-eslint/no-unused-vars': [
      'warn',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      },
    ],

    // Error handling
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/explicit-function-return-types': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',

    // Type safety (warnings for now)
    '@typescript-eslint/no-unsafe-assignment': 'warn',
    '@typescript-eslint/no-unsafe-return': 'warn',
    '@typescript-eslint/no-unsafe-member-access': 'warn',
    '@typescript-eslint/no-unsafe-argument': 'warn',
    '@typescript-eslint/no-non-null-assertion': 'warn',
    '@typescript-eslint/no-floating-promises': 'warn',
    '@typescript-eslint/await-thenable': 'warn',
    '@typescript-eslint/no-implied-eval': 'warn', // TODO: Replace new Function() with safe evaluator
    '@typescript-eslint/no-unnecessary-type-assertion': 'warn',
    '@typescript-eslint/no-redundant-type-constituents': 'warn',

    // Code quality
    'no-console': [
      'warn',
      {
        allow: ['warn', 'error', 'debug'],
      },
    ],
    'no-debugger': 'error',
    'prefer-const': 'warn',
    'no-var': 'error',

    // Best practices
    eqeqeq: ['error', 'always'],
    'no-eval': 'error',
    'no-new-func': 'warn', // TODO: Replace with safe evaluator
    'no-script-url': 'error',
    '@typescript-eslint/ban-types': [
      'warn',
      {
        types: {
          Function: false, // Allow Function type for callbacks
        },
      },
    ],
  },
  overrides: [
    {
      files: ['**/*.test.ts', '**/*.spec.ts'],
      env: {
        jest: true,
      },
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
      },
    },
  ],
};
