'use client';

import { ScraperPlatform } from '@/data/scraperPlatforms';

interface PlatformSelectorProps {
    platforms: ScraperPlatform[];
    selectedPlatform: string;
    onSelectPlatform: (platformId: string) => void;
}

export default function PlatformSelector({
    platforms,
    selectedPlatform,
    onSelectPlatform
}: PlatformSelectorProps) {
    return (
        <div className="platform-selector">
            <h3 className="platform-title">
                <span className="platform-icon">🔍</span>
                Select Data Source
            </h3>
            <div className="platform-grid">
                {platforms.map(platform => (
                    <button
                        key={platform.id}
                        onClick={() => onSelectPlatform(platform.id)}
                        className={`platform-card ${selectedPlatform === platform.id ? 'selected' : ''}`}
                        style={{
                            '--platform-color': platform.color
                        } as React.CSSProperties}
                    >
                        <span className="platform-card-icon">{platform.icon}</span>
                        <span className="platform-card-name">{platform.name}</span>
                        {selectedPlatform === platform.id && (
                            <span className="platform-check">✓</span>
                        )}
                    </button>
                ))}
            </div>

            {selectedPlatform && (
                <div className="platform-info">
                    <p className="platform-desc">
                        {platforms.find(p => p.id === selectedPlatform)?.description}
                    </p>
                    <div className="platform-data-points">
                        <span className="data-label">Data extracted:</span>
                        <div className="data-chips">
                            {platforms.find(p => p.id === selectedPlatform)?.dataPoints.slice(0, 5).map((point, idx) => (
                                <span key={idx} className="data-chip">{point}</span>
                            ))}
                            {(platforms.find(p => p.id === selectedPlatform)?.dataPoints.length || 0) > 5 && (
                                <span className="data-chip more">+{(platforms.find(p => p.id === selectedPlatform)?.dataPoints.length || 0) - 5} more</span>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
