# Park Regency — Website

Static export of the Park Regency website (parkregency.com redesign).
Built with WordPress + Elementor, exported as a fully self-contained static site —
no WordPress, PHP, or database required.

## Pages

| Page     | Path                  |
|----------|-----------------------|
| Home     | `index.html`          |
| Agents   | `agents/index.html`   |
| Careers  | `careers/index.html`  |
| Services | `services/index.html` |
| Contact  | `contact/index.html`  |

## Run it locally

Any static file server works. With Python installed:

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000

(Opening `index.html` directly by double-clicking will not load styles correctly —
browsers restrict local file access. Use a server as above.)

## Deploy

This folder can be hosted as-is on any static host:

- **GitHub Pages** — Settings → Pages → deploy from the `main` branch root.
- **Netlify / Vercel / Cloudflare Pages** — drag-and-drop the folder or connect the repo.
- **Any web host** — upload the folder contents to the web root via FTP.

## Notes

- **Agent directory**: all 126 agents are included in `wp-content/amp-agents.json`.
  Search, sorting, and pagination on the Agents page run fully in the browser.
  To update agent info, edit that JSON file.
- **Contact form & newsletter signup**: these were wired to WordPress and do not
  submit on a static site. To make them live, connect a form service
  (e.g. Formspree, Basin) or keep them as visual elements.
- The home page hero video streams from YouTube and requires an internet connection.
