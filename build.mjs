import { build } from "esbuild";
import { readFile, writeFile } from "fs/promises";
import { createHash } from "crypto";

const manifest = JSON.parse(await readFile("manifest.json", "utf8"));

await build({
  entryPoints: ["src/index.ts"],
  bundle: true,
  format: "iife",
  globalName: "plugin",
  platform: "neutral",
  target: "es2020",
  outfile: "dist/index.js",
  minify: true,
  banner: {
    js: "(() => {"
  },
  footer: {
    js: "return plugin.default;\n})();"
  },
  external: [
    "@vendetta/metro",
    "@vendetta/metro/common",
    "@vendetta/patcher",
    "@vendetta/ui/components",
    "@vendetta/ui/assets",
    "@vendetta/ui/toasts"
  ]
});

const js = await readFile("dist/index.js");
manifest.main = "index.js";
manifest.hash = createHash("sha256").update(js).digest("hex");
await writeFile("dist/manifest.json", JSON.stringify(manifest, null, 4) + "\n");
