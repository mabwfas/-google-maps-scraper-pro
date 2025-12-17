// Robust Real Web Scraping Library using Playwright
// Scrapes actual data from Google Maps, Yelp, Facebook, and Yellow Pages
// With retry logic, fallback selectors, and comprehensive error handling
// Supports both local Playwright and Browserless.io for Vercel deployment

import { chromium, Browser, BrowserContext, Page, Locator } from 'playwright';

// Configuration
const CONFIG = {
    maxRetries: 3,
    retryDelay: 2000,
    pageTimeout: 45000,
    navigationTimeout: 60000,
    scrollIterations: 6,
    scrollDelay: 1200,
    minDelayBetweenRequests: 800,
    maxDelayBetweenRequests: 2000,
};

// User agents rotation for anti-detection
const USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
];

// Singleton browser instance for reuse
let browserInstance: Browser | null = null;

// Check if running on Vercel (serverless)
const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME;

// Browserless.io API key (set in Vercel environment variables)
const BROWSERLESS_API_KEY = process.env.BROWSERLESS_API_KEY;

async function getBrowser(): Promise<Browser> {
    if (!browserInstance || !browserInstance.isConnected()) {

        // Option 1: Use Browserless.io for cloud/Vercel deployment
        if (BROWSERLESS_API_KEY) {
            console.log('🌐 Connecting to Browserless.io cloud browser...');
            const browserWSEndpoint = `wss://chrome.browserless.io?token=${BROWSERLESS_API_KEY}`;
            browserInstance = await chromium.connectOverCDP(browserWSEndpoint);
            console.log('✅ Connected to Browserless.io');
        }
        // Option 2: Use local Playwright for development
        else if (!isServerless) {
            console.log('🚀 Launching local browser...');
            browserInstance = await chromium.launch({
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--disable-gpu',
                    '--window-size=1920,1080',
                    '--disable-blink-features=AutomationControlled',
                ]
            });
            console.log('✅ Local browser launched');
        }
        // Option 3: Serverless without Browserless - throw error
        else {
            throw new Error(
                'Cannot run Playwright on serverless without Browserless.io. ' +
                'Please set BROWSERLESS_API_KEY environment variable. ' +
                'Get a free API key at https://www.browserless.io/'
            );
        }
    }
    return browserInstance;
}

// Create a new context with random user agent
async function createContext(browser: Browser): Promise<BrowserContext> {
    const userAgent = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
    return browser.newContext({
        userAgent,
        viewport: { width: 1920, height: 1080 },
        locale: 'en-US',
        timezoneId: 'America/New_York',
        geolocation: { latitude: 40.7128, longitude: -74.0060 },
        permissions: ['geolocation'],
    });
}

// Close browser when done
export async function closeBrowser(): Promise<void> {
    if (browserInstance) {
        await browserInstance.close();
        browserInstance = null;
        console.log('🛑 Browser closed');
    }
}

// Helper to delay between requests
function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Random delay to appear more human-like
function randomDelay(min: number = CONFIG.minDelayBetweenRequests, max: number = CONFIG.maxDelayBetweenRequests): Promise<void> {
    return delay(Math.floor(Math.random() * (max - min)) + min);
}

// Safe text extraction with fallback
async function safeGetText(locator: Locator, fallback: string = ''): Promise<string> {
    try {
        const text = await locator.textContent({ timeout: 3000 });
        return text?.trim() || fallback;
    } catch {
        return fallback;
    }
}

// Safe attribute extraction
async function safeGetAttribute(locator: Locator, attr: string, fallback: string = ''): Promise<string> {
    try {
        const value = await locator.getAttribute(attr, { timeout: 3000 });
        return value?.trim() || fallback;
    } catch {
        return fallback;
    }
}

