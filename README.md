# Vendex

**Turn any product reel or Alibaba URL into a ranked supplier shortlist — instantly.**

Paste an Instagram/TikTok reel or a direct Alibaba product link. Vendex downloads the video, extracts the best frame, runs a visual image search on Alibaba, and returns a ranked list of matching suppliers with prices, MOQs, trust badges, delivery estimates, and a one-click chat button.

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                           User Browser                               │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │                Next.js Frontend  :3001                         │  │
│  │                                                                │  │
│  │  ┌────────────┐   ┌──────────────────┐   ┌─────────────────┐  │  │
│  │  │ Dashboard  │   │   Jobs / Live    │   │ Supplier Cards  │  │  │
│  │  │ Submit URL │   │ Pipeline Progress│   │  & Table View   │  │  │
│  │  └─────┬──────┘   └────────┬─────────┘   └────────┬────────┘  │  │
│  └────────┼───────────────────┼─────────────────────┼────────────┘  │
│           │ POST /process     │ GET /jobs/:id        │ GET /suppliers │
└───────────┼───────────────────┼─────────────────────┼───────────────┘
            │                   │                      │
            ▼                   ▼                      ▼
┌──────────────────────────────────────────────────────────────────────┐
│                     FastAPI Backend  :3002                           │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │                   Pipeline  (asyncio)                          │  │
│  │                                                                │  │
│  │   ┌──────────┐  ┌───────────┐  ┌────────────┐  ┌──────────┐  │  │
│  │   │  yt-dlp  │─▶│  OpenCV   │─▶│ Playwright │─▶│  SQLite  │  │  │
│  │   │ Download │  │   Frame   │  │   Search   │  │   Save   │  │  │
│  │   │   Reel   │  │  Extract  │  │  + Scrape  │  │          │  │  │
│  │   └──────────┘  └───────────┘  └─────┬──────┘  └──────────┘  │  │
│  │                                       │                        │  │
│  │                            ┌──────────┴──────────┐            │  │
│  │                            │   10 parallel tabs  │            │  │
│  │                            │   per job · max 2   │            │  │
│  │                            │   concurrent jobs   │            │  │
│  │                            └─────────────────────┘            │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                      │
│   vendex.db          downloads/          alibaba_session.json    │
│   (SQLite)               frames/             (cookie cache)          │
└──────────────────────────────────────────────────────────────────────┘
            │
            ▼
┌──────────────────────────────────────────────────────────────────────┐
│                          Alibaba.com                                 │
│        Image Search → Product Listings → Product Pages              │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Pipeline

```
 Paste URL
     │
     ├── Alibaba product URL ──────────────────────────────────┐
     │                                                          │
     └── Reel URL (Instagram / TikTok)                         │
              │                                                 │
              ▼                                                 │
         1. DOWNLOAD                                            │
            yt-dlp fetches the reel video                       │
              │                                                 │
              ▼                                                 │
         2. EXTRACT                                             │
            OpenCV picks the sharpest, most-distinct frame      │
              │                                                 │
              ▼                                                 ▼
         3. SEARCH  ◀────────────────────────────── Scrape product page
            Playwright uploads frame to Alibaba image search
            Opens 10 product pages in parallel tabs
            Solves slider CAPTCHAs automatically
              │
              ▼
         4. NORMALIZE
            Prices → INR + USD · Data saved to SQLite
              │
              ▼
           DONE  ✓
            Frontend renders ranked supplier list
```

---

## Features

- **Reel → Suppliers in ~60s** — paste any Instagram or TikTok reel URL
- **Direct Alibaba URL** — skip the video step and scrape a product page directly
- **CSV batch upload** — process dozens of URLs concurrently
- **Live pipeline progress** — real-time stage-by-stage updates while jobs run
- **Rich supplier data** — price tiers, MOQ, ratings, trust badges (Verified / Gold / Trade Assurance), delivery estimates, certifications, reorder rate, response time
- **Visual match score** — results ranked by similarity to your source product
- **Compare mode** — select up to 4 suppliers and view side-by-side
- **One-click Chat** — opens Alibaba and auto-triggers "Contact Supplier" with a pre-filled inquiry message via a Chrome extension
- **Card / Table views** — toggle between a rich grid and a dense data table
- **Filter & sort** — by price, MOQ, match score, country, trust level
- **Automatic CAPTCHA solving** — slider CAPTCHAs handled with realistic mouse movement

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, TypeScript, Tailwind CSS, shadcn/ui, Zustand |
| Backend | FastAPI, Python 3.12, asyncio |
| Scraping | Playwright (real Chrome binary), playwright-stealth |
| Video | yt-dlp, OpenCV |
| Database | SQLite via aiosqlite |
| Currency | forex-python (live INR ↔ USD rates) |
| Chat extension | Chrome MV3 content script |

---

## Project Structure

