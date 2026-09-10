/**
 * Utility functions for Hologram calculations and helpers
 * Provides reusable logic for body proportions, SVG generation, and validation
 */

import { BodyProportions, SVGPaths, HologramPosition } from './hologramTypes';

/**
 * Calculate human body proportions based on total height
 * Uses standard anatomical ratios (head = 1/7 of body)
 */
export const calculateBodyProportions = (baseHeight: number): BodyProportions => {
    return {
        headHeight: baseHeight * 0.14,      // 14% - Head
        neckHeight: baseHeight * 0.035,     // 3.5% - Neck
        torsoHeight: baseHeight * 0.43,     // 43% - Torso
        legsHeight: baseHeight * 0.395,     // 39.5% - Legs
        armLength: baseHeight * 0.38,       // 38% - Arms
        shoulderWidth: baseHeight * 0.25    // 25% - Shoulders
    };
};

/**
 * Generate SVG paths for seated human figure with FILLED BODY (not stick figure)
 * Creates realistic paths based on facing direction and proportions
 */
export const generateSeatedPaths = (
    facing: 'front' | 'left' | 'right',
    _proportions: BodyProportions,  // Prefixed with _ to indicate intentionally unused
    baseWidth: number = 200
): SVGPaths => {
    const centerX = baseWidth / 2;

    // Adjusted Y coordinates for SEATED posture (lower on screen)
    const headY = 180;      // Head lower
    const neckY = headY + 30;
    const shoulderY = neckY + 15;
    const waistY = shoulderY + 60;  // Shorter torso for seated
    const hipY = waistY + 20;
    const kneeY = hipY + 45;        // Bent knees
    const footY = kneeY + 50;

    if (facing === 'front') {
        return {
            // Head - Filled circle
            head: `M ${centerX} ${headY} m -22,0 a 22,26 0 1,0 44,0 a 22,26 0 1,0 -44,0`,

            // Neck - Filled
            neck: `M ${centerX - 10} ${neckY} L ${centerX - 8} ${shoulderY} L ${centerX + 8} ${shoulderY} L ${centerX + 10} ${neckY} Z`,

            // Torso - FILLED SOLID SHAPE
            torso: `M ${centerX - 30} ${shoulderY} 
                    Q ${centerX - 35} ${shoulderY + 20} ${centerX - 32} ${waistY} 
                    L ${centerX - 28} ${hipY} 
                    L ${centerX + 28} ${hipY} 
                    L ${centerX + 32} ${waistY} 
                    Q ${centerX + 35} ${shoulderY + 20} ${centerX + 30} ${shoulderY} 
                    Z`,

            // Left Arm - THICKER
            leftArm: `M ${centerX - 30} ${shoulderY + 8} 
                      Q ${centerX - 45} ${shoulderY + 25} ${centerX - 50} ${shoulderY + 45}
                      L ${centerX - 48} ${shoulderY + 47}
                      Q ${centerX - 43} ${shoulderY + 27} ${centerX - 28} ${shoulderY + 10}
                      Z`,

            // Right Arm - THICKER
            rightArm: `M ${centerX + 30} ${shoulderY + 8} 
                       Q ${centerX + 45} ${shoulderY + 25} ${centerX + 50} ${shoulderY + 45}
                       L ${centerX + 48} ${shoulderY + 47}
                       Q ${centerX + 43} ${shoulderY + 27} ${centerX + 28} ${shoulderY + 10}
                       Z`,

            // Left Leg - THICKER, BENT (seated)
            leftLeg: `M ${centerX - 28} ${hipY} 
                      L ${centerX - 30} ${kneeY} 
                      L ${centerX - 30} ${footY}
                      L ${centerX - 26} ${footY}
                      L ${centerX - 26} ${kneeY}
                      L ${centerX - 24} ${hipY}
                      Z`,

            // Right Leg - THICKER, BENT (seated)
            rightLeg: `M ${centerX + 24} ${hipY} 
                       L ${centerX + 26} ${kneeY} 
                       L ${centerX + 26} ${footY}
                       L ${centerX + 30} ${footY}
                       L ${centerX + 30} ${kneeY}
                       L ${centerX + 28} ${hipY}
                       Z`
        };
    } else if (facing === 'right') {
        const profileX = centerX + 10;
        return {
            head: `M ${profileX} ${headY} m -24,0 a 24,26 0 1,0 48,0 a 24,26 0 1,0 -48,0`,
            neck: `M ${profileX - 6} ${neckY} L ${profileX - 4} ${shoulderY} L ${profileX + 8} ${shoulderY} L ${profileX + 6} ${neckY} Z`,
            torso: `M ${profileX - 4} ${shoulderY} 
                    Q ${profileX + 12} ${shoulderY + 30} ${profileX + 8} ${waistY} 
                    L ${profileX - 4} ${hipY} 
                    Z`,
            leftArm: `M ${profileX} ${shoulderY + 12} 
                      Q ${profileX + 25} ${shoulderY + 25} ${profileX + 40} ${shoulderY + 30}
                      L ${profileX + 38} ${shoulderY + 33}
                      Q ${profileX + 23} ${shoulderY + 28} ${profileX - 2} ${shoulderY + 15}
                      Z`,
            rightArm: `M ${profileX - 4} ${shoulderY + 12} 
                       Q ${profileX - 15} ${shoulderY + 22} ${profileX - 20} ${shoulderY + 40}
                       L ${profileX - 18} ${shoulderY + 42}
                       Q ${profileX - 13} ${shoulderY + 24} ${profileX - 2} ${shoulderY + 14}
                       Z`,
            leftLeg: `M ${profileX - 4} ${hipY} 
                      L ${profileX + 30} ${hipY + 10} 
                      L ${profileX + 30} ${footY}
                      L ${profileX + 26} ${footY}
                      L ${profileX + 26} ${hipY + 12}
                      Z`,
            rightLeg: `M ${profileX - 4} ${hipY} 
                       L ${profileX - 8} ${kneeY} 
                       L ${profileX - 8} ${footY}
                       L ${profileX - 4} ${footY}
                       Z`
        };
    } else { // left
        const profileX = centerX - 10;
        return {
            head: `M ${profileX} ${headY} m -24,0 a 24,26 0 1,0 48,0 a 24,26 0 1,0 -48,0`,
            neck: `M ${profileX + 6} ${neckY} L ${profileX + 4} ${shoulderY} L ${profileX - 8} ${shoulderY} L ${profileX - 6} ${neckY} Z`,
            torso: `M ${profileX + 4} ${shoulderY} 
                    Q ${profileX - 12} ${shoulderY + 30} ${profileX - 8} ${waistY} 
                    L ${profileX + 4} ${hipY} 
                    Z`,
            leftArm: `M ${profileX} ${shoulderY + 12} 
                      Q ${profileX - 25} ${shoulderY + 25} ${profileX - 40} ${shoulderY + 30}
                      L ${profileX - 38} ${shoulderY + 33}
                      Q ${profileX - 23} ${shoulderY + 28} ${profileX + 2} ${shoulderY + 15}
                      Z`,
            rightArm: `M ${profileX + 4} ${shoulderY + 12} 
                       Q ${profileX + 15} ${shoulderY + 22} ${profileX + 20} ${shoulderY + 40}
                       L ${profileX + 18} ${shoulderY + 42}
                       Q ${profileX + 13} ${shoulderY + 24} ${profileX + 2} ${shoulderY + 14}
                       Z`,
            leftLeg: `M ${profileX + 4} ${hipY} 
                      L ${profileX - 30} ${hipY + 10} 
                      L ${profileX - 30} ${footY}
                      L ${profileX - 26} ${footY}
                      L ${profileX - 26} ${hipY + 12}
                      Z`,
            rightLeg: `M ${profileX + 4} ${hipY} 
                       L ${profileX + 8} ${kneeY} 
                       L ${profileX + 8} ${footY}
                       L ${profileX + 4} ${footY}
                       Z`
        };
    }
};

/**
 * Validate hologram configuration
 * Ensures all required properties are present and valid
 */
export const validateHologramConfig = (config: Partial<HologramPosition>): boolean => {
    if (!config) return false;

    const hasRequiredFields =
        typeof config.x === 'string' &&
        typeof config.scale === 'number' &&
        ['front', 'left', 'right'].includes(config.facing || '');

    const hasValidScale = Boolean(config.scale && config.scale > 0 && config.scale <= 2);

    return hasRequiredFields && hasValidScale;
};

/**
 * Get color variations for hologram effects
 */
export const getHologramColors = (baseColor: string) => {
    return {
        primary: baseColor,
        gradient: `${baseColor}60`,
        glow: `${baseColor}40`
    };
};
