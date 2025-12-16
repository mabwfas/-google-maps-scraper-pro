// Platform-Specific Mock Data Generators

import { ScrapedBusiness } from '@/types';
import { calculateOpportunityScore } from './scoring';
import { generateSuggestionTags } from './suggestions';
import { generatePitchIdeas } from './pitchGenerator';

// LinkedIn Company Names
const linkedinCompanies = [
    "TechVenture Labs", "Digital Solutions Inc", "CloudFirst Technologies", "Innovate Partners",
    "Growth Dynamics", "Apex Consulting Group", "Quantum Analytics", "NextGen Software",
    "Velocity Ventures", "Strategic Insights Corp", "DataDriven Co", "Synergy Systems",
    "Blueprint Strategy", "Pinnacle Advisors", "Frontier Solutions", "Catalyst Partners"
];

// Yelp Business Names
const yelpBusinesses = [
    "The Local Grind", "Mama Rosa's Kitchen", "Urban Fitness Club", "Serenity Spa & Salon",
    "The Burger Joint", "Craft Coffee House", "Fresh Market Deli", "Iron Temple Gym",
    "Golden Fortune Chinese", "Bella Notte Italian", "The Brew Yard", "Pure Bliss Yoga",
    "Taco Loco", "The Hair Lounge", "Main Street Pizza", "Zen Garden Thai"
];

// Instagram Business Names
const instagramBusinesses = [
    "@luxe_lifestyle", "@fitness_guru_official", "@artisan_coffee_co", "@beauty_secrets_pro",
    "@fashion_forward_boutique", "@healthy_eats_kitchen", "@urban_yoga_studio", "@photo_magic_studio",
    "@handmade_treasures", "@vegan_delights", "@travel_adventures", "@music_beats_studio"
];

// TripAdvisor Names
const tripAdvisorBusinesses = [
    "The Grand Hotel", "Ocean View Resort", "Historic Downtown Inn", "Mountain Lodge Retreat",
    "Bistro Parisienne", "The Seafood Shack", "Adventure Tours Inc", "Skyline Rooftop Bar",
    "Countryside B&B", "Luxury Spa Resort", "Cultural Heritage Museum", "Sunset Beach Club"
];

// Generate platform-specific business data
export function generatePlatformData(
    platform: string,
    cities: string[],
    category: string,
    country: string,
    limit: number
): ScrapedBusiness[] {
    switch (platform) {
        case 'linkedin':
            return generateLinkedInData(cities, category, country, limit);
        case 'yelp':
            return generateYelpData(cities, category, country, limit);
        case 'facebook':
            return generateFacebookData(cities, category, country, limit);
        case 'instagram':
            return generateInstagramData(cities, category, country, limit);
        case 'tripadvisor':
            return generateTripAdvisorData(cities, category, country, limit);
        case 'yellow_pages':
            return generateYellowPagesData(cities, category, country, limit);
        case 'indeed':
            return generateIndeedData(cities, category, country, limit);
        case 'google_maps':
        default:
            return generateGoogleMapsData(cities, category, country, limit);
    }
}

