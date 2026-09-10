import { Phase } from '../types/project';

/**
 * Calculates the total duration of the project in weeks.
 * It considers the start week and duration of each phase.
 * It enforces a minimum of 14 weeks.
 * 
 * @param phases - List of project phases
 * @returns Total number of weeks
 */
export const calculateTotalWeeks = (phases: Phase[]): number => {
    if (!phases || phases.length === 0) return 14; // Default minimum

    const maxWeek = Math.max(...phases.map(p => p.startWeek + p.duration));
    return Math.max(14, maxWeek);
};

/**
 * Calculates a scaling factor based on the change in resource count.
 * Uses a dampened exponent (0.8) to simulate diminishing returns (Brooks's Law-ish).
 * 
 * New Time = Original Time * (Original Headcount / New Headcount) ^ EfficiencyExponent
 * 
 * @param originalCount - Total headcount in the original plan
 * @param newCount - Total headcount in the current plan
 * @returns Multiplier for the duration (e.g., 0.8 means 80% of original time)
 */
export const calculateRecalculatedWeeks = (
    originalWeeks: number,
    originalHeadcount: number,
    newHeadcount: number
): number => {
    if (newHeadcount <= 0) return originalWeeks; // Avoid division by zero
    if (originalHeadcount <= 0) return originalWeeks; // Safety for bad data

    // Efficiency exponent: 1.0 = perfect linear scaling (double people = half time)
    // 0.5 = strong diminishing returns
    // 0.8 = reasonable compromise for software projects
    const EFFICIENCY_EXPONENT = 0.8;

    const scalingFactor = Math.pow(originalHeadcount / newHeadcount, EFFICIENCY_EXPONENT);

    let newWeeks = originalWeeks * scalingFactor;

    // Minimum sensible duration (it's hard to rush a project below a certain point regardless of people)
    // Let's say we can't compress more than 50% of the original timeline no matter what
    const minWeeks = originalWeeks * 0.5;

    return Math.max(newWeeks, minWeeks);
};
