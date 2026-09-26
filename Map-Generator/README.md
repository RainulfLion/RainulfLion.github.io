# Fantasy Hex Map Generator

[Open the generator](https://gallowshumorgaming.com/Map-Generator/) · [Browse the artwork](https://gallowshumorgaming.com/Map-Generator/tiles.html) · [Tile aligner](https://gallowshumorgaming.com/Map-Generator/aligner.html)

A static browser map maker with 309 original terrain, settlement, decoration, river, road and coast assets. The artwork and alignment load automatically. No account, API key or build step is required to use the website.

## On a phone

- Tap **Generate** to create a map. Open **Controls** to change the seed, terrain, rivers and other settings.
- Drag with one finger to move around. Pinch with two fingers to zoom, including while a painting tool is selected.
- Choose a painting tool and terrain under **Controls**, then tap **Done** to paint on the map.
- Tap **Save PNG** to download the map. Use **Save .json** in Controls to keep an editable copy.
- The controls open as a drawer, leaving the whole screen available for the map. Both portrait and landscape layouts are supported.

Phone defaults use a smaller map and render size; the same settings remain adjustable. Very large phone exports are limited to protect browser memory.

## Artwork and water

The pack contains 88 terrain/settlement/landmark tiles, 144 route pieces and bridges, eight decorations, 63 coast shapes and six river outlets. Shorelines appear around both lakes and seas, with open connections between joined lake cells. Generated rivers follow drainage routes from mountain sources. Source peaks remain visible and generated settlements avoid them.

`assets/tiles/` contains smaller WebP images for the website. `newTiles/map-ready/` preserves the transparent PNGs and alignment profile. The WebP pack is about 6.3 MB compared with 31.5 MB for the PNG images. Both use the same canvas dimensions and alpha transparency.

The original template frame is 300 × 450 pixels, with a 300 × 352 ground face. The alignment profile preserves raised peaks and treetops without changing spacing. Decorative sprites use their natural size relative to that frame.

The tile aligner is optional; the supplied pack is already aligned. Custom folders can still be loaded in the generator. When opening `index.html` directly from disk, load the tile folder once to enable canvas export; the hosted website exports immediately.

## Development and checks

This directory is served directly by GitHub Pages. `index.html`, `newTiles/pack-data.js` and the asset folders must stay together. No backend or secret configuration is used.

To run browser checks:

```sh
npm ci
npx playwright install chromium
npm test
```

The test starts a local server and checks desktop, small-phone, portrait and landscape layouts; all 309 images; touch panning and pinching; painting; mountain river sources; and PNG downloads. Set `MAP_TEST_BROWSER` to an installed Chromium/Edge executable if needed. Set `MAP_TEST_URL` to check a hosted deployment instead. Test screenshots and downloads are ignored under `tests/artifacts/`.

See [ARTWORK.md](ARTWORK.md) for artwork provenance.
