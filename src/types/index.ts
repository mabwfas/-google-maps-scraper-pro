// Google Maps Scraper Pro - Type Definitions

export interface Coordinates {
    lat: number;
    lng: number;
}

export interface BusinessHours {
    day: string;
    open: string;
    close: string;
}

export interface SocialMedia {
    platform: string;
    url: string;
}

export type SuggestionCategory = 'critical' | 'major' | 'growth' | 'upsell';

export interface SuggestionTag {
    label: string;
    category: SuggestionCategory;
    icon: string;
}

export interface PitchIdea {
    service: string;
    package: string;
    price: string;
    timeline: string;
    pitch: string;
    urgency: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    roi: string;
    emailTemplate?: string;
    callScript?: string;
}

export type BusinessStatus = 'OPERATIONAL' | 'CLOSED_TEMPORARILY' | 'CLOSED_PERMANENTLY';

export interface ScrapedBusiness {
    id: string;
    businessName: string;
    category: string;
    address: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
    coordinates: Coordinates;
    plusCode?: string;
    phone?: string;
    website?: string;
    email?: string;
    mapsUrl: string;
    rating: number;
    totalReviews: number;
    priceRange?: string;
    businessStatus: BusinessStatus;
    hours?: BusinessHours[];
    amenities?: string[];
    photosCount?: number;
    description?: string;
    socialMedia?: SocialMedia[];
    scrapedAt: string;
    source: 'google_maps';
    opportunityScore: number;
    suggestionTags: SuggestionTag[];
    pitchIdeas: PitchIdea[];
}

export type OpportunityLevel = 'hot' | 'good' | 'decent' | 'low';

export interface SearchFilters {
    country: string;
    cityMode: 'top10' | 'top25' | 'top50' | 'custom';
    selectedCities: string[];
    category: string;
    minRating: number;
    minReviews: number;
    resultsLimit: number;
}

export interface ScrapingState {
    isActive: boolean;
    isPaused: boolean;
    progress: number;
    total: number;
    currentCity: string;
    estimatedTimeRemaining: number;
}

export interface Country {
    code: string;
    name: string;
    topCities: string[];
}
