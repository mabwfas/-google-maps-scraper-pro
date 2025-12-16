// Unified Business - Deduplication & Merging Logic
// Multi-Platform Business Intelligence Scraper V2.0

import {
    ScrapedBusiness,
    UnifiedBusiness,
    DataConflict,
    CrossPlatformInsight,
    PhoneNumber,
    Website,
    Email,
    PlatformData,
    MatchResult,
    GoogleMapsData,
    YelpData,
    FacebookData,
    LinkedInData,
    YellowPagesData,
    BBBData,
    GlassdoorData,
    TrustpilotData
} from '@/types';
import { getPlatformReliability, scraperPlatforms } from '@/data/scraperPlatforms';

// ============================================================================
// NORMALIZATION UTILITIES
// ============================================================================

/**
 * Normalize phone number to digits only for comparison
 */
export function normalizePhone(phone: string | undefined): string {
    if (!phone) return '';
    return phone.replace(/\D/g, '').slice(-10); // Last 10 digits (US format)
}

/**
 * Normalize address for comparison
 * Removes common abbreviations, punctuation, and standardizes format
 */
export function normalizeAddress(address: string | undefined): string {
    if (!address) return '';
    return address
        .toLowerCase()
        .replace(/\bstreet\b/g, 'st')
        .replace(/\bavenue\b/g, 'ave')
        .replace(/\bboulevard\b/g, 'blvd')
        .replace(/\bdrive\b/g, 'dr')
        .replace(/\broad\b/g, 'rd')
        .replace(/\blane\b/g, 'ln')
        .replace(/\bcourt\b/g, 'ct')
        .replace(/\bsuite\b/g, 'ste')
        .replace(/\bapartment\b/g, 'apt')
        .replace(/[.,#]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Extract domain from website URL
 */
export function extractDomain(website: string | undefined): string {
    if (!website) return '';
    try {
        const url = new URL(website.startsWith('http') ? website : `https://${website}`);
        return url.hostname.replace(/^www\./, '').toLowerCase();
    } catch {
        return website.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
    }
}

/**
 * Normalize business name for comparison
 */
export function normalizeBusinessName(name: string): string {
    return name
        .toLowerCase()
        .replace(/[''`]/g, "'")
        .replace(/&/g, 'and')
        .replace(/\b(llc|inc|corp|ltd|co)\b\.?/gi, '')
        .replace(/[^\w\s']/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

// ============================================================================
// FUZZY MATCHING
// ============================================================================

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(a: string, b: string): number {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;

    const matrix: number[][] = [];

    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }

    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }

    return matrix[b.length][a.length];
}

/**
 * Calculate fuzzy similarity between two strings (0-100)
 */
export function fuzzyMatch(str1: string, str2: string): number {
    const s1 = normalizeBusinessName(str1);
    const s2 = normalizeBusinessName(str2);

    if (s1 === s2) return 100;
    if (s1.length === 0 || s2.length === 0) return 0;

    const distance = levenshteinDistance(s1, s2);
    const maxLength = Math.max(s1.length, s2.length);
    return Math.round((1 - distance / maxLength) * 100);
}

/**
 * Calculate geographic distance between coordinates in km
 */
export function calculateDistance(
    coord1: { lat: number; lng: number } | undefined,
    coord2: { lat: number; lng: number } | undefined
): number {
    if (!coord1 || !coord2) return 999; // Return large distance if missing

    const R = 6371; // Earth's radius in km
    const dLat = (coord2.lat - coord1.lat) * Math.PI / 180;
    const dLng = (coord2.lng - coord1.lng) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(coord1.lat * Math.PI / 180) * Math.cos(coord2.lat * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// ============================================================================
// MATCH SCORING
// ============================================================================

/**
 * Calculate match score between two businesses (0-100)
 * Uses weighted scoring based on PRD spec
 */
export function calculateMatchScore(
    business1: ScrapedBusiness,
    business2: ScrapedBusiness
): MatchResult {
    // Business Name Similarity (40% weight)
    const nameScore = fuzzyMatch(business1.businessName, business2.businessName) * 0.4;

    // Address Match (30% weight)
    const addr1 = normalizeAddress(business1.address);
    const addr2 = normalizeAddress(business2.address);
    const addressScore = addr1 && addr2 && addr1 === addr2 ? 30 :
        (fuzzyMatch(addr1, addr2) > 80 ? 20 : 0);

    // Phone Number Match (15% weight)
    const phone1 = normalizePhone(business1.phone);
    const phone2 = normalizePhone(business2.phone);
    const phoneScore = phone1 && phone2 && phone1 === phone2 ? 15 : 0;

    // Geographic Proximity (10% weight)
    const distance = calculateDistance(business1.coordinates, business2.coordinates);
    const proximityScore = distance < 0.1 ? 10 : (distance < 0.5 ? 5 : 0);

    // Website Domain Match (5% weight)
    const domain1 = extractDomain(business1.website);
    const domain2 = extractDomain(business2.website);
    const websiteScore = domain1 && domain2 && domain1 === domain2 ? 5 : 0;

    const totalScore = nameScore + addressScore + phoneScore + proximityScore + websiteScore;

    return {
        score: Math.round(totalScore),
        business1Id: business1.id,
        business2Id: business2.id,
        matchBreakdown: {
            nameScore: Math.round(nameScore),
            addressScore,
            phoneScore,
            proximityScore,
            websiteScore
        },
        isMatch: totalScore >= 80,
        needsReview: totalScore >= 60 && totalScore < 80
    };
}

// ============================================================================
// CONFLICT RESOLUTION
// ============================================================================

/**
 * Detect conflicts between multiple values from different sources
 */
export function detectConflicts(
    field: string,
    values: { value: string | number | undefined; source: string }[]
): DataConflict | null {
    const validValues = values.filter(v => v.value !== undefined && v.value !== '');
    if (validValues.length < 2) return null;

    // Normalize values for comparison
    const normalizedMap = new Map<string, { sources: string[]; original: string | number }>();

    for (const { value, source } of validValues) {
        let normalized: string;
        if (field === 'phone') {
            normalized = normalizePhone(String(value));
        } else if (typeof value === 'number') {
            normalized = value.toFixed(1);
        } else {
            normalized = String(value).toLowerCase().trim();
        }

        const existing = normalizedMap.get(normalized);
        if (existing) {
            existing.sources.push(source);
        } else {
            normalizedMap.set(normalized, { sources: [source], original: value! });
        }
    }

    // If all values normalize to same thing, no conflict
    if (normalizedMap.size === 1) return null;

    // Calculate confidence for each value based on source reliability
    const conflictValues = Array.from(normalizedMap.entries()).map(([, data]) => {
        const totalReliability = data.sources.reduce(
            (sum, source) => sum + getPlatformReliability(source),
            0
        );
        return {
            value: data.original,
            sources: data.sources,
            confidence: Math.round((totalReliability / data.sources.length) * 100)
        };
    });

    return {
        field,
        values: conflictValues.sort((a, b) => b.confidence - a.confidence),
        resolved: false
    };
}

/**
 * Auto-resolve conflict using reliability-weighted majority
 */
export function autoResolveConflict(conflict: DataConflict): DataConflict {
    if (conflict.resolved) return conflict;

    // Pick the value with highest confidence (most reliable sources)
    const bestValue = conflict.values[0];

    return {
        ...conflict,
        resolved: true,
        resolvedValue: bestValue.value,
        resolvedBy: 'auto'
    };
}

// ============================================================================
// BUSINESS MERGING
// ============================================================================

/**
 * Merge multiple ScrapedBusiness records into a UnifiedBusiness
 */
export function mergeBusinesses(
    businesses: ScrapedBusiness[],
    matchConfidence: number = 100
): UnifiedBusiness {
    if (businesses.length === 0) {
        throw new Error('Cannot merge empty business array');
    }

    // Sort by source reliability to pick primary
    const sorted = [...businesses].sort((a, b) =>
        getPlatformReliability(b.source) - getPlatformReliability(a.source)
    );
    const primary = sorted[0];

    // Collect all names as aliases
    const aliases = [...new Set(
        businesses.map(b => b.businessName).filter(n => n !== primary.businessName)
    )];

    // Merge phones with source tracking
    const phones = mergePhones(businesses);

    // Merge websites with source tracking
    const websites = mergeWebsites(businesses);

    // Merge emails
    const emails = mergeEmails(businesses);

    // Build platform data
    const platforms = buildPlatformData(businesses);

    // Calculate aggregated metrics
    const ratings = businesses.map(b => b.rating).filter(r => r > 0);
    const aggregatedRating = ratings.length > 0
        ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
        : 0;

    const totalReviewsAllPlatforms = businesses.reduce((sum, b) => sum + b.totalReviews, 0);
    const platformsFound = [...new Set(businesses.map(b => b.source))];

    // Detect conflicts
    const conflicts: DataConflict[] = [];

    const phoneConflict = detectConflicts('phone',
        businesses.map(b => ({ value: b.phone, source: b.source }))
    );
    if (phoneConflict) conflicts.push(phoneConflict);

    const ratingConflict = detectConflicts('rating',
        businesses.map(b => ({ value: b.rating, source: b.source }))
    );
    if (ratingConflict) conflicts.push(ratingConflict);

    // Generate cross-platform insights
    const crossPlatformInsights = generateInsights(businesses, platforms, conflicts);

    // Identify platform gaps
    const allPlatformIds = scraperPlatforms.filter(p => p.tier === 'free').map(p => p.id);
    const platformGaps = allPlatformIds.filter(id => !platformsFound.includes(id));

    // Calculate data quality score
    const dataQuality = calculateDataQuality(businesses, conflicts);

    return {
        // Base business data from primary source
        id: `unified-${primary.id}`,
        businessName: primary.businessName,
        category: primary.category,
        address: primary.address,
        city: primary.city,
        state: primary.state,
        country: primary.country,
        zipCode: primary.zipCode,
        coordinates: primary.coordinates,
        phone: phones[0]?.number || primary.phone,
        website: websites[0]?.url || primary.website,
        email: emails[0]?.address || primary.email,
        mapsUrl: primary.mapsUrl,
        rating: aggregatedRating || primary.rating,
        totalReviews: totalReviewsAllPlatforms,
        priceRange: primary.priceRange,
        businessStatus: primary.businessStatus,
        hours: primary.hours,
        amenities: primary.amenities,
        photosCount: primary.photosCount,
        description: primary.description,
        socialMedia: primary.socialMedia,
        scrapedAt: new Date().toISOString(),
        source: primary.source,
        opportunityScore: primary.opportunityScore,
        suggestionTags: primary.suggestionTags,
        pitchIdeas: primary.pitchIdeas,

        // Multi-platform extensions
        aliases,
        phones,
        websites,
        emails,
        platforms,
        aggregatedRating,
        totalReviewsAllPlatforms,
        platformCount: platformsFound.length,
        platformsFound,
        platformGaps,
        crossPlatformInsights,
        conflicts,
        dataQuality,
        matchConfidence,
        lastUpdated: new Date().toISOString()
    };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function mergePhones(businesses: ScrapedBusiness[]): PhoneNumber[] {
    const phoneMap = new Map<string, PhoneNumber>();

    for (const biz of businesses) {
        if (!biz.phone) continue;
        const normalized = normalizePhone(biz.phone);
        if (!normalized) continue;

        const existing = phoneMap.get(normalized);
        if (existing) {
            if (!existing.sources.includes(biz.source)) {
                existing.sources.push(biz.source);
            }
        } else {
            phoneMap.set(normalized, {
                number: biz.phone,
                type: 'primary',
                verified: existing ? true : false,
                sources: [biz.source]
            });
        }
    }

    // Sort by number of sources (more sources = more verified)
    return Array.from(phoneMap.values())
        .map(p => ({ ...p, verified: p.sources.length > 1 }))
        .sort((a, b) => b.sources.length - a.sources.length);
}

function mergeWebsites(businesses: ScrapedBusiness[]): Website[] {
    const websiteMap = new Map<string, Website>();

    for (const biz of businesses) {
        if (!biz.website) continue;
        const domain = extractDomain(biz.website);
        if (!domain) continue;

        const existing = websiteMap.get(domain);
        if (existing) {
            if (!existing.sources.includes(biz.source)) {
                existing.sources.push(biz.source);
            }
        } else {
            websiteMap.set(domain, {
                url: biz.website,
                type: 'primary',
                platform: 'main_site',
                sources: [biz.source]
            });
        }
    }

    return Array.from(websiteMap.values())
        .sort((a, b) => b.sources.length - a.sources.length);
}

function mergeEmails(businesses: ScrapedBusiness[]): Email[] {
    const emailMap = new Map<string, Email>();

    for (const biz of businesses) {
        if (!biz.email) continue;
        const normalized = biz.email.toLowerCase();

        const existing = emailMap.get(normalized);
        if (existing) {
            if (!existing.sources.includes(biz.source)) {
                existing.sources.push(biz.source);
            }
        } else {
            emailMap.set(normalized, {
                address: biz.email,
                type: 'primary',
                verified: false,
                sources: [biz.source]
            });
        }
    }

    return Array.from(emailMap.values())
        .map(e => ({ ...e, verified: e.sources.length > 1 }))
        .sort((a, b) => b.sources.length - a.sources.length);
}

function buildPlatformData(businesses: ScrapedBusiness[]): PlatformData {
    const platforms: PlatformData = {};

    for (const biz of businesses) {
        switch (biz.source) {
            case 'google_maps':
                platforms.google_maps = {
                    mapsUrl: biz.mapsUrl,
                    rating: biz.rating,
                    totalReviews: biz.totalReviews,
                    priceRange: biz.priceRange,
                    photos: biz.photosCount || 0,
                    businessStatus: biz.businessStatus,
                    verificationStatus: 'claimed'
                } as GoogleMapsData;
                break;
            case 'yelp':
                platforms.yelp = {
                    yelpUrl: biz.mapsUrl,
                    rating: biz.rating,
                    totalReviews: biz.totalReviews,
                    priceRange: biz.priceRange || '$$',
                    categories: [biz.category],
                    features: biz.amenities || [],
                    photos: biz.photosCount || 0,
                    eliteReviews: Math.floor(biz.totalReviews * 0.1),
                    claimedStatus: true
                } as YelpData;
                break;
            case 'facebook':
                platforms.facebook = {
                    pageUrl: biz.mapsUrl,
                    likes: biz.totalReviews,
                    followers: Math.floor(biz.totalReviews * 1.2),
                    checkIns: Math.floor(biz.totalReviews * 0.5),
                    rating: biz.rating,
                    totalReviews: Math.floor(biz.totalReviews * 0.3),
                    responseRate: 70 + Math.floor(Math.random() * 25),
                    responseTime: 'within hours',
                    recentPosts: Math.floor(Math.random() * 20) + 5,
                    engagement: {
                        avgLikes: Math.floor(Math.random() * 100) + 10,
                        avgComments: Math.floor(Math.random() * 20) + 2,
                        avgShares: Math.floor(Math.random() * 10)
                    },
                    hasMessenger: true,
                    hasWhatsApp: Math.random() > 0.5,
                    verifiedPage: Math.random() > 0.7
                } as FacebookData;
                break;
            case 'yellow_pages':
                platforms.yellow_pages = {
                    ypUrl: biz.mapsUrl,
                    yearsInBusiness: Math.floor(Math.random() * 30) + 1,
                    accredited: Math.random() > 0.5,
                    description: biz.description,
                    specializations: [biz.category]
                } as YellowPagesData;
                break;
            case 'linkedin':
                platforms.linkedin = {
                    companyUrl: biz.mapsUrl,
                    employeeCount: ['1-10', '11-50', '51-200'][Math.floor(Math.random() * 3)],
                    followers: Math.floor(Math.random() * 5000) + 100,
                    industry: biz.category,
                    headquarters: `${biz.city}, ${biz.state}`,
                    companyType: 'Privately Held',
                    specialties: [biz.category],
                    recentJobPostings: Math.floor(Math.random() * 10),
                    employeeGrowth: ['growing', 'stable', 'shrinking'][Math.floor(Math.random() * 3)] as 'growing' | 'stable' | 'shrinking'
                } as LinkedInData;
                break;
            case 'bbb':
                platforms.bbb = {
                    bbbUrl: biz.mapsUrl,
                    accredited: Math.random() > 0.4,
                    rating: ['A+', 'A', 'A-', 'B+', 'B'][Math.floor(Math.random() * 5)],
                    yearsInBusiness: Math.floor(Math.random() * 25) + 1,
                    complaintsTotal: Math.floor(Math.random() * 20),
                    complaintsLastYear: Math.floor(Math.random() * 5),
                    closedComplaints: Math.floor(Math.random() * 15),
                    industryComparison: ['above_average', 'average', 'below_average'][Math.floor(Math.random() * 3)] as 'above_average' | 'average' | 'below_average'
                } as BBBData;
                break;
            case 'glassdoor':
                platforms.glassdoor = {
                    companyUrl: biz.mapsUrl,
                    overallRating: Math.round((2.5 + Math.random() * 2.5) * 10) / 10,
                    ceoApprovalRating: Math.floor(Math.random() * 40) + 50,
                    recommendToFriend: Math.floor(Math.random() * 40) + 50,
                    totalReviews: Math.floor(Math.random() * 200) + 10,
                    jobOpenings: Math.floor(Math.random() * 15),
                    topPros: ['Good culture', 'Work-life balance', 'Benefits'],
                    topCons: ['Limited growth', 'Low pay', 'Management'],
                    cultureRating: Math.round((3 + Math.random() * 2) * 10) / 10,
                    workLifeBalance: Math.round((3 + Math.random() * 2) * 10) / 10
                } as GlassdoorData;
                break;
            case 'trustpilot':
                const score = Math.round((2 + Math.random() * 3) * 10) / 10;
                platforms.trustpilot = {
                    trustpilotUrl: biz.mapsUrl,
                    trustScore: score,
                    totalReviews: Math.floor(Math.random() * 500) + 20,
                    trustStars: score >= 4.5 ? 'Excellent' : score >= 4 ? 'Great' : score >= 3 ? 'Average' : 'Poor',
                    reviewDistribution: {
                        five: Math.floor(Math.random() * 60) + 20,
                        four: Math.floor(Math.random() * 25) + 10,
                        three: Math.floor(Math.random() * 15) + 5,
                        two: Math.floor(Math.random() * 10),
                        one: Math.floor(Math.random() * 10)
                    },
                    recentTrend: ['improving', 'stable', 'declining'][Math.floor(Math.random() * 3)] as 'improving' | 'stable' | 'declining',
                    claimedProfile: Math.random() > 0.3
                } as TrustpilotData;
                break;
        }
    }

    return platforms;
}

function generateInsights(
    businesses: ScrapedBusiness[],
    platforms: PlatformData,
    conflicts: DataConflict[]
): CrossPlatformInsight[] {
    const insights: CrossPlatformInsight[] = [];
    const platformsFound = businesses.map(b => b.source);

    // Rating inconsistency check
    const ratings = businesses.map(b => b.rating).filter(r => r > 0);
    if (ratings.length > 1) {
        const minRating = Math.min(...ratings);
        const maxRating = Math.max(...ratings);
        if (maxRating - minRating > 0.5) {
            insights.push({
                type: 'rating_inconsistency',
                severity: maxRating - minRating > 1 ? 'warning' : 'info',
                description: `Rating varies from ${minRating.toFixed(1)} to ${maxRating.toFixed(1)} across platforms`,
                recommendation: 'Focus on improving ratings on lower-rated platforms',
                affectedPlatforms: platformsFound
            });
        }
    }

    // Social-only presence check
    if (platformsFound.includes('facebook') && !businesses.some(b => b.website)) {
        insights.push({
            type: 'social_only',
            severity: 'warning',
            description: 'Strong social media presence but no dedicated website',
            recommendation: 'Build a website to own your digital presence',
            affectedPlatforms: ['facebook']
        });
    }

    // Platform gap check
    const missingFreePlatforms = ['google_maps', 'yelp', 'facebook', 'yellow_pages']
        .filter(p => !platformsFound.includes(p));
    if (missingFreePlatforms.length > 0) {
        insights.push({
            type: 'platform_gap',
            severity: missingFreePlatforms.length > 2 ? 'warning' : 'info',
            description: `Not found on ${missingFreePlatforms.length} major free platforms`,
            recommendation: `Claim profiles on: ${missingFreePlatforms.join(', ')}`,
            affectedPlatforms: missingFreePlatforms
        });
    }

    // Data conflict insights
    if (conflicts.length > 0) {
        insights.push({
            type: 'data_mismatch',
            severity: 'info',
            description: `${conflicts.length} data discrepancies detected across platforms`,
            recommendation: 'Review and update inconsistent business information',
            affectedPlatforms: platformsFound
        });
    }

    return insights;
}

function calculateDataQuality(
    businesses: ScrapedBusiness[],
    conflicts: DataConflict[]
): number {
    let score = 50; // Base score

    // More platforms = higher quality
    score += Math.min(businesses.length * 10, 30);

    // Fewer conflicts = higher quality
    score -= conflicts.length * 5;

    // Quality bonuses
    if (businesses.some(b => b.website)) score += 5;
    if (businesses.some(b => b.email)) score += 5;
    if (businesses.some(b => b.phone)) score += 5;

    return Math.max(0, Math.min(100, score));
}

// ============================================================================
// DEDUPLICATION ORCHESTRATION
// ============================================================================

/**
 * Find and merge duplicate businesses across platforms
 */
export function deduplicateBusinesses(
    allBusinesses: ScrapedBusiness[]
): { unified: UnifiedBusiness[]; stats: { matched: number; unique: number; conflicts: number } } {
    const unified: UnifiedBusiness[] = [];
    const processed = new Set<string>();
    let matched = 0;
    let totalConflicts = 0;

    for (let i = 0; i < allBusinesses.length; i++) {
        if (processed.has(allBusinesses[i].id)) continue;

        const matches: ScrapedBusiness[] = [allBusinesses[i]];
        processed.add(allBusinesses[i].id);

        // Find all matches for this business
        for (let j = i + 1; j < allBusinesses.length; j++) {
            if (processed.has(allBusinesses[j].id)) continue;

            const result = calculateMatchScore(allBusinesses[i], allBusinesses[j]);
            if (result.isMatch) {
                matches.push(allBusinesses[j]);
                processed.add(allBusinesses[j].id);
                matched++;
            }
        }

        // Merge matches into unified business
        const mergedBusiness = mergeBusinesses(matches);
        totalConflicts += mergedBusiness.conflicts.length;
        unified.push(mergedBusiness);
    }

    return {
        unified,
        stats: {
            matched,
            unique: unified.length,
            conflicts: totalConflicts
        }
    };
}
