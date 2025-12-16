# Lead Scraper Pro v2.0

A **Multi-Platform Business Intelligence Scraper** that extracts real business data from Google Maps, Yelp, Yellow Pages, and Facebook. Features AI-powered opportunity scoring, deduplication across platforms, and pitch generation.

## 🚀 Features

- **Real Web Scraping**: Uses Playwright to scrape actual business data (not mock data)
- **Multi-Platform Support**: Google Maps, Yelp, Yellow Pages, Facebook
- **AI Opportunity Scoring**: Identifies hot leads based on business characteristics
- **Cross-Platform Deduplication**: Merges data from multiple sources
- **Pitch Generation**: Auto-generates sales pitches based on business gaps
- **Export**: CSV and PDF reports with platform comparison

## 📦 Installation

```bash
npm install
npx playwright install chromium
```

## 🏃 Running

```bash
npm run dev
```

Open http://localhost:3000

## 🔧 How It Works

1. Select platforms (Google Maps, Yelp, etc.)
2. Enter search query and location
3. Click "Scrape" - launches headless browser to scrape real data
4. View results with opportunity scores
5. Export to CSV/PDF

## ⚠️ Important Notes

- **First scrape is slower** (~5-10 seconds per platform - browser launch time)
- **Rate limiting**: Sites may block if you scrape too fast
- **Best results**: Google Maps and Yellow Pages work most reliably
- **Facebook**: Limited due to login requirements

## 📁 Key Files

- `src/lib/realScraper.ts` - Web scraping logic (Playwright)
- `src/lib/unifiedBusiness.ts` - Deduplication & merging
- `src/app/api/scrape/route.ts` - API endpoint
- `src/components/` - UI components

## License

MIT
