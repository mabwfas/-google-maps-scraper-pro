'use client';

import { UnifiedBusiness, DataConflict, CrossPlatformInsight } from '@/types';
import { scraperPlatforms, platformAbbreviations } from '@/data/scraperPlatforms';

interface ExpandableBusinessRowProps {
    business: UnifiedBusiness;
    isExpanded: boolean;
    onToggle: () => void;
    onViewPitch: (business: UnifiedBusiness) => void;
}

export default function ExpandableBusinessRow({
    business,
    isExpanded,
    onToggle,
    onViewPitch
}: ExpandableBusinessRowProps) {

    const getPlatformBadges = () => {
        return business.platformsFound.map(platformId => {
            const platform = scraperPlatforms.find(p => p.id === platformId);
            if (!platform) return null;

            return (
                <span
                    key={platformId}
                    className="platform-badge-small"
                    style={{ backgroundColor: platform.color }}
                    title={platform.name}
                >
                    {platformAbbreviations[platformId] || platformId[0].toUpperCase()}
                </span>
            );
        });
    };

    const getMissingPlatformBadges = () => {
        return business.platformGaps.slice(0, 3).map(platformId => {
            const platform = scraperPlatforms.find(p => p.id === platformId);
            if (!platform) return null;

            return (
                <span
                    key={platformId}
                    className="platform-badge-missing"
                    title={`Missing on ${platform.name}`}
                >
                    {platform.icon}
                </span>
            );
        });
    };

    const renderPlatformDetails = () => {
        const { platforms } = business;

        return (
            <div className="platform-details-grid">
                {/* Google Maps */}
                {platforms.google_maps && (
                    <div className="platform-detail-card google_maps">
                        <div className="platform-card-header">
                            <span className="platform-card-icon">🗺️</span>
                            <span className="platform-card-name">Google Maps</span>
                            <span className="platform-card-status">✅</span>
                        </div>
                        <div className="platform-card-stats">
                            <div className="stat-row">
                                <span>Rating:</span>
                                <span>{platforms.google_maps.rating}⭐</span>
                            </div>
                            <div className="stat-row">
                                <span>Reviews:</span>
                                <span>{platforms.google_maps.totalReviews}</span>
                            </div>
                            <div className="stat-row">
                                <span>Photos:</span>
                                <span>{platforms.google_maps.photos}</span>
                            </div>
                            <div className="stat-row">
                                <span>Status:</span>
                                <span className="status-verified">
                                    {platforms.google_maps.verificationStatus}
                                </span>
                            </div>
                        </div>
                        <a
                            href={platforms.google_maps.mapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="platform-card-link"
                        >
                            View on Google Maps →
                        </a>
                    </div>
                )}

                {/* Yelp */}
                {platforms.yelp && (
                    <div className="platform-detail-card yelp">
                        <div className="platform-card-header">
                            <span className="platform-card-icon">⭐</span>
                            <span className="platform-card-name">Yelp</span>
                            <span className="platform-card-status">✅</span>
                        </div>
                        <div className="platform-card-stats">
                            <div className="stat-row">
                                <span>Rating:</span>
                                <span>{platforms.yelp.rating}⭐</span>
                            </div>
                            <div className="stat-row">
                                <span>Reviews:</span>
                                <span>{platforms.yelp.totalReviews}</span>
                            </div>
                            <div className="stat-row">
                                <span>Price:</span>
                                <span>{platforms.yelp.priceRange}</span>
                            </div>
                            <div className="stat-row">
                                <span>Elite Reviews:</span>
                                <span>{platforms.yelp.eliteReviews}</span>
                            </div>
                        </div>
                        <a
                            href={platforms.yelp.yelpUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="platform-card-link"
                        >
                            View on Yelp →
                        </a>
                    </div>
                )}

                {/* Facebook */}
                {platforms.facebook && (
                    <div className="platform-detail-card facebook">
                        <div className="platform-card-header">
                            <span className="platform-card-icon">📘</span>
                            <span className="platform-card-name">Facebook</span>
                            <span className="platform-card-status">✅</span>
                        </div>
                        <div className="platform-card-stats">
                            <div className="stat-row">
                                <span>Likes:</span>
                                <span>{platforms.facebook.likes.toLocaleString()}</span>
                            </div>
                            <div className="stat-row">
                                <span>Followers:</span>
                                <span>{platforms.facebook.followers.toLocaleString()}</span>
                            </div>
                            <div className="stat-row">
                                <span>Response Rate:</span>
                                <span className={platforms.facebook.responseRate && platforms.facebook.responseRate > 80 ? 'good' : 'warning'}>
                                    {platforms.facebook.responseRate}%
                                </span>
                            </div>
                            <div className="stat-row">
                                <span>Recent Posts:</span>
                                <span>{platforms.facebook.recentPosts}</span>
                            </div>
                        </div>
                        <a
                            href={platforms.facebook.pageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="platform-card-link"
                        >
                            View on Facebook →
                        </a>
                    </div>
                )}

                {/* Yellow Pages */}
                {platforms.yellow_pages && (
                    <div className="platform-detail-card yellow_pages">
                        <div className="platform-card-header">
                            <span className="platform-card-icon">📒</span>
                            <span className="platform-card-name">Yellow Pages</span>
                            <span className="platform-card-status">✅</span>
                        </div>
                        <div className="platform-card-stats">
                            <div className="stat-row">
                                <span>Years in Business:</span>
                                <span>{platforms.yellow_pages.yearsInBusiness}</span>
                            </div>
                            <div className="stat-row">
                                <span>Accredited:</span>
                                <span>{platforms.yellow_pages.accredited ? '✅ Yes' : '❌ No'}</span>
                            </div>
                        </div>
                        <a
                            href={platforms.yellow_pages.ypUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="platform-card-link"
                        >
                            View on Yellow Pages →
                        </a>
                    </div>
                )}
            </div>
        );
    };

    const renderMissingPlatforms = () => {
        if (business.platformGaps.length === 0) return null;

        return (
            <div className="missing-platforms-section">
                <h4>❌ Missing Platforms</h4>
                <div className="missing-platforms-list">
                    {business.platformGaps.map(platformId => {
                        const platform = scraperPlatforms.find(p => p.id === platformId);
                        if (!platform) return null;

                        return (
                            <div key={platformId} className="missing-platform-item">
                                <span className="missing-icon">{platform.icon}</span>
                                <span className="missing-name">{platform.name}</span>
                                <span className="missing-hint">
                                    {platform.uniqueData[0]}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    const renderInsights = () => {
        if (business.crossPlatformInsights.length === 0) return null;

        return (
            <div className="insights-section">
                <h4>🔍 Cross-Platform Insights</h4>
                <div className="insights-list">
                    {business.crossPlatformInsights.map((insight, idx) => (
                        <div
                            key={idx}
                            className={`insight-item ${insight.severity}`}
                        >
                            <span className="insight-icon">
                                {insight.severity === 'critical' ? '🚨' :
                                    insight.severity === 'warning' ? '⚠️' : 'ℹ️'}
                            </span>
                            <div className="insight-content">
                                <p className="insight-description">{insight.description}</p>
                                <p className="insight-recommendation">
                                    💡 {insight.recommendation}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const renderConflicts = () => {
        const unresolvedConflicts = business.conflicts.filter(c => !c.resolved);
        if (unresolvedConflicts.length === 0) return null;

        return (
            <div className="conflicts-section">
                <h4>⚠️ Data Conflicts ({unresolvedConflicts.length})</h4>
                <div className="conflicts-list">
                    {unresolvedConflicts.slice(0, 3).map((conflict, idx) => (
                        <div key={idx} className="conflict-item">
                            <span className="conflict-field">{conflict.field}:</span>
                            <div className="conflict-values">
                                {conflict.values.map((v, i) => (
                                    <span key={i} className="conflict-value">
                                        {String(v.value)}
                                        <span className="conflict-sources">
                                            ({v.sources.join(', ')})
                                        </span>
                                    </span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const renderAggregatedMetrics = () => (
        <div className="aggregated-metrics">
            <h4>📊 Aggregated Metrics</h4>
            <div className="metrics-grid">
                <div className="metric-item">
                    <span className="metric-label">Avg Rating</span>
                    <span className="metric-value">
                        {business.aggregatedRating.toFixed(1)}⭐
                    </span>
                </div>
                <div className="metric-item">
                    <span className="metric-label">Total Reviews</span>
                    <span className="metric-value">
                        {business.totalReviewsAllPlatforms.toLocaleString()}
                    </span>
                </div>
                <div className="metric-item">
                    <span className="metric-label">Platforms</span>
                    <span className="metric-value">
                        {business.platformCount}
                    </span>
                </div>
                <div className="metric-item">
                    <span className="metric-label">Data Quality</span>
                    <span className={`metric-value quality-${business.dataQuality >= 80 ? 'high' :
                            business.dataQuality >= 50 ? 'medium' : 'low'
                        }`}>
                        {business.dataQuality}%
                    </span>
                </div>
            </div>
        </div>
    );

    return (
        <>
            {/* Compact Row */}
            <tr
                className={`expandable-row ${isExpanded ? 'expanded' : ''}`}
                onClick={onToggle}
            >
                <td className="cell-expand">
                    <button className="expand-btn">
                        {isExpanded ? '▼' : '▶'}
                    </button>
                </td>
                <td className="cell-name">
                    <div className="business-name-wrapper">
                        <span className="business-name">{business.businessName}</span>
                        {business.aliases.length > 0 && (
                            <span className="alias-count" title={business.aliases.join(', ')}>
                                +{business.aliases.length} alias
                            </span>
                        )}
                    </div>
                </td>
                <td className="cell-city">{business.city}</td>
                <td className="cell-platforms">
                    <div className="platforms-badges">
                        {getPlatformBadges()}
                        {business.platformGaps.length > 0 && (
                            <span className="gap-indicator" title={`Missing ${business.platformGaps.length} platforms`}>
                                +{business.platformGaps.length}
                            </span>
                        )}
                    </div>
                </td>
                <td className="cell-rating">
                    <span className="rating-badge">
                        {business.aggregatedRating.toFixed(1)}⭐
                    </span>
                </td>
                <td className="cell-reviews">
                    {business.totalReviewsAllPlatforms.toLocaleString()}
                </td>
                <td className="cell-social">
                    {business.platforms.facebook && (
                        <span className="social-stat">
                            {(business.platforms.facebook.followers / 1000).toFixed(1)}k
                        </span>
                    )}
                </td>
                <td className="cell-actions">
                    <button
                        onClick={(e) => { e.stopPropagation(); onViewPitch(business); }}
                        className="btn-pitch"
                    >
                        💼 Pitches ({business.pitchIdeas.length})
                    </button>
                </td>
            </tr>

            {/* Expanded Details */}
            {isExpanded && (
                <tr className="expanded-details-row">
                    <td colSpan={8}>
                        <div className="expanded-content">
                            {/* Unified Data */}
                            <div className="unified-data-section">
                                <h4>🎯 Unified Data</h4>
                                <div className="unified-data-grid">
                                    <div className="data-item">
                                        <label>Address:</label>
                                        <span>{business.address}, {business.city}, {business.state}</span>
                                    </div>
                                    <div className="data-item">
                                        <label>Phone:</label>
                                        <span>
                                            {business.phone || 'N/A'}
                                            {business.phones.length > 1 && (
                                                <span className="multi-source">
                                                    ({business.phones[0].sources.length} sources)
                                                </span>
                                            )}
                                        </span>
                                    </div>
                                    <div className="data-item">
                                        <label>Website:</label>
                                        {business.website ? (
                                            <a href={business.website} target="_blank" rel="noopener noreferrer">
                                                {business.website}
                                            </a>
                                        ) : (
                                            <span className="no-data">No website</span>
                                        )}
                                    </div>
                                    <div className="data-item">
                                        <label>Email:</label>
                                        <span>{business.email || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Platform Details */}
                            <div className="platform-presence-section">
                                <h4>🌐 Platform Presence ({business.platformCount} of 4 searched)</h4>
                                {renderPlatformDetails()}
                            </div>

                            {/* Missing Platforms */}
                            {renderMissingPlatforms()}

                            {/* Aggregated Metrics */}
                            {renderAggregatedMetrics()}

                            {/* Cross-Platform Insights */}
                            {renderInsights()}

                            {/* Conflicts */}
                            {renderConflicts()}

                            {/* Pitch CTA */}
                            <div className="pitch-cta">
                                <button
                                    onClick={() => onViewPitch(business)}
                                    className="btn-view-pitches"
                                >
                                    💼 View {business.pitchIdeas.length} AI-Generated Pitch Ideas →
                                </button>
                            </div>
                        </div>
                    </td>
                </tr>
            )}
        </>
    );
}
