// AI Pitch Generation System

import { ScrapedBusiness, PitchIdea } from '@/types';

export function generatePitchIdeas(business: Partial<ScrapedBusiness>): PitchIdea[] {
    const pitches: PitchIdea[] = [];
    const category = (business.category || '').toLowerCase();
    const rating = business.rating || 0;
    const reviews = business.totalReviews || 0;

    // Priority 1: No Website
    if (!business.website) {
        pitches.push({
            service: 'Professional Website Development',
            package: 'Starter Website Package',
            price: '$1,800 - $3,500',
            timeline: '2-3 weeks',
            pitch: `Build a stunning ${business.category || 'business'} website that showcases ${business.businessName} and attracts more customers. Your competitors already have websites - don't lose business to them.`,
            urgency: 'HIGH',
            roi: 'Get 30-40% more customers through online discovery',
            emailTemplate: generateWebsiteEmail(business),
            callScript: generateWebsiteCallScript(business)
        });
    }

    // Priority 2: No E-commerce (for retail/food)
    const isRetail = ['restaurant', 'retail', 'store', 'shop', 'food', 'pizza', 'bakery'].some(s => category.includes(s));
    if (isRetail && business.website && !business.website.includes('shop')) {
        pitches.push({
            service: 'Shopify E-commerce Store',
            package: 'Full Shopify Setup + Theme',
            price: '$2,500 - $5,000',
            timeline: '3-4 weeks',
            pitch: `Launch online ordering/sales for ${business.businessName}. With ${reviews} happy customers, imagine the revenue from online orders 24/7.`,
            urgency: 'HIGH',
            roi: 'Average 25% revenue increase in first 6 months'
        });
    }

    // Priority 3: Poor Rating + High Traffic
    if (rating < 4.0 && reviews > 50) {
        pitches.push({
            service: 'Reputation Management',
            package: 'Review Recovery Program',
            price: '$800/month (3-month minimum)',
            timeline: 'Ongoing',
            pitch: `Your ${rating}⭐ rating is costing you customers. With ${reviews} reviews, you have high visibility but need reputation repair. We'll help you improve reviews and respond professionally.`,
            urgency: 'CRITICAL',
            roi: 'Every 0.5 star increase = 20% more bookings'
        });
    }

    // Priority 4: Has Website but Bad Quality
    if (business.website && !business.website.includes('https')) {
        pitches.push({
            service: 'Website Redesign + Security',
            package: 'Complete Website Overhaul',
            price: '$2,000 - $4,000',
            timeline: '3-4 weeks',
            pitch: `Your website is outdated and insecure (no HTTPS). Modern customers expect fast, secure, mobile-friendly sites. Let's rebuild your online presence.`,
            urgency: 'MEDIUM',
            roi: 'Reduce bounce rate by 40%, increase conversions by 25%'
        });
    }

    // Priority 5: No Online Booking (for service businesses)
    const isService = ['salon', 'spa', 'doctor', 'dentist', 'gym', 'fitness', 'yoga'].some(s => category.includes(s));
    if (isService) {
        pitches.push({
            service: 'Online Booking System',
            package: 'Automated Scheduling Solution',
            price: '$1,200 setup + $50/month',
            timeline: '1-2 weeks',
            pitch: `Stop losing bookings to competitors with online scheduling. ${business.businessName} customers want to book appointments 24/7, not just during business hours.`,
            urgency: 'MEDIUM',
            roi: '30% more bookings, 50% reduction in no-shows'
        });
    }

    // Priority 6: Few Reviews
    if (reviews < 20) {
        pitches.push({
            service: 'Review Generation Campaign',
            package: '6-Month Review Growth Program',
            price: '$500/month',
            timeline: 'Ongoing',
            pitch: `With only ${reviews} reviews, you're invisible to most customers. We'll help you ethically collect 50-100+ authentic reviews in 6 months.`,
            urgency: 'MEDIUM',
            roi: 'Businesses with 50+ reviews get 3x more clicks'
        });
    }

    // Priority 7: Good Business but Could Scale
    if (rating >= 4.5 && reviews > 100) {
        pitches.push({
            service: 'Growth & Scaling Package',
            package: 'Multi-Location Digital Strategy',
            price: '$3,000 - $8,000',
            timeline: 'Ongoing partnership',
            pitch: `${business.businessName} is thriving with ${rating}⭐ and ${reviews} reviews! Let's scale you up: multiple locations, franchise support, advanced marketing automation.`,
            urgency: 'LOW',
            roi: 'Position for 2-3x growth in next 12-24 months'
        });
    }

    // Priority 8: Local SEO
    if (!business.description || (business.description && business.description.length < 100)) {
        pitches.push({
            service: 'Local SEO Optimization',
            package: 'Google Business Profile Optimization',
            price: '$600 one-time + $300/month',
            timeline: '1 week setup, ongoing optimization',
            pitch: `Your Google Business Profile is underoptimized. We'll improve your local search rankings so customers find ${business.businessName} when searching for ${business.category} in ${business.city}.`,
            urgency: 'MEDIUM',
            roi: 'Rank in top 3 local results = 40% more foot traffic'
        });
    }

    // Priority 9: Social Media
    if (!business.socialMedia || business.socialMedia.length === 0) {
        if (reviews > 30) {
            pitches.push({
                service: 'Social Media Setup & Management',
                package: 'Instagram + Facebook Launch',
                price: '$800 setup + $400/month',
                timeline: '2 weeks setup, ongoing content',
                pitch: `${business.businessName} has ${reviews} happy customers but no social media presence. We'll create and manage your Instagram/Facebook to attract the younger demographic.`,
                urgency: 'LOW',
                roi: 'Reach 10,000+ potential customers per month'
            });
        }
    }

    return pitches.slice(0, 5); // Return top 5 pitches
}

