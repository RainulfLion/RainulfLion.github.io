# Artwork provenance

The paintings and decorations in this pack were generated for this project using the supplied Plane template and the user's pine/brushland artwork as camera and scale references. Prepared copies share the same hex ground frame and lighting direction. The generation prompts and terrain/decorative descriptions are preserved under `newTiles/`.

River and road artwork was drawn from original geometry, with matching edge connections. Coasts combine newly generated beach sand with this project's own grass and shallow-water paintings, fitted to every neighboring-land arrangement. Bridges and river outlets were also created for this project.

Third-party Hex Samples images are not included, loaded by the website, copied into this pack, or supplied as generation references. Their filenames informed compatible asset names only.

The transparent PNGs are the prepared originals used by the app. WebP copies retain their dimensions and alpha channel, encoded at quality 88 with full alpha quality for faster loading. The original higher-resolution generation files and working revisions remain in the local workspace; they are not needed to run the website.

## Westeros collection

The 25 Westeros strongholds and east-west Wall are new fan-art interpretations made with built-in image generation, using this project's Winterfell tile as a style reference. Castle silhouettes were enlarged to remain prominent on maps. Oldtown is represented by the Hightower. These are artistic interpretations rather than architectural reconstructions.

The collection's full-resolution 1024 × 1536 transparent PNGs are included in `newTiles/map-ready/`. Their pixels are unchanged from the selected generation outputs. The Wall received one additional refinement to keep its crest horizontal at both tile boundaries. `newTiles/westeros/catalog.json` records the complete prompts, the refinement prompt and generated artifact identifiers without local filesystem paths.

Castle Black and Eastwatch were subsequently redrawn directly on the straight Wall tile. Castle Black connects at both edges; Eastwatch connects at its western edge and ends at the eastern sea. Shadow Tower was created from the same Wall template, with western crags and an eastern connection. All four use the same ground frame. `npm run test:wall` renders them together and checks the wall crest at every connecting edge.
