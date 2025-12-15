'use client';

import { useState, useCallback, useMemo } from 'react';
import { SearchFilters, ScrapedBusiness, ScrapingState } from '@/types';
import { countries, getTopCitiesForCountry } from '@/data/countries';
import { popularCategories } from '@/data/categories';
import { scraperPlatforms } from '@/data/scraperPlatforms';
import { generateMockBusinesses } from '@/lib/mockData';
import { exportToCSV } from '@/lib/exportCSV';
import { exportToPDF } from '@/lib/exportPDF';
import Sidebar from '@/components/Sidebar';
import DataTable from '@/components/DataTable';
import PitchModal from '@/components/PitchModal';
import Header from '@/components/Header';
import StatsBar from '@/components/StatsBar';
import ProgressBar from '@/components/ProgressBar';

export default function Home() {
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
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedPlatform, setSelectedPlatform] = useState('google_maps');

  const currentCountry = useMemo(() =>
    countries.find(c => c.code === filters.country),
    [filters.country]
  );

  const currentPlatform = useMemo(() =>
    scraperPlatforms.find(p => p.id === selectedPlatform),
    [selectedPlatform]
  );

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

    // Simulate progressive scraping
    const totalResults = filters.resultsLimit;
    const batchSize = 10;
    const batches = Math.ceil(totalResults / batchSize);

    for (let i = 0; i < batches; i++) {
      if (scrapingState.isPaused) {
        await new Promise(resolve => setTimeout(resolve, 100));
        i--;
        continue;
      }

      await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 200));

      const currentBatch = Math.min(batchSize, totalResults - i * batchSize);
      const cityIndex = Math.floor((i * batchSize) / (totalResults / cities.length));

      const newBusinesses = generateMockBusinesses(
        [cities[cityIndex % cities.length]],
        filters.category,
        currentCountry?.name || 'United States',
        currentBatch
      );

      setBusinesses(prev => [...prev, ...newBusinesses]);
      setScrapingState(prev => ({
        ...prev,
        progress: Math.min((i + 1) * batchSize, totalResults),
        currentCity: cities[cityIndex % cities.length],
        estimatedTimeRemaining: Math.max(0, Math.ceil((batches - i - 1) * 0.5) * 60)
      }));
    }

    setScrapingState(prev => ({
      ...prev,
      isActive: false,
      progress: totalResults,
      estimatedTimeRemaining: 0
    }));
  }, [filters, currentCountry, scrapingState.isPaused]);

  const handlePauseScraping = useCallback(() => {
    setScrapingState(prev => ({ ...prev, isPaused: !prev.isPaused }));
  }, []);

  const handleStopScraping = useCallback(() => {
    setScrapingState({
      isActive: false,
      isPaused: false,
      progress: 0,
      total: 0,
      currentCity: '',
      estimatedTimeRemaining: 0
    });
  }, []);

  const handleViewPitch = useCallback((business: ScrapedBusiness) => {
    setSelectedBusiness(business);
    setIsPitchModalOpen(true);
  }, []);

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
    <div className="app-container">
      <Header
        onExportCSV={handleExportCSV}
        onExportPDF={handleExportPDF}
        hasData={businesses.length > 0}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />

      <div className="main-layout">
        <Sidebar
          isOpen={sidebarOpen}
          filters={filters}
          onFiltersChange={setFilters}
          countries={countries}
          categories={popularCategories}
          onStartScraping={handleStartScraping}
          isScrapingActive={scrapingState.isActive}
          onPauseScraping={handlePauseScraping}
          onStopScraping={handleStopScraping}
          isPaused={scrapingState.isPaused}
          platforms={scraperPlatforms}
          selectedPlatform={selectedPlatform}
          onSelectPlatform={setSelectedPlatform}
        />

        <main className="content-area">
          {scrapingState.isActive && (
            <ProgressBar
              progress={scrapingState.progress}
              total={scrapingState.total}
              currentCity={scrapingState.currentCity}
              estimatedTime={scrapingState.estimatedTimeRemaining}
              isPaused={scrapingState.isPaused}
            />
          )}

          {businesses.length > 0 && (
            <StatsBar businesses={businesses} />
          )}

          <DataTable
            businesses={businesses}
            onViewPitch={handleViewPitch}
            isLoading={scrapingState.isActive}
          />
        </main>
      </div>

      {isPitchModalOpen && selectedBusiness && (
        <PitchModal
          business={selectedBusiness}
          onClose={() => setIsPitchModalOpen(false)}
        />
      )}
    </div>
  );
}
