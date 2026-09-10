import { describe, it, expect } from 'vitest';
import { calculateTotalWeeks } from './projectUtils';
import { Phase } from '../types/project';

describe('calculateTotalWeeks', () => {
    it('should return default minimum of 14 weeks for empty phases', () => {
        const phases: Phase[] = [];
        expect(calculateTotalWeeks(phases)).toBe(14);
    });

    it('should return 14 weeks if project is shorter than 14 weeks', () => {
        const phases: any[] = [
            { startWeek: 1, duration: 4 }
        ];
        expect(calculateTotalWeeks(phases)).toBe(14);
    });

    it('should return correct duration for long projects', () => {
        const phases: any[] = [
            { startWeek: 1, duration: 20 }
        ];
        expect(calculateTotalWeeks(phases)).toBe(21); // 1 + 20 = 21
    });

    it('should find the maximum end week among multiple phases', () => {
        const phases: any[] = [
            { startWeek: 1, duration: 10 }, // Ends at 11
            { startWeek: 5, duration: 20 }, // Ends at 25
            { startWeek: 10, duration: 5 }  // Ends at 15
        ];
        expect(calculateTotalWeeks(phases)).toBe(25);
    });
});
