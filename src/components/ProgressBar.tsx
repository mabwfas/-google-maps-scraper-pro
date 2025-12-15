'use client';

interface ProgressBarProps {
    progress: number;
    total: number;
    currentCity: string;
    estimatedTime: number;
    isPaused: boolean;
}

export default function ProgressBar({ progress, total, currentCity, estimatedTime, isPaused }: ProgressBarProps) {
    const percentage = total > 0 ? Math.round((progress / total) * 100) : 0;

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
    };

    return (
        <div className="progress-container">
            <div className="progress-header">
                <span className="progress-title">
                    {isPaused ? '⏸️ Paused' : '📊 Scraping in progress...'}
                </span>
                <span className="progress-stats">
                    {progress} / {total} ({percentage}%)
                </span>
            </div>

            <div className="progress-bar-track">
                <div
                    className={`progress-bar-fill ${isPaused ? 'paused' : ''}`}
                    style={{ width: `${percentage}%` }}
                />
            </div>

            <div className="progress-footer">
                <span className="progress-city">
                    📍 Current: {currentCity}
                </span>
                <span className="progress-eta">
                    ⏱️ Est. remaining: {formatTime(estimatedTime)}
                </span>
            </div>
        </div>
    );
}
