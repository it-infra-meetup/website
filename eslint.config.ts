import js from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";
import { defineConfig } from "eslint/config";

export default defineConfig([
  js.configs.recommended,
  tseslint.configs.recommendedTypeChecked,
  {
    ignores: ["**/dist/**", "**/node_modules/**", "apps/**", "packages/**"],
  },
  {
    files: ["*.config.{ts,mjs,js}"],
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
      globals: { ...globals.nodeBuiltin },
    },
  },
]);
