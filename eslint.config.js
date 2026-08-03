import js from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";

export default [
  js.configs.recommended,
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tsParser,
      parserOptions: { ecmaVersion: "latest", sourceType: "module" },
      globals: {
        window: "readonly",
        document: "readonly",
        HTMLDivElement: "readonly",
        MouseEvent: "readonly",
        console: "readonly",
      },
    },
    plugins: { "@typescript-eslint": tseslint },
    rules: { ...tseslint.configs.recommended.rules },
  },
  { ignores: ["dist/", "node_modules/", "storybook-static/"] },
];
