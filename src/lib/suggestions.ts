// Smart Suggestion Tags Generator

import { ScrapedBusiness, SuggestionTag, SuggestionCategory } from '@/types';

interface TagRule {
    condition: (b: Partial<ScrapedBusiness>) => boolean;
    label: string;
    category: SuggestionCategory;
    icon: string;
}

const tagRules: TagRule[] = [
    // Critical Issues (Red)
    {
        condition: (b) => !b.website,
        label: 'No Website',
        category: 'critical',
        icon: '🚨'
    },
    {
        condition: (b) => (b.rating || 5) < 3.5,
        label: 'Poor Rating',
        category: 'critical',
        icon: '🚨'
    },
    {
        condition: (b) => b.website !== undefined && !b.website.includes('https'),
        label: 'Non-Secure Site',
        category: 'critical',
        icon: '🚨'
    },
    {
        condition: (b) => b.businessStatus === 'CLOSED_TEMPORARILY',
        label: 'Closed Temporarily',
        category: 'critical',
        icon: '🚨'
    },

    // Major Opportunities (Orange)
    {
        condition: (b) => {
            const cat = (b.category || '').toLowerCase();
            const isService = ['restaurant', 'salon', 'spa', 'dentist', 'doctor', 'gym'].some(s => cat.includes(s));
            return isService && (!b.website || !b.website.includes('booking'));
        },
        label: 'No Online Booking',
        category: 'major',
        icon: '⚠️'
    },
    {
        condition: (b) => (b.photosCount || 0) < 10,
        label: 'Limited Photos',
        category: 'major',
        icon: '⚠️'
    },
    {
        condition: (b) => !b.hours || b.hours.length === 0,
        label: 'Missing Hours',
        category: 'major',
        icon: '⚠️'
    },

    // Growth Opportunities (Blue)
    {
        condition: (b) => (b.totalReviews || 0) < 20,
        label: 'Few Reviews',
        category: 'growth',
        icon: '💡'
    },
    {
        condition: (b) => (b.totalReviews || 0) > 100 && !b.website,
        label: 'High Traffic, No Website',
        category: 'growth',
        icon: '💡'
    },
    {
        condition: (b) => !b.socialMedia || b.socialMedia.length === 0,
        label: 'No Social Media',
        category: 'growth',
        icon: '💡'
    },
    {
        condition: (b) => !b.email,
        label: 'No Email Listed',
        category: 'growth',
        icon: '💡'
    },
    {
        condition: (b) => !b.description || b.description.length < 50,
        label: 'Weak Description',
        category: 'growth',
        icon: '💡'
    },

    // Upsell Opportunities (Green)
    {
        condition: (b) => {
            const cat = (b.category || '').toLowerCase();
            const isRetail = ['store', 'shop', 'retail', 'boutique'].some(s => cat.includes(s));
            return isRetail && Boolean(b.website) && !b.website!.includes('shop');
        },
        label: 'No E-commerce',
        category: 'upsell',
        icon: '✨'
    },
    {
        condition: (b) => (b.rating || 0) >= 4.5 && (b.totalReviews || 0) > 50,
        label: 'Scale Ready',
        category: 'upsell',
        icon: '✨'
    },
    {
        condition: (b) => (b.rating || 0) >= 4.0 && (b.totalReviews || 0) > 200,
        label: 'Premium Potential',
        category: 'upsell',
        icon: '✨'
    }
];

export function generateSuggestionTags(business: Partial<ScrapedBusiness>): SuggestionTag[] {
    const tags: SuggestionTag[] = [];

    for (const rule of tagRules) {
        if (rule.condition(business)) {
            tags.push({
                label: rule.label,
                category: rule.category,
                icon: rule.icon
            });
        }
    }

    // Limit to top 5 most relevant tags
    return tags.slice(0, 5);
}

export function getTagColor(category: SuggestionCategory): string {
    switch (category) {
        case 'critical': return '#EA4335';
        case 'major': return '#FBBC04';
        case 'growth': return '#4285F4';
        case 'upsell': return '#34A853';
    }
}

export function getTagBgColor(category: SuggestionCategory): string {
    switch (category) {
        case 'critical': return 'rgba(234, 67, 53, 0.15)';
        case 'major': return 'rgba(251, 188, 4, 0.15)';
        case 'growth': return 'rgba(66, 133, 244, 0.15)';
        case 'upsell': return 'rgba(52, 168, 83, 0.15)';
    }
}
