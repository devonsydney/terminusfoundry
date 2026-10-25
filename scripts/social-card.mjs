// Render the home page's link-preview image (og:image) from the wordmark: 1200 x 630 on the page background, the
// lockup centred so a square crop (WhatsApp's small preview) still shows all of it.
// Run: npm run social-card   (needs sharp, a devDependency). Output is committed; rerun when the brand mark changes.
import sharp from "sharp";

const svg = "src/assets/logos/terminus-foundry-wordmark-dark.svg";
const out = "src/images/home/terminus-foundry-card.png";
const [width, height, markHeight] = [1200, 630, 340];

// The SVG has a wide margin round the lockup; trim it so markHeight is the height of the ink.
const ink = await sharp(svg, { density: 600 }).trim().png().toBuffer();
const mark = await sharp(ink).resize({ height: markHeight }).png().toBuffer();
const { width: markWidth } = await sharp(mark).metadata();

await sharp({ create: { width, height, channels: 3, background: "#202020" } })
  .composite([{ input: mark, left: Math.round((width - markWidth) / 2), top: Math.round((height - markHeight) / 2) }])
  .png({ compressionLevel: 9, palette: true })
  .toFile(out);

console.log(`${out}: ${width} x ${height}, mark ${markWidth} x ${markHeight}`);
