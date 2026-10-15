import { describe, it, expect } from 'vitest';
import { normalizeProductData } from './normalization';
import { ProductData } from './types';

describe('ProductManager Normalization', () => {
    describe('normalizeProductData', () => {
        it('should handle nested dashboard.productDetails structure', () => {
            const mockAIResponse = {
                dashboard: {
                    summary: {
                        title: 'Product Vision',
                        statement: 'Revolutionary AI platform'
                    },
                    kpis: [
                        { label: 'MVP Confidence', value: '85%', trend: 'up' },
                        { label: 'Time to Market', value: '3 Months', trend: 'neutral' }
                    ],
                    productDetails: {
                        vision: 'Transform how teams collaborate with AI',
                        targetAudience: ['Startups', 'SMBs', 'Enterprise'],
                        keyFeatures: [
                            { feature: 'AI Chat', description: 'Intelligent conversations' },
                            { feature: 'Analytics', description: 'Real-time insights' }
                        ],
                        successMetrics: ['User Adoption', 'Revenue Growth']
                    },
                    roadmap: [
                        { phase: 'MVP', timeline: 'Q1 2024', goal: 'Launch Core', features: ['Login', 'Dashboard'], status: 'current' }
                    ],
                    prioritization: [
                        { feature: 'AI Chat', impact: 90, effort: 40, priority: 'Must Have' }
                    ],
                    competitors: [
                        { attribute: 'Price', ourProduct: 90, competitorAvg: 70, marketLeader: 80 }
                    ]
                }
            };

            const result = normalizeProductData(mockAIResponse);

            // Verify core data extraction
            expect(result.vision).toBe('Transform how teams collaborate with AI');
            expect(result.targetAudience).toEqual(['Startups', 'SMBs', 'Enterprise']);
            expect(result.keyFeatures).toHaveLength(2);
            expect(result.keyFeatures[0]).toHaveProperty('feature', 'AI Chat');

            // Verify strategy data
            expect(result.roadmap).toHaveLength(1);
            expect(result.roadmap[0]).toHaveProperty('phase', 'MVP');
            expect(result.prioritization).toHaveLength(1);
            expect(result.competitors).toHaveLength(1);

            // Verify KPIs
            expect(result.kpis).toHaveLength(2);
            expect(result.kpis[0]).toHaveProperty('label', 'MVP Confidence');
        });

        it('should handle flat structure without dashboard wrapper', () => {
            const mockFlatResponse = {
                vision: 'Direct vision statement',
                targetAudience: ['Developers'],
                keyFeatures: ['Feature 1', 'Feature 2'],
                roadmap: [{ phase: 'Phase 1' }]
            };

            const result = normalizeProductData(mockFlatResponse);

            expect(result.vision).toBe('Direct vision statement');
            expect(result.targetAudience).toEqual(['Developers']);
            expect(result.roadmap).toHaveLength(1);
        });

        it('should handle missing productDetails gracefully', () => {
            const mockResponse = {
                dashboard: {
                    vision: 'Vision at dashboard level',
                    roadmap: [{ phase: 'MVP' }]
                }
            };

            const result = normalizeProductData(mockResponse);

            expect(result.vision).toBe('Vision at dashboard level');
            expect(result.roadmap).toHaveLength(1);
        });

        it('should extract discovery questions from tabs', () => {
            const mockResponse = {
                dashboard: {
                    tabs: [
                        {
                            id: 'discovery',
                            type: 'interactive-questions',
                            data: [
                                { id: 'q1', question: 'What is your target market?', context: 'Market validation' },
                                { id: 'q2', question: 'What is your pricing strategy?', context: 'Revenue model' }
                            ]
                        }
                    ]
                }
            };

            const result = normalizeProductData(mockResponse);

            expect(result.discoveryQuestions).toHaveLength(2);
            expect(result.discoveryQuestions[0]).toHaveProperty('question', 'What is your target market?');
        });

        it('should extract charts from tabs', () => {
            const mockResponse = {
                dashboard: {
                    tabs: [
                        {
                            id: 'charts',
                            type: 'charts',
                            data: [
                                { title: 'Market Growth', type: 'bar', data: [] }
                            ]
                        }
                    ]
                }
            };

            const result = normalizeProductData(mockResponse);

            expect(result.charts).toHaveLength(1);
            expect(result.charts[0]).toHaveProperty('title', 'Market Growth');
        });

        it('should handle empty or null data gracefully', () => {
            const result = normalizeProductData({});

            expect(result.vision).toBe('');
            expect(result.targetAudience).toEqual([]);
            expect(result.keyFeatures).toEqual([]);
            expect(result.roadmap).toEqual([]);
            expect(result.prioritization).toEqual([]);
            expect(result.competitors).toEqual([]);
            expect(result.kpis).toEqual([]);
            expect(result.discoveryQuestions).toEqual([]);
            expect(result.charts).toEqual([]);
        });

        it('should handle case-insensitive key matching', () => {
            const mockResponse = {
                ProductVision: 'Case insensitive vision',
                TargetAudience: ['Audience 1'],
                KeyFeatures: ['Feature 1']
            };

            const result = normalizeProductData(mockResponse);

            expect(result.vision).toBe('Case insensitive vision');
            expect(result.targetAudience).toEqual(['Audience 1']);
            expect(result.keyFeatures).toEqual(['Feature 1']);
        });
    });
});
