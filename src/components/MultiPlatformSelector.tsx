'use client';

import { useState, useMemo } from 'react';
import { scraperPlatforms, ScraperPlatform, getPlatformsByTier } from '@/data/scraperPlatforms';
import { PlatformTier } from '@/types';

interface MultiPlatformSelectorProps {
    selectedPlatforms: string[];
    onSelectionChange: (platforms: string[]) => void;
    disabled?: boolean;
}

export default function MultiPlatformSelector({
    selectedPlatforms,
    onSelectionChange,
    disabled = false
}: MultiPlatformSelectorProps) {
    const [isExpanded, setIsExpanded] = useState(true);

    const platformsByTier = useMemo(() => ({
        free: getPlatformsByTier('free'),
        pro: getPlatformsByTier('pro'),
        premium: getPlatformsByTier('premium')
    }), []);

    const togglePlatform = (platformId: string) => {
        if (disabled) return;

        if (selectedPlatforms.includes(platformId)) {
            onSelectionChange(selectedPlatforms.filter(id => id !== platformId));
        } else {
            onSelectionChange([...selectedPlatforms, platformId]);
        }
    };

    const selectAllFree = () => {
        if (disabled) return;
        const freeIds = platformsByTier.free.map(p => p.id);
        const otherSelected = selectedPlatforms.filter(id =>
            !platformsByTier.free.some(p => p.id === id)
        );
        onSelectionChange([...otherSelected, ...freeIds]);
    };

    const clearAll = () => {
        if (disabled) return;
        onSelectionChange([]);
    };

    const renderPlatformChip = (platform: ScraperPlatform, isLocked: boolean = false) => {
        const isSelected = selectedPlatforms.includes(platform.id);

        return (
            <button
                key={platform.id}
                onClick={() => !isLocked && togglePlatform(platform.id)}
                disabled={disabled || isLocked}
                className={`platform-chip ${isSelected ? 'selected' : ''} ${isLocked ? 'locked' : ''}`}
                style={{
                    '--platform-color': platform.color
                } as React.CSSProperties}
            >
                <span className="platform-chip-icon">{platform.icon}</span>
                <div className="platform-chip-content">
                    <span className="platform-chip-name">{platform.name}</span>
                    <span className="platform-chip-coverage">{platform.coverage}</span>
                </div>
                {isLocked ? (
                    <span className="platform-chip-lock">🔒</span>
                ) : (
                    <span className="platform-chip-check">
                        {isSelected ? '✓' : ''}
                    </span>
                )}
            </button>
        );
    };

    const renderTierSection = (
        tier: PlatformTier,
        title: string,
        platforms: ScraperPlatform[],
        isLocked: boolean = false
    ) => (
        <div className={`platform-tier-section ${tier}`}>
            <div className="tier-header">
                <h4>{title}</h4>
                {isLocked && <span className="tier-badge pro">Upgrade</span>}
            </div>
            <div className="platform-chips-grid">
                {platforms.map(p => renderPlatformChip(p, isLocked))}
            </div>
        </div>
    );

    return (
        <div className="multi-platform-selector">
            <div className="selector-header" onClick={() => setIsExpanded(!isExpanded)}>
                <div className="selector-title">
                    <span className="selector-icon">🌐</span>
                    <span>Data Sources</span>
                    <span className="selected-count">
                        {selectedPlatforms.length} selected
                    </span>
                </div>
                <button className="expand-toggle">
                    {isExpanded ? '▼' : '▶'}
                </button>
            </div>

            {isExpanded && (
                <div className="selector-content">
                    {/* Quick Actions */}
                    <div className="selector-actions">
                        <button
                            onClick={selectAllFree}
                            disabled={disabled}
                            className="action-btn"
                        >
                            Select All Free
                        </button>
                        <button
                            onClick={clearAll}
                            disabled={disabled}
                            className="action-btn secondary"
                        >
                            Clear
                        </button>
                    </div>

                    {/* Free Tier */}
                    {renderTierSection('free', '🆓 Free Platforms', platformsByTier.free)}

                    {/* Pro Tier */}
                    {renderTierSection('pro', '⭐ Pro Platforms', platformsByTier.pro, true)}

                    {/* Premium Tier */}
                    {renderTierSection('premium', '💎 Premium Platforms', platformsByTier.premium, true)}

                    {/* Selection Summary */}
                    <div className="selection-summary">
                        <div className="summary-row">
                            <span>Selected Platforms:</span>
                            <div className="selected-icons">
                                {selectedPlatforms.map(id => {
                                    const platform = scraperPlatforms.find(p => p.id === id);
                                    return platform ? (
                                        <span
                                            key={id}
                                            className="selected-platform-icon"
                                            style={{ backgroundColor: platform.color }}
                                            title={platform.name}
                                        >
                                            {platform.icon}
                                        </span>
                                    ) : null;
                                })}
                                {selectedPlatforms.length === 0 && (
                                    <span className="no-selection">None selected</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
