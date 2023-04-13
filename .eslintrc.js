module.exports = {
  root: true,
  extends: ['react-app'],
  parserOptions: {
    ecmaVersion: 2020,
    project: ['tsconfig.json', 'tsconfig.test.json'],
    sourceType: 'module',
  },
  rules: {
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        varsIgnorePattern: '^_',
        argsIgnorePattern: '^_',
      },
    ],
  },
  overrides: [
    {
      files: '*.{ts,tsx}',
      rules: {
        '@typescript-eslint/no-explicit-any': 'error',
        '@typescript-eslint/no-unsafe-argument': 'error',
        '@typescript-eslint/no-unsafe-assignment': 'error',
        '@typescript-eslint/no-unsafe-call': 'error',
        '@typescript-eslint/no-unsafe-member-access': 'error',
        '@typescript-eslint/explicit-module-boundary-types': 'error',
        '@typescript-eslint/no-floating-promises': 'error',
        'no-console': 'warn',
        '@typescript-eslint/no-throw-literal': 'error',
      },
    },
    {
      files: ['**/__tests__/**/*.{ts,tsx}', 'scripts/**/*.ts'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-unsafe-argument': 'off',
        '@typescript-eslint/no-unsafe-assignment': 'off',
        '@typescript-eslint/no-unsafe-call': 'off',
        '@typescript-eslint/no-unsafe-member-access': 'off',
        '@typescript-eslint/explicit-module-boundary-types': 'off',
        '@typescript-eslint/no-floating-promises': 'off',
        '@typescript-eslint/no-throw-literal': 'off',
      },
    },
  ],
};
