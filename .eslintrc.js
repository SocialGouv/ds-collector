// npm i -D eslint eslint-plugin-prettier eslint-config-prettier prettier

module.exports = {
  env: {
    browser: false,
    commonjs: true,
    es6: true,
    node: true,
    mocha: true,
    jest: true
    //   "jest/globals": true
  },
  extends: [
    "eslint:recommended",
    "plugin:prettier/recommended",
    "plugin:jest/recommended"
  ],
  parserOptions: {
    ecmaVersion: 7,
    ecmaFeatures: {
      experimentalObjectRestSpread: true,
      jsx: true
    },
    sourceType: "module"
  },
  plugins: ["prettier", "jest"],
  globals: {
    describe: true,
    it: true,
    beforeEach: true,
    afterEach: true,
    before: true,
    after: true
  },
  rules: {
    "prettier/prettier": "error",
    "no-unused-vars": "warn"
  }
};
