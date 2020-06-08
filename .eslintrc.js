module.exports = {
  env: {
    browser: true,
    node: true,
    es6: true,
  },
  extends: [
    'plugin:react/recommended',
    'airbnb',
  ],
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly',
  },
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
      impliedStrict: true,
    },
    ecmaVersion: 2018,
    sourceType: 'module',
  },
  plugins: [
    'react',
    'graphql',
  ],
  rules: {
    'no-underscore-dangle': 0,
    'react/forbid-prop-types': 0,
    'react/jsx-filename-extension': [1, { 'extensions': ['.js', '.jsx'] }],
  },
};
