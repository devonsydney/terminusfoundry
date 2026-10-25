// Render the favicon set from the brand tile mark (terminus-foundry-logomark-tile.svg) into src/assets/favicons/.
// Run: npm run favicons   (needs sharp, a devDependency). Output is committed; rerun when the brand mark changes.
import sharp from "sharp";
import fs from "node:fs/promises";
import path from "node:path";

const svg = "src/assets/logos/terminus-foundry-logomark-tile.svg";
const out = "src/assets/favicons";
await fs.mkdir(out, { recursive: true });

const png = async (size) => sharp(svg, { density: 384 }).resize(size, size).png().toBuffer();

const files = { "favicon-16.png": 16, "favicon-32.png": 32, "favicon-48.png": 48, "apple-touch-icon.png": 180, "icon-192.png": 192, "icon-512.png": 512 };
const buffers = {};
for (const [name, size] of Object.entries(files)) {
  buffers[name] = await png(size);
  await fs.writeFile(path.join(out, name), buffers[name]);
}
await fs.copyFile(svg, path.join(out, "favicon.svg"));

// favicon.ico: an ICO directory wrapping the 16, 32 and 48 px PNGs (PNG-in-ICO, supported by every current browser).
const entries = ["favicon-16.png", "favicon-32.png", "favicon-48.png"].map((n) => ({ size: files[n], data: buffers[n] }));
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0); header.writeUInt16LE(1, 2); header.writeUInt16LE(entries.length, 4);
let offset = 6 + 16 * entries.length;
const dir = [];
for (const e of entries) {
  const d = Buffer.alloc(16);
  d.writeUInt8(e.size, 0); d.writeUInt8(e.size, 1); d.writeUInt8(0, 2); d.writeUInt8(0, 3);
  d.writeUInt16LE(1, 4); d.writeUInt16LE(32, 6); d.writeUInt32LE(e.data.length, 8); d.writeUInt32LE(offset, 12);
  offset += e.data.length;
  dir.push(d);
}
await fs.writeFile(path.join(out, "favicon.ico"), Buffer.concat([header, ...dir, ...entries.map((e) => e.data)]));

await fs.writeFile(path.join(out, "site.webmanifest"), JSON.stringify({
  name: "Terminus Foundry",
  short_name: "Terminus Foundry",
  icons: [
    { src: "/assets/favicons/icon-192.png", sizes: "192x192", type: "image/png" },
    { src: "/assets/favicons/icon-512.png", sizes: "512x512", type: "image/png" },
  ],
  theme_color: "#202020",
  background_color: "#202020",
  display: "browser",
}, null, 2) + "\n");

console.log(`favicons written to ${out}/: ${Object.keys(files).join(", ")}, favicon.svg, favicon.ico, site.webmanifest`);
