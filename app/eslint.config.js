import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";
import eslintConfigPrettier from "eslint-config-prettier";


export default [
  {files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"]},        // rules applies to all matching files.
  {languageOptions: { globals: globals.browser }},  // extends the global variables available in the linting environment 
                                                    //      to include those specific to a browser environment
  {settings: {
    react: {
      version: "detect", // Automatically detect the React version
    },
  }},
  pluginJs.configs.recommended,                     // default js rules
  ...tseslint.configs.recommended,                  // default ts rules
  pluginReact.configs.flat.recommended,
  eslintConfigPrettier,
];