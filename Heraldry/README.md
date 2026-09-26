# Heraldry Catalog & Designer

A static GitHub Pages catalog of 42 transparent heraldic images, linked from the
Gallows Humor Gaming homepage. Open `/Heraldry/` for the catalog and
`/Heraldry/designer.html` for the supplied coat-of-arms designer.

## Features

- Search by name, category, description, or tags; filter six categories and saved charges.
- Preview against a checkerboard, light, dark, red, or blue background.
- Download individual transparent PNGs, scalable SVGs, or the complete ZIP.
- Read source credits and image licenses per item or in `CREDITS.md`.
- Add any catalog charge to the designer; artwork is embedded so SVG and PNG exports work without external image requests.
- Export source credits for the images used in a design. SVG designs include these credits as embedded metadata.
- Responsive, keyboard-accessible catalog with a native preview dialog.

## Files

- `catalog.json`: manifest, dimensions, categories, tags, source links, and licenses.
- `assets/`: 42 PNGs and 40 SVGs. The original supplied PNGs retain their pixels and alpha channel.
- `catalog.js`, `catalog.css`, `index.html`: catalog application, no build step.
- `designer.html`: supplied standalone designer, with catalog integration.
- `designer-catalog.js`, `designer-catalog.css`: in-designer charge picker and import handling.
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
