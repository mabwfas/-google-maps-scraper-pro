// AI Opportunity Scoring Algorithm

import { ScrapedBusiness, OpportunityLevel } from '@/types';

const PREMIUM_LOCATIONS = [
    'Manhattan', 'Beverly Hills', 'Dubai', 'Singapore', 'London', 'San Francisco',
    'Miami Beach', 'Monaco', 'Zurich', 'Hong Kong', 'Tokyo', 'Sydney'
];

export function calculateOpportunityScore(business: Partial<ScrapedBusiness>): number {
    let score = 0;

    // No website = huge opportunity (+25)
    if (!business.website) {
        score += 25;
    }

    // High traffic but low rating = need help (+30)
    if ((business.totalReviews || 0) > 50 && (business.rating || 5) < 4.0) {
        score += 30;
    }

    // Has website but non-secure (+15)
    if (business.website && !business.website.includes('https')) {
        score += 15;
    }

    // Poor online presence - few reviews (+20)
    if ((business.totalReviews || 0) < 20) {
        score += 20;
    }

    // Good business but could be better (+15)
    const rating = business.rating || 0;
    const reviews = business.totalReviews || 0;
    if (rating >= 4.0 && rating < 4.5 && reviews > 100) {
        score += 15;
    }

    // No business hours listed (+10)
    if (!business.hours || business.hours.length === 0) {
        score += 10;
    }

    // Premium area location (+10)
    if (business.city && PREMIUM_LOCATIONS.some(loc =>
        business.city!.toLowerCase().includes(loc.toLowerCase())
    )) {
        score += 10;
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

    return Math.min(95, Math.max(5, probability));
}
