# Fantasy Hex Map Generator

[Open the generator](https://gallowshumorgaming.com/Map-Generator/) · [Westeros castles](https://gallowshumorgaming.com/Map-Generator/newTiles/westeros/preview.html) · [Browse all artwork](https://gallowshumorgaming.com/Map-Generator/tiles.html) · [Tile aligner](https://gallowshumorgaming.com/Map-Generator/aligner.html)

A static browser map maker with 334 terrain, settlement, decoration, river, road and coast assets, including a new collection of Westeros castles. The artwork and alignment load automatically. No account, API key or build step is required to use the website.

## Westeros castles

The **Westeros** paint palette includes 24 distinct strongholds and a straight east-west ice Wall. Castles have large, recognizable silhouettes and are also available in the Stamp menu with their proper names. Paint Wall tiles in a horizontal row to extend it across the map. Existing terrain choices are retained.

[Browse and download the collection](newTiles/westeros/preview.html). Each original is a transparent 1024 × 1536 PNG; the website uses smaller WebP downloads at the same resolution. The gallery supports searching, enlargement, and individual PNG downloads. Prompts are preserved in [the catalog](newTiles/westeros/catalog.json).

## On a phone

- Tap **Generate** to create a map. Open **Controls** to change the seed, terrain, rivers and other settings.
- Drag with one finger to move around. Pinch with two fingers to zoom, including while a painting tool is selected.
- Choose a painting tool and terrain under **Controls**, then tap **Done** to paint on the map.
- Tap **Save PNG** to download the map. Use **Save .json** in Controls to keep an editable copy.
- The controls open as a drawer, leaving the whole screen available for the map. Both portrait and landscape layouts are supported.

Phone defaults use a smaller map and render size; the same settings remain adjustable. Very large phone exports are limited to protect browser memory.

## Artwork and water

The pack contains 88 terrain/settlement/landmark tiles, 144 route pieces and bridges, eight decorations, 63 coast shapes, six river outlets, and 25 Westeros tiles. Shorelines appear around both lakes and seas, with open connections between joined lake cells. Generated rivers follow drainage routes from mountain sources. Source peaks remain visible and generated settlements avoid them.

`assets/tiles/` contains smaller WebP images for the website. `newTiles/map-ready/` preserves the transparent PNGs and alignment profile. Both use the same canvas dimensions and alpha transparency.

The original template frame is 300 × 450 pixels, with a 300 × 352 ground face. The alignment profile preserves raised peaks and treetops without changing spacing. Decorative sprites use their natural size relative to that frame. The high-resolution Westeros tiles have individually measured ground frames; the generator fits their height to the grid and draws matching terrain below their transparent silhouettes.

The tile aligner is optional; the supplied pack is already aligned. Custom folders can still be loaded in the generator. When opening `index.html` directly from disk, load the tile folder once to enable canvas export; the hosted website exports immediately.

## Development and checks

This directory is served directly by GitHub Pages. `index.html`, `newTiles/pack-data.js` and the asset folders must stay together. No backend or secret configuration is used.

To run browser checks:

```sh
npm ci
npx playwright install chromium
npm test
```

The test starts a local server and checks desktop, small-phone, portrait and landscape layouts; all 334 images; Westeros painting and stamps; touch panning and pinching; mountain river sources; and PNG downloads. It also checks both galleries, including a full-resolution castle download. Set `MAP_TEST_BROWSER` to an installed Chromium/Edge executable if needed. Set `MAP_TEST_URL` to check a hosted deployment instead. Test screenshots and downloads are ignored under `tests/artifacts/`.

See [ARTWORK.md](ARTWORK.md) for artwork provenance.
