'use client';

import { ScrapingState } from '@/types';
import { scraperPlatforms } from '@/data/scraperPlatforms';

interface PlatformProgressProps {
    scrapingState: ScrapingState;
    selectedPlatforms: string[];
}

export default function PlatformProgress({
    scrapingState,
    selectedPlatforms
}: PlatformProgressProps) {
    if (!scrapingState.isActive && !scrapingState.platformProgress) {
        return null;
    }

    const formatTime = (seconds: number): string => {
        if (seconds < 60) return `${seconds}s`;
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}m ${secs}s`;
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'complete': return '✅';
            case 'scraping': return '🔄';
            case 'queued': return '⏳';
            case 'error': return '❌';
            default: return '⏳';
        }
    };

    const getStatusClass = (status: string) => {
        switch (status) {
            case 'complete': return 'status-complete';
            case 'scraping': return 'status-scraping';
            case 'queued': return 'status-queued';
            case 'error': return 'status-error';
            default: return 'status-queued';
        }
    };

    return (
        <div className="platform-progress-container">
            {/* Overall Progress */}
            <div className="overall-progress">
                <div className="progress-header">
                    <span className="progress-title">
                        🗺️ Scraping in Progress...
                    </span>
                    <span className="progress-stats">
                        {scrapingState.progress} / {scrapingState.total} businesses
                    </span>
                </div>
                <div className="progress-bar-container">
                    <div
                        className="progress-bar-fill"
                        style={{
                            width: `${(scrapingState.progress / scrapingState.total) * 100}%`
                        }}
                    />
                </div>
                <div className="progress-meta">
                    <span className="current-city">
                        📍 {scrapingState.currentCity}
                    </span>
                    <span className="time-remaining">
                        ⏱️ {formatTime(scrapingState.estimatedTimeRemaining)} remaining
                    </span>
                </div>
            </div>

            {/* Per-Platform Progress */}
            <div className="platform-progress-grid">
                {selectedPlatforms.map(platformId => {
                    const platform = scraperPlatforms.find(p => p.id === platformId);
                    if (!platform) return null;

                    const progress = scrapingState.platformProgress?.[platformId] || {
                        status: 'queued',
                        progress: 0,
                        total: 0,
                        found: 0
                    };

                    const percentage = progress.total > 0
                        ? Math.round((progress.progress / progress.total) * 100)
                        : 0;

                    return (
                        <div
                            key={platformId}
                            className={`platform-progress-item ${getStatusClass(progress.status)}`}
                            style={{
                                '--platform-color': platform.color
                            } as React.CSSProperties}
                        >
                            <div className="platform-progress-header">
                                <span className="platform-icon">{platform.icon}</span>
                                <span className="platform-name">{platform.name}</span>
                                <span className="platform-status">
                                    {getStatusIcon(progress.status)}
                                </span>
                            </div>
                            <div className="platform-progress-bar">
                                <div
                                    className="platform-progress-fill"
                                    style={{
                                        width: `${percentage}%`,
                                        backgroundColor: platform.color
                                    }}
                                />
                            </div>
                            <div className="platform-progress-stats">
                                <span>{progress.found} found</span>
                                <span>{percentage}%</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Deduplication Stats */}
            {scrapingState.deduplicationStats && (
                <div className="dedup-stats">
                    <div className="dedup-header">
                        🔄 Deduplication & Merging
                    </div>
                    <div className="dedup-items">
                        <div className="dedup-item">
                            <span className="dedup-icon">🔗</span>
                            <span className="dedup-label">Matched</span>
                            <span className="dedup-value">
                                {scrapingState.deduplicationStats.matched}
                            </span>
                        </div>
                        <div className="dedup-item">
                            <span className="dedup-icon">📍</span>
                            <span className="dedup-label">Unique</span>
                            <span className="dedup-value">
                                {scrapingState.deduplicationStats.unique}
                            </span>
                        </div>
                        <div className="dedup-item">
                            <span className="dedup-icon">⚠️</span>
                            <span className="dedup-label">Conflicts</span>
                            <span className="dedup-value">
                                {scrapingState.deduplicationStats.conflicts}
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
