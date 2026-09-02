import { defineConfig } from "tsup";

export default defineConfig([
  // 1. NPM Library Bundle (ESM + CJS + Types)
  {
    entry: ["src/index.ts"],
    format: ["esm", "cjs"],
    dts: true,
    clean: true,
    sourcemap: true,
    minify: false,
    treeshake: true,
  },
  // 2. Standalone Minified Browser Script (<script src="https://analytika.me/a.js">)
  {
    entry: {
      a: "src/browser.ts",
    },
    format: ["iife"],
    outExtension() {
      return {
        js: ".js",
      };
    },
    globalName: "Analytika",
    minify: true,
    dts: false,
    clean: false,
    sourcemap: false,
    treeshake: true,
    target: "es2018",
  },
]);
