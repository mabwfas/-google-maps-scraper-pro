// Mock Business Data Generator

import { ScrapedBusiness } from '@/types';
import { calculateOpportunityScore } from './scoring';
import { generateSuggestionTags } from './suggestions';
import { generatePitchIdeas } from './pitchGenerator';

const businessNames = [
    "Joe's Pizza", "Maria's Salon", "Tech Fix Pro", "Elite Gym", "Golden Dragon Restaurant",
    "Sunrise Cafe", "Urban Cuts Barbershop", "Fresh Bites Deli", "Apex Fitness", "Blue Ocean Sushi",
    "The Coffee Bean", "Bella Italia", "Quick Auto Repair", "Zen Spa & Wellness", "Lucky Star Chinese",
    "Downtown Dental", "Green Garden Landscaping", "Metro Plumbing", "City Electric Services", "Prime Realty",
    "Fashion Forward Boutique", "Tasty Tacos", "Cozy Corner Bakery", "Supreme Nails", "Master Mechanics",
    "Harmony Yoga Studio", "The Pet Palace", "Cloud Nine Massage", "Victory Law Firm", "Bright Smile Dentistry",
    "Sizzle BBQ", "Mom's Kitchen", "Star Cleaners", "Royal Taj Indian", "Precision Tire Shop",
    "Glow Beauty Spa", "Fast Lane Auto", "Fresh Flowers Shop", "Peak Performance Gym", "Sunset Photography",
    "The Wine Cellar", "Quick Print Services", "Healthy Habits Clinic", "Urban Garden Nursery", "Smart Tech Solutions",
    "Classic Cuts Salon", "Flavor Town Burgers", "Serenity Wellness Center", "Top Notch Contractors", "Luxury Limousine"
];

const categories = [
    "Pizza Restaurant", "Hair Salon", "Electronics Repair", "Fitness Center", "Chinese Restaurant",
    "Coffee Shop", "Barbershop", "Deli", "Gym", "Sushi Restaurant",
    "Cafe", "Italian Restaurant", "Auto Repair", "Spa", "Chinese Restaurant",
    "Dentist", "Landscaping", "Plumber", "Electrician", "Real Estate Agency",
    "Clothing Store", "Mexican Restaurant", "Bakery", "Nail Salon", "Auto Repair",
    "Yoga Studio", "Pet Store", "Massage Therapy", "Law Firm", "Dental Clinic",
    "BBQ Restaurant", "American Restaurant", "Dry Cleaner", "Indian Restaurant", "Tire Shop",
    "Beauty Spa", "Auto Service", "Florist", "Gym", "Photography Studio",
    "Wine Bar", "Printing Service", "Medical Clinic", "Garden Center", "IT Services",
    "Hair Salon", "Burger Restaurant", "Wellness Center", "General Contractor", "Limo Service"
];

const streets = [
    "Main St", "Oak Ave", "Maple Dr", "Broadway", "Market St", "1st Ave", "2nd St", "Park Blvd",
    "Center St", "Highland Ave", "Valley Rd", "Commerce Dr", "Industrial Blvd", "Tech Way"
];

export function generateMockBusinesses(
    cities: string[],
    category: string,
    country: string,
    limit: number
): ScrapedBusiness[] {
    const businesses: ScrapedBusiness[] = [];
    const perCity = Math.ceil(limit / cities.length);

    for (const city of cities) {
        for (let i = 0; i < perCity && businesses.length < limit; i++) {
            const nameIndex = (businesses.length + i) % businessNames.length;
            const catIndex = (businesses.length + i) % categories.length;

            // Generate realistic random data
            const hasWebsite = Math.random() > 0.4;
            const rating = Math.round((3.0 + Math.random() * 2) * 10) / 10;
            const reviews = Math.floor(Math.random() * 500) + 5;
            const hasHttp = Math.random() > 0.7;

            const baseBusiness: Partial<ScrapedBusiness> = {
                id: `biz-${businesses.length + 1}-${Date.now()}`,
                businessName: businessNames[nameIndex],
                category: category || categories[catIndex],
                address: `${Math.floor(Math.random() * 9000) + 100} ${streets[Math.floor(Math.random() * streets.length)]}`,
                city: city,
                state: getStateForCity(city, country),
                country: country,
                zipCode: String(Math.floor(Math.random() * 90000) + 10000),
                coordinates: {
                    lat: 25 + Math.random() * 25,
                    lng: -120 + Math.random() * 60
                },
                phone: generatePhoneNumber(),
                website: hasWebsite ? `${hasHttp ? 'http' : 'https'}://www.${businessNames[nameIndex].toLowerCase().replace(/[^a-z]/g, '')}.com` : undefined,
                email: Math.random() > 0.4 ? `info@${businessNames[nameIndex].toLowerCase().replace(/[^a-z]/g, '')}.com` : undefined,
                mapsUrl: `https://maps.google.com/?q=${encodeURIComponent(businessNames[nameIndex] + ' ' + city)}`,
                rating: rating,
                totalReviews: reviews,
                priceRange: ['$', '$$', '$$$', '$$$$'][Math.floor(Math.random() * 4)],
                businessStatus: Math.random() > 0.95 ? 'CLOSED_TEMPORARILY' : 'OPERATIONAL',
                hours: Math.random() > 0.3 ? generateBusinessHours() : undefined,
                photosCount: Math.floor(Math.random() * 50),
                description: Math.random() > 0.4 ? `Welcome to ${businessNames[nameIndex]}, your trusted ${category || categories[catIndex]} in ${city}.` : undefined,
                scrapedAt: new Date().toISOString(),
                source: 'google_maps'
            };

            // Calculate AI fields
            const opportunityScore = calculateOpportunityScore(baseBusiness);
            const suggestionTags = generateSuggestionTags(baseBusiness);
            const pitchIdeas = generatePitchIdeas(baseBusiness);

            businesses.push({
                ...baseBusiness,
                opportunityScore,
                suggestionTags,
                pitchIdeas
            } as ScrapedBusiness);
        }
    }

    // Sort by opportunity score (highest first)
    return businesses.sort((a, b) => b.opportunityScore - a.opportunityScore);
}

function generatePhoneNumber(): string {
    const area = Math.floor(Math.random() * 900) + 100;
    const prefix = Math.floor(Math.random() * 900) + 100;
    const line = Math.floor(Math.random() * 9000) + 1000;
    return `(${area}) ${prefix}-${line}`;
}

function generateBusinessHours(): { day: string; open: string; close: string }[] {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return days.map(day => ({
        day,
        open: day === 'Sunday' ? '10:00 AM' : '9:00 AM',
        close: day === 'Sunday' ? '6:00 PM' : '8:00 PM'
    }));
}

function getStateForCity(city: string, country: string): string {
    if (country === 'United States') {
        const stateMap: Record<string, string> = {
            'New York': 'NY', 'Los Angeles': 'CA', 'Chicago': 'IL', 'Houston': 'TX',
            'Phoenix': 'AZ', 'Philadelphia': 'PA', 'San Antonio': 'TX', 'San Diego': 'CA',
            'Dallas': 'TX', 'San Jose': 'CA', 'Austin': 'TX', 'Jacksonville': 'FL',
            'San Francisco': 'CA', 'Seattle': 'WA', 'Denver': 'CO', 'Boston': 'MA',
            'Las Vegas': 'NV', 'Miami': 'FL', 'Atlanta': 'GA', 'Portland': 'OR'
        };
        return stateMap[city] || 'CA';
    }
    return '';
}
