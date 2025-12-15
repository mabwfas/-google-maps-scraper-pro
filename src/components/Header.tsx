'use client';

interface HeaderProps {
    onExportCSV: () => void;
    onExportPDF: () => void;
    hasData: boolean;
    onToggleSidebar: () => void;
}

export default function Header({ onExportCSV, onExportPDF, hasData, onToggleSidebar }: HeaderProps) {
    return (
        <header className="app-header">
            <div className="header-left">
                <button onClick={onToggleSidebar} className="menu-btn" aria-label="Toggle sidebar">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="3" y1="6" x2="21" y2="6" />
                        <line x1="3" y1="12" x2="21" y2="12" />
                        <line x1="3" y1="18" x2="21" y2="18" />
                    </svg>
                </button>
                <div className="logo-container">
                    <span className="logo-icon">🗺️</span>
                    <div className="logo-text">
                        <h1>Google Maps Scraper Pro</h1>
                        <span className="logo-subtitle">by Digital Marketing Heroes</span>
                    </div>
                </div>
            </div>

            <div className="header-right">
                <div className="export-buttons">
                    <button
                        onClick={onExportCSV}
                        disabled={!hasData}
                        className="btn-export csv"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7,10 12,15 17,10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                        CSV
                    </button>
                    <button
                        onClick={onExportPDF}
                        disabled={!hasData}
                        className="btn-export pdf"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14,2 14,8 20,8" />
                            <line x1="16" y1="13" x2="8" y2="13" />
                            <line x1="16" y1="17" x2="8" y2="17" />
                        </svg>
                        PDF Report
                    </button>
                </div>
            </div>
        </header>
    );
}
