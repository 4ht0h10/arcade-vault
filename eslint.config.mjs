import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Prototype templates (React UMD globals), reference material only.
    "references/**",
  ]),
  // Turn off rules that conflict with Prettier formatting.
  prettier,
  // Superfluous whitespace Prettier leaves alone (e.g. inside comments). Template literals are untouched.
  {
    rules: {
      "no-trailing-spaces": ["error", { ignoreComments: false }],
      "no-multiple-empty-lines": ["error", { max: 1, maxBOF: 0, maxEOF: 0 }],
      // Catches code after return/throw, e.g. a `return` alone on its line before JSX.
      "no-unreachable": "error",
    },
  },
]);

export default eslintConfig;
