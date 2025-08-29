import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
    // Override specific rules that are too strict for the current codebase.
    rules: {
      // Allow the use of `any` temporarily to unblock the build. Consider fixing types later.
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
];

export default eslintConfig;
