'use client';

import { useState, useMemo } from 'react';
import { ScrapedBusiness } from '@/types';
import { getOpportunityLevel, getOpportunityLabel, getOpportunityEmoji, getOpportunityColor } from '@/lib/scoring';
import { getTagColor, getTagBgColor } from '@/lib/suggestions';

interface DataTableProps {
    businesses: ScrapedBusiness[];
    onViewPitch: (business: ScrapedBusiness) => void;
    isLoading: boolean;
}

type SortField = 'businessName' | 'city' | 'rating' | 'totalReviews' | 'opportunityScore';
type SortDirection = 'asc' | 'desc';

export default function DataTable({ businesses, onViewPitch, isLoading }: DataTableProps) {
    const [sortField, setSortField] = useState<SortField>('opportunityScore');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);
    const [filterScore, setFilterScore] = useState<string>('all');

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
                    comparison = a.rating - b.rating;
                    break;
                case 'totalReviews':
                    comparison = a.totalReviews - b.totalReviews;
                    break;
                case 'opportunityScore':
                    comparison = a.opportunityScore - b.opportunityScore;
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

    const SortIcon = ({ field }: { field: SortField }) => (
        <span className="sort-icon">
            {sortField === field ? (sortDirection === 'asc' ? '↑' : '↓') : '↕'}
        </span>
    );

    if (businesses.length === 0 && !isLoading) {
        return (
            <div className="empty-state">
                <div className="empty-icon">🗺️</div>
                <h3>No results yet</h3>
                <p>Start a search to see business data with AI opportunity scores</p>
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
                            <th onClick={() => handleSort('businessName')} className="sortable">
                                Business Name <SortIcon field="businessName" />
                            </th>
                            <th>Category</th>
                            <th onClick={() => handleSort('city')} className="sortable">
                                City <SortIcon field="city" />
                            </th>
                            <th>Phone</th>
                            <th>Email</th>
                            <th onClick={() => handleSort('rating')} className="sortable">
                                Rating <SortIcon field="rating" />
                            </th>
                            <th onClick={() => handleSort('totalReviews')} className="sortable">
                                Reviews <SortIcon field="totalReviews" />
                            </th>
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
                            return (
                                <tr key={business.id} className={`row-${level}`}>
                                    <td className="cell-name">
                                        <div className="business-name">{business.businessName}</div>
                                        {business.website && (
                                            <a href={business.website} target="_blank" rel="noopener noreferrer" className="business-website">
                                                {business.website.replace(/https?:\/\/(www\.)?/, '').substring(0, 25)}...
                                            </a>
                                        )}
                                    </td>
                                    <td className="cell-category">{business.category}</td>
                                    <td className="cell-city">{business.city}</td>
                                    <td className="cell-phone">
                                        {business.phone ? (
                                            <a href={`tel:${business.phone}`} className="phone-link">
                                                📞 {business.phone}
                                            </a>
                                        ) : (
                                            <span className="no-data">-</span>
                                        )}
                                    </td>
                                    <td className="cell-email">
                                        {business.email ? (
                                            <a href={`mailto:${business.email}`} className="email-link">
                                                ✉️ {business.email}
                                            </a>
                                        ) : (
                                            <span className="no-data">No email</span>
                                        )}
                                    </td>
                                    <td className="cell-rating">
                                        <span className="rating-badge">
                                            {business.rating.toFixed(1)} ⭐
                                        </span>
                                    </td>
                                    <td className="cell-reviews">{business.totalReviews}</td>
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
                                            onClick={() => onViewPitch(business)}
                                            className="btn-pitch"
                                        >
                                            💼 Pitches
                                        </button>
                                        <a
                                            href={business.mapsUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="btn-maps"
                                        >
                                            📍
                                        </a>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <div className="table-pagination">
                <span className="pagination-info">
                    Showing {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, filteredAndSorted.length)} of {filteredAndSorted.length}
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
