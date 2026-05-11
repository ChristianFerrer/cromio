/* One-off: bake the radar_cromio mark on a #10C56A rounded tile so the
   PWA install icon / favicon / apple-touch match the in-app <Logo> tile. */
const sharp = require("sharp");
const path = require("path");

const SIZE = 512;
const RADIUS = 96;
const PADDING = 64;
const BG = "#10C56A";

const tile = `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}">
  <rect width="${SIZE}" height="${SIZE}" rx="${RADIUS}" ry="${RADIUS}" fill="${BG}"/>
</svg>`;

const inner = SIZE - PADDING * 2;

(async () => {
  const radar = await sharp(path.join(__dirname, "..", "public", "radar_cromio.png"))
    .resize(inner, inner, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .toBuffer();

  await sharp(Buffer.from(tile))
    .composite([{ input: radar, top: PADDING, left: PADDING }])
    .png()
    .toFile(path.join(__dirname, "..", "public", "cromio_icon.png"));

  console.log("[icon] wrote public/cromio_icon.png (512×512)");
})();
