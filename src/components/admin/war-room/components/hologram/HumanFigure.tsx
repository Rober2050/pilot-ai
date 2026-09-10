/**
 * HumanFigure Component
 * Renders realistic human hologram with proper proportions and seated posture
 * Supports front, left, and right orientations
 */

import React, { useMemo } from 'react';
import { HumanFigureProps } from '../utils/hologramTypes';
import { calculateBodyProportions, generateSeatedPaths } from '../utils/hologramUtils';

export const HumanFigure: React.FC<HumanFigureProps> = ({
    facing,
    isSeated,
    scale,
    color,
    isActive,
    onError
}) => {
    // Calculate body proportions
    const proportions = useMemo(() => calculateBodyProportions(400), []);

    // Generate SVG paths for current facing direction
    const paths = useMemo(() => {
        try {
            return generateSeatedPaths(facing, proportions, 200);
        } catch (error) {
            onError?.(error as Error);
            // Return fallback simple paths
            return {
                head: 'M 100 45 m -28,0 a 28,32 0 1,0 56,0 a 28,32 0 1,0 -56,0',
                neck: 'M 90 75 L 88 90 L 112 90 L 110 75 Z',
                torso: 'M 75 90 Q 70 110 72 140 L 85 175 L 115 175 L 128 140 Q 130 110 125 90 Z',
                leftArm: 'M 75 100 Q 50 115 45 135',
                rightArm: 'M 125 100 Q 150 115 155 135',
                leftLeg: 'M 85 175 L 82 200 L 82 220',
                rightLeg: 'M 115 175 L 118 200 L 118 220'
            };
        }
    }, [facing, proportions, onError]);

    return (
        <g className="human-figure" transform={`scale(${scale})`}>
            {/* Head */}
            <path
                d={paths.head}
                fill={`url(#grad-human-${facing})`}
                stroke={color}
                strokeWidth="2"
                strokeOpacity="0.9"
            />

            {/* Neck */}
            <path
                d={paths.neck}
                fill={`url(#grad-human-${facing})`}
                stroke={color}
                strokeWidth="1.5"
                strokeOpacity="0.8"
            />

            {/* Torso */}
            <path
                d={paths.torso}
                fill={`url(#grad-human-${facing})`}
                stroke={color}
                strokeWidth="2"
                strokeOpacity="0.9"
            />

            {/* Shoulder detail line */}
            {facing === 'front' && (
                <line
                    x1="75"
                    y1="95"
                    x2="125"
                    y2="95"
                    stroke={color}
                    strokeWidth="1"
                    strokeOpacity="0.5"
                />
            )}

            {/* Arms */}
            <path
                d={paths.leftArm}
                fill="none"
                stroke={color}
                strokeWidth="2.5"
                strokeOpacity="0.85"
                strokeLinecap="round"
            />
            <path
                d={paths.rightArm}
                fill="none"
                stroke={color}
                strokeWidth="2.5"
                strokeOpacity="0.85"
                strokeLinecap="round"
            />

            {/* Legs - These will be rendered in lower layer */}
            <g className="legs-group">
                <path
                    d={paths.leftLeg}
                    fill="none"
                    stroke={color}
                    strokeWidth="3"
                    strokeOpacity="0.9"
                    strokeLinecap="round"
                />
                <path
                    d={paths.rightLeg}
                    fill="none"
                    stroke={color}
                    strokeWidth="3"
                    strokeOpacity="0.9"
                    strokeLinecap="round"
                />
            </g>

            {/* Gradient definition */}
            <defs>
                <linearGradient id={`grad-human-${facing}`} x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor={color} stopOpacity="0.6" />
                    <stop offset="100%" stopColor={color} stopOpacity="0.2" />
                </linearGradient>
            </defs>
        </g>
    );
};
