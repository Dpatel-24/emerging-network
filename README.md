# emerging.network

Most VC directories cover Silicon Valley and stop there. This one doesn't. Emerging Networks tracks the funds, investors, and ecosystem partners building startup activity outside the usual hubs, across regions like the Gulf South, the Southeast, and the Mountain West, where capital is thinner and harder to find.

The directory has four parts. Capital lists funds and the people writing checks. Partners covers the lawyers, accountants, and other service providers founders actually need, including ones we haven't vetted yet, marked openly as open seats rather than left out. Pulse tracks events and short dispatches on what's happening in each region. Map gives a geographic view of where the capital actually sits.

Everything is built on Vite and React, with Airtable as the backend and Vercel for hosting. Listings live in Airtable, not in the code, so updating the directory doesn't require a deploy.

## Deploy

Push to `main`. Vercel picks it up automatically through the GitHub integration.

## Editing content

Directory data (funds, investors, partners, events, dispatches) lives in Airtable. For styling changes, edit `src/lib/tokens.js` first rather than reaching for inline styles in `App.jsx`.
