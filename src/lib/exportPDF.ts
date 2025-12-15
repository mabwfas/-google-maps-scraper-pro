// PDF Export Utility

import { ScrapedBusiness } from '@/types';
import { getOpportunityLevel, getOpportunityLabel, getOpportunityEmoji } from './scoring';

interface PDFExportOptions {
    searchCategory: string;
    cities: string[];
    country: string;
}

export async function exportToPDF(businesses: ScrapedBusiness[], options: PDFExportOptions): Promise<void> {
    // Dynamic import jspdf
    const { jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFontSize(24);
    doc.setTextColor(66, 133, 244);
    doc.text('Google Maps Scraper Pro', pageWidth / 2, 20, { align: 'center' });

    doc.setFontSize(14);
    doc.setTextColor(100);
    doc.text('Lead Generation Report', pageWidth / 2, 28, { align: 'center' });

    // Search Info
    doc.setFontSize(10);
    doc.setTextColor(50);
    const date = new Date().toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
    });
    doc.text(`Search: ${options.searchCategory} in ${options.cities.join(', ')}`, 14, 40);
    doc.text(`Country: ${options.country} | Date: ${date}`, 14, 46);
    doc.text(`Total Results: ${businesses.length}`, 14, 52);

    // Opportunity Analysis
    const hot = businesses.filter(b => b.opportunityScore >= 80).length;
    const good = businesses.filter(b => b.opportunityScore >= 60 && b.opportunityScore < 80).length;
    const decent = businesses.filter(b => b.opportunityScore >= 40 && b.opportunityScore < 60).length;
    const low = businesses.filter(b => b.opportunityScore < 40).length;

    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text('OPPORTUNITY ANALYSIS', 14, 65);

    doc.setFontSize(10);
    doc.setTextColor(244, 67, 54);
    doc.text(`Hot Leads: ${hot} (${Math.round(hot / businesses.length * 100)}%)`, 14, 73);
    doc.setTextColor(255, 152, 0);
    doc.text(`Good Opportunities: ${good} (${Math.round(good / businesses.length * 100)}%)`, 70, 73);
    doc.setTextColor(255, 193, 7);
    doc.text(`Decent Prospects: ${decent} (${Math.round(decent / businesses.length * 100)}%)`, 14, 80);
    doc.setTextColor(158, 158, 158);
    doc.text(`Low Priority: ${low} (${Math.round(low / businesses.length * 100)}%)`, 70, 80);

    // Top Issues Found
    const noWebsite = businesses.filter(b => !b.website).length;
    const poorRating = businesses.filter(b => b.rating < 4.0).length;
    const fewReviews = businesses.filter(b => b.totalReviews < 20).length;

    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text('TOP ISSUES FOUND', 14, 93);

    doc.setFontSize(9);
    doc.setTextColor(80);
    doc.text(`• ${noWebsite} businesses without websites`, 14, 100);
    doc.text(`• ${poorRating} with rating below 4.0 stars`, 14, 106);
    doc.text(`• ${fewReviews} with fewer than 20 reviews`, 14, 112);

    // Top 10 Hottest Leads
    doc.setFontSize(12);
    doc.setTextColor(244, 67, 54);
    doc.text('TOP 10 HOTTEST LEADS', 14, 125);

    const topLeads = businesses.slice(0, 10);
    let yPos = 133;

    doc.setFontSize(9);
    topLeads.forEach((biz, idx) => {
        const level = getOpportunityLevel(biz.opportunityScore);
        const emoji = getOpportunityEmoji(level);

        doc.setTextColor(0);
        doc.text(`${idx + 1}. ${biz.businessName} (Score: ${biz.opportunityScore}) ${emoji}`, 14, yPos);

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

    const tableData = businesses.map(biz => [
        biz.businessName.substring(0, 20),
        biz.category.substring(0, 15),
        biz.city,
        `${biz.rating}★`,
        String(biz.totalReviews),
        String(biz.opportunityScore),
        biz.phone || '-'
    ]);

    autoTable(doc, {
        head: [['Name', 'Category', 'City', 'Rating', 'Reviews', 'Score', 'Phone']],
        body: tableData,
        startY: 28,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [66, 133, 244] },
        alternateRowStyles: { fillColor: [245, 245, 245] }
    });

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(
            `Google Maps Scraper Pro | Page ${i} of ${pageCount} | Generated ${new Date().toISOString()}`,
            pageWidth / 2,
            doc.internal.pageSize.getHeight() - 10,
            { align: 'center' }
        );
    }

    // Save
    const fileName = `google-maps-report-${options.searchCategory.replace(/\s+/g, '-')}-${date.replace(/\s+/g, '-')}.pdf`;
    doc.save(fileName);
}
