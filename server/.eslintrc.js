module.exports = {
  env: {
    commonjs: true,
    es6: true,
    node: true
  },
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly'
  },
  parserOptions: {
    ecmaVersion: 2018
  },
  extends: ['plugin:prettier/recommended'],
  rules: {
    'prettier/prettier': 'error'
  }
};