// Google Maps Data (existing)
function generateGoogleMapsData(cities: string[], category: string, country: string, limit: number): ScrapedBusiness[] {
    const businesses: ScrapedBusiness[] = [];
    const businessNames = [
        "Joe's Pizza", "Maria's Salon", "Tech Fix Pro", "Elite Gym", "Golden Dragon Restaurant",
        "Sunrise Cafe", "Urban Cuts Barbershop", "Fresh Bites Deli", "Apex Fitness", "Blue Ocean Sushi"
    ];

    for (let i = 0; i < limit; i++) {
        const city = cities[i % cities.length];
        const name = businessNames[i % businessNames.length];
        const hasWebsite = Math.random() > 0.4;

        const baseBusiness: Partial<ScrapedBusiness> = {
            id: `gmap-${i}-${Date.now()}`,
            businessName: name,
            category: category,
            address: `${Math.floor(Math.random() * 9000) + 100} Main St`,
            city: city,
            state: 'CA',
            country: country,
            zipCode: String(Math.floor(Math.random() * 90000) + 10000),
            coordinates: { lat: 34 + Math.random() * 10, lng: -118 + Math.random() * 10 },
            phone: generatePhone(),
            email: Math.random() > 0.4 ? `info@${name.toLowerCase().replace(/[^a-z]/g, '')}.com` : undefined,
            website: hasWebsite ? `https://www.${name.toLowerCase().replace(/[^a-z]/g, '')}.com` : undefined,
            mapsUrl: `https://maps.google.com/?q=${encodeURIComponent(name + ' ' + city)}`,
            rating: Math.round((3.0 + Math.random() * 2) * 10) / 10,
            totalReviews: Math.floor(Math.random() * 500) + 5,
            priceRange: ['$', '$$', '$$$'][Math.floor(Math.random() * 3)],
            businessStatus: 'OPERATIONAL',
            scrapedAt: new Date().toISOString(),
            source: 'google_maps'
        };

        businesses.push(enrichBusiness(baseBusiness));
    }

    return businesses.sort((a, b) => b.opportunityScore - a.opportunityScore);
}

// LinkedIn Data
function generateLinkedInData(cities: string[], category: string, country: string, limit: number): ScrapedBusiness[] {
    const businesses: ScrapedBusiness[] = [];
    const industries = ["Technology", "Marketing", "Finance", "Healthcare", "Manufacturing", "Retail"];

    for (let i = 0; i < limit; i++) {
        const city = cities[i % cities.length];
        const name = linkedinCompanies[i % linkedinCompanies.length];
        const industry = industries[i % industries.length];

        const baseBusiness: Partial<ScrapedBusiness> = {
            id: `linkedin-${i}-${Date.now()}`,
            businessName: name,
            category: category || industry,
            address: `${Math.floor(Math.random() * 500) + 1} Corporate Blvd, Suite ${Math.floor(Math.random() * 500)}`,
            city: city,
            state: 'CA',
            country: country,
            zipCode: String(Math.floor(Math.random() * 90000) + 10000),
            coordinates: { lat: 34 + Math.random() * 10, lng: -118 + Math.random() * 10 },
            phone: Math.random() > 0.3 ? generatePhone() : undefined,
            email: `contact@${name.toLowerCase().replace(/[^a-z]/g, '')}.com`,
            website: `https://www.${name.toLowerCase().replace(/[^a-z]/g, '')}.com`,
            mapsUrl: `https://linkedin.com/company/${name.toLowerCase().replace(/[^a-z]/g, '')}`,
            rating: Math.round((3.5 + Math.random() * 1.5) * 10) / 10,
            totalReviews: Math.floor(Math.random() * 200) + 10,
            priceRange: undefined,
            businessStatus: 'OPERATIONAL',
            description: `${name} is a leading ${industry} company specializing in ${category || 'innovative solutions'}. Employees: ${Math.floor(Math.random() * 500) + 10}`,
            scrapedAt: new Date().toISOString(),
            source: 'google_maps'
        };

        businesses.push(enrichBusiness(baseBusiness));
    }

    return businesses.sort((a, b) => b.opportunityScore - a.opportunityScore);
}

