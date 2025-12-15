'use client';

import { ScrapedBusiness } from '@/types';

interface StatsBarProps {
    businesses: ScrapedBusiness[];
}

export default function StatsBar({ businesses }: StatsBarProps) {
    const total = businesses.length;
    const hot = businesses.filter(b => b.opportunityScore >= 80).length;
    const good = businesses.filter(b => b.opportunityScore >= 60 && b.opportunityScore < 80).length;
    const decent = businesses.filter(b => b.opportunityScore >= 40 && b.opportunityScore < 60).length;
    const low = businesses.filter(b => b.opportunityScore < 40).length;

    const avgRating = total > 0
        ? (businesses.reduce((sum, b) => sum + b.rating, 0) / total).toFixed(1)
        : '0';

    const cities = [...new Set(businesses.map(b => b.city))];

    return (
        <div className="stats-bar">
            <div className="stats-summary">
                <span className="stats-complete">✅ Scraping Complete!</span>
                <span className="stats-total">{total} businesses found</span>
            </div>

            <div className="stats-details">
                <span className="stat-item">
                    🌍 Cities: {cities.slice(0, 3).join(', ')}{cities.length > 3 ? ` +${cities.length - 3}` : ''}
                </span>
                <span className="stat-item">
                    ⭐ Avg Rating: {avgRating}
                </span>
            </div>

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
        </div>
    );
}
