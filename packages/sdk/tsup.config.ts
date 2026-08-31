import { defineConfig } from "tsup";

export default defineConfig([
  // 1. NPM Module (ESM + CJS + Types)
  {
    entry: ["src/index.ts"],
    format: ["esm", "cjs"],
    dts: true,
    sourcemap: true,
    clean: true,
    minify: true,
    treeshake: true,
    target: "es2020",
    outDir: "dist",
  },
  // 2. Standalone Drop-in Script for <script> tag (outputs dist/script.js)
  {
    entry: {
      script: "src/script.ts",
    },
    format: ["iife"],
    globalName: "analytika",
    minify: true,
    sourcemap: false,
    target: "es2020",
    outDir: "dist",
    outExtension() {
      return {
        js: ".js",
      };
    },
  },
]);
