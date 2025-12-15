'use client';

import { SearchFilters, Country } from '@/types';
import { ScraperPlatform } from '@/data/scraperPlatforms';

interface SidebarProps {
    isOpen: boolean;
    filters: SearchFilters;
    onFiltersChange: (filters: SearchFilters) => void;
    countries: Country[];
    categories: string[];
    onStartScraping: () => void;
    isScrapingActive: boolean;
    onPauseScraping: () => void;
    onStopScraping: () => void;
    isPaused: boolean;
    platforms: ScraperPlatform[];
    selectedPlatform: string;
    onSelectPlatform: (id: string) => void;
}

export default function Sidebar({
    isOpen,
    filters,
    onFiltersChange,
    countries,
    categories,
    onStartScraping,
    isScrapingActive,
    onPauseScraping,
    onStopScraping,
    isPaused,
    platforms,
    selectedPlatform,
    onSelectPlatform
}: SidebarProps) {
    const selectedCountry = countries.find(c => c.code === filters.country);
    const availableCities = selectedCountry?.topCities || [];
    const currentPlatform = platforms.find(p => p.id === selectedPlatform);

    const handleCountryChange = (code: string) => {
        onFiltersChange({
            ...filters,
            country: code,
            selectedCities: []
        });
    };

    const handleCityModeChange = (mode: 'top10' | 'top25' | 'top50' | 'custom') => {
        onFiltersChange({
            ...filters,
            cityMode: mode,
            selectedCities: mode === 'custom' ? filters.selectedCities : []
        });
    };

    const handleCityToggle = (city: string) => {
        const isSelected = filters.selectedCities.includes(city);
        onFiltersChange({
            ...filters,
            selectedCities: isSelected
                ? filters.selectedCities.filter(c => c !== city)
                : [...filters.selectedCities, city].slice(0, 10)
        });
    };

    if (!isOpen) return null;

    return (
        <aside className="sidebar">
            <div className="sidebar-content">
                {/* Platform Selection */}
                <div className="sidebar-section platform-section">
                    <h3 className="section-title">
                        <span className="section-icon">🔍</span>
                        Data Source
                    </h3>
                    <div className="platform-grid">
                        {platforms.map(platform => (
                            <button
                                key={platform.id}
                                onClick={() => onSelectPlatform(platform.id)}
                                className={`platform-btn ${selectedPlatform === platform.id ? 'selected' : ''}`}
                                style={{ '--platform-color': platform.color } as React.CSSProperties}
                                title={platform.description}
                            >
                                <span className="platform-icon">{platform.icon}</span>
                                <span className="platform-name">{platform.name}</span>
                            </button>
                        ))}
                    </div>
                    {currentPlatform && (
                        <p className="platform-desc">{currentPlatform.description}</p>
                    )}
                </div>

                <div className="sidebar-section">
                    <h3 className="section-title">
                        <span className="section-icon">🌍</span>
                        Select Country
                    </h3>
                    <select
                        value={filters.country}
                        onChange={(e) => handleCountryChange(e.target.value)}
                        className="select-input"
                    >
                        {countries.map(country => (
                            <option key={country.code} value={country.code}>
                                {country.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="sidebar-section">
                    <h3 className="section-title">
                        <span className="section-icon">📍</span>
                        City Selection
                    </h3>
                    <div className="radio-group">
                        {(['top10', 'top25', 'top50', 'custom'] as const).map(mode => (
                            <label key={mode} className="radio-label">
                                <input
                                    type="radio"
                                    name="cityMode"
                                    checked={filters.cityMode === mode}
                                    onChange={() => handleCityModeChange(mode)}
                                    className="radio-input"
                                />
                                <span className="radio-text">
                                    {mode === 'custom' ? 'Custom Cities' : `Top ${mode.replace('top', '')} Cities`}
                                </span>
                            </label>
                        ))}
                    </div>

                    {filters.cityMode === 'custom' && (
                        <div className="city-chips-container">
                            <p className="helper-text">Select up to 10 cities:</p>
                            <div className="city-chips">
                                {availableCities.slice(0, 25).map(city => (
                                    <button
                                        key={city}
                                        onClick={() => handleCityToggle(city)}
                                        className={`city-chip ${filters.selectedCities.includes(city) ? 'selected' : ''}`}
                                    >
                                        {city}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="sidebar-section">
                    <h3 className="section-title">
                        <span className="section-icon">🔍</span>
                        Business Category
                    </h3>
                    <input
                        type="text"
                        value={filters.category}
                        onChange={(e) => onFiltersChange({ ...filters, category: e.target.value })}
                        placeholder="e.g., Coffee Shops, Dentists..."
                        className="text-input"
                        list="categories"
                    />
                    <datalist id="categories">
                        {categories.map(cat => (
                            <option key={cat} value={cat} />
                        ))}
                    </datalist>

                    <div className="quick-categories">
                        {categories.slice(0, 6).map(cat => (
                            <button
                                key={cat}
                                onClick={() => onFiltersChange({ ...filters, category: cat })}
                                className="quick-cat-btn"
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="sidebar-section">
                    <h3 className="section-title">
                        <span className="section-icon">⚙️</span>
                        Filters
                    </h3>

                    <div className="filter-row">
                        <label className="filter-label">Min Rating</label>
                        <select
                            value={filters.minRating}
                            onChange={(e) => onFiltersChange({ ...filters, minRating: Number(e.target.value) })}
                            className="select-input small"
                        >
                            <option value={0}>Any</option>
                            <option value={3}>3+ ⭐</option>
                            <option value={3.5}>3.5+ ⭐</option>
                            <option value={4}>4+ ⭐</option>
                            <option value={4.5}>4.5+ ⭐</option>
                        </select>
                    </div>

                    <div className="filter-row">
                        <label className="filter-label">Min Reviews</label>
                        <select
                            value={filters.minReviews}
                            onChange={(e) => onFiltersChange({ ...filters, minReviews: Number(e.target.value) })}
                            className="select-input small"
                        >
                            <option value={0}>Any</option>
                            <option value={10}>10+</option>
                            <option value={25}>25+</option>
                            <option value={50}>50+</option>
                            <option value={100}>100+</option>
                        </select>
                    </div>

                    <div className="filter-row">
                        <label className="filter-label">Results Limit</label>
                        <select
                            value={filters.resultsLimit}
                            onChange={(e) => onFiltersChange({ ...filters, resultsLimit: Number(e.target.value) })}
                            className="select-input small"
                        >
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                            <option value={250}>250</option>
                            <option value={500}>500</option>
                        </select>
                    </div>
                </div>

                <div className="sidebar-actions">
                    {!isScrapingActive ? (
                        <button
                            onClick={onStartScraping}
                            className="btn-primary btn-start"
                            disabled={!filters.category}
                        >
                            <span className="btn-icon">🚀</span>
                            Start Scraping
                        </button>
                    ) : (
                        <>
                            <button
                                onClick={onPauseScraping}
                                className="btn-secondary"
                            >
                                {isPaused ? '▶️ Resume' : '⏸️ Pause'}
                            </button>
                            <button
                                onClick={onStopScraping}
                                className="btn-danger"
                            >
                                ⏹️ Stop
                            </button>
                        </>
                    )}
                </div>
            </div>
        </aside>
    );
}
