import js from "@eslint/js";
import globals from "globals";
import { defineConfig } from "eslint/config";


export default defineConfig([
  {
    files: [
      "{src,test}/*.{js,mjs,cjs}",
    ],
    plugins: {
      js,
    },
    extends: [
      "js/recommended",
    ],
    rules: {
      'brace-style': ['error', 'stroustrup'],
      'comma-dangle': ['error', 'always-multiline'],
      'indent': ['error', 2],
      'semi': ['error', 'always'],
    },
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.mocha,
      },
    },
  },
]);
