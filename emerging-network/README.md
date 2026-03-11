# emerging.network

Emerging Manager VC Directory — trust-gated, operationally useful.

## Deploy in 3 steps

### Option A: Vercel (recommended)
```bash
npm install
npx vercel
```
Follow prompts → live URL in ~60 seconds.

### Option B: Netlify drag-and-drop
```bash
npm install
npm run build
```
Then drag the `/build` folder to netlify.com/drop.

### Option C: Run locally
```bash
npm install
npm start
```
Opens at http://localhost:3000

## Swap in real data
Edit the `funds` array in `src/App.jsx`. Each fund object takes:
- name, fund, size, vintage, stage, focus[], geo, checkSize
- status, lpStatus, thesis, portfolio[], coInvest, leadDeals
- connections[] (array of fund IDs for network graph)
- twitter, web, notes
