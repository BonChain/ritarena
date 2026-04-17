import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: {
      index: "src/index.ts",
      "live/index": "src/live/index.ts",
      "hooks/index": "src/hooks/index.ts",
    },
    format: ["cjs", "esm"],
    dts: true,
    splitting: false,
    clean: true,
    external: ["react", "react-dom", "@ritarena/sdk"],
  },
]);
