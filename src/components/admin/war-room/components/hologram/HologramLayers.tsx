/**
 * HologramLayers Component
 * Manages z-index layering for hologram body parts
 * Ensures legs render behind table and upper body renders in front
 */

import React from 'react';

interface HologramLayersProps {
    children: React.ReactNode;
    tableZIndex?: number;
    className?: string;
}

export const HologramLayers: React.FC<HologramLayersProps> = ({
    children,
    tableZIndex = 15,
    className = ''
}) => {
    return (
        <div className={`hologram-layers-container ${className}`}>
            {/* Lower layer - Legs (behind table) */}
            <div
                className="hologram-layer-lower absolute inset-0"
                style={{ zIndex: tableZIndex - 5 }}
            >
                {children}
            </div>

            {/* Upper layer - Body (in front of table) */}
            <div
                className="hologram-layer-upper absolute inset-0"
                style={{ zIndex: tableZIndex + 5 }}
            >
                {children}
            </div>
        </div>
    );
};

/**
 * Separate component for rendering only legs
 * Used in lower z-index layer
 */
export const LegsLayer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <svg
            viewBox="0 0 200 400"
            className="w-full h-full legs-only"
            style={{ overflow: 'visible' }}
        >
            {/* Only render elements with class 'legs-group' */}
            {children}
        </svg>
    );
};

/**
 * Separate component for rendering upper body
 * Used in upper z-index layer
 */
export const UpperBodyLayer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <svg
            viewBox="0 0 200 400"
            className="w-full h-full upper-body-only"
            style={{ overflow: 'visible' }}
        >
            {/* Render all except 'legs-group' */}
            {children}
        </svg>
    );
};