// Yelp Data
function generateYelpData(cities: string[], category: string, country: string, limit: number): ScrapedBusiness[] {
    const businesses: ScrapedBusiness[] = [];

    for (let i = 0; i < limit; i++) {
        const city = cities[i % cities.length];
        const name = yelpBusinesses[i % yelpBusinesses.length];
        const hasWebsite = Math.random() > 0.5;

        const baseBusiness: Partial<ScrapedBusiness> = {
            id: `yelp-${i}-${Date.now()}`,
            businessName: name,
            category: category,
            address: `${Math.floor(Math.random() * 2000) + 1} ${['Oak', 'Main', 'Elm', 'Park'][Math.floor(Math.random() * 4)]} Street`,
            city: city,
            state: 'CA',
            country: country,
            zipCode: String(Math.floor(Math.random() * 90000) + 10000),
            coordinates: { lat: 34 + Math.random() * 10, lng: -118 + Math.random() * 10 },
            phone: generatePhone(),
            email: Math.random() > 0.5 ? `hello@${name.toLowerCase().replace(/[^a-z]/g, '')}.com` : undefined,
            website: hasWebsite ? `https://${name.toLowerCase().replace(/[^a-z]/g, '')}.com` : undefined,
            mapsUrl: `https://yelp.com/biz/${name.toLowerCase().replace(/[^a-z]/g, '-')}`,
            rating: Math.round((2.5 + Math.random() * 2.5) * 10) / 10,
            totalReviews: Math.floor(Math.random() * 800) + 20,
            priceRange: ['$', '$$', '$$$', '$$$$'][Math.floor(Math.random() * 4)],
            businessStatus: 'OPERATIONAL',
            scrapedAt: new Date().toISOString(),
            source: 'google_maps'
        };

        businesses.push(enrichBusiness(baseBusiness));
    }

    return businesses.sort((a, b) => b.opportunityScore - a.opportunityScore);
}

// Facebook Data
function generateFacebookData(cities: string[], category: string, country: string, limit: number): ScrapedBusiness[] {
    const businesses: ScrapedBusiness[] = [];
    const pageNames = [
        "Local Coffee House", "City Fitness Center", "Downtown Boutique", "Fresh Farm Market",
        "Sunset Restaurant", "Urban Art Gallery", "Community Bakery", "Wellness Studio"
    ];

    for (let i = 0; i < limit; i++) {
        const city = cities[i % cities.length];
        const name = pageNames[i % pageNames.length];
        const followers = Math.floor(Math.random() * 50000) + 100;

        const baseBusiness: Partial<ScrapedBusiness> = {
            id: `fb-${i}-${Date.now()}`,
            businessName: name,
            category: category,
            address: `${Math.floor(Math.random() * 1000) + 1} Commerce Ave`,
            city: city,
            state: 'CA',
            country: country,
            zipCode: String(Math.floor(Math.random() * 90000) + 10000),
            coordinates: { lat: 34 + Math.random() * 10, lng: -118 + Math.random() * 10 },
            phone: Math.random() > 0.3 ? generatePhone() : undefined,
            email: Math.random() > 0.4 ? `info@${name.toLowerCase().replace(/[^a-z]/g, '')}.com` : undefined,
            website: Math.random() > 0.4 ? `https://${name.toLowerCase().replace(/[^a-z]/g, '')}.com` : undefined,
            mapsUrl: `https://facebook.com/${name.toLowerCase().replace(/[^a-z]/g, '')}`,
            rating: Math.round((3.0 + Math.random() * 2) * 10) / 10,
            totalReviews: followers,
            priceRange: ['$', '$$', '$$$'][Math.floor(Math.random() * 3)],
            businessStatus: 'OPERATIONAL',
            description: `${followers.toLocaleString()} followers | ${Math.floor(followers * 0.8)} likes`,
            scrapedAt: new Date().toISOString(),
            source: 'google_maps'
        };

        businesses.push(enrichBusiness(baseBusiness));
    }

    return businesses.sort((a, b) => b.opportunityScore - a.opportunityScore);
}

