// Scraper Platform Types and Configuration
// Extended for Multi-Platform Business Intelligence Scraper V2.0

import { PlatformTier } from '@/types';

export interface ScraperPlatform {
    id: string;
    name: string;
    icon: string;
    description: string;
    dataPoints: string[];
    color: string;
    enabled: boolean;
    // NEW: Multi-platform features
    tier: PlatformTier;
    coverage: string; // e.g., "200M+ businesses"
    uniqueData: string[]; // Platform-specific valuable data
    multiSelectEnabled: boolean; // Can be selected with other platforms
    reliability: number; // 0-1 score for conflict resolution
}

export const scraperPlatforms: ScraperPlatform[] = [
    {
        id: 'google_maps',
        name: 'Google Maps',
        icon: '🗺️',
        description: 'Extract business data from Google Maps with ratings, reviews, contact info',
        dataPoints: ['Business Name', 'Address', 'Phone', 'Website', 'Rating', 'Reviews', 'Hours', 'Category'],
        color: '#4285F4',
        enabled: true,
        tier: 'free',
        coverage: '200M+ businesses',
        uniqueData: ['Popular Times', 'Place ID', 'Verified Status', 'Photos'],
        multiSelectEnabled: true,
        reliability: 0.95
    },
    {
        id: 'yelp',
        name: 'Yelp',
        icon: '⭐',
        description: 'Scrape local business reviews, ratings, and detailed features',
        dataPoints: ['Business Name', 'Category', 'Rating', 'Reviews', 'Phone', 'Address', 'Price Range', 'Features'],
        color: '#D32323',
        enabled: true,
        tier: 'free',
        coverage: '25M+ businesses',
        uniqueData: ['Elite Reviews', 'Price Range', 'Business Features', 'Q&A'],
        multiSelectEnabled: true,
        reliability: 0.90
    },
    {
        id: 'facebook',
        name: 'Facebook Pages',
        icon: '📘',
        description: 'Extract business page data, engagement metrics, and response rates',
        dataPoints: ['Page Name', 'Category', 'Followers', 'Likes', 'Phone', 'Website', 'Rating', 'Response Rate'],
        color: '#1877F2',
        enabled: true,
        tier: 'free',
        coverage: '200M+ pages',
        uniqueData: ['Response Rate', 'Engagement Metrics', 'Recent Posts', 'Check-ins'],
        multiSelectEnabled: true,
        reliability: 0.85
    },
    {
        id: 'yellow_pages',
        name: 'Yellow Pages',
        icon: '📒',
        description: 'Access business directory listings with years in business data',
        dataPoints: ['Business Name', 'Category', 'Phone', 'Address', 'Website', 'Years in Business'],
        color: '#FFD700',
        enabled: true,
        tier: 'free',
        coverage: '20M+ US businesses',
        uniqueData: ['Years in Business', 'BBB Info', 'Specializations'],
        multiSelectEnabled: true,
        reliability: 0.80
    },
    {
        id: 'linkedin',
        name: 'LinkedIn',
        icon: '💼',
        description: 'Find company profiles, employees, and decision-makers for B2B outreach',
        dataPoints: ['Company Name', 'Industry', 'Size', 'Location', 'Website', 'Employees', 'Job Postings'],
        color: '#0A66C2',
        enabled: true,
        tier: 'pro',
        coverage: '60M+ companies',
        uniqueData: ['Employee Count', 'Job Postings', 'Company Growth', 'Decision Makers'],
        multiSelectEnabled: true,
        reliability: 0.90
    },
    {
        id: 'bbb',
        name: 'BBB',
        icon: '🏆',
        description: 'Better Business Bureau accreditation, ratings, and complaint history',
        dataPoints: ['Company Name', 'BBB Rating', 'Accreditation', 'Complaints', 'Years in Business'],
        color: '#005A9C',
        enabled: true,
        tier: 'pro',
        coverage: '5M+ businesses',
        uniqueData: ['BBB Rating', 'Accreditation Status', 'Complaint History', 'Response Time'],
        multiSelectEnabled: true,
        reliability: 0.85
    },
    {
        id: 'glassdoor',
        name: 'Glassdoor',
        icon: '🏢',
        description: 'Extract employer profiles with company reviews and culture ratings',
        dataPoints: ['Company Name', 'Overall Rating', 'CEO Approval', 'Reviews', 'Job Openings', 'Culture'],
        color: '#0CAA41',
        enabled: true,
        tier: 'premium',
        coverage: '2M+ companies',
        uniqueData: ['Employee Reviews', 'Culture Rating', 'CEO Approval', 'Salary Data'],
        multiSelectEnabled: true,
        reliability: 0.85
    },
    {
        id: 'trustpilot',
        name: 'Trustpilot',
        icon: '✅',
        description: 'Customer trust scores and verified review data',
        dataPoints: ['Company Name', 'Trust Score', 'Reviews', 'Star Rating', 'Review Trend'],
        color: '#00B67A',
        enabled: true,
        tier: 'premium',
        coverage: '1M+ companies',
        uniqueData: ['Trust Score', 'Verified Reviews', 'Review Trend', 'Response Rate'],
        multiSelectEnabled: true,
        reliability: 0.80
    },
    {
        id: 'tripadvisor',
        name: 'TripAdvisor',
        icon: '🦉',
        description: 'Scrape hotels, restaurants, and attractions with traveler reviews',
        dataPoints: ['Business Name', 'Rating', 'Reviews', 'Ranking', 'Price Range', 'Address', 'Phone'],
        color: '#00AF87',
        enabled: true,
        tier: 'premium',
        coverage: '8M+ businesses',
        uniqueData: ['Traveler Rankings', 'Awards', 'Traveler Photos', 'Cuisine Types'],
        multiSelectEnabled: true,
        reliability: 0.85
    },
    {
        id: 'instagram',
        name: 'Instagram Business',
        icon: '📸',
        description: 'Find business accounts with engagement metrics and contact info',
        dataPoints: ['Username', 'Followers', 'Posts', 'Bio', 'Website', 'Category', 'Email'],
        color: '#E4405F',
        enabled: true,
        tier: 'premium',
        coverage: '200M+ business accounts',
        uniqueData: ['Follower Count', 'Engagement Rate', 'Post Frequency', 'Bio Links'],
        multiSelectEnabled: true,
        reliability: 0.75
    },
    {
        id: 'indeed',
        name: 'Indeed Companies',
        icon: '💼',
        description: 'Extract employer profiles with company reviews and job postings',
        dataPoints: ['Company Name', 'Industry', 'Size', 'Rating', 'Reviews', 'Location', 'Jobs Posted'],
        color: '#2164F3',
        enabled: true,
        tier: 'premium',
        coverage: '10M+ employers',
        uniqueData: ['Employer Reviews', 'Salary Data', 'Active Job Listings', 'Interview Insights'],
        multiSelectEnabled: true,
        reliability: 0.80
    }
];

