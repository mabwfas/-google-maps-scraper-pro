// AI Opportunity Scoring Algorithm
// Enhanced for Multi-Platform Business Intelligence

import { ScrapedBusiness, OpportunityLevel, UnifiedBusiness } from '@/types';

const PREMIUM_LOCATIONS = [
    'Manhattan', 'Beverly Hills', 'Dubai', 'Singapore', 'London', 'San Francisco',
    'Miami Beach', 'Monaco', 'Zurich', 'Hong Kong', 'Tokyo', 'Sydney', 'Los Angeles',
    'New York', 'Chicago', 'Boston', 'Seattle', 'Austin', 'Denver', 'Atlanta'
];

// Type guard for unified business
function isUnifiedBusiness(business: Partial<ScrapedBusiness>): business is Partial<UnifiedBusiness> {
    return 'platformsFound' in business && 'aggregatedRating' in business;
}

export function calculateOpportunityScore(business: Partial<ScrapedBusiness>): number {
    let score = 0;

    // === Core Opportunities (60 points max) ===

    // No website = huge opportunity (+25)
    if (!business.website) {
        score += 25;
    }

    // High traffic but low rating = need help (+25)
    if ((business.totalReviews || 0) > 50 && (business.rating || 5) < 4.0) {
        score += 25;
    }

    // Has website but non-secure (+10)
    if (business.website && !business.website.includes('https')) {
        score += 10;
    }

    // Poor online presence - few reviews (+15)
    if ((business.totalReviews || 0) < 20) {
        score += 15;
    }

    // Good business but could be better (+10)
    const rating = business.rating || 0;
    const reviews = business.totalReviews || 0;
    if (rating >= 4.0 && rating < 4.5 && reviews > 100) {
        score += 10;
    }

    // === Multi-Platform Bonuses (40 points max) ===
    if (isUnifiedBusiness(business)) {
        const unified = business as Partial<UnifiedBusiness>;

        // Missing platforms = opportunity (+5 per missing platform)
        const platformGaps = unified.platformGaps || [];
        score += Math.min(20, platformGaps.length * 5);

        // Low data quality = needs improvement (+10)
        if ((unified.dataQuality || 100) < 50) {
            score += 10;
        }

        // Rating inconsistency across platforms (+10)
        const conflicts = unified.conflicts || [];
        if (conflicts.some(c => c.field === 'rating')) {
            score += 10;
        }

        // No social presence (+15)
        if (!unified.platforms?.facebook && !unified.platforms?.linkedin) {
            score += 15;
        }

        // Facebook but low engagement (+10)
        if (unified.platforms?.facebook && (unified.platforms.facebook.followers || 0) < 100) {
            score += 10;
        }
    }

    // === Location Bonus (10 points max) ===
    if (business.city && PREMIUM_LOCATIONS.some(loc =>
        business.city!.toLowerCase().includes(loc.toLowerCase())
    )) {
        score += 10;
    }

    // === Secondary Signals (15 points max) ===

    // No business hours listed (+5)
    if (!business.hours || business.hours.length === 0) {
        score += 5;
    }

    // Few photos (+5)
    if ((business.photosCount || 0) < 10) {
        score += 5;
    }

    // No description (+5)
    if (!business.description) {
        score += 5;
    }

    return Math.min(100, score);
}

export function getOpportunityLevel(score: number): OpportunityLevel {
    if (score >= 80) return 'hot';
    if (score >= 60) return 'good';
    if (score >= 40) return 'decent';
    return 'low';
}

export function getOpportunityLabel(level: OpportunityLevel): string {
    switch (level) {
        case 'hot': return 'Hot Lead';
        case 'good': return 'Good Opportunity';
        case 'decent': return 'Decent Prospect';
        case 'low': return 'Low Priority';
    }
}

export function getOpportunityEmoji(level: OpportunityLevel): string {
    switch (level) {
        case 'hot': return '🔥';
        case 'good': return '⭐';
        case 'decent': return '✅';
        case 'low': return '💤';
    }
}

export function getOpportunityColor(level: OpportunityLevel): string {
    switch (level) {
        case 'hot': return '#FF4444';
        case 'good': return '#FF8C00';
        case 'decent': return '#FFD700';
        case 'low': return '#9E9E9E';
    }
}

export function getCloseProbability(score: number, business: Partial<ScrapedBusiness>): number {
    let probability = score * 0.5; // Base probability from score

    // Adjust based on specific factors
    if (!business.website) probability += 15;
    if ((business.rating || 5) < 4.0 && (business.totalReviews || 0) > 50) probability += 10;
    if ((business.totalReviews || 0) > 100) probability += 5; // Can afford services

    // Multi-platform bonuses
    if (isUnifiedBusiness(business)) {
        const unified = business as Partial<UnifiedBusiness>;
        if ((unified.platformGaps?.length || 0) > 2) probability += 10;
        if (!unified.platforms?.facebook) probability += 5;
    }

    return Math.min(95, Math.max(5, probability));
}

// Calculate score breakdown for display
export function getScoreBreakdown(business: Partial<ScrapedBusiness>): { reason: string; points: number }[] {
    const breakdown: { reason: string; points: number }[] = [];

    if (!business.website) {
        breakdown.push({ reason: 'No website', points: 25 });
    }

    if ((business.totalReviews || 0) > 50 && (business.rating || 5) < 4.0) {
        breakdown.push({ reason: 'Low rating with high traffic', points: 25 });
    }

    if ((business.totalReviews || 0) < 20) {
        breakdown.push({ reason: 'Few online reviews', points: 15 });
    }

    if (isUnifiedBusiness(business)) {
        const unified = business as Partial<UnifiedBusiness>;
        const gaps = unified.platformGaps?.length || 0;
        if (gaps > 0) {
            breakdown.push({ reason: `Missing ${gaps} platform(s)`, points: Math.min(20, gaps * 5) });
        }
        if (!unified.platforms?.facebook && !unified.platforms?.linkedin) {
            breakdown.push({ reason: 'No social presence', points: 15 });
        }
    }

    return breakdown;
}

