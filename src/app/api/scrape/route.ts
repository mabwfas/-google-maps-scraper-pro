import { NextRequest, NextResponse } from 'next/server';
import { scrapeRealData, closeBrowser } from '@/lib/realScraper';

// Real web scraping API endpoint using Playwright
// Scrapes actual business data from Google Maps, Yelp, Yellow Pages, Facebook

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { platform, query, city, country } = body;

        if (!query || !city) {
            return NextResponse.json({ error: 'Missing query or city' }, { status: 400 });
        }

        console.log(`📡 API Request: Scraping ${platform} for "${query}" in ${city}, ${country}`);

        // Use real scraping
        const results = await scrapeRealData(platform, query, city, country, 20);

        console.log(`✅ Scraped ${results.length} real businesses from ${platform}`);

        return NextResponse.json({
            success: true,
            data: results,
            message: `Scraped ${results.length} real businesses from ${platform}`
        });
    } catch (error) {
        console.error('Scraping error:', error);
        return NextResponse.json({
            error: 'Failed to scrape data',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

// Clean up browser on server shutdown
export async function DELETE() {
    try {
        await closeBrowser();
        return NextResponse.json({ success: true, message: 'Browser closed' });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to close browser' }, { status: 500 });
    }
}

