# Alloy Index

> A brand partnership assessment tool — powered by Tavily research + Gemini 2.5 Flash

Enter any talent or brand, get a scored analysis across 5 dimensions backed by live web research.

---

## Stack

- **Next.js 14** (App Router)
- **Gemini 2.5 Flash** (`gemini-2.5-flash`) for scoring
- **Tavily** for live web research on talent
- No UI libraries — custom SVG radar chart, CSS-only animations

API keys live **server-side only** in environment variables. They never touch the browser.

---

## Local Setup

### 1. Clone and install

```bash
git clone https://github.com/YOUR_USERNAME/alloy-index.git
cd alloy-index
npm install
```

### 2. Add your API keys

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in:

```
GEMINI_API_KEY=AIza...
TAVILY_API_KEY=tvly-...
```

Get keys at:
- Gemini → https://aistudio.google.com/apikey  (free tier available)
- Tavily → https://app.tavily.com

### 3. Run locally

```bash
npm run dev
```

Open http://localhost:3000

---

## Deploy to Vercel

### Option A — Vercel CLI (recommended)

```bash
npm install -g vercel
vercel
```

Follow the prompts, then add your keys:

```bash
vercel env add GEMINI_API_KEY
vercel env add TAVILY_API_KEY
```

Then deploy to production:

```bash
vercel --prod
```

### Option B — GitHub + Vercel Dashboard

1. Push this repo to GitHub
2. Go to https://vercel.com/new and import your repo
3. In **Settings > Environment Variables**, add:
   - `GEMINI_API_KEY`
   - `TAVILY_API_KEY`
4. Click **Deploy**

---

## Full first-time deploy (from scratch)

```bash
# 1. Create folder and add files
mkdir alloy-index && cd alloy-index
# (drop all project files in here, preserving the app/ folder structure)

# 2. Add keys
cp .env.example .env.local
# edit .env.local with real keys

# 3. Test locally
npm install
npm run dev

# 4. Init git and push to GitHub
git init
git add .
git commit -m "Initial commit — Alloy Index"
# create repo at github.com/new, then:
git remote add origin https://github.com/YOUR_USERNAME/alloy-index.git
git branch -M main
git push -u origin main

# 5. Deploy to Vercel
npm install -g vercel
vercel
vercel env add GEMINI_API_KEY
vercel env add TAVILY_API_KEY
vercel --prod
```

---

## Features

- **Brand profiles** — auto-save to localStorage, multiple named profiles
- **Market quick-select** — 20 country/region chips, multi-select
- **Light / Dark mode** — warm parchment light, deep charcoal dark
- **5-dimension scoring** — Cultural Alignment, Audience Demographics, Platform Reach, Brand Safety, International Reach
- **Live research** — Tavily searches before scoring for current intel
- **Exports** — Copy, TXT download, Email (mailto), Print/PDF
- **Mobile-friendly** — tab navigation, responsive layout

---

## Customization

| File | What to change |
|------|----------------|
| `app/page.jsx` | UI, brand defaults, market list, campaign tags |
| `app/api/score/route.js` | Gemini prompt, scoring dimensions |
| `app/api/search/route.js` | Tavily search config |
| `app/globals.css` | Colors, fonts, theme tokens |
