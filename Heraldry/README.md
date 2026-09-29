# Heraldry Catalog & Designer

A static GitHub Pages catalog of 43 transparent heraldic images, linked from the
Gallows Humor Gaming homepage. Open `/Heraldry/` for the catalog and
`/Heraldry/designer.html` for the supplied coat-of-arms designer.

## Features

- Search by name, category, description, or tags; filter six categories and saved charges.
- Preview against a checkerboard, light, dark, red, or blue background.
- Download individual transparent PNGs, scalable SVGs, or the complete ZIP.
- Read source credits and image licenses per item or in `CREDITS.md`.
- Add any catalog charge to the designer; artwork is embedded so SVG and PNG exports work without external image requests.
- Recolor catalog images and uploaded artwork from Selected Layer (Adjust on phones). Choose Original colors, One color, Two colors (split), or Counterchanged (field colors). Keep dark details & shading preserves linework; leave it off for a solid silhouette. Transparency is retained; opaque source backgrounds remain opaque.
- Counterchanged charges follow the field division as they move or rotate, automatically reversing two field colors. With more colors, each region uses the next distinct color. Ordinaries and patterns do not affect this mapping. Split colors have independent pickers, five divisions, and a Swap colors button.
- Add the curled Cross Moline from the built-in charges or the image catalog, including transparent PNG and SVG downloads.
- Export source credits for the images used in a design. SVG designs include these credits as embedded metadata.
- Responsive, keyboard-accessible catalog with a native preview dialog.
- Phone designer with a persistent shield preview, five editing tabs, touch dragging and adjustment buttons, and a full-screen view. Landscape phones place controls beside the shield.
- Phone PNG exports show an image preview and offer native file sharing where supported, with a download fallback.

## Files

- `catalog.json`: manifest, dimensions, categories, tags, source links, and licenses.
- `assets/`: 43 PNGs and 41 SVGs. The original supplied PNGs retain their pixels and alpha channel.
- `catalog.js`, `catalog.css`, `index.html`: catalog application, no build step.
- `designer.html`: supplied standalone designer, with catalog integration.
- `designer-catalog.js`, `designer-catalog.css`: in-designer charge picker and import handling.
- `designer-colors.js`: non-destructive image recoloring, split colors, and field-aligned counterchanging.
- `designer-mobile.js`, `designer-mobile.css`, `catalog-mobile.css`: touch controls and small-screen layouts.
- `credits.html`, `CREDITS.md`: attribution and reuse terms.
- `heraldry-catalog.zip`: all image assets, the manifest, and credits.

Serve the repository root with any local HTTP server to preview. The website has
no server application and makes no external image requests. Web fonts are optional;
the page falls back to locally available fonts when offline.

Image licenses are per asset; see [CREDITS.md](CREDITS.md). The imported art's
CC BY-SA license does not relicense the supplied artwork or the application.

## Extending the collection

Add a transparent PNG and optional SVG under `assets/`, then add a manifest record
using the existing schema. Include width and height for the PNG, meaningful tags,
the artist, source URL, license URL, and any modifications. Update credits and
the downloadable ZIP whenever assets change. Do not add artwork without known
source and reuse terms. The category names in the catalog and designer picker
must agree.

## Checking color controls

With Playwright available, serve the repository on port 8765 and run
`node Heraldry/tests/color-controls.cjs`. Set `HERALDRY_BASE_URL` for another
server, or `PLAYWRIGHT_MODULE` to an installed Playwright module path.
The checks cover uploaded SVG/PNG pixels, original restoration, dark details,
counterchanging after transforms and field edits, catalog imports, duplication,
mobile controls, and exported SVG/PNG colors.