// Retry wrapper for operations
async function withRetry<T>(
    operation: () => Promise<T>,
    retries: number = CONFIG.maxRetries,
    delayMs: number = CONFIG.retryDelay
): Promise<T> {
    let lastError: Error | undefined;
    for (let i = 0; i < retries; i++) {
        try {
            return await operation();
        } catch (error) {
            lastError = error as Error;
            console.log(`⚠️ Retry ${i + 1}/${retries}: ${lastError.message}`);
            if (i < retries - 1) await delay(delayMs);
        }
    }
    throw lastError;
}

export interface ScrapedBusinessData {
    id: string;
    businessName: string;
    category: string;
    address: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
    coordinates: { lat: number; lng: number };
    phone?: string;
    email?: string;
    website?: string;
    mapsUrl: string;
    rating: number;
    totalReviews: number;
    priceRange?: string;
    businessStatus: string;
    hours?: string[];
    photosCount?: number;
    description?: string;
    scrapedAt: string;
    source: string;
}

// ===================================
// GOOGLE MAPS SCRAPER (Robust)
// ===================================
export async function scrapeGoogleMapsReal(
    query: string,
    city: string,
    country: string,
    limit: number = 20
): Promise<ScrapedBusinessData[]> {
    console.log(`🗺️ Starting Google Maps scrape: "${query}" in ${city}, ${country}`);

    const browser = await getBrowser();
    const context = await createContext(browser);
    const page = await context.newPage();
    const businesses: ScrapedBusinessData[] = [];

    try {
        // Navigate to Google Maps search with retry
        const searchQuery = encodeURIComponent(`${query} in ${city}, ${country}`);
        const url = `https://www.google.com/maps/search/${searchQuery}`;

        await withRetry(async () => {
            await page.goto(url, {
                waitUntil: 'domcontentloaded',
                timeout: CONFIG.navigationTimeout
            });
        });

        console.log('📍 Page loaded, waiting for results...');
        await delay(3000);

        // Wait for search results to appear
        try {
            await page.waitForSelector('div[role="feed"]', { timeout: 10000 });
        } catch {
            console.log('⚠️ Feed not found, trying alternative approach...');
        }

        // Scroll to load more results
        console.log('📜 Scrolling to load more results...');
        const scrollContainer = page.locator('div[role="main"]');

        for (let i = 0; i < CONFIG.scrollIterations; i++) {
            try {
                await scrollContainer.evaluate(node => {
                    node.scrollTop = node.scrollHeight;
                });
                await delay(CONFIG.scrollDelay);
            } catch {
                // Scroll container might not exist, continue
            }
        }

        // Multiple selector strategies for listings
        const listingSelectors = [
            'div[role="feed"] > div > div[jsaction*="mouseover"]',
            'div[role="feed"] > div > div[class*="Nv2PK"]',
            'a[href*="/maps/place/"]',
            '[data-value="Search this area"]',
        ];

        let listings: Locator[] = [];
        for (const selector of listingSelectors) {
            try {
                listings = await page.locator(selector).all();
                if (listings.length > 0) {
                    console.log(`✅ Found ${listings.length} listings using selector: ${selector.substring(0, 30)}...`);
                    break;
                }
            } catch {
                continue;
            }
        }

        // Alternative: extract from page content
        if (listings.length === 0) {
            console.log('⚠️ No listings found via selectors, trying content extraction...');

            // Get all links that look like business listings
            const links = await page.locator('a[href*="/maps/place/"]').all();
            console.log(`Found ${links.length} place links`);

            for (let i = 0; i < Math.min(links.length, limit); i++) {
                try {
                    const link = links[i];
                    const href = await safeGetAttribute(link, 'href');
                    const ariaLabel = await safeGetAttribute(link, 'aria-label');

                    if (ariaLabel && href) {
                        // Parse name from aria-label
                        const name = ariaLabel.split('.')[0] || ariaLabel;

                        businesses.push({
                            id: `gm-${Date.now()}-${i}`,
                            businessName: name,
                            category: query,
                            address: city,
                            city: city,
                            state: '',
                            country: country,
                            zipCode: '',
                            coordinates: { lat: 0, lng: 0 },
                            mapsUrl: href.startsWith('http') ? href : `https://www.google.com${href}`,
                            rating: 0,
                            totalReviews: 0,
                            businessStatus: 'OPERATIONAL',
                            scrapedAt: new Date().toISOString(),
                            source: 'google_maps'
                        });
                        console.log(`📍 Scraped (link): ${name}`);
                    }
                } catch (err) {
                    // Skip failed
                }
            }
        }

        // Click-based detailed extraction
        for (let i = 0; i < Math.min(listings.length, limit); i++) {
            try {
                const listing = listings[i];

                // Click on the listing to get details
                await listing.click({ timeout: 5000 });
                await delay(1500);

                // Multiple selectors for business name
                let name = '';
                const nameSelectors = ['h1.DUwDvf', 'h1.fontHeadlineLarge', 'h1[class*="DUwDvf"]', 'div.fontHeadlineLarge'];
                for (const sel of nameSelectors) {
                    name = await safeGetText(page.locator(sel).first());
                    if (name) break;
                }

                if (!name) {
                    console.log(`⚠️ Skipping listing ${i} - no name found`);
                    await page.keyboard.press('Escape');
                    await randomDelay();
                    continue;
                }

                // Get rating - multiple approaches
                let rating = 0;
                const ratingSelectors = [
                    'div.F7nice span[aria-hidden="true"]',
                    'span.ceNzKf',
                    'span[aria-label*="stars"]',
                ];
                for (const sel of ratingSelectors) {
                    const ratingText = await safeGetText(page.locator(sel).first());
                    if (ratingText) {
                        rating = parseFloat(ratingText.replace(',', '.')) || 0;
                        if (rating > 0) break;
                    }
                }

                // Get review count
                let reviews = 0;
                try {
                    const reviewEl = page.locator('span[aria-label*="review"]').first();
                    const reviewText = await safeGetAttribute(reviewEl, 'aria-label');
                    const match = reviewText.match(/(\d+[\d,]*)/);
                    reviews = parseInt((match?.[1] || '0').replace(/,/g, ''));
                } catch { }

                // Get address - multiple approaches
                let address = '';
                const addressSelectors = [
                    'button[data-item-id="address"]',
                    'button[aria-label*="Address"]',
                    '[data-tooltip="Copy address"]',
                ];
                for (const sel of addressSelectors) {
                    address = await safeGetAttribute(page.locator(sel).first(), 'aria-label');
                    if (address) {
                        address = address.replace(/^Address:\s*/i, '');
                        break;
                    }
                }

                // Get phone
                let phone = '';
                const phoneSelectors = [
                    'button[data-item-id^="phone:"]',
                    'button[aria-label*="Phone"]',
                    '[data-tooltip="Copy phone number"]',
                ];
                for (const sel of phoneSelectors) {
                    phone = await safeGetAttribute(page.locator(sel).first(), 'aria-label');
                    if (phone) {
                        phone = phone.replace(/^Phone:\s*/i, '');
                        break;
                    }
                }

                // Get website
                let website = '';
                const websiteSelectors = [
                    'a[data-item-id="authority"]',
                    'a[aria-label*="Website"]',
                    'a[data-value*="Website"]',
                ];
                for (const sel of websiteSelectors) {
                    website = await safeGetAttribute(page.locator(sel).first(), 'href');
                    if (website) break;
                }

                // Get category
                let category = query;
                const categorySelectors = ['button.DkEaL', 'span.DkEaL', '[data-section-id="category"]'];
                for (const sel of categorySelectors) {
                    const cat = await safeGetText(page.locator(sel).first());
                    if (cat) {
                        category = cat;
                        break;
                    }
                }

                // Get price range
                let priceRange = '';
                try {
                    priceRange = await safeGetText(page.locator('span[aria-label*="Price"]').first());
                } catch { }

                const mapsUrl = page.url();

                businesses.push({
                    id: `gm-${Date.now()}-${i}`,
                    businessName: name,
                    category: category,
                    address: address,
                    city: city,
                    state: '',
                    country: country,
                    zipCode: '',
                    coordinates: { lat: 0, lng: 0 },
                    phone: phone || undefined,
                    website: website || undefined,
                    priceRange: priceRange || undefined,
                    mapsUrl: mapsUrl,
                    rating: rating,
                    totalReviews: reviews,
                    businessStatus: 'OPERATIONAL',
                    scrapedAt: new Date().toISOString(),
                    source: 'google_maps'
                });

                console.log(`✅ Scraped: ${name} (${rating}⭐, ${reviews} reviews)`);

                // Go back to results
                await page.keyboard.press('Escape');
                await randomDelay();

            } catch (err) {
                console.error(`❌ Error scraping listing ${i}:`, (err as Error).message);
                try {
                    await page.keyboard.press('Escape');
                } catch { }
            }
        }

    } catch (error) {
        console.error('❌ Google Maps scraping error:', (error as Error).message);
    } finally {
        await context.close();
    }

    console.log(`📊 Google Maps: Scraped ${businesses.length} businesses`);
    return businesses;
}

