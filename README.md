# emerging.network

A curated directory of venture funds, investors, and ecosystem partners across emerging U.S. startup markets. Vite + React on the frontend, Airtable as the backend, Vercel for hosting.

## Structure

- `src/App.jsx` — the app: Capital, Partners, Pulse, and Map tabs, plus Terms/Privacy pages
- `src/lib/tokens.js` — colors, type scale, spacing (single source of truth for styling)
- `src/lib/components.jsx` — shared UI pieces (cards, panels, buttons) built from those tokens
- `api/airtable.js` — proxies reads to Airtable so the token never reaches the browser
- `api/contact.js` — handles "Get Listed" form submissions

## Run locally

```bash
npm install
npm run dev
```

Opens at `http://localhost:5173`. You'll need `AIRTABLE_BASE` and `AIRTABLE_TOKEN` set as environment variables for live data to load — the app still renders without them, just empty.

## Deploy

Push to `main`. Vercel picks it up automatically if the GitHub integration is connected; `vercel.json` already points it at `npm run build` and `dist/`.

## Editing content

Directory data (funds, investors, partners, events, dispatches) lives in Airtable, not in the code. To change styling, edit `src/lib/tokens.js` first, not inline styles in `App.jsx`.
