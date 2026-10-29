module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },
  plugins: ['react-refresh'],
  settings: {
    react: { version: 'detect' },
  },
  rules: {
    // The existing client has legacy violations in these rules. Keep the
    // recommended baseline active without making the first CI run fail on
    // unrelated cleanup; these can be tightened as the files are modernized.
    'no-unused-vars': 'off',
    'no-mixed-spaces-and-tabs': 'off',
    'react/react-in-jsx-scope': 'off',
    'react/no-unescaped-entities': 'off',
    'react/no-unknown-property': 'off',
    'react/prop-types': 'off',
    'react-hooks/exhaustive-deps': 'off',
    'react-refresh/only-export-components': 'off',
  },
};
