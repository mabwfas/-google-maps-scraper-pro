'use client';

import { useState, useCallback, useMemo } from 'react';
import { SearchFilters, ScrapedBusiness, ScrapingState } from '@/types';
import { countries, getTopCitiesForCountry } from '@/data/countries';
import { popularCategories } from '@/data/categories';
import { scraperPlatforms } from '@/data/scraperPlatforms';
import { generatePlatformData } from '@/lib/platformMockData';
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

    // Scrape data from API
    const totalResults = filters.resultsLimit;
    const resultsPerCity = Math.ceil(totalResults / cities.length);

    for (let cityIdx = 0; cityIdx < cities.length; cityIdx++) {
      const city = cities[cityIdx];

      if (scrapingState.isPaused) {
        await new Promise(resolve => setTimeout(resolve, 100));
        cityIdx--;
        continue;
      }

      setScrapingState(prev => ({
        ...prev,
        currentCity: city,
        progress: Math.floor((cityIdx / cities.length) * totalResults)
      }));

      try {
        // Call API route for real scraping
        const response = await fetch('/api/scrape', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            platform: selectedPlatform,
            query: filters.category,
            city: city,
            country: currentCountry?.name || 'United States',
            // API key would be stored in environment variables for production
            apiKey: process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY
          })
        });

        const result = await response.json();

        if (result.success && result.data) {
          // Enrich with AI scoring
          const enrichedBusinesses = result.data.slice(0, resultsPerCity).map((biz: any) => {
            const { calculateOpportunityScore } = require('@/lib/scoring');
            const { generateSuggestionTags } = require('@/lib/suggestions');
            const { generatePitchIdeas } = require('@/lib/pitchGenerator');

            return {
              ...biz,
              opportunityScore: calculateOpportunityScore(biz),
              suggestionTags: generateSuggestionTags(biz),
              pitchIdeas: generatePitchIdeas(biz)
            };
          });

          setBusinesses(prev => [...prev, ...enrichedBusinesses]);
        }
      } catch (error) {
        console.error('Scraping error for', city, error);
        // Fallback to mock data on error
        const fallbackData = generatePlatformData(
          selectedPlatform,
          [city],
          filters.category,
          currentCountry?.name || 'United States',
          resultsPerCity
        );
        setBusinesses(prev => [...prev, ...fallbackData]);
      }

      // Update progress
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
  }, [filters, currentCountry, scrapingState.isPaused, selectedPlatform]);

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
