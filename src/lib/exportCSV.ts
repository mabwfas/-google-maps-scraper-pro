// CSV Export Utility
// Enhanced for Multi-Platform Business Intelligence Scraper V2.0

import { ScrapedBusiness, UnifiedBusiness } from '@/types';

// Type guard to check if business is UnifiedBusiness
function isUnifiedBusiness(business: ScrapedBusiness): business is UnifiedBusiness {
    return 'platformsFound' in business && 'aggregatedRating' in business;
}

export function exportToCSV(businesses: ScrapedBusiness[], filename?: string): void {
    // Check if we have multi-platform data
    const isMultiPlatform = businesses.length > 0 && isUnifiedBusiness(businesses[0]);

    const baseHeaders = [
        'Business Name',
        'Category',
        'Address',
        'City',
        'State',
        'Country',
        'ZIP',
        'Phone',
        'Website',
        'Maps URL',
        'Rating',
        'Reviews',
        'Price Range',
        'Status',
        'Opportunity Score',
        'Opportunity Level',
        'Suggestions',
        'Top Pitch',
        'Pitch Price',
        'Latitude',
        'Longitude'
    ];

    // Additional headers for multi-platform data
    const multiPlatformHeaders = [
        'Platform Count',
        'Platforms Found',
        'Missing Platforms',
        'Aggregated Rating',
        'Total Reviews All Platforms',
        'Facebook Followers',
        'Data Quality %',
        'Match Confidence %',
        'Has Conflicts',
        'Insights Count'
    ];

    const headers = isMultiPlatform
        ? [...baseHeaders, ...multiPlatformHeaders]
        : baseHeaders;

    const rows = businesses.map(biz => {
        const baseRow = [
            escapeCSV(biz.businessName),
            escapeCSV(biz.category),
            escapeCSV(biz.address),
            escapeCSV(biz.city),
            escapeCSV(biz.state),
            escapeCSV(biz.country),
            escapeCSV(biz.zipCode),
            escapeCSV(biz.phone || ''),
            escapeCSV(biz.website || ''),
            escapeCSV(biz.mapsUrl),
            String(biz.rating),
            String(biz.totalReviews),
            escapeCSV(biz.priceRange || ''),
            escapeCSV(biz.businessStatus),
            String(biz.opportunityScore),
            getOpportunityLevel(biz.opportunityScore),
            escapeCSV(biz.suggestionTags.map(t => t.label).join('; ')),
            escapeCSV(biz.pitchIdeas[0]?.service || ''),
            escapeCSV(biz.pitchIdeas[0]?.price || ''),
            String(biz.coordinates.lat),
            String(biz.coordinates.lng)
        ];

        if (isMultiPlatform && isUnifiedBusiness(biz)) {
            const multiPlatformRow = [
                String(biz.platformCount),
                escapeCSV(biz.platformsFound.join('; ')),
                escapeCSV(biz.platformGaps.join('; ')),
                String(biz.aggregatedRating.toFixed(2)),
                String(biz.totalReviewsAllPlatforms),
                String(biz.platforms.facebook?.followers || 0),
                String(biz.dataQuality),
                String(biz.matchConfidence),
                biz.conflicts.length > 0 ? 'Yes' : 'No',
                String(biz.crossPlatformInsights.length)
            ];
            return [...baseRow, ...multiPlatformRow];
        }

        return baseRow;
    });

    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    const date = new Date().toISOString().split('T')[0];
    const platformSuffix = isMultiPlatform ? 'multi-platform' : 'google-maps';
    link.href = url;
    link.download = filename || `${platformSuffix}-scraper-${date}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function escapeCSV(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
}

function getOpportunityLevel(score: number): string {
    if (score >= 80) return 'Hot Lead';
    if (score >= 60) return 'Good Opportunity';
    if (score >= 40) return 'Decent Prospect';
    return 'Low Priority';
}

