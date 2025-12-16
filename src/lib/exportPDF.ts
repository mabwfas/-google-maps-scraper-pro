// PDF Export Utility
// Enhanced for Multi-Platform Business Intelligence Scraper V2.0

import { ScrapedBusiness, UnifiedBusiness } from '@/types';
import { getOpportunityLevel, getOpportunityLabel, getOpportunityEmoji } from './scoring';

interface PDFExportOptions {
    searchCategory: string;
    cities: string[];
    country: string;
}

// Type guard to check if business is UnifiedBusiness
function isUnifiedBusiness(business: ScrapedBusiness): business is UnifiedBusiness {
    return 'platformsFound' in business && 'aggregatedRating' in business;
}

export async function exportToPDF(businesses: ScrapedBusiness[], options: PDFExportOptions): Promise<void> {
    // Dynamic import jspdf
    const { jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Check if we have multi-platform data
    const isMultiPlatform = businesses.length > 0 && isUnifiedBusiness(businesses[0]);
    const unifiedBusinesses = isMultiPlatform ? businesses as UnifiedBusiness[] : [];

    // Header
    doc.setFontSize(24);
    doc.setTextColor(66, 133, 244);
    const title = isMultiPlatform ? 'Multi-Platform Scraper Pro' : 'Google Maps Scraper Pro';
    doc.text(title, pageWidth / 2, 20, { align: 'center' });

    doc.setFontSize(14);
    doc.setTextColor(100);
    const subtitle = isMultiPlatform ? 'Business Intelligence Report' : 'Lead Generation Report';
    doc.text(subtitle, pageWidth / 2, 28, { align: 'center' });

    // Search Info
    doc.setFontSize(10);
    doc.setTextColor(50);
    const date = new Date().toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
    });
    doc.text(`Search: ${options.searchCategory} in ${options.cities.join(', ')}`, 14, 40);
    doc.text(`Country: ${options.country} | Date: ${date}`, 14, 46);
    doc.text(`Total Results: ${businesses.length}`, 14, 52);

    // Multi-Platform Summary (only if multi-platform data)
    let yPos = 58;
    if (isMultiPlatform) {
        // Platform Coverage
        const platformCounts: Record<string, number> = {};
        unifiedBusinesses.forEach(biz => {
            biz.platformsFound.forEach(p => {
                platformCounts[p] = (platformCounts[p] || 0) + 1;
            });
        });

        doc.setFontSize(12);
        doc.setTextColor(0);
        doc.text('PLATFORM COVERAGE', 14, yPos);
        yPos += 7;

        doc.setFontSize(9);
        doc.setTextColor(80);
        Object.entries(platformCounts).forEach(([platform, count]) => {
            const pct = Math.round((count / businesses.length) * 100);
            doc.text(`• ${platform}: ${count} businesses (${pct}%)`, 14, yPos);
            yPos += 5;
        });

        // Cross-Platform Insights Summary
        yPos += 5;
        const totalInsights = unifiedBusinesses.reduce((sum, b) => sum + b.crossPlatformInsights.length, 0);
        const totalConflicts = unifiedBusinesses.reduce((sum, b) => sum + b.conflicts.length, 0);
        const avgQuality = unifiedBusinesses.reduce((sum, b) => sum + b.dataQuality, 0) / unifiedBusinesses.length;
        const avgPlatforms = unifiedBusinesses.reduce((sum, b) => sum + b.platformCount, 0) / unifiedBusinesses.length;

        doc.setFontSize(12);
        doc.setTextColor(0);
        doc.text('CROSS-PLATFORM ANALYSIS', 14, yPos);
        yPos += 7;

        doc.setFontSize(9);
        doc.setTextColor(80);
        doc.text(`• Avg. platforms per business: ${avgPlatforms.toFixed(1)}`, 14, yPos);
        yPos += 5;
        doc.text(`• Total insights generated: ${totalInsights}`, 14, yPos);
        yPos += 5;
        doc.text(`• Data conflicts found: ${totalConflicts}`, 14, yPos);
        yPos += 5;
        doc.text(`• Avg. data quality score: ${avgQuality.toFixed(0)}%`, 14, yPos);
        yPos += 10;
    }

    // Opportunity Analysis
    const hot = businesses.filter(b => b.opportunityScore >= 80).length;
    const good = businesses.filter(b => b.opportunityScore >= 60 && b.opportunityScore < 80).length;
    const decent = businesses.filter(b => b.opportunityScore >= 40 && b.opportunityScore < 60).length;
    const low = businesses.filter(b => b.opportunityScore < 40).length;

    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text('OPPORTUNITY ANALYSIS', 14, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setTextColor(244, 67, 54);
    doc.text(`Hot Leads: ${hot} (${Math.round(hot / businesses.length * 100)}%)`, 14, yPos);
    doc.setTextColor(255, 152, 0);
    doc.text(`Good Opportunities: ${good} (${Math.round(good / businesses.length * 100)}%)`, 70, yPos);
    yPos += 7;
    doc.setTextColor(255, 193, 7);
    doc.text(`Decent Prospects: ${decent} (${Math.round(decent / businesses.length * 100)}%)`, 14, yPos);
    doc.setTextColor(158, 158, 158);
    doc.text(`Low Priority: ${low} (${Math.round(low / businesses.length * 100)}%)`, 70, yPos);
    yPos += 12;

    // Top Issues Found
    const noWebsite = businesses.filter(b => !b.website).length;
    const poorRating = businesses.filter(b => b.rating < 4.0).length;
    const fewReviews = businesses.filter(b => b.totalReviews < 20).length;

    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text('TOP ISSUES FOUND', 14, yPos);
    yPos += 7;

    doc.setFontSize(9);
    doc.setTextColor(80);
    doc.text(`• ${noWebsite} businesses without websites`, 14, yPos);
    yPos += 5;
    doc.text(`• ${poorRating} with rating below 4.0 stars`, 14, yPos);
    yPos += 5;
    doc.text(`• ${fewReviews} with fewer than 20 reviews`, 14, yPos);
    yPos += 12;

    // Top 10 Hottest Leads
    doc.setFontSize(12);
    doc.setTextColor(244, 67, 54);
    doc.text('TOP 10 HOTTEST LEADS', 14, yPos);
    yPos += 8;

    const topLeads = businesses.slice(0, 10);

    doc.setFontSize(9);
    topLeads.forEach((biz, idx) => {
        const level = getOpportunityLevel(biz.opportunityScore);
        const emoji = getOpportunityEmoji(level);
        const platformInfo = isUnifiedBusiness(biz) ? ` [${biz.platformCount} platforms]` : '';

        doc.setTextColor(0);
        doc.text(`${idx + 1}. ${biz.businessName} (Score: ${biz.opportunityScore}) ${emoji}${platformInfo}`, 14, yPos);

        doc.setTextColor(100);
        if (biz.pitchIdeas[0]) {
            doc.text(`   Pitch: ${biz.pitchIdeas[0].service} - ${biz.pitchIdeas[0].price}`, 14, yPos + 5);
        }
        doc.text(`   ${biz.phone || 'No phone'} | ${biz.city}`, 14, yPos + 10);

        yPos += 18;

        if (yPos > 270) {
            doc.addPage();
            yPos = 20;
        }
    });

    // Full Data Table
    doc.addPage();
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text('COMPLETE BUSINESS LISTINGS', 14, 20);

    const tableHeaders = isMultiPlatform
        ? [['Name', 'Category', 'City', 'Platforms', 'Rating', 'Reviews', 'Score', 'Phone']]
        : [['Name', 'Category', 'City', 'Rating', 'Reviews', 'Score', 'Phone']];

    const tableData = businesses.map(biz => {
        const baseData = [
            biz.businessName.substring(0, 18),
            biz.category.substring(0, 12),
            biz.city,
        ];

        if (isMultiPlatform && isUnifiedBusiness(biz)) {
            return [
                ...baseData,
                String(biz.platformCount),
                `${biz.aggregatedRating.toFixed(1)}★`,
                String(biz.totalReviewsAllPlatforms),
                String(biz.opportunityScore),
                biz.phone || '-'
            ];
        }

        return [
            ...baseData,
            `${biz.rating}★`,
            String(biz.totalReviews),
            String(biz.opportunityScore),
            biz.phone || '-'
        ];
    });

    autoTable(doc, {
        head: tableHeaders,
        body: tableData,
        startY: 28,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: isMultiPlatform ? [52, 168, 83] : [66, 133, 244] },
        alternateRowStyles: { fillColor: [245, 245, 245] }
    });

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        const footer = isMultiPlatform
            ? `Multi-Platform Scraper Pro | Page ${i} of ${pageCount} | Generated ${new Date().toISOString()}`
            : `Google Maps Scraper Pro | Page ${i} of ${pageCount} | Generated ${new Date().toISOString()}`;
        doc.text(
            footer,
            pageWidth / 2,
            doc.internal.pageSize.getHeight() - 10,
            { align: 'center' }
        );
    }

    // Save
    const prefix = isMultiPlatform ? 'multi-platform' : 'google-maps';
    const fileName = `${prefix}-report-${options.searchCategory.replace(/\s+/g, '-')}-${date.replace(/\s+/g, '-')}.pdf`;
    doc.save(fileName);
}

