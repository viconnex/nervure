module.exports = {
  parser: "@typescript-eslint/parser", // Specifies the ESLint parser
  extends: [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier/@typescript-eslint",
    "plugin:prettier/recommended"
  ],
  parserOptions: {
    ecmaVersion: 2018, // Allows for the parsing of modern ECMAScript features
    sourceType: "module" // Allows for the use of imports
  },
  rules: {
    "prettier/prettier": "error",
    "@typescript-eslint/ban-ts-ignore": "off"
  },
  overrides: [
    {
      files: ["*-test.js", "*.spec.ts"],
      rules: {
        "@typescript-eslint/explicit-function-return-type": "off",
      }
    },
  ]
};
