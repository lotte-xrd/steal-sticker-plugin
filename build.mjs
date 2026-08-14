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
    js: "return plugin.default;\n})()"
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

let js = (await readFile("dist/index.js", "utf8")).trim();
if (js.endsWith(";")) {
  js = js.slice(0, -1).trim();
}
await writeFile("dist/index.js", js);

const hash = createHash("sha256").update(js).digest("hex");

manifest.main = "dist/index.js";
manifest.hash = hash;
await writeFile("manifest.json", JSON.stringify(manifest, null, 4) + "\n");

const distManifest = { ...manifest, main: "index.js" };
await writeFile("dist/manifest.json", JSON.stringify(distManifest, null, 4) + "\n");