function generateWebsiteEmail(business: Partial<ScrapedBusiness>): string {
    return `Subject: Quick question about ${business.businessName}'s website

Hi there,

I was searching for ${business.category || 'businesses'} in ${business.city || 'your area'} and came across ${business.businessName} on Google Maps. ${business.totalReviews || 0} reviews and ${business.rating || 0} stars - clearly you're doing something right!

I noticed you don't have a website, which surprised me given your strong reputation. I work with successful ${business.category || 'businesses'} to build modern websites with online ordering systems.

Would you be open to a quick 10-minute call to discuss how we've helped similar businesses increase orders by 30-40%?

Best regards,
[Your Name]
Digital Marketing Heroes`;
}

function generateWebsiteCallScript(business: Partial<ScrapedBusiness>): string {
    return `OPENING:
"Hi, may I speak with the owner or manager?"

[When connected]
"Hi, this is [Your Name] from Digital Marketing Heroes. Quick question - I found ${business.businessName} on Google - ${business.rating}⭐ stars, awesome! But I noticed you don't have a website. Is that intentional or just haven't gotten around to it?"

KEY POINTS:
• ${business.totalReviews || 0} reviews means you have traffic - website captures more
• Competitors with websites get 30-40% more customers
• We can have you live in 2-3 weeks for $1,800-$3,500

CLOSE:
"Would you be open to a quick 15-minute meeting to see examples?"`;
}

export function generateBundlePackage(pitches: PitchIdea[]): { name: string; services: string[]; discount: string; price: string } | null {
    if (pitches.length < 2) return null;

    const topServices = pitches.slice(0, 3).map(p => p.service);

    return {
        name: 'Complete Digital Transformation Package',
        services: topServices,
        discount: '15% off',
        price: 'Contact for custom pricing'
    };
}

export function getBestContactTime(category: string): { days: string[]; time: string; reason: string } {
    const cat = category.toLowerCase();

    if (['restaurant', 'bar', 'cafe', 'pizza', 'food'].some(s => cat.includes(s))) {
        return {
            days: ['Tuesday', 'Wednesday'],
            time: '2:00 PM - 4:00 PM',
            reason: 'Between lunch and dinner rush'
        };
    }

    if (['salon', 'spa', 'beauty'].some(s => cat.includes(s))) {
        return {
            days: ['Monday', 'Tuesday'],
            time: '10:00 AM - 12:00 PM',
            reason: 'Slower start to week'
        };
    }

    if (['doctor', 'dentist', 'medical'].some(s => cat.includes(s))) {
        return {
            days: ['Wednesday', 'Thursday'],
            time: '12:00 PM - 1:00 PM',
            reason: 'During lunch break'
        };
    }

    return {
        days: ['Tuesday', 'Wednesday', 'Thursday'],
        time: '10:00 AM - 11:30 AM',
        reason: 'Standard business hours, mid-week'
    };
}
