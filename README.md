# Platka Image Converter

Platka Image Converter is a privacy-first, browser-based image utility for converting, resizing, cropping, and compressing images. It is designed to feel fast and polished while keeping the selected files on the user's device.

Live application: [platka-image-converter.pages.dev](https://platka-image-converter.pages.dev/)

## Highlights

- Convert JPG, PNG, WEBP, GIF, and other browser-readable image formats to JPEG.
- Process multiple images in one session.
- Drag and drop, file picker, clipboard paste, or image URL import.
- Choose JPEG quality from 1% to 100%.
- Resize images while preserving aspect ratio.
- Visual crop editor with a draggable crop frame and eight resize handles.
- Crop images using direct manipulation or precise pixel coordinates.
- Download individual JPEG files or download the full queue as a ZIP archive.
- No account or permanent image storage.
- Responsive premium light interface with accessible controls, keyboard focus states, and reduced visual complexity.
- Platka brand logo used in the header, footer, favicon, and social preview metadata.

## Privacy model

Image processing runs in the browser using the Canvas API. Files selected from your device are not uploaded to a Platka server. Converted blobs are kept in browser memory for the current session and are released when the page is cleared or closed.

URL imports use a small Cloudflare edge proxy. The proxy fetches a public HTTP or HTTPS image URL, adds the CORS headers required by the browser, and stores the response in a temporary cache with a maximum lifetime of 5 minutes. The cache expires automatically and is not a permanent image archive. Requests are limited to public image URLs and images up to 25 MB.

Some source servers block Cloudflare proxy requests, time out, or restrict automated access. When that happens, download the image and use the file picker instead.

The ZIP download feature loads JSZip from the cdnjs CDN. This dependency is only used to package already-converted blobs in the browser.

## How to use

1. Open the [live converter](https://platka-image-converter.pages.dev/).
2. Choose files, drop them into the upload area, paste an image from the clipboard, or import an image URL.
3. For each image, choose `Resize image`, `Crop image`, or `Skip editing`.
4. In the crop editor, drag the red frame to move it or drag any handle to resize it. The pixel fields update live.
5. Adjust JPEG quality when needed.
6. Download individual results or use `Download all (.zip)`.

## Local development

This project is intentionally small and does not require a framework or build step.

### Run locally

Use any static file server from the project directory. For example, with Python:

```bash
python -m http.server 8080
```

Then open [http://localhost:8080](http://localhost:8080/).

Opening `index.html` directly works for the core file conversion flow. A local server is recommended when testing URL imports and browser security behavior. The `/api/image` proxy requires the Cloudflare Pages deployment to be running.

### Project structure

```text
.
├── index.html       # UI, styles, conversion logic, and legal modal content
├── _worker.js       # Temporary image URL proxy with a 5-minute edge cache
├── logo.png         # Platka brand logo and favicon source
├── robots.txt       # Crawler access policy and sitemap location
├── sitemap.xml      # Canonical public URL for search engines
├── wrangler.jsonc   # Cloudflare Pages configuration
└── README.md        # Project documentation
```

## Implementation notes

- The UI is built with semantic HTML, modern CSS, and vanilla JavaScript.
- `File`, `Blob`, `URL.createObjectURL()`, `Image`, `canvas`, and `canvas.toBlob()` provide the local processing pipeline.
- PNG transparency is composited onto white before JPEG export because JPEG does not support transparency.
- Original dimensions are preserved unless a resize or crop operation is selected.
- The crop frame maps pointer movement to the image's natural pixel dimensions and keeps the coordinate fields synchronized.
- Object URLs are revoked when they are replaced or cleared to avoid unnecessary memory retention.
- JSZip is loaded from `https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js` for ZIP exports.
- `_worker.js` handles `/api/image` before forwarding normal requests to the Pages asset binding.

## SEO and discoverability

The deployed page includes:

- A descriptive title and meta description.
- Canonical URL pointing to the production Pages domain.
- Open Graph and Twitter metadata for link previews.
- `WebApplication` JSON-LD structured data.
- A public `robots.txt` file.
- A public `sitemap.xml` file.

To request indexing, add `https://platka-image-converter.pages.dev/` to Google Search Console, submit `https://platka-image-converter.pages.dev/sitemap.xml`, and use URL Inspection to request a crawl.

## Deploy to Cloudflare Pages

The production project is named `platka-image-converter`.

```bash
npx wrangler@latest pages deploy . \
  --project-name platka-image-converter \
  --branch main \
  --commit-dirty=true
```

The Cloudflare Pages project uses the production branch `main`. The temporary URL proxy is available only through the deployed Pages Worker; the static HTML file server does not provide `/api/image` locally.

The repository is also available at [github.com/candrabasic/image_converter](https://github.com/candrabasic/image_converter).

## Brand and contact

Platka Image Converter is part of Platka Software Digital.

- Email: [platkasoftwaredigital@gmail.com](mailto:platkasoftwaredigital@gmail.com)
- Phone: `081111102880`
- Official websites: [platkadigital.com](https://platkadigital.com/) · [platka.io](https://platka.io/)

The app includes Privacy Policy and Terms & Conditions links in the footer. The legal copy is provided as general product information and should be reviewed by the project owner for the jurisdictions where the service is offered.

## License

No license has been declared yet. Add a `LICENSE` file before distributing or reusing this project outside the repository.
