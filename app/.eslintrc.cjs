module.exports = {
  root: true,
  env: {
    browser: true,  // Enable browser global variable
    es2020: true,   // Enable ES2020 syntax
    node: true,     // Enable Node.js global variables & Node.js scoping
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended',
    'plugin:@typescript-eslint/recommended', // TypeScipt rules
  ],
  ignorePatterns: ['dist', 'node_modules'],
  parser: '@typescript-eslint/parser', // TypeScipt rules
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  settings: {
    react: {
      version: 'detect', // Automatically detect the React version
    },
  },
  plugins: [
    'react',
    'react-hooks',
    '@typescript-eslint', // TypeScipt rules
  ],
  rules: {
    'react/jsx-no-target-blank': 'off',
    'react-hooks/rules-of-hooks': 'error', 
    'react-hooks/exhaustive-deps': 'warn', 
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }], // TypeScipt rules
  },
}