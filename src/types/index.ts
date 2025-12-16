// Google Maps Scraper Pro - Type Definitions
// Extended for Multi-Platform Business Intelligence Scraper V2.0

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
    sourcePlatform?: string; // NEW: Which platform triggered this pitch
}

export type BusinessStatus = 'OPERATIONAL' | 'CLOSED_TEMPORARILY' | 'CLOSED_PERMANENTLY';

// Multi-source phone number tracking
export interface PhoneNumber {
    number: string;
    type: 'primary' | 'secondary' | 'fax';
    verified: boolean;
    sources: string[]; // Which platforms provided this
}

// Multi-source website tracking
export interface Website {
    url: string;
    type: 'primary' | 'social' | 'booking' | 'ecommerce';
    platform: string; // 'main_site' | 'facebook' | 'instagram' | etc
    sources: string[];
}

// Multi-source email tracking
export interface Email {
    address: string;
    type: 'primary' | 'support' | 'sales';
    verified: boolean;
    sources: string[];
}

// Platform-specific data structures
export interface GoogleMapsData {
    mapsUrl: string;
    placeId?: string;
    rating: number;
    totalReviews: number;
    priceRange?: string;
    photos: number;
    businessStatus: string;
    verificationStatus: 'verified' | 'claimed' | 'unclaimed';
}

export interface YelpData {
    yelpUrl: string;
    yelpId?: string;
    rating: number;
    totalReviews: number;
    priceRange: string; // $ to $$$$
    categories: string[];
    features: string[]; // "Delivery", "Takeout", "Outdoor Seating"
    photos: number;
    eliteReviews: number; // Reviews from Yelp Elite users
    topReviewSummary?: string;
    claimedStatus: boolean;
}

export interface FacebookData {
    pageUrl: string;
    pageId?: string;
    likes: number;
    followers: number;
    checkIns: number;
    rating: number;
    totalReviews: number;
    responseRate?: number; // % of messages responded to
    responseTime?: string; // "within hours", "within days"
    recentPosts: number; // Posts in last 30 days
    engagement: {
        avgLikes: number;
        avgComments: number;
        avgShares: number;
    };
    hasMessenger: boolean;
    hasWhatsApp: boolean;
    verifiedPage: boolean;
}

export interface LinkedInData {
    companyUrl: string;
    companyId?: string;
    employeeCount: string; // "11-50", "51-200", etc.
    followers: number;
    industry: string;
    headquarters: string;
    founded?: number;
    companyType: string; // "Privately Held", "Public", etc.
    specialties: string[];
    recentJobPostings: number;
    employeeGrowth: 'growing' | 'stable' | 'shrinking';
}

export interface YellowPagesData {
    ypUrl: string;
    yearsInBusiness: number;
    accredited: boolean;
    description?: string;
    specializations: string[];
}

export interface GlassdoorData {
    companyUrl: string;
    overallRating: number;
    ceoApprovalRating?: number;
    recommendToFriend: number; // Percentage
    totalReviews: number;
    jobOpenings: number;
    topPros: string[];
    topCons: string[];
    cultureRating?: number;
    workLifeBalance?: number;
}

export interface BBBData {
    bbbUrl: string;
    accredited: boolean;
    rating: string; // "A+", "A", "B", etc.
    yearsInBusiness: number;
    complaintsTotal: number;
    complaintsLastYear: number;
    closedComplaints: number;
    industryComparison: 'above_average' | 'average' | 'below_average';
}

export interface TrustpilotData {
    trustpilotUrl: string;
    trustScore: number; // 1-5
    totalReviews: number;
    trustStars: 'Excellent' | 'Great' | 'Average' | 'Poor' | 'Bad';
    reviewDistribution: {
        five: number;
        four: number;
        three: number;
        two: number;
        one: number;
    };
    recentTrend: 'improving' | 'declining' | 'stable';
    claimedProfile: boolean;
}

// All platform data in one object
export interface PlatformData {
    google_maps?: GoogleMapsData;
    yelp?: YelpData;
    facebook?: FacebookData;
    linkedin?: LinkedInData;
    yellow_pages?: YellowPagesData;
    glassdoor?: GlassdoorData;
    bbb?: BBBData;
    trustpilot?: TrustpilotData;
}

// Data conflict tracking
export interface DataConflict {
    field: string; // 'phone' | 'address' | 'rating' | etc.
    values: {
        value: string | number;
        sources: string[];
        confidence: number; // 0-100
    }[];
    resolved: boolean;
    resolvedValue?: string | number;
    resolvedBy?: 'auto' | 'user';
}

// Cross-platform insight
export interface CrossPlatformInsight {
    type: 'rating_inconsistency' | 'platform_gap' | 'social_only' | 'review_gap' | 'data_mismatch';
    severity: 'info' | 'warning' | 'critical';
    description: string;
    recommendation: string;
    affectedPlatforms: string[];
}

// Base scraped business (single platform)
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
    source: string; // Changed from 'google_maps' to allow any platform
    opportunityScore: number;
    suggestionTags: SuggestionTag[];
    pitchIdeas: PitchIdea[];
}

// Unified business (merged from multiple platforms)
export interface UnifiedBusiness extends ScrapedBusiness {
    // Core Identity
    aliases: string[]; // Different names across platforms

    // Multi-source contact info
    phones: PhoneNumber[];
    websites: Website[];
    emails: Email[];

    // Platform Presence
    platforms: PlatformData;

    // Aggregated Metrics
    aggregatedRating: number; // Average across all platforms
    totalReviewsAllPlatforms: number; // Sum of all reviews
    platformCount: number; // Number of platforms found on
    platformsFound: string[]; // List of platform IDs

    // Platform Intelligence
    platformGaps: string[]; // Missing platforms that would add value
    crossPlatformInsights: CrossPlatformInsight[];

    // Conflict tracking
    conflicts: DataConflict[];

    // Quality metrics
    dataQuality: number; // 0-100 confidence score
    matchConfidence: number; // How confident we are these are the same business
    lastUpdated: string;
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
    selectedPlatforms?: string[]; // NEW: Multi-platform support
    searchMode?: 'unified' | 'platform_specific' | 'enrichment'; // NEW: Search mode
}

export interface ScrapingState {
    isActive: boolean;
    isPaused: boolean;
    progress: number;
    total: number;
    currentCity: string;
    estimatedTimeRemaining: number;
    // NEW: Per-platform progress
    platformProgress?: {
        [platformId: string]: {
            status: 'queued' | 'scraping' | 'complete' | 'error';
            progress: number;
            total: number;
            found: number;
        };
    };
    // NEW: Deduplication stats
    deduplicationStats?: {
        matched: number;
        unique: number;
        conflicts: number;
    };
}

export interface Country {
    code: string;
    name: string;
    topCities: string[];
}

// Platform tier for pricing/access control
export type PlatformTier = 'free' | 'pro' | 'premium';

// Match result from deduplication
export interface MatchResult {
    score: number; // 0-100
    business1Id: string;
    business2Id: string;
    matchBreakdown: {
        nameScore: number;
        addressScore: number;
        phoneScore: number;
        proximityScore: number;
        websiteScore: number;
    };
    isMatch: boolean; // score >= 80
    needsReview: boolean; // 60 <= score < 80
}

