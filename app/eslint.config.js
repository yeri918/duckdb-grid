import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";


export default [
  {files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"]},
  {languageOptions: { globals: globals.browser }},
  {plugins: {
    js: pluginJs,
    ts: tseslint,
    react: pluginReact,
  }},
  {settings: {
    react: {
      version: "detect", // Automatically detect the React version
    },
  }},
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  pluginReact.configs.flat.recommended,
];