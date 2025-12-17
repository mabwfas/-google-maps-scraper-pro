'use client';

import { ScrapedBusiness, UnifiedBusiness } from '@/types';
import { scraperPlatforms } from '@/data/scraperPlatforms';

interface StatsBarProps {
    businesses: ScrapedBusiness[];
}

// Type guard
function isUnifiedBusiness(business: ScrapedBusiness): business is UnifiedBusiness {
    return 'platformsFound' in business && 'aggregatedRating' in business;
}

export default function StatsBar({ businesses }: StatsBarProps) {
    const total = businesses.length;
    const isMultiPlatform = total > 0 && isUnifiedBusiness(businesses[0]);

    // Opportunity breakdown
    const hot = businesses.filter(b => b.opportunityScore >= 80).length;
    const good = businesses.filter(b => b.opportunityScore >= 60 && b.opportunityScore < 80).length;
    const decent = businesses.filter(b => b.opportunityScore >= 40 && b.opportunityScore < 60).length;
    const low = businesses.filter(b => b.opportunityScore < 40).length;

    // Multi-platform stats
    let avgRating = '0';
    let avgPlatforms = '1';
    let avgQuality = '0';
    let platformCounts: Record<string, number> = {};

    if (isMultiPlatform) {
        const unified = businesses as UnifiedBusiness[];
        avgRating = (unified.reduce((sum, b) => sum + b.aggregatedRating, 0) / total).toFixed(1);
        avgPlatforms = (unified.reduce((sum, b) => sum + b.platformCount, 0) / total).toFixed(1);
        avgQuality = (unified.reduce((sum, b) => sum + b.dataQuality, 0) / total).toFixed(0);

        // Count platforms
        unified.forEach(b => {
            b.platformsFound.forEach(p => {
                platformCounts[p] = (platformCounts[p] || 0) + 1;
            });
        });
    } else {
        avgRating = total > 0
            ? (businesses.reduce((sum, b) => sum + b.rating, 0) / total).toFixed(1)
            : '0';
    }

    const cities = [...new Set(businesses.map(b => b.city))];
    const withWebsite = businesses.filter(b => b.website).length;
    const withPhone = businesses.filter(b => b.phone).length;

    return (
        <div className="stats-bar">
            <div className="stats-summary">
                <span className="stats-complete">✅ Scraping Complete!</span>
                <span className="stats-total">
                    {total} {isMultiPlatform ? 'unified ' : ''}businesses found
                </span>
            </div>

            <div className="stats-details">
                <span className="stat-item">
                    🌍 Cities: {cities.slice(0, 3).join(', ')}{cities.length > 3 ? ` +${cities.length - 3}` : ''}
                </span>
                <span className="stat-item">
                    ⭐ Avg Rating: {avgRating}
                </span>
                {isMultiPlatform && (
                    <>
                        <span className="stat-item">
                            📊 Avg Platforms: {avgPlatforms}
                        </span>
                        <span className="stat-item">
                            📈 Data Quality: {avgQuality}%
                        </span>
                    </>
                )}
            </div>

            {isMultiPlatform && Object.keys(platformCounts).length > 0 && (
                <div className="stats-platforms">
                    {Object.entries(platformCounts).map(([platformId, count]) => {
                        const platform = scraperPlatforms.find(p => p.id === platformId);
                        return (
                            <span
                                key={platformId}
                                className="platform-stat"
                                style={{ backgroundColor: platform?.color || '#666' }}
                                title={`${platform?.name || platformId}: ${count} businesses`}
                            >
                                {platform?.icon || '📦'} {count}
                            </span>
                        );
                    })}
                </div>
            )}

            <div className="stats-opportunities">
                <span className="opp-badge hot" title="Hot Leads (80-100)">
                    🔥 {hot}
                </span>
                <span className="opp-badge good" title="Good Opportunities (60-79)">
                    ⭐ {good}
                </span>
                <span className="opp-badge decent" title="Decent Prospects (40-59)">
                    ✅ {decent}
                </span>
                <span className="opp-badge low" title="Low Priority (0-39)">
                    💤 {low}
                </span>
            </div>

            <div className="stats-contact">
                <span className="contact-stat" title="Businesses with website">
                    🌐 {withWebsite} with websites
                </span>
                <span className="contact-stat" title="Businesses with phone">
                    📞 {withPhone} with phone
                </span>
            </div>
        </div>
    );
}

