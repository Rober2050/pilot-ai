/**
 * Fixed Positioning System for War Room
 * 
 * Simple, reliable positioning for 2-4 roles.
 * All positions are percentages relative to container width.
 * No dynamic calculations, no perspective, no rotations.
 */

export interface FixedPosition {
    x: number;      // % from left (0-100)
    y: number;      // % from top (0-100) - usually fixed at 50%
    scale: number;  // Scale multiplier (usually 1.0)
}

/**
 * Fixed layouts for each role count
 * Positions are evenly distributed across the screen
 */
export const FIXED_LAYOUTS: Record<number, FixedPosition[]> = {
    // 2 Roles: Perfectly centered in window
    2: [
        { x: 38, y: 38, scale: 0.65 },
        { x: 62, y: 38, scale: 0.65 }
    ],
    // 3 Roles: Balanced distribution
    3: [
        { x: 36, y: 38, scale: 0.55 },
        { x: 50, y: 38, scale: 0.55 },
        { x: 63, y: 38, scale: 0.55 }
    ],
    // 4 Roles: Tight but centered
    4: [
        { x: 36, y: 38, scale: 0.48 },
        { x: 45, y: 38, scale: 0.48 },
        { x: 55, y: 38, scale: 0.48 },
        { x: 65, y: 38, scale: 0.48 }
    ]
};

/**
 * Get fixed positions for a given number of roles
 * @param count Number of roles (2-4)
 * @returns Array of fixed positions
 */
export const getFixedPositions = (count: number): FixedPosition[] => {
    const layout = FIXED_LAYOUTS[count];

    if (!layout) {
        console.error(`[FixedPositions] Invalid role count: ${count}. Falling back to 2 roles.`);
        return FIXED_LAYOUTS[2];
    }

    return layout;
};

/**
 * Background images for each configuration
 * Using unified Telepresence background (video wall setup)
 */
export const BACKGROUND_IMAGES: Record<number, string> = {
    2: '/war-room/telepresence-bg.png',
    3: '/war-room/telepresence-bg.png',
    4: '/war-room/telepresence-bg.png'
};

/**
 * Get background image for a given number of roles
 */
export const getBackgroundImage = (count: number): string => {
    return BACKGROUND_IMAGES[count] || BACKGROUND_IMAGES[4];
};
