'use client';

import { useState, useMemo } from 'react';
import { ScrapedBusiness, UnifiedBusiness } from '@/types';
import { getOpportunityLevel, getOpportunityLabel, getOpportunityEmoji, getOpportunityColor } from '@/lib/scoring';
import { getTagColor, getTagBgColor } from '@/lib/suggestions';
import { scraperPlatforms, platformAbbreviations } from '@/data/scraperPlatforms';

interface DataTableProps {
    businesses: ScrapedBusiness[];
    onViewPitch: (business: ScrapedBusiness) => void;
    isLoading: boolean;
}

type SortField = 'businessName' | 'city' | 'rating' | 'totalReviews' | 'opportunityScore' | 'platformCount';
type SortDirection = 'asc' | 'desc';

// Type guard to check if business is UnifiedBusiness
function isUnifiedBusiness(business: ScrapedBusiness): business is UnifiedBusiness {
    return 'platformsFound' in business && 'aggregatedRating' in business;
}

export default function DataTable({ businesses, onViewPitch, isLoading }: DataTableProps) {
    const [sortField, setSortField] = useState<SortField>('opportunityScore');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);
    const [filterScore, setFilterScore] = useState<string>('all');
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

    // Check if we have multi-platform data
    const isMultiPlatform = businesses.length > 0 && isUnifiedBusiness(businesses[0]);

    const filteredAndSorted = useMemo(() => {
        let result = [...businesses];

        // Filter by search term
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(b =>
                b.businessName.toLowerCase().includes(term) ||
                b.city.toLowerCase().includes(term) ||
                b.category.toLowerCase().includes(term)
            );
        }

        // Filter by score
        if (filterScore !== 'all') {
            result = result.filter(b => {
                const level = getOpportunityLevel(b.opportunityScore);
                return level === filterScore;
            });
        }

        // Sort
        result.sort((a, b) => {
            let comparison = 0;
            switch (sortField) {
                case 'businessName':
                    comparison = a.businessName.localeCompare(b.businessName);
                    break;
                case 'city':
                    comparison = a.city.localeCompare(b.city);
                    break;
                case 'rating':
                    const ratingA = isUnifiedBusiness(a) ? a.aggregatedRating : a.rating;
                    const ratingB = isUnifiedBusiness(b) ? b.aggregatedRating : b.rating;
                    comparison = ratingA - ratingB;
                    break;
                case 'totalReviews':
                    const reviewsA = isUnifiedBusiness(a) ? a.totalReviewsAllPlatforms : a.totalReviews;
                    const reviewsB = isUnifiedBusiness(b) ? b.totalReviewsAllPlatforms : b.totalReviews;
                    comparison = reviewsA - reviewsB;
                    break;
                case 'opportunityScore':
                    comparison = a.opportunityScore - b.opportunityScore;
                    break;
                case 'platformCount':
                    const countA = isUnifiedBusiness(a) ? a.platformCount : 1;
                    const countB = isUnifiedBusiness(b) ? b.platformCount : 1;
                    comparison = countA - countB;
                    break;
            }
            return sortDirection === 'asc' ? comparison : -comparison;
        });

        return result;
    }, [businesses, searchTerm, filterScore, sortField, sortDirection]);

    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredAndSorted.slice(start, start + pageSize);
    }, [filteredAndSorted, currentPage, pageSize]);

    const totalPages = Math.ceil(filteredAndSorted.length / pageSize);

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('desc');
        }
    };

    const toggleRowExpansion = (businessId: string) => {
        setExpandedRows(prev => {
            const next = new Set(prev);
            if (next.has(businessId)) {
                next.delete(businessId);
            } else {
                next.add(businessId);
            }
            return next;
        });
    };

    const SortIcon = ({ field }: { field: SortField }) => (
        <span className="sort-icon">
            {sortField === field ? (sortDirection === 'asc' ? '↑' : '↓') : '↕'}
        </span>
    );

    const renderPlatformBadges = (business: ScrapedBusiness) => {
        if (!isUnifiedBusiness(business)) {
            // Single platform - show source
            const platform = scraperPlatforms.find(p => p.id === business.source);
            return platform ? (
                <span
                    className="platform-badge-small"
                    style={{ backgroundColor: platform.color }}
                    title={platform.name}
                >
                    {platformAbbreviations[platform.id] || platform.icon}
                </span>
            ) : null;
        }

        return (
            <div className="platforms-badges">
                {business.platformsFound.map(platformId => {
                    const platform = scraperPlatforms.find(p => p.id === platformId);
                    if (!platform) return null;
                    return (
                        <span
                            key={platformId}
                            className="platform-badge-small"
                            style={{ backgroundColor: platform.color }}
                            title={platform.name}
                        >
                            {platformAbbreviations[platformId] || platform.icon}
                        </span>
                    );
                })}
                {business.platformGaps.length > 0 && (
                    <span
                        className="gap-indicator"
                        title={`Missing: ${business.platformGaps.join(', ')}`}
                    >
                        +{business.platformGaps.length}
                    </span>
                )}
            </div>
        );
    };

    const renderExpandedRow = (business: UnifiedBusiness) => {
        return (
            <tr className="expanded-details-row">
                <td colSpan={isMultiPlatform ? 11 : 10}>
                    <div className="expanded-content">
                        {/* Platform Details Grid */}
                        <div className="platform-presence-section">
                            <h4>🌐 Platform Presence ({business.platformCount} platforms)</h4>
                            <div className="platform-details-grid">
                                {business.platforms.google_maps && (
                                    <div className="platform-detail-card google_maps">
                                        <div className="platform-card-header">
                                            <span className="platform-card-icon">🗺️</span>
                                            <span className="platform-card-name">Google Maps</span>
                                            <span className="platform-card-status">✅</span>
                                        </div>
                                        <div className="platform-card-stats">
                                            <div className="stat-row">
                                                <span>Rating:</span>
                                                <span>{business.platforms.google_maps.rating}⭐</span>
                                            </div>
                                            <div className="stat-row">
                                                <span>Reviews:</span>
                                                <span>{business.platforms.google_maps.totalReviews}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {business.platforms.yelp && (
                                    <div className="platform-detail-card yelp">
                                        <div className="platform-card-header">
                                            <span className="platform-card-icon">⭐</span>
                                            <span className="platform-card-name">Yelp</span>
                                            <span className="platform-card-status">✅</span>
                                        </div>
                                        <div className="platform-card-stats">
                                            <div className="stat-row">
                                                <span>Rating:</span>
                                                <span>{business.platforms.yelp.rating}⭐</span>
                                            </div>
                                            <div className="stat-row">
                                                <span>Reviews:</span>
                                                <span>{business.platforms.yelp.totalReviews}</span>
                                            </div>
                                            <div className="stat-row">
                                                <span>Price:</span>
                                                <span>{business.platforms.yelp.priceRange}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {business.platforms.facebook && (
                                    <div className="platform-detail-card facebook">
                                        <div className="platform-card-header">
                                            <span className="platform-card-icon">📘</span>
                                            <span className="platform-card-name">Facebook</span>
                                            <span className="platform-card-status">✅</span>
                                        </div>
                                        <div className="platform-card-stats">
                                            <div className="stat-row">
                                                <span>Followers:</span>
                                                <span>{business.platforms.facebook.followers.toLocaleString()}</span>
                                            </div>
                                            <div className="stat-row">
                                                <span>Response Rate:</span>
                                                <span className={business.platforms.facebook.responseRate && business.platforms.facebook.responseRate > 80 ? 'good' : 'warning'}>
                                                    {business.platforms.facebook.responseRate}%
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {business.platforms.yellow_pages && (
                                    <div className="platform-detail-card yellow_pages">
                                        <div className="platform-card-header">
                                            <span className="platform-card-icon">📒</span>
                                            <span className="platform-card-name">Yellow Pages</span>
                                            <span className="platform-card-status">✅</span>
                                        </div>
                                        <div className="platform-card-stats">
                                            <div className="stat-row">
                                                <span>Years:</span>
                                                <span>{business.platforms.yellow_pages.yearsInBusiness}</span>
                                            </div>
                                            <div className="stat-row">
                                                <span>Accredited:</span>
                                                <span>{business.platforms.yellow_pages.accredited ? '✅' : '❌'}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Missing Platforms */}
                        {business.platformGaps.length > 0 && (
                            <div className="missing-platforms-section">
                                <h4>❌ Missing Platforms ({business.platformGaps.length})</h4>
                                <div className="missing-platforms-list">
                                    {business.platformGaps.map(platformId => {
                                        const platform = scraperPlatforms.find(p => p.id === platformId);
                                        if (!platform) return null;
                                        return (
                                            <div key={platformId} className="missing-platform-item">
                                                <span className="missing-icon">{platform.icon}</span>
                                                <span className="missing-name">{platform.name}</span>
                                                <span className="missing-hint">{platform.uniqueData[0]}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Cross-Platform Insights */}
                        {business.crossPlatformInsights.length > 0 && (
                            <div className="insights-section">
                                <h4>🔍 Cross-Platform Insights</h4>
                                <div className="insights-list">
                                    {business.crossPlatformInsights.map((insight, idx) => (
                                        <div key={idx} className={`insight-item ${insight.severity}`}>
                                            <span className="insight-icon">
                                                {insight.severity === 'critical' ? '🚨' :
                                                    insight.severity === 'warning' ? '⚠️' : 'ℹ️'}
                                            </span>
                                            <div className="insight-content">
                                                <p className="insight-description">{insight.description}</p>
                                                <p className="insight-recommendation">💡 {insight.recommendation}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Aggregated Metrics */}
                        <div className="aggregated-metrics">
                            <h4>📊 Aggregated Metrics</h4>
                            <div className="metrics-grid">
                                <div className="metric-item">
                                    <span className="metric-label">Avg Rating</span>
                                    <span className="metric-value">{business.aggregatedRating.toFixed(1)}⭐</span>
                                </div>
                                <div className="metric-item">
                                    <span className="metric-label">Total Reviews</span>
                                    <span className="metric-value">{business.totalReviewsAllPlatforms.toLocaleString()}</span>
                                </div>
                                <div className="metric-item">
                                    <span className="metric-label">Platforms</span>
                                    <span className="metric-value">{business.platformCount}</span>
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

                        {/* View Pitches CTA */}
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
        );
    };

    if (businesses.length === 0 && !isLoading) {
        return (
            <div className="empty-state">
                <div className="empty-icon">🌐</div>
                <h3>No results yet</h3>
                <p>Select platforms and start a search to see business data with AI opportunity scores</p>
            </div>
        );
    }

    return (
        <div className="data-table-container">
            <div className="table-controls">
                <div className="table-search">
                    <input
                        type="text"
                        placeholder="Search businesses..."
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                        className="search-input"
                    />
                </div>

                <div className="table-filters">
                    <select
                        value={filterScore}
                        onChange={(e) => { setFilterScore(e.target.value); setCurrentPage(1); }}
                        className="filter-select"
                    >
                        <option value="all">All Leads</option>
                        <option value="hot">🔥 Hot Leads</option>
                        <option value="good">⭐ Good Opportunities</option>
                        <option value="decent">✅ Decent Prospects</option>
                        <option value="low">💤 Low Priority</option>
                    </select>

                    <select
                        value={pageSize}
                        onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                        className="pagesize-select"
                    >
                        <option value={25}>25 per page</option>
                        <option value={50}>50 per page</option>
                        <option value={100}>100 per page</option>
                    </select>
                </div>
            </div>

            <div className="table-wrapper">
                <table className="data-table">
                    <thead>
                        <tr>
                            {isMultiPlatform && <th className="th-expand"></th>}
                            <th onClick={() => handleSort('businessName')} className="sortable">
                                Business Name <SortIcon field="businessName" />
                            </th>
                            {isMultiPlatform && (
                                <th onClick={() => handleSort('platformCount')} className="sortable">
                                    Platforms <SortIcon field="platformCount" />
                                </th>
                            )}
                            <th onClick={() => handleSort('city')} className="sortable">
                                City <SortIcon field="city" />
                            </th>
                            <th>Phone</th>
                            <th onClick={() => handleSort('rating')} className="sortable">
                                {isMultiPlatform ? 'Avg Rating' : 'Rating'} <SortIcon field="rating" />
                            </th>
                            <th onClick={() => handleSort('totalReviews')} className="sortable">
                                Reviews <SortIcon field="totalReviews" />
                            </th>
                            {isMultiPlatform && <th>Social</th>}
                            <th onClick={() => handleSort('opportunityScore')} className="sortable">
                                Score <SortIcon field="opportunityScore" />
                            </th>
                            <th>Suggestions</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedData.map(business => {
                            const level = getOpportunityLevel(business.opportunityScore);
                            const isExpanded = expandedRows.has(business.id);
                            const unified = isUnifiedBusiness(business) ? business : null;

                            return (
                                <>
                                    <tr
                                        key={business.id}
                                        className={`row-${level} ${isMultiPlatform ? 'expandable-row' : ''} ${isExpanded ? 'expanded' : ''}`}
                                        onClick={isMultiPlatform ? () => toggleRowExpansion(business.id) : undefined}
                                    >
                                        {isMultiPlatform && (
                                            <td className="cell-expand">
                                                <button className="expand-btn">
                                                    {isExpanded ? '▼' : '▶'}
                                                </button>
                                            </td>
                                        )}
                                        <td className="cell-name">
                                            <div className="business-name-wrapper">
                                                <span className="business-name">{business.businessName}</span>
                                                {unified?.aliases && unified.aliases.length > 0 && (
                                                    <span className="alias-count" title={unified.aliases.join(', ')}>
                                                        +{unified.aliases.length} alias
                                                    </span>
                                                )}
                                            </div>
                                            {business.website && (
                                                <a
                                                    href={business.website}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="business-website"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    {business.website.replace(/https?:\/\/(www\.)?/, '').substring(0, 25)}...
                                                </a>
                                            )}
                                        </td>
                                        {isMultiPlatform && (
                                            <td className="cell-platforms">
                                                {renderPlatformBadges(business)}
                                            </td>
                                        )}
                                        <td className="cell-city">{business.city}</td>
                                        <td className="cell-phone">
                                            {business.phone ? (
                                                <a
                                                    href={`tel:${business.phone}`}
                                                    className="phone-link"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    📞 {business.phone}
                                                </a>
                                            ) : (
                                                <span className="no-data">-</span>
                                            )}
                                        </td>
                                        <td className="cell-rating">
                                            <span className="rating-badge">
                                                {unified
                                                    ? unified.aggregatedRating.toFixed(1)
                                                    : business.rating.toFixed(1)} ⭐
                                            </span>
                                        </td>
                                        <td className="cell-reviews">
                                            {unified
                                                ? unified.totalReviewsAllPlatforms.toLocaleString()
                                                : business.totalReviews.toLocaleString()}
                                        </td>
                                        {isMultiPlatform && (
                                            <td className="cell-social">
                                                {unified?.platforms.facebook && (
                                                    <span className="social-stat" title="Facebook followers">
                                                        📘 {(unified.platforms.facebook.followers / 1000).toFixed(1)}k
                                                    </span>
                                                )}
                                            </td>
                                        )}
                                        <td className="cell-score">
                                            <div
                                                className={`score-badge ${level}`}
                                                style={{ backgroundColor: getOpportunityColor(level) }}
                                            >
                                                {getOpportunityEmoji(level)} {business.opportunityScore}
                                            </div>
                                        </td>
                                        <td className="cell-tags">
                                            <div className="tags-container">
                                                {business.suggestionTags.slice(0, 2).map((tag, idx) => (
                                                    <span
                                                        key={idx}
                                                        className="suggestion-tag"
                                                        style={{
                                                            color: getTagColor(tag.category),
                                                            backgroundColor: getTagBgColor(tag.category)
                                                        }}
                                                    >
                                                        {tag.icon} {tag.label}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="cell-actions">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onViewPitch(business); }}
                                                className="btn-pitch"
                                            >
                                                💼 {unified ? unified.pitchIdeas.length : 'Pitches'}
                                            </button>
                                        </td>
                                    </tr>
                                    {isExpanded && unified && renderExpandedRow(unified)}
                                </>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <div className="table-pagination">
                <span className="pagination-info">
                    Showing {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, filteredAndSorted.length)} of {filteredAndSorted.length}
                    {isMultiPlatform && ' unified businesses'}
                </span>

                <div className="pagination-controls">
                    <button
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                        className="page-btn"
                    >
                        ⏮️
                    </button>
                    <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="page-btn"
                    >
                        ◀️
                    </button>
                    <span className="page-current">
                        Page {currentPage} of {totalPages || 1}
                    </span>
                    <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="page-btn"
                    >
                        ▶️
                    </button>
                    <button
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={currentPage === totalPages}
                        className="page-btn"
                    >
                        ⏭️
                    </button>
                </div>
            </div>
        </div>
    );
}

