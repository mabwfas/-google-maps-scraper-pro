'use client';

import { useState, useCallback, useMemo } from 'react';
import { SearchFilters, ScrapedBusiness, ScrapingState, UnifiedBusiness } from '@/types';
import { countries, getTopCitiesForCountry } from '@/data/countries';
import { popularCategories } from '@/data/categories';
import { scraperPlatforms, getFreePlatforms } from '@/data/scraperPlatforms';
import { exportToCSV } from '@/lib/exportCSV';
import { exportToPDF } from '@/lib/exportPDF';
import { calculateOpportunityScore } from '@/lib/scoring';
import { generateSuggestionTags } from '@/lib/suggestions';
import { generatePitchIdeas } from '@/lib/pitchGenerator';
import { deduplicateBusinesses, mergeBusinesses } from '@/lib/unifiedBusiness';
import DataTable from '@/components/DataTable';
import PitchModal from '@/components/PitchModal';
import StatsBar from '@/components/StatsBar';
import MultiPlatformSelector from '@/components/MultiPlatformSelector';
import PlatformProgress from '@/components/PlatformProgress';

export default function Home() {
  // Initialize with free platforms selected
  const freePlatformIds = getFreePlatforms().map(p => p.id);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(freePlatformIds);

  const [filters, setFilters] = useState<SearchFilters>({
    country: 'US',
    cityMode: 'top10',
    selectedCities: [],
    category: '',
    minRating: 0,
    minReviews: 0,
    resultsLimit: 100,
    selectedPlatforms: freePlatformIds,
    searchMode: 'unified'
  });

  const [businesses, setBusinesses] = useState<ScrapedBusiness[]>([]);
  const [unifiedBusinesses, setUnifiedBusinesses] = useState<UnifiedBusiness[]>([]);
  const [scrapingState, setScrapingState] = useState<ScrapingState>({
    isActive: false,
    isPaused: false,
    progress: 0,
    total: 0,
    currentCity: '',
    estimatedTimeRemaining: 0,
    platformProgress: {},
    deduplicationStats: undefined
  });

  const [selectedBusiness, setSelectedBusiness] = useState<ScrapedBusiness | null>(null);
  const [isPitchModalOpen, setIsPitchModalOpen] = useState(false);

  const currentCountry = useMemo(() =>
    countries.find(c => c.code === filters.country),
    [filters.country]
  );

  const selectedCountry = countries.find(c => c.code === filters.country);
  const availableCities = selectedCountry?.topCities || [];

  const handlePlatformSelectionChange = (platforms: string[]) => {
    setSelectedPlatforms(platforms);
    setFilters(prev => ({ ...prev, selectedPlatforms: platforms }));
  };

  const handleStartScraping = useCallback(async () => {
    const cities = filters.selectedCities.length > 0
      ? filters.selectedCities
      : getTopCitiesForCountry(filters.country, filters.cityMode);

    if (cities.length === 0 || !filters.category) {
      alert('Please select cities and enter a business category');
      return;
    }

    if (selectedPlatforms.length === 0) {
      alert('Please select at least one platform to scrape');
      return;
    }

    // Initialize platform progress
    const initialPlatformProgress: ScrapingState['platformProgress'] = {};
    selectedPlatforms.forEach(platformId => {
      initialPlatformProgress![platformId] = {
        status: 'queued',
        progress: 0,
        total: 0,
        found: 0
      };
    });

    setScrapingState({
      isActive: true,
      isPaused: false,
      progress: 0,
      total: filters.resultsLimit * selectedPlatforms.length,
      currentCity: cities[0],
      estimatedTimeRemaining: Math.ceil((filters.resultsLimit * selectedPlatforms.length) / 15) * 60,
      platformProgress: initialPlatformProgress,
      deduplicationStats: undefined
    });

    setBusinesses([]);
    setUnifiedBusinesses([]);

    const allScrapedBusinesses: ScrapedBusiness[] = [];
    const totalResults = filters.resultsLimit;
    const resultsPerCity = Math.ceil(totalResults / cities.length);

    // Scrape each platform
    for (let platformIdx = 0; platformIdx < selectedPlatforms.length; platformIdx++) {
      const platformId = selectedPlatforms[platformIdx];

      // Update platform status to scraping
      setScrapingState(prev => ({
        ...prev,
        platformProgress: {
          ...prev.platformProgress,
          [platformId]: {
            status: 'scraping' as const,
            progress: prev.platformProgress?.[platformId]?.progress ?? 0,
            total: totalResults,
            found: prev.platformProgress?.[platformId]?.found ?? 0
          }
        }
      }));

      const platformBusinesses: ScrapedBusiness[] = [];

      for (let cityIdx = 0; cityIdx < cities.length; cityIdx++) {
        const city = cities[cityIdx];

        setScrapingState(prev => ({
          ...prev,
          currentCity: city,
          progress: (platformIdx * totalResults) + Math.floor((cityIdx / cities.length) * totalResults)
        }));

        try {
          const response = await fetch('/api/scrape', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              platform: platformId,
              query: filters.category,
              city: city,
              country: currentCountry?.name || 'United States'
            })
          });

          const result = await response.json();

          if (result.success && result.data) {
            const enrichedBusinesses = result.data.slice(0, resultsPerCity).map((biz: ScrapedBusiness) => ({
              ...biz,
              source: platformId, // Tag with platform source
              opportunityScore: calculateOpportunityScore(biz),
              suggestionTags: generateSuggestionTags(biz),
              pitchIdeas: generatePitchIdeas(biz)
            }));

            platformBusinesses.push(...enrichedBusinesses);

            // Update platform progress
            setScrapingState(prev => ({
              ...prev,
              platformProgress: {
                ...prev.platformProgress,
                [platformId]: {
                  status: prev.platformProgress?.[platformId]?.status ?? 'scraping' as const,
                  total: prev.platformProgress?.[platformId]?.total ?? totalResults,
                  progress: (cityIdx + 1) * resultsPerCity,
                  found: platformBusinesses.length
                }
              }
            }));
          }
        } catch (error) {
          console.error('Scraping error for', platformId, city, error);
        }
      }

      // Mark platform as complete
      setScrapingState(prev => ({
        ...prev,
        platformProgress: {
          ...prev.platformProgress,
          [platformId]: {
            status: 'complete' as const,
            total: prev.platformProgress?.[platformId]?.total ?? totalResults,
            progress: totalResults,
            found: platformBusinesses.length
          }
        }
      }));

      allScrapedBusinesses.push(...platformBusinesses);
    }

    // Deduplication phase
    setScrapingState(prev => ({
      ...prev,
      currentCity: 'Deduplicating...',
    }));

    // Perform deduplication across all platforms
    const { unified, stats } = deduplicateBusinesses(allScrapedBusinesses);

    setUnifiedBusinesses(unified);
    setBusinesses(allScrapedBusinesses); // Keep raw data too

    setScrapingState(prev => ({
      ...prev,
      isActive: false,
      progress: prev.total,
      estimatedTimeRemaining: 0,
      deduplicationStats: stats
    }));

  }, [filters, currentCountry, selectedPlatforms]);

  const handleExportCSV = useCallback(() => {
    if (unifiedBusinesses.length === 0 && businesses.length === 0) {
      alert('No data to export');
      return;
    }
    // Export unified or raw businesses
    exportToCSV(unifiedBusinesses.length > 0 ? unifiedBusinesses as unknown as ScrapedBusiness[] : businesses);
  }, [businesses, unifiedBusinesses]);

  const handleExportPDF = useCallback(async () => {
    if (unifiedBusinesses.length === 0 && businesses.length === 0) {
      alert('No data to export');
      return;
    }
    const cities = filters.selectedCities.length > 0
      ? filters.selectedCities
      : getTopCitiesForCountry(filters.country, filters.cityMode);

    await exportToPDF(
      unifiedBusinesses.length > 0 ? unifiedBusinesses as unknown as ScrapedBusiness[] : businesses,
      {
        searchCategory: filters.category,
        cities,
        country: currentCountry?.name || 'United States'
      }
    );
  }, [businesses, unifiedBusinesses, filters, currentCountry]);

  // Use unified businesses if available, otherwise raw
  const displayBusinesses = unifiedBusinesses.length > 0
    ? (unifiedBusinesses as unknown as ScrapedBusiness[])
    : businesses;

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header multi-platform">
        <div className="header-left">
          <div className="logo-section">
            <span className="logo-icon">🌐</span>
            <div className="logo-text-container">
              <span className="logo-text">Multi-Platform Scraper Pro</span>
              <span className="logo-subtitle">Business Intelligence Edition</span>
            </div>
          </div>
        </div>

        <div className="header-center">
          <div className="platforms-summary">
            {selectedPlatforms.slice(0, 4).map(id => {
              const platform = scraperPlatforms.find(p => p.id === id);
              return platform ? (
                <span
                  key={id}
                  className="platform-indicator"
                  style={{ backgroundColor: platform.color }}
                  title={platform.name}
                >
                  {platform.icon}
                </span>
              ) : null;
            })}
            {selectedPlatforms.length > 4 && (
              <span className="platform-more">+{selectedPlatforms.length - 4}</span>
            )}
          </div>
        </div>

        <div className="header-right">
          <button
            onClick={handleExportCSV}
            disabled={displayBusinesses.length === 0}
            className="btn-export csv"
          >
            📥 CSV
          </button>
          <button
            onClick={handleExportPDF}
            disabled={displayBusinesses.length === 0}
            className="btn-export pdf"
          >
            📄 PDF
          </button>
        </div>
      </header>

      <div className="dashboard-layout">
        {/* Sidebar */}
        <aside className="dashboard-sidebar">
          {/* Platform Selector */}
          <MultiPlatformSelector
            selectedPlatforms={selectedPlatforms}
            onSelectionChange={handlePlatformSelectionChange}
            disabled={scrapingState.isActive}
          />

          <div className="sidebar-section">
            <h3>🌍 Country</h3>
            <select
              value={filters.country}
              onChange={(e) => setFilters({ ...filters, country: e.target.value, selectedCities: [] })}
              className="select-input"
              disabled={scrapingState.isActive}
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
                    disabled={scrapingState.isActive}
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
                    disabled={scrapingState.isActive}
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
              placeholder="e.g., Italian Restaurant..."
              className="text-input"
              list="categories"
              disabled={scrapingState.isActive}
            />
            <datalist id="categories">
              {popularCategories.map(cat => <option key={cat} value={cat} />)}
            </datalist>
            <div className="quick-categories">
              {popularCategories.slice(0, 4).map(cat => (
                <button
                  key={cat}
                  onClick={() => setFilters({ ...filters, category: cat })}
                  className="quick-cat-btn"
                  disabled={scrapingState.isActive}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="sidebar-section">
            <h3>⚙️ Options</h3>
            <div className="filter-row">
              <label>Results per Platform</label>
              <select
                value={filters.resultsLimit}
                onChange={(e) => setFilters({ ...filters, resultsLimit: Number(e.target.value) })}
                className="select-input small"
                disabled={scrapingState.isActive}
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
              disabled={!filters.category || scrapingState.isActive || selectedPlatforms.length === 0}
              className="btn-start multi-platform"
            >
              {scrapingState.isActive
                ? '⏳ Scraping...'
                : `🚀 Scrape ${selectedPlatforms.length} Platform${selectedPlatforms.length > 1 ? 's' : ''}`
              }
            </button>
          </div>

          {/* Scraping Stats Summary */}
          {scrapingState.deduplicationStats && (
            <div className="scraping-summary">
              <h4>📊 Results Summary</h4>
              <div className="summary-stats">
                <div className="stat-item">
                  <span className="stat-value">{scrapingState.deduplicationStats.unique}</span>
                  <span className="stat-label">Unique Businesses</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{scrapingState.deduplicationStats.matched}</span>
                  <span className="stat-label">Cross-Platform Matches</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{scrapingState.deduplicationStats.conflicts}</span>
                  <span className="stat-label">Data Conflicts</span>
                </div>
              </div>
            </div>
          )}
        </aside>

        {/* Main Content */}
        <main className="dashboard-main">
          {/* Multi-Platform Progress */}
          {scrapingState.isActive && (
            <PlatformProgress
              scrapingState={scrapingState}
              selectedPlatforms={selectedPlatforms}
            />
          )}

          {displayBusinesses.length > 0 && <StatsBar businesses={displayBusinesses} />}

          <DataTable
            businesses={displayBusinesses}
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

