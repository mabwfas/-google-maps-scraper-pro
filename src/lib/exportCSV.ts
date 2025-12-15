// CSV Export Utility

import { ScrapedBusiness } from '@/types';

export function exportToCSV(businesses: ScrapedBusiness[], filename?: string): void {
    const headers = [
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

    const rows = businesses.map(biz => [
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
    ]);

    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    const date = new Date().toISOString().split('T')[0];
    link.href = url;
    link.download = filename || `google-maps-scraper-${date}.csv`;
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
