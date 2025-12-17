import { NextRequest, NextResponse } from 'next/server';
import { scrapeRealData, closeBrowser } from '@/lib/realScraper';

// Real web scraping API endpoint using Playwright
// Scrapes actual business data from Google Maps, Yelp, Yellow Pages, Facebook

// Supported platforms
const SUPPORTED_PLATFORMS = ['google_maps', 'yelp', 'yellow_pages', 'facebook'];

// Request timeout (5 minutes for scraping)
const REQUEST_TIMEOUT = 300000;

// GET - Health check and status
export async function GET() {
    return NextResponse.json({
        status: 'ok',
        message: 'Lead Scraper Pro API v2.0',
        supportedPlatforms: SUPPORTED_PLATFORMS,
        endpoints: {
            'POST /api/scrape': 'Scrape business data from platforms',
            'DELETE /api/scrape': 'Close browser instance'
        }
    });
}

// POST - Scrape data from platforms
export async function POST(request: NextRequest) {
    const startTime = Date.now();

    try {
        // Parse request body
        let body;
        try {
            body = await request.json();
        } catch {
            return NextResponse.json({
                error: 'Invalid JSON body'
            }, { status: 400 });
        }

        const { platform, query, city, country, limit = 20 } = body;

        // Validate required fields
        if (!platform) {
            return NextResponse.json({
                error: 'Missing required field: platform',
                supportedPlatforms: SUPPORTED_PLATFORMS
            }, { status: 400 });
        }

        if (!query) {
            return NextResponse.json({
                error: 'Missing required field: query (business category)'
            }, { status: 400 });
        }

        if (!city) {
            return NextResponse.json({
                error: 'Missing required field: city'
            }, { status: 400 });
        }

        // Validate platform
        if (!SUPPORTED_PLATFORMS.includes(platform)) {
            return NextResponse.json({
                error: `Unsupported platform: ${platform}`,
                supportedPlatforms: SUPPORTED_PLATFORMS
            }, { status: 400 });
        }

        // Validate limit
        const parsedLimit = Math.min(Math.max(1, parseInt(limit) || 20), 50);

        console.log(`\n📡 API Request:
   Platform: ${platform}
   Query: "${query}"
   City: ${city}, ${country || 'US'}
   Limit: ${parsedLimit}
`);

        // Use real scraping with timeout
        const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('Scraping timeout exceeded')), REQUEST_TIMEOUT);
        });

        const results = await Promise.race([
            scrapeRealData(platform, query, city, country || 'United States', parsedLimit),
            timeoutPromise
        ]);

        const duration = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`✅ Scraped ${results.length} businesses in ${duration}s`);

        return NextResponse.json({
            success: true,
            data: results,
            meta: {
                platform,
                query,
                city,
                country: country || 'United States',
                count: results.length,
                duration: `${duration}s`
            }
        });

    } catch (error) {
        const duration = ((Date.now() - startTime) / 1000).toFixed(1);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        console.error(`❌ Scraping failed after ${duration}s:`, errorMessage);

        // Return appropriate status code
        const status = errorMessage.includes('timeout') ? 504 : 500;

        return NextResponse.json({
            success: false,
            error: 'Failed to scrape data',
            details: errorMessage,
            duration: `${duration}s`
        }, { status });
    }
}

// DELETE - Clean up browser instance
export async function DELETE() {
    try {
        await closeBrowser();
        return NextResponse.json({
            success: true,
            message: 'Browser instance closed successfully'
        });
    } catch (error) {
        return NextResponse.json({
            success: false,
            error: 'Failed to close browser',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}


