'use client';

import { ScrapedBusiness } from '@/types';
import { getOpportunityLevel, getOpportunityLabel, getOpportunityEmoji } from '@/lib/scoring';
import { getBestContactTime, generateBundlePackage } from '@/lib/pitchGenerator';

interface PitchModalProps {
    business: ScrapedBusiness;
    onClose: () => void;
}

export default function PitchModal({ business, onClose }: PitchModalProps) {
    const level = getOpportunityLevel(business.opportunityScore);
    const bundle = generateBundlePackage(business.pitchIdeas);
    const contactTime = getBestContactTime(business.category);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert('Copied to clipboard!');
    };

    const getUrgencyColor = (urgency: string) => {
        switch (urgency) {
            case 'CRITICAL': return '#EA4335';
            case 'HIGH': return '#FF8C00';
            case 'MEDIUM': return '#FBBC04';
            case 'LOW': return '#34A853';
            default: return '#9E9E9E';
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <button className="modal-close" onClick={onClose}>×</button>

                <div className="modal-header">
                    <h2>💼 Pitch Ideas for {business.businessName}</h2>
                    <div className="modal-subtitle">
                        {business.city}, {business.state} | {business.rating}⭐ ({business.totalReviews} reviews) |
                        <span className={`score-inline ${level}`}>
                            Score: {business.opportunityScore} {getOpportunityEmoji(level)}
                        </span>
                    </div>
                </div>

                <div className="modal-body">
                    <section className="pitch-section">
                        <h3>🎯 Recommended Pitch Sequence</h3>

                        {business.pitchIdeas.map((pitch, idx) => (
                            <div key={idx} className="pitch-card">
                                <div className="pitch-header">
                                    <span className="pitch-number">{idx + 1}</span>
                                    <div className="pitch-title">
                                        <span
                                            className="urgency-badge"
                                            style={{ backgroundColor: getUrgencyColor(pitch.urgency) }}
                                        >
                                            {pitch.urgency}
                                        </span>
                                        <h4>{pitch.service}</h4>
                                    </div>
                                </div>

                                <div className="pitch-meta">
                                    <span className="pitch-package">📦 {pitch.package}</span>
                                    <span className="pitch-price">💰 {pitch.price}</span>
                                    <span className="pitch-timeline">⏱️ {pitch.timeline}</span>
                                </div>

                                <div className="pitch-content">
                                    <p className="pitch-text">{pitch.pitch}</p>
                                    <div className="pitch-roi">
                                        <strong>ROI:</strong> {pitch.roi}
                                    </div>
                                </div>

                                <div className="pitch-actions">
                                    <button
                                        onClick={() => copyToClipboard(pitch.pitch)}
                                        className="btn-copy"
                                    >
                                        📋 Copy Pitch
                                    </button>
                                    {pitch.emailTemplate && (
                                        <button
                                            onClick={() => copyToClipboard(pitch.emailTemplate!)}
                                            className="btn-email"
                                        >
                                            ✉️ Email Template
                                        </button>
                                    )}
                                    {pitch.callScript && (
                                        <button
                                            onClick={() => copyToClipboard(pitch.callScript!)}
                                            className="btn-script"
                                        >
                                            📞 Call Script
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </section>

                    {bundle && (
                        <section className="bundle-section">
                            <h3>💎 Bundle Discount</h3>
                            <div className="bundle-card">
                                <h4>{bundle.name}</h4>
                                <ul className="bundle-services">
                                    {bundle.services.map((service, idx) => (
                                        <li key={idx}>✓ {service}</li>
                                    ))}
                                </ul>
                                <div className="bundle-discount">
                                    Save {bundle.discount} - {bundle.price}
                                </div>
                            </div>
                        </section>
                    )}

                    <section className="timing-section">
                        <h3>📅 Best Time to Contact</h3>
                        <div className="timing-card">
                            <div className="timing-info">
                                <span><strong>Days:</strong> {contactTime.days.join(', ')}</span>
                                <span><strong>Time:</strong> {contactTime.time}</span>
                                <span><strong>Reason:</strong> {contactTime.reason}</span>
                            </div>
                        </div>
                    </section>

                    <section className="contact-section">
                        <h3>📞 Contact Information</h3>
                        <div className="contact-card">
                            <div className="contact-row">
                                <span className="contact-label">Phone:</span>
                                <span className="contact-value">{business.phone || 'Not available'}</span>
                                {business.phone && (
                                    <button
                                        onClick={() => copyToClipboard(business.phone!)}
                                        className="btn-copy-small"
                                    >
                                        📋
                                    </button>
                                )}
                            </div>
                            <div className="contact-row">
                                <span className="contact-label">Website:</span>
                                <span className="contact-value">
                                    {business.website ? (
                                        <a href={business.website} target="_blank" rel="noopener noreferrer">
                                            {business.website}
                                        </a>
                                    ) : (
                                        <span className="no-website">No website (opportunity!)</span>
                                    )}
                                </span>
                            </div>
                            <div className="contact-row">
                                <span className="contact-label">Address:</span>
                                <span className="contact-value">{business.address}, {business.city}, {business.zipCode}</span>
                            </div>
                            <div className="contact-row">
                                <span className="contact-label">Maps:</span>
                                <a href={business.mapsUrl} target="_blank" rel="noopener noreferrer" className="maps-link">
                                    Open in Google Maps →
                                </a>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
