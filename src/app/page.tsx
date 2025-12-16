'use client';

import { useState, useCallback, useMemo } from 'react';
import { SearchFilters, ScrapedBusiness, ScrapingState } from '@/types';
import { countries, getTopCitiesForCountry } from '@/data/countries';
import { popularCategories } from '@/data/categories';
import { scraperPlatforms, ScraperPlatform } from '@/data/scraperPlatforms';
import { exportToCSV } from '@/lib/exportCSV';
import { exportToPDF } from '@/lib/exportPDF';
import { calculateOpportunityScore } from '@/lib/scoring';
import { generateSuggestionTags } from '@/lib/suggestions';
import { generatePitchIdeas } from '@/lib/pitchGenerator';
import DataTable from '@/components/DataTable';
import PitchModal from '@/components/PitchModal';
import StatsBar from '@/components/StatsBar';
import ProgressBar from '@/components/ProgressBar';

export default function Home() {
  const [selectedPlatformId, setSelectedPlatformId] = useState('google_maps');
  const [filters, setFilters] = useState<SearchFilters>({
    country: 'US',
    cityMode: 'top10',
    selectedCities: [],
    category: '',
    minRating: 0,
    minReviews: 0,
    resultsLimit: 100
  });

  const [businesses, setBusinesses] = useState<ScrapedBusiness[]>([]);
  const [scrapingState, setScrapingState] = useState<ScrapingState>({
    isActive: false,
    isPaused: false,
    progress: 0,
    total: 0,
    currentCity: '',
    estimatedTimeRemaining: 0
  });

  const [selectedBusiness, setSelectedBusiness] = useState<ScrapedBusiness | null>(null);
  const [isPitchModalOpen, setIsPitchModalOpen] = useState(false);

  const platform = useMemo(() =>
    scraperPlatforms.find(p => p.id === selectedPlatformId) || scraperPlatforms[0],
    [selectedPlatformId]
  );

  const currentCountry = useMemo(() =>
    countries.find(c => c.code === filters.country),
    [filters.country]
  );

  const selectedCountry = countries.find(c => c.code === filters.country);
  const availableCities = selectedCountry?.topCities || [];

  const handlePlatformChange = (platformId: string) => {
    setSelectedPlatformId(platformId);
    setBusinesses([]); // Clear results when switching platforms
  };

  const handleStartScraping = useCallback(async () => {
    const cities = filters.selectedCities.length > 0
      ? filters.selectedCities
      : getTopCitiesForCountry(filters.country, filters.cityMode);

    if (cities.length === 0 || !filters.category) {
      alert('Please select cities and enter a business category');
      return;
    }

    setScrapingState({
      isActive: true,
      isPaused: false,
      progress: 0,
      total: filters.resultsLimit,
      currentCity: cities[0],
      estimatedTimeRemaining: Math.ceil(filters.resultsLimit / 15) * 60
    });

    setBusinesses([]);

    const totalResults = filters.resultsLimit;
    const resultsPerCity = Math.ceil(totalResults / cities.length);

    for (let cityIdx = 0; cityIdx < cities.length; cityIdx++) {
      const city = cities[cityIdx];

      setScrapingState(prev => ({
        ...prev,
        currentCity: city,
        progress: Math.floor((cityIdx / cities.length) * totalResults)
      }));

      try {
        const response = await fetch('/api/scrape', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            platform: platform.id,
            query: filters.category,
            city: city,
            country: currentCountry?.name || 'United States'
          })
        });

        const result = await response.json();

        if (result.success && result.data) {
          const enrichedBusinesses = result.data.slice(0, resultsPerCity).map((biz: any) => ({
            ...biz,
            opportunityScore: calculateOpportunityScore(biz),
            suggestionTags: generateSuggestionTags(biz),
            pitchIdeas: generatePitchIdeas(biz)
          }));

          setBusinesses(prev => [...prev, ...enrichedBusinesses]);
        }
      } catch (error) {
        console.error('Scraping error for', city, error);
      }

      setScrapingState(prev => ({
        ...prev,
        progress: Math.min((cityIdx + 1) * resultsPerCity, totalResults),
        estimatedTimeRemaining: Math.max(0, (cities.length - cityIdx - 1) * 30)
      }));
    }

    setScrapingState(prev => ({
      ...prev,
      isActive: false,
      progress: totalResults,
      estimatedTimeRemaining: 0
    }));
  }, [filters, currentCountry, platform.id]);

  const handleExportCSV = useCallback(() => {
    if (businesses.length === 0) {
      alert('No data to export');
      return;
    }
    exportToCSV(businesses);
  }, [businesses]);

  const handleExportPDF = useCallback(async () => {
    if (businesses.length === 0) {
      alert('No data to export');
      return;
    }
    const cities = filters.selectedCities.length > 0
      ? filters.selectedCities
      : getTopCitiesForCountry(filters.country, filters.cityMode);

    await exportToPDF(businesses, {
      searchCategory: filters.category,
      cities,
      country: currentCountry?.name || 'United States'
    });
  }, [businesses, filters, currentCountry]);

  return (
    <div className="dashboard-container">
      {/* Header with Platform Dropdown */}
      <header className="dashboard-header" style={{ '--platform-color': platform.color } as React.CSSProperties}>
        <div className="header-left">
          <div className="logo-section">
            <span className="logo-icon">🔍</span>
            <span className="logo-text">Lead Scraper Pro</span>
          </div>

          {/* Platform Dropdown Switcher */}
          <div className="platform-switcher">
            <select
              value={selectedPlatformId}
              onChange={(e) => handlePlatformChange(e.target.value)}
              className="platform-dropdown"
              style={{ borderColor: platform.color }}
            >
              {scraperPlatforms.map(p => (
                <option key={p.id} value={p.id}>
                  {p.icon} {p.name}
                </option>
              ))}
            </select>
            <span className="platform-badge" style={{ backgroundColor: platform.color }}>
              {platform.icon} {platform.name}
            </span>
          </div>
        </div>

        <div className="header-right">
          <button onClick={handleExportCSV} disabled={businesses.length === 0} className="btn-export csv">
            📥 CSV
          </button>
          <button onClick={handleExportPDF} disabled={businesses.length === 0} className="btn-export pdf">
            📄 PDF
          </button>
        </div>
      </header>

      <div className="dashboard-layout">
        {/* Sidebar */}
        <aside className="dashboard-sidebar">
          <div className="sidebar-section">
            <h3>🌍 Country</h3>
            <select
              value={filters.country}
              onChange={(e) => setFilters({ ...filters, country: e.target.value, selectedCities: [] })}
              className="select-input"
            >
              {countries.map(c => (
                <option key={c.code} value={c.code}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="sidebar-section">
            <h3>📍 Cities</h3>
            <div className="radio-group">
              {(['top10', 'top25', 'top50', 'custom'] as const).map(mode => (
                <label key={mode} className="radio-label">
                  <input
                    type="radio"
                    checked={filters.cityMode === mode}
                    onChange={() => setFilters({ ...filters, cityMode: mode, selectedCities: mode === 'custom' ? filters.selectedCities : [] })}
                  />
                  {mode === 'custom' ? 'Custom' : `Top ${mode.replace('top', '')}`}
                </label>
              ))}
            </div>
            {filters.cityMode === 'custom' && (
              <div className="city-chips">
                {availableCities.slice(0, 20).map(city => (
                  <button
                    key={city}
                    onClick={() => {
                      const isSelected = filters.selectedCities.includes(city);
                      setFilters({
                        ...filters,
                        selectedCities: isSelected
                          ? filters.selectedCities.filter(c => c !== city)
                          : [...filters.selectedCities, city].slice(0, 10)
                      });
                    }}
                    className={`city-chip ${filters.selectedCities.includes(city) ? 'selected' : ''}`}
                  >
                    {city}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="sidebar-section">
            <h3>🔍 Search Query</h3>
            <input
              type="text"
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              placeholder={`e.g., ${platform.dataPoints[0] || 'Restaurant'}...`}
              className="text-input"
              list="categories"
            />
            <datalist id="categories">
              {popularCategories.map(cat => <option key={cat} value={cat} />)}
            </datalist>
            <div className="quick-categories">
              {popularCategories.slice(0, 4).map(cat => (
                <button key={cat} onClick={() => setFilters({ ...filters, category: cat })} className="quick-cat-btn">
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="sidebar-section">
            <h3>⚙️ Options</h3>
            <div className="filter-row">
              <label>Results Limit</label>
              <select
                value={filters.resultsLimit}
                onChange={(e) => setFilters({ ...filters, resultsLimit: Number(e.target.value) })}
                className="select-input small"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={250}>250</option>
              </select>
            </div>
          </div>

          <div className="sidebar-actions">
            <button
              onClick={handleStartScraping}
              disabled={!filters.category || scrapingState.isActive}
              className="btn-start"
              style={{ backgroundColor: platform.color }}
            >
              {scrapingState.isActive ? '⏳ Scraping...' : `🚀 Start ${platform.name} Scrape`}
            </button>
          </div>

          {/* Platform Info */}
          <div className="platform-info-box" style={{ borderColor: platform.color }}>
            <h4>{platform.icon} {platform.name}</h4>
            <p>{platform.description}</p>
            <div className="data-points-list">
              <strong>Data Extracted:</strong>
              {platform.dataPoints.map((point, idx) => (
                <span key={idx} className="data-point">{point}</span>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="dashboard-main">
          {scrapingState.isActive && (
            <ProgressBar
              progress={scrapingState.progress}
              total={scrapingState.total}
              currentCity={scrapingState.currentCity}
              estimatedTime={scrapingState.estimatedTimeRemaining}
              isPaused={scrapingState.isPaused}
            />
          )}

          {businesses.length > 0 && <StatsBar businesses={businesses} />}

          <DataTable
            businesses={businesses}
            onViewPitch={(biz) => { setSelectedBusiness(biz); setIsPitchModalOpen(true); }}
            isLoading={scrapingState.isActive}
          />
        </main>
      </div>

      {isPitchModalOpen && selectedBusiness && (
        <PitchModal business={selectedBusiness} onClose={() => setIsPitchModalOpen(false)} />
      )}
    </div>
  );
}