// ===================================
// YELP SCRAPER (Robust)
// ===================================
export async function scrapeYelpReal(
    query: string,
    city: string,
    limit: number = 20
): Promise<ScrapedBusinessData[]> {
    console.log(`⭐ Starting Yelp scrape: "${query}" in ${city}`);

    const browser = await getBrowser();
    const context = await createContext(browser);
    const page = await context.newPage();
    const businesses: ScrapedBusinessData[] = [];

    try {
        const searchUrl = `https://www.yelp.com/search?find_desc=${encodeURIComponent(query)}&find_loc=${encodeURIComponent(city)}`;

        await withRetry(async () => {
            await page.goto(searchUrl, {
                waitUntil: 'domcontentloaded',
                timeout: CONFIG.navigationTimeout
            });
        });

        console.log('📍 Yelp page loaded, extracting listings...');
        await delay(3000);

        // Multiple selectors for Yelp cards (they change frequently)
        const cardSelectors = [
            '[data-testid="serp-ia-card"]',
            'div[class*="container__"] > div:has(a[href*="/biz/"])',
            'li:has(a[href*="/biz/"])',
            'div.businessName__',
        ];

        let cards: Locator[] = [];
        for (const selector of cardSelectors) {
            try {
                cards = await page.locator(selector).all();
                if (cards.length > 0) {
                    console.log(`✅ Found ${cards.length} Yelp cards with selector: ${selector.substring(0, 30)}...`);
                    break;
                }
            } catch {
                continue;
            }
        }

        // Fallback: Extract from all links
        if (cards.length === 0) {
            console.log('⚠️ Using fallback Yelp extraction...');
            const bizLinks = await page.locator('a[href*="/biz/"]').all();

            const seenNames = new Set<string>();
            for (let i = 0; i < Math.min(bizLinks.length, limit * 2); i++) {
                try {
                    const link = bizLinks[i];
                    const href = await safeGetAttribute(link, 'href');
                    const text = await safeGetText(link);

                    if (text && text.length > 2 && !seenNames.has(text) && href.includes('/biz/')) {
                        seenNames.add(text);

                        let fullUrl = href;
                        if (!href.startsWith('http')) {
                            fullUrl = 'https://www.yelp.com' + href;
                        }

                        businesses.push({
                            id: `yelp-${Date.now()}-${businesses.length}`,
                            businessName: text,
                            category: query,
                            address: city,
                            city: city,
                            state: '',
                            country: 'United States',
                            zipCode: '',
                            coordinates: { lat: 0, lng: 0 },
                            mapsUrl: fullUrl,
                            rating: 0,
                            totalReviews: 0,
                            businessStatus: 'OPERATIONAL',
                            scrapedAt: new Date().toISOString(),
                            source: 'yelp'
                        });
                        console.log(`⭐ Scraped (fallback): ${text}`);

                        if (businesses.length >= limit) break;
                    }
                } catch { }
            }
        }

        // Process cards if found
        for (let i = 0; i < Math.min(cards.length, limit); i++) {
            try {
                const card = cards[i];

                // Get business name - multiple approaches
                let name = '';
                const nameSelectors = [
                    'a[class*="businessName"] span',
                    'a[href*="/biz/"] span',
                    'h3 a span',
                    'a[class*="css-"] span[class*="css-"]',
                ];
                for (const sel of nameSelectors) {
                    name = await safeGetText(card.locator(sel).first());
                    if (name && name.length > 1) break;
                }
                if (!name) continue;

                // Get rating
                let rating = 0;
                try {
                    const ratingEl = card.locator('[aria-label*="rating"]').first();
                    const ratingLabel = await safeGetAttribute(ratingEl, 'aria-label');
                    const match = ratingLabel.match(/([\d.]+)/);
                    rating = parseFloat(match?.[1] || '0');
                } catch { }

                // Get review count
                let reviews = 0;
                try {
                    const reviewText = await safeGetText(card.locator('span:has-text("review")').first());
                    const match = reviewText.match(/(\d+)/);
                    reviews = parseInt(match?.[1] || '0');
                } catch { }

                // Get category
                let category = query;
                try {
                    category = await safeGetText(card.locator('[class*="priceCategory"] a, span[class*="category"]').first()) || query;
                } catch { }

                // Get address
                let address = '';
                try {
                    address = await safeGetText(card.locator('[class*="secondaryAttributes"] p, span[class*="address"]').first());
                } catch { }

                // Get phone
                let phone = '';
                try {
                    const phoneText = await safeGetText(card.locator('p:has-text("(")').first());
                    if (phoneText.match(/\(\d{3}\)/)) {
                        phone = phoneText;
                    }
                } catch { }

                // Get price range
                let priceRange = '';
                try {
                    priceRange = await safeGetText(card.locator('[class*="priceRange"], span:has-text("$")').first());
                } catch { }

                // Get link
                let bizUrl = '';
                try {
                    bizUrl = await safeGetAttribute(card.locator('a[href*="/biz/"]').first(), 'href');
                    if (bizUrl && !bizUrl.startsWith('http')) {
                        bizUrl = 'https://www.yelp.com' + bizUrl;
                    }
                } catch { }

                businesses.push({
                    id: `yelp-${Date.now()}-${i}`,
                    businessName: name,
                    category: category,
                    address: address,
                    city: city,
                    state: '',
                    country: 'United States',
                    zipCode: '',
                    coordinates: { lat: 0, lng: 0 },
                    phone: phone || undefined,
                    priceRange: priceRange || undefined,
                    mapsUrl: bizUrl || searchUrl,
                    rating: rating,
                    totalReviews: reviews,
                    businessStatus: 'OPERATIONAL',
                    scrapedAt: new Date().toISOString(),
                    source: 'yelp'
                });

                console.log(`⭐ Scraped: ${name} (${rating}⭐, ${reviews} reviews)`);

            } catch (err) {
                console.error(`❌ Error scraping Yelp listing ${i}:`, (err as Error).message);
            }
        }

    } catch (error) {
        console.error('❌ Yelp scraping error:', (error as Error).message);
    } finally {
        await context.close();
    }

    console.log(`📊 Yelp: Scraped ${businesses.length} businesses`);
    return businesses;
}

