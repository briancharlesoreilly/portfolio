# Quite Weird — the interactive concept collection

A self-hosted presentation for Bathroom Mood Department, Sound Library and Domestic Peace Treaty. Built from the existing Quite Sharp Blender studies and the current shop briefs. No public deployment has been made.

## Hosting

Upload **the contents of `dist`** to the folder you want to serve. `index.html` must be at that folder's root, alongside `styles.css`, `app.js`, `viewer.js`, `assets`, `briefs` and `vendor`.

The ready-to-upload ZIP has this same layout at its root. Extract it before uploading unless your host supports ZIP extraction. Use an ordinary static web host, or a static folder on your existing site. No Node server, database, account, API key or build command is required. All paths are relative, so a subfolder such as `/quite-weird/` works too.

Serve the site over HTTP/HTTPS. Double-clicking index.html as a local file can block the 3D models because browsers restrict file-to-file requests. For a local preview, serve `dist` with a small local web server; for example, from this project folder: `python -m http.server 8765 --bind 127.0.0.1 --directory dist`, then visit `http://127.0.0.1:8765/`. Use your installed Python launcher if it has a different name. Localhost is only a preview on your own computer; send your friend the hosted address.

Your host should serve `.js` as JavaScript, `.glb` as `model/gltf-binary` or binary data, and PDFs normally. Standard static hosts generally handle these. Avoid an HTML fallback replacing missing model or script files.

## Exploring

- Choose one of the three objects.
- Drag with a mouse or one finger to orbit. The camera starts in an orthographic three-quarter view.
- Scroll or pinch to zoom; plus/minus buttons also work.
- Choose Assembled or Exploded, or scrub the slider between them.
- Hover or tap a piece for information. The component list provides the same inspection without precise pointing.
- Enlarge the viewer for a closer look; Escape closes it. Reset view restores the initial angle and zoom.
- Keyboard: focus the model, use arrow keys to rotate and +/− to zoom. Buttons, slider and component list are keyboard accessible.
- Each shop brief opens in a separate tab; the host/browser decides whether PDFs display inline or download.

## What is included

- Three local GLB assemblies, exported from the existing Blender scenes with evaluated holes and profiles, individual component identities and presentation-only exploded offsets.
- Original concept renders as loading/fallback images.
- QW01 R01, QW05 R03 and QW07 R03 shop-brief PDFs.
- Local Rubik regular/bold fonts and Three.js 0.180.0 viewer files, with their licence notices.
- Quite Sharp Option B palette: paper, ink, cobalt, butter and rose, managed in `styles.css`.

Only the selected GLB loads; previously visited models remain cached while the page is open. No third-party runtime requests, analytics, email collection, cookies, background audio or embedded services are included. A modern WebGL2-capable browser is required for the interactive view; the render remains if 3D initialization fails. Visual grain is a browser illustration, not a sampled material scan.

## Prototype boundary

The source Blender files were preserved. This site is a presentation derivative, not CAD, toolpaths or production approval. The source scenes contain simplified controls and omit some internal electronics, wiring, fixings and sample-dependent hardware. The exploded arrangement explains the modelled layers and components; it is not a complete physical assembly sequence. No working sound or device firmware is simulated here.

These are concepts for feedback, not products offered for sale. The PDFs intentionally include more technical prototype detail than the main presentation.

## Sharing with a trusted friend

The page includes a search-engine no-index hint, which is **not access control**. If you want the presentation and downloadable shop briefs to remain private, use your host's password protection or existing access controls for the entire folder. The package itself does not implement authentication. Anyone who can access a public hosted copy can download its assets and PDFs.

## Editing later

- Copy and descriptions: `viewer.js` (initial fallback copy also appears in `index.html`).
- Colour/type/spacing: `styles.css`.
- Product models: `assets/QW01.glb`, `assets/QW05.glb`, `assets/QW07.glb`.
- Briefs: `briefs/`.
- Model audit: `model-audit.json` outside the hosted folder records source files, mesh counts and part assignments.

Changing a Blender model or a CAD drawing does not automatically update this site. Re-export the changed model and review its part metadata/exploded relationships before replacing its GLB.