// Instagram Data
function generateInstagramData(cities: string[], category: string, country: string, limit: number): ScrapedBusiness[] {
    const businesses: ScrapedBusiness[] = [];

    for (let i = 0; i < limit; i++) {
        const city = cities[i % cities.length];
        const handle = instagramBusinesses[i % instagramBusinesses.length];
        const name = handle.replace('@', '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        const followers = Math.floor(Math.random() * 100000) + 500;

        const baseBusiness: Partial<ScrapedBusiness> = {
            id: `ig-${i}-${Date.now()}`,
            businessName: `${handle} (${name})`,
            category: category,
            address: city,
            city: city,
            state: 'CA',
            country: country,
            zipCode: '',
            coordinates: { lat: 34 + Math.random() * 10, lng: -118 + Math.random() * 10 },
            phone: undefined,
            email: Math.random() > 0.5 ? `${handle.replace('@', '')}@gmail.com` : undefined,
            website: Math.random() > 0.6 ? `https://linktr.ee/${handle.replace('@', '')}` : undefined,
            mapsUrl: `https://instagram.com/${handle.replace('@', '')}`,
            rating: Math.round((3.5 + Math.random() * 1.5) * 10) / 10,
            totalReviews: followers,
            priceRange: undefined,
            businessStatus: 'OPERATIONAL',
            description: `${followers.toLocaleString()} followers | ${Math.floor(Math.random() * 500) + 50} posts`,
            scrapedAt: new Date().toISOString(),
            source: 'google_maps'
        };

        businesses.push(enrichBusiness(baseBusiness));
    }

    return businesses.sort((a, b) => b.opportunityScore - a.opportunityScore);
}

// TripAdvisor Data
function generateTripAdvisorData(cities: string[], category: string, country: string, limit: number): ScrapedBusiness[] {
    const businesses: ScrapedBusiness[] = [];

    for (let i = 0; i < limit; i++) {
        const city = cities[i % cities.length];
        const name = tripAdvisorBusinesses[i % tripAdvisorBusinesses.length];

        const baseBusiness: Partial<ScrapedBusiness> = {
            id: `ta-${i}-${Date.now()}`,
            businessName: name,
            category: category || 'Hotel',
            address: `${Math.floor(Math.random() * 500) + 1} Tourist Blvd`,
            city: city,
            state: 'CA',
            country: country,
            zipCode: String(Math.floor(Math.random() * 90000) + 10000),
            coordinates: { lat: 34 + Math.random() * 10, lng: -118 + Math.random() * 10 },
            phone: generatePhone(),
            email: `reservations@${name.toLowerCase().replace(/[^a-z]/g, '')}.com`,
            website: `https://www.${name.toLowerCase().replace(/[^a-z]/g, '')}.com`,
            mapsUrl: `https://tripadvisor.com/${name.toLowerCase().replace(/[^a-z]/g, '-')}`,
            rating: Math.round((3.0 + Math.random() * 2) * 10) / 10,
            totalReviews: Math.floor(Math.random() * 2000) + 50,
            priceRange: ['$$', '$$$', '$$$$'][Math.floor(Math.random() * 3)],
            businessStatus: 'OPERATIONAL',
            description: `Ranked #${Math.floor(Math.random() * 50) + 1} in ${city}`,
            scrapedAt: new Date().toISOString(),
            source: 'google_maps'
        };

        businesses.push(enrichBusiness(baseBusiness));
    }

    return businesses.sort((a, b) => b.opportunityScore - a.opportunityScore);
}

// Yellow Pages Data
function generateYellowPagesData(cities: string[], category: string, country: string, limit: number): ScrapedBusiness[] {
    const businesses: ScrapedBusiness[] = [];
    const businessTypes = [
        "Quality Plumbing Services", "Expert Electric Co", "Premier Auto Repair", "Family Dentistry",
        "Reliable HVAC Solutions", "Professional Lawn Care", "Quick Print Shop", "Local Hardware Store"
    ];

    for (let i = 0; i < limit; i++) {
        const city = cities[i % cities.length];
        const name = businessTypes[i % businessTypes.length];
        const yearsInBusiness = Math.floor(Math.random() * 40) + 1;

        const baseBusiness: Partial<ScrapedBusiness> = {
            id: `yp-${i}-${Date.now()}`,
            businessName: name,
            category: category,
            address: `${Math.floor(Math.random() * 5000) + 1} Industrial Way`,
            city: city,
            state: 'CA',
            country: country,
            zipCode: String(Math.floor(Math.random() * 90000) + 10000),
            coordinates: { lat: 34 + Math.random() * 10, lng: -118 + Math.random() * 10 },
            phone: generatePhone(),
            email: Math.random() > 0.3 ? `contact@${name.toLowerCase().replace(/[^a-z]/g, '')}.com` : undefined,
            website: Math.random() > 0.5 ? `https://${name.toLowerCase().replace(/[^a-z]/g, '')}.com` : undefined,
            mapsUrl: `https://yellowpages.com/${name.toLowerCase().replace(/[^a-z]/g, '-')}`,
            rating: Math.round((3.5 + Math.random() * 1.5) * 10) / 10,
            totalReviews: Math.floor(Math.random() * 100) + 5,
            priceRange: ['$', '$$', '$$$'][Math.floor(Math.random() * 3)],
            businessStatus: 'OPERATIONAL',
            description: `${yearsInBusiness} years in business | BBB Accredited`,
            scrapedAt: new Date().toISOString(),
            source: 'google_maps'
        };

        businesses.push(enrichBusiness(baseBusiness));
    }

    return businesses.sort((a, b) => b.opportunityScore - a.opportunityScore);
}

// Indeed Data
function generateIndeedData(cities: string[], category: string, country: string, limit: number): ScrapedBusiness[] {
    const businesses: ScrapedBusiness[] = [];
    const companies = [
        "TechCorp Industries", "Global Solutions LLC", "Innovate Now Inc", "Dynamic Systems",
        "Premier Services Group", "Advance Technologies", "Core Business Solutions", "Elite Staffing"
    ];

    for (let i = 0; i < limit; i++) {
        const city = cities[i % cities.length];
        const name = companies[i % companies.length];
        const jobsPosted = Math.floor(Math.random() * 50) + 1;

        const baseBusiness: Partial<ScrapedBusiness> = {
            id: `indeed-${i}-${Date.now()}`,
            businessName: name,
            category: category || 'Technology',
            address: `${Math.floor(Math.random() * 1000) + 1} Business Park Dr`,
            city: city,
            state: 'CA',
            country: country,
            zipCode: String(Math.floor(Math.random() * 90000) + 10000),
            coordinates: { lat: 34 + Math.random() * 10, lng: -118 + Math.random() * 10 },
            phone: Math.random() > 0.5 ? generatePhone() : undefined,
            email: `careers@${name.toLowerCase().replace(/[^a-z]/g, '')}.com`,
            website: `https://www.${name.toLowerCase().replace(/[^a-z]/g, '')}.com`,
            mapsUrl: `https://indeed.com/cmp/${name.toLowerCase().replace(/[^a-z]/g, '-')}`,
            rating: Math.round((2.5 + Math.random() * 2.5) * 10) / 10,
            totalReviews: Math.floor(Math.random() * 300) + 10,
            priceRange: undefined,
            businessStatus: 'OPERATIONAL',
            description: `${jobsPosted} jobs posted | ${['51-200', '201-500', '501-1000', '1000+'][Math.floor(Math.random() * 4)]} employees`,
            scrapedAt: new Date().toISOString(),
            source: 'google_maps'
        };

        businesses.push(enrichBusiness(baseBusiness));
    }

    return businesses.sort((a, b) => b.opportunityScore - a.opportunityScore);
}

// Helper functions
function generatePhone(): string {
    const area = Math.floor(Math.random() * 900) + 100;
    const prefix = Math.floor(Math.random() * 900) + 100;
    const line = Math.floor(Math.random() * 9000) + 1000;
    return `(${area}) ${prefix}-${line}`;
}

function enrichBusiness(baseBusiness: Partial<ScrapedBusiness>): ScrapedBusiness {
    const opportunityScore = calculateOpportunityScore(baseBusiness);
    const suggestionTags = generateSuggestionTags(baseBusiness);
    const pitchIdeas = generatePitchIdeas(baseBusiness);

    return {
        ...baseBusiness,
        opportunityScore,
        suggestionTags,
        pitchIdeas
    } as ScrapedBusiness;
}