// ===================================
// YELLOW PAGES SCRAPER (Robust)
// ===================================
export async function scrapeYellowPagesReal(
    query: string,
    city: string,
    limit: number = 20
): Promise<ScrapedBusinessData[]> {
    console.log(`📒 Starting Yellow Pages scrape: "${query}" in ${city}`);

    const browser = await getBrowser();
    const context = await createContext(browser);
    const page = await context.newPage();
    const businesses: ScrapedBusinessData[] = [];

    try {
        const searchUrl = `https://www.yellowpages.com/search?search_terms=${encodeURIComponent(query)}&geo_location_terms=${encodeURIComponent(city)}`;

        await withRetry(async () => {
            await page.goto(searchUrl, {
                waitUntil: 'domcontentloaded',
                timeout: CONFIG.navigationTimeout
            });
        });

        console.log('📍 Yellow Pages loaded, extracting listings...');
        await delay(2000);

        // Get all business listings
        const listingSelectors = ['.result', '.srp-listing', 'div[class*="result"]'];
        let listings: Locator[] = [];

        for (const selector of listingSelectors) {
            listings = await page.locator(selector).all();
            if (listings.length > 0) {
                console.log(`✅ Found ${listings.length} Yellow Pages listings`);
                break;
            }
        }

        for (let i = 0; i < Math.min(listings.length, limit); i++) {
            try {
                const listing = listings[i];

                // Get business name
                const name = await safeGetText(listing.locator('.business-name, a.business-name, .n').first());
                if (!name) continue;

                // Get phone
                const phone = await safeGetText(listing.locator('.phones, .phone, [class*="phone"]').first());

                // Get address
                let address = '';
                const street = await safeGetText(listing.locator('.street-address, .adr').first());
                const locality = await safeGetText(listing.locator('.locality').first());
                address = `${street} ${locality}`.trim();

                // Get category
                const category = await safeGetText(listing.locator('.categories a, .links a').first()) || query;

                // Get website
                const website = await safeGetAttribute(listing.locator('a.track-visit-website, a[href*="http"]:not([href*="yellowpages"])').first(), 'href');

                // Get rating (Yellow Pages uses class-based ratings)
                let rating = 0;
                try {
                    const ratingClass = await safeGetAttribute(listing.locator('.ratings, [class*="rating"]').first(), 'class');
                    const match = ratingClass.match(/count-(\d+)|rating-(\d+)/);
                    rating = parseFloat(match?.[1] || match?.[2] || '0');
                } catch { }

                // Get review count
                let reviews = 0;
                const reviewText = await safeGetText(listing.locator('.count, [class*="review-count"]').first());
                const reviewMatch = reviewText.match(/(\d+)/);
                reviews = parseInt(reviewMatch?.[1] || '0');

                // Get link
                let bizUrl = await safeGetAttribute(listing.locator('a.business-name, a.n').first(), 'href');
                if (bizUrl && !bizUrl.startsWith('http')) {
                    bizUrl = 'https://www.yellowpages.com' + bizUrl;
                }

                businesses.push({
                    id: `yp-${Date.now()}-${i}`,
                    businessName: name.trim(),
                    category: category,
                    address: address,
                    city: city,
                    state: '',
                    country: 'United States',
                    zipCode: '',
                    coordinates: { lat: 0, lng: 0 },
                    phone: phone || undefined,
                    website: website || undefined,
                    mapsUrl: bizUrl || searchUrl,
                    rating: rating,
                    totalReviews: reviews,
                    businessStatus: 'OPERATIONAL',
                    scrapedAt: new Date().toISOString(),
                    source: 'yellow_pages'
                });

                console.log(`📒 Scraped: ${name.trim()} (${rating}⭐)`);

            } catch (err) {
                console.error(`❌ Error scraping Yellow Pages listing ${i}:`, (err as Error).message);
            }
        }

    } catch (error) {
        console.error('❌ Yellow Pages scraping error:', (error as Error).message);
    } finally {
        await context.close();
    }

    console.log(`📊 Yellow Pages: Scraped ${businesses.length} businesses`);
    return businesses;
}

