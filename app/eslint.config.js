import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";

// eslint.config.mjs
const eslintPluginPrettierRecommended = require('eslint-plugin-prettier/recommended');

export default [
  {files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"]},        // rules applies to all matching files.
  {languageOptions: { globals: globals.browser }},  // extends the global variables available in the linting environment 
                                                    //      to include those specific to a browser environment
  pluginJs.configs.recommended,                     // default js rules
  ...tseslint.configs.recommended,                  // default ts rules
  pluginReact.configs.flat.recommended,
  eslintPluginPrettierRecommended,

  {
    rules: {
      eqeqeq: "off",
      "no-unused-vars": "error",
      "prefer-const": ["error", { ignoreReadBeforeAssign: true }],
    },
  },

  {
    ignores: [".node_modules/*"]
  },
];