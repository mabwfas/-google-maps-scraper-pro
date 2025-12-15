// Scraper Platform Types and Configuration

export interface ScraperPlatform {
    id: string;
    name: string;
    icon: string;
    description: string;
    dataPoints: string[];
    color: string;
    enabled: boolean;
}

export const scraperPlatforms: ScraperPlatform[] = [
    {
        id: 'google_maps',
        name: 'Google Maps',
        icon: '🗺️',
        description: 'Extract business data from Google Maps with ratings, reviews, contact info',
        dataPoints: ['Business Name', 'Address', 'Phone', 'Website', 'Rating', 'Reviews', 'Hours', 'Category'],
        color: '#4285F4',
        enabled: true
    },
    {
        id: 'linkedin',
        name: 'LinkedIn',
        icon: '💼',
        description: 'Find company profiles, employees, and decision-makers for B2B outreach',
        dataPoints: ['Company Name', 'Industry', 'Size', 'Location', 'Website', 'Employees', 'Description'],
        color: '#0A66C2',
        enabled: true
    },
    {
        id: 'yelp',
        name: 'Yelp',
        icon: '⭐',
        description: 'Scrape local business reviews, ratings, and contact information',
        dataPoints: ['Business Name', 'Category', 'Rating', 'Reviews', 'Phone', 'Address', 'Price Range', 'Hours'],
        color: '#D32323',
        enabled: true
    },
    {
        id: 'yellow_pages',
        name: 'Yellow Pages',
        icon: '📒',
        description: 'Access business directory listings with verified contact details',
        dataPoints: ['Business Name', 'Category', 'Phone', 'Address', 'Website', 'Years in Business'],
        color: '#FFD700',
        enabled: true
    },
    {
        id: 'facebook',
        name: 'Facebook Pages',
        icon: '📘',
        description: 'Extract business page data, followers, and contact information',
        dataPoints: ['Page Name', 'Category', 'Followers', 'Likes', 'Phone', 'Website', 'Address', 'Rating'],
        color: '#1877F2',
        enabled: true
    },
    {
        id: 'instagram',
        name: 'Instagram Business',
        icon: '📸',
        description: 'Find business accounts with engagement metrics and contact info',
        dataPoints: ['Username', 'Followers', 'Posts', 'Bio', 'Website', 'Category', 'Email'],
        color: '#E4405F',
        enabled: true
    },
    {
        id: 'tripadvisor',
        name: 'TripAdvisor',
        icon: '🦉',
        description: 'Scrape hotels, restaurants, and attractions with traveler reviews',
        dataPoints: ['Business Name', 'Rating', 'Reviews', 'Ranking', 'Price Range', 'Address', 'Phone'],
        color: '#00AF87',
        enabled: true
    },
    {
        id: 'indeed',
        name: 'Indeed Companies',
        icon: '💼',
        description: 'Extract employer profiles with company reviews and job postings',
        dataPoints: ['Company Name', 'Industry', 'Size', 'Rating', 'Reviews', 'Location', 'Jobs Posted'],
        color: '#2164F3',
        enabled: true
    }
];

export const getScraperById = (id: string): ScraperPlatform | undefined => {
    return scraperPlatforms.find(s => s.id === id);
};

export const getEnabledScrapers = (): ScraperPlatform[] => {
    return scraperPlatforms.filter(s => s.enabled);
};