// ===================================
// FACEBOOK BUSINESS SCRAPER (Limited)
// ===================================
export async function scrapeFacebookReal(
    query: string,
    city: string,
    limit: number = 20
): Promise<ScrapedBusinessData[]> {
    console.log(`📘 Starting Facebook scrape: "${query}" in ${city}`);
    console.log('⚠️ Note: Facebook scraping is limited without authentication');

    const browser = await getBrowser();
    const context = await createContext(browser);
    const page = await context.newPage();
    const businesses: ScrapedBusinessData[] = [];

    try {
        // Try public search (limited)
        const searchUrl = `https://www.facebook.com/public/${encodeURIComponent(query + ' ' + city)}`;

        await page.goto(searchUrl, {
            waitUntil: 'domcontentloaded',
            timeout: CONFIG.navigationTimeout
        });
        await delay(3000);

        // Facebook heavily restricts scraping - try to get any public data
        const pageCards = await page.locator('[role="article"], [data-pagelet*="Page"], div[class*="Feed"]').all();
        console.log(`Found ${pageCards.length} potential Facebook listings`);

        for (let i = 0; i < Math.min(pageCards.length, limit); i++) {
            try {
                const card = pageCards[i];
                const name = await safeGetText(card.locator('strong, [role="heading"]').first());

                if (name && name.length > 2) {
                    businesses.push({
                        id: `fb-${Date.now()}-${i}`,
                        businessName: name,
                        category: query,
                        address: city,
                        city: city,
                        state: '',
                        country: 'United States',
                        zipCode: '',
                        coordinates: { lat: 0, lng: 0 },
                        mapsUrl: `https://www.facebook.com/search/pages/?q=${encodeURIComponent(name + ' ' + city)}`,
                        rating: 0,
                        totalReviews: 0,
                        businessStatus: 'OPERATIONAL',
                        scrapedAt: new Date().toISOString(),
                        source: 'facebook'
                    });
                    console.log(`📘 Scraped: ${name}`);
                }
            } catch { }
        }

    } catch (error) {
        console.error('❌ Facebook scraping error:', (error as Error).message);
    } finally {
        await context.close();
    }

    console.log(`📊 Facebook: Scraped ${businesses.length} businesses (limited data)`);
    return businesses;
}