```
vendex/
├── app/                          # Next.js App Router pages
│   ├── dashboard/                # Main search & submit page
│   ├── jobs/                     # Job history + live progress
│   ├── results/                  # Supplier results view
│   ├── settings/                 # App settings
│   └── api/                      # Next.js API routes (webhooks)
│
├── components/
│   ├── dashboard/
│   │   ├── SupplierCard.tsx      # Grid card view
│   │   └── SupplierTable.tsx     # Dense table view
│   ├── layout/                   # Sidebar, navbar
│   └── shared/                   # TrustBadge, RatingStars, EmptyState
│
├── stores/                       # Zustand global state
├── hooks/                        # Custom React hooks
└── lib/
    ├── types.ts                  # Shared TypeScript types
    ├── api-client.ts             # Typed backend API wrapper
    └── utils.ts                  # Helpers (price formatting, flags, etc.)

├── backend/
│   ├── main.py                   # FastAPI app entry point
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── routers/
│   │   ├── process.py            # POST /process  ·  POST /process/batch
│   │   ├── jobs.py               # GET /jobs  ·  GET /jobs/:id
│   │   ├── suppliers.py          # GET /suppliers
│   │   ├── csv_upload.py         # POST /csv-upload
│   │   └── health.py             # GET /health
│   ├── services/
│   │   ├── playwright_client.py  # Core scraper + CAPTCHA solver
│   │   ├── downloader.py         # yt-dlp wrapper
│   │   ├── frame_extractor.py    # OpenCV best-frame selection
│   │   └── currency_service.py   # Currency conversion helpers
│   ├── models/
│   │   ├── schemas.py            # Pydantic request/response models
│   │   └── database.py           # SQLite init + async CRUD
│   └── utils/
│       ├── logger.py
│       └── currency.py

├── extension/                    # Chrome extension — load unpacked
│   ├── manifest.json
│   └── content.js                # Auto-clicks chat + pre-fills message

└── scripts/
    └── start-dev.sh              # One-command dev startup
```

---

## Getting Started

### Prerequisites

- **Node.js** 18+
- **Python** 3.11+
- **Google Chrome** (installed at the default macOS path)
- **ffmpeg**

```bash
brew install ffmpeg
```

### 1. Clone the repo

```bash
git clone https://github.com/your-username/vendex.git
cd vendex
```

### 2. Start everything

```bash
chmod +x scripts/start-dev.sh
./scripts/start-dev.sh
```

This script:
- Creates a Python virtualenv and installs all dependencies
- Clears stale `.pyc` cache
- Starts the FastAPI backend on **:3002**
- Starts the Next.js frontend on **:3001**
- Waits for the backend to be healthy before starting the frontend

Open [http://localhost:3001](http://localhost:3001)

### 3. Install the Chrome extension

1. Go to `chrome://extensions`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked** → select the `extension/` folder

The extension watches for `#vendex-chat` in the URL on any Alibaba page and automatically clicks "Contact Supplier" / "Chat Now", pre-fills a default inquiry message, and clicks Send.

### 4. Environment variables

Create a `.env` file in the project root:

```env
# Backend base URL (used by the frontend)
NEXT_PUBLIC_API_URL=http://localhost:3002

# Optional: webhook called when a job completes or fails
NEXTJS_WEBHOOK_URL=http://localhost:3001/api/webhook
NEXTJS_WEBHOOK_SECRET=your-secret-here
```

---

## Usage

### Single URL

1. Go to [http://localhost:3001](http://localhost:3001)
2. Paste an Instagram / TikTok reel URL **or** an Alibaba product URL
3. Watch the live pipeline stages (Download → Extract → Search → Normalize)
4. Browse, filter, sort, and compare suppliers

### Batch CSV

1. Navigate to **Jobs → Upload CSV**
2. Upload a `.csv` with a `url` column (and an optional `label` column)
3. Up to 2 jobs run concurrently; results appear as each finishes

### Chat with a supplier

1. Click **Chat** on any supplier card or table row
2. Chrome opens the Alibaba product page
3. The extension auto-clicks "Contact Supplier" and sends a pre-filled bulk inquiry

---

## Configuration

| Variable | Default | Description |
|---|---|---|
| `MAX_CONCURRENT_JOBS` | `2` | Max parallel pipeline jobs |
| `DOWNLOAD_DIR` | `./downloads` | Temp directory for reel videos |
| `FRAME_OUTPUT_DIR` | `./frames` | Temp directory for extracted frames |
| `NEXTJS_WEBHOOK_URL` | — | Called on job complete / fail |
| `NEXTJS_WEBHOOK_SECRET` | — | Secret for webhook auth header |

---

## How the scraper works

| Technique | Detail |
|---|---|
| **Real Chrome binary** | Uses system Chrome, not Playwright's bundled Chromium — Alibaba checks the binary path |
| **playwright-stealth** | Patches `navigator`, WebGL, `sec-ch-ua`, and 20+ other fingerprints to match Chrome 131 |
| **Session persistence** | Cookies saved to `alibaba_session.json` after each run so Alibaba sees a returning user |
| **CAPTCHA solving** | nc-webid sliders solved with a fast ease-in drag + overshoot, matching human flick movement |
| **Parallel tabs** | Up to 10 product pages scraped simultaneously per job in separate browser tabs |
| **Single JS pass** | All data extracted in one `page.evaluate()` call per product page to minimise round-trips |
| **Lazy load handling** | Page scrolled to 800 / 2500 / 5000px before extraction to trigger seller card, ranking, logistics |

---

## License

MIT