export const getScraperById = (id: string): ScraperPlatform | undefined => {
    return scraperPlatforms.find(s => s.id === id);
};

export const getEnabledScrapers = (): ScraperPlatform[] => {
    return scraperPlatforms.filter(s => s.enabled);
};

// NEW: Get platforms by tier
export const getPlatformsByTier = (tier: PlatformTier): ScraperPlatform[] => {
    return scraperPlatforms.filter(s => s.tier === tier && s.enabled);
};

// NEW: Get free platforms
export const getFreePlatforms = (): ScraperPlatform[] => {
    return getPlatformsByTier('free');
};

// NEW: Get multi-select enabled platforms
export const getMultiSelectPlatforms = (): ScraperPlatform[] => {
    return scraperPlatforms.filter(s => s.multiSelectEnabled && s.enabled);
};

// NEW: Platform reliability for conflict resolution
export const getPlatformReliability = (platformId: string): number => {
    const platform = getScraperById(platformId);
    return platform?.reliability ?? 0.5;
};

// NEW: Platform display names for UI
export const platformAbbreviations: Record<string, string> = {
    'google_maps': 'G',
    'yelp': 'Y',
    'facebook': 'F',
    'yellow_pages': 'YP',
    'linkedin': 'L',
    'bbb': 'B',
    'glassdoor': 'GD',
    'trustpilot': 'T',
    'tripadvisor': 'TA',
    'instagram': 'I',
    'indeed': 'IN'
};