// ===================================
// MAIN EXPORT FUNCTION
// ===================================
export async function scrapeRealData(
    platform: string,
    query: string,
    city: string,
    country: string,
    limit: number = 20
): Promise<ScrapedBusinessData[]> {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🔍 REAL SCRAPING: ${platform.toUpperCase()}`);
    console.log(`   Query: "${query}" in ${city}, ${country}`);
    console.log(`   Limit: ${limit} businesses`);
    console.log(`${'='.repeat(60)}\n`);

    const startTime = Date.now();
    let results: ScrapedBusinessData[] = [];

    try {
        switch (platform) {
            case 'google_maps':
                results = await scrapeGoogleMapsReal(query, city, country, limit);
                break;
            case 'yelp':
                results = await scrapeYelpReal(query, city, limit);
                break;
            case 'yellow_pages':
                results = await scrapeYellowPagesReal(query, city, limit);
                break;
            case 'facebook':
                results = await scrapeFacebookReal(query, city, limit);
                break;
            case 'linkedin':
                // LinkedIn requires login - return message
                console.log('⚠️ LinkedIn requires authentication - returning empty results');
                console.log('💡 Tip: Use LinkedIn official API or Sales Navigator for company data');
                results = [];
                break;
            case 'tripadvisor':
                // TripAdvisor is heavily protected - return message
                console.log('⚠️ TripAdvisor has strong anti-scraping measures');
                console.log('💡 Tip: Consider using TripAdvisor Content API');
                results = [];
                break;
            case 'instagram':
                // Instagram requires login
                console.log('⚠️ Instagram requires authentication - returning empty results');
                results = [];
                break;
            case 'indeed':
                // Indeed for job listings
                console.log('⚠️ Indeed requires authentication - returning empty results');
                results = [];
                break;
            default:
                console.log(`⚠️ Platform "${platform}" not supported for real scraping`);
                console.log(`📋 Supported platforms: google_maps, yelp, yellow_pages, facebook`);
                return [];
        }
    } catch (error) {
        console.error(`❌ Fatal error scraping ${platform}:`, (error as Error).message);
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n✅ Completed ${platform} in ${duration}s - Found ${results.length} businesses\n`);

    return results;
}

