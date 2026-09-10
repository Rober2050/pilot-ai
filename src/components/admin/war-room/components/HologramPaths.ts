export const HOLOGRAM_PATHS = {
    // -------------------------------------------------------------------------
    // FRONT VIEW (Center Agent - High Fidelity)
    // -------------------------------------------------------------------------
    front: {
        // Skull & Neck (Organic)
        head: `
            M 100 20
            C 115 20, 125 30, 125 50 
            C 125 65, 115 75, 100 75
            C 85 75, 75 65, 75 50
            C 75 30, 85 20, 100 20 Z
            
            // Neck muscles
            M 85 65 Q 88 80 80 85
            M 115 65 Q 112 80 120 85
        `,
        // Chest & Torso (Muscular Definition)
        torso: `
            // Shoulders to Waist
            M 75 85 
            C 60 85, 55 95, 55 110  // Left Shoulder
            L 55 130
            C 60 145, 70 150, 85 150 // Left Hip
            L 115 150
            C 130 150, 140 145, 145 130 // Right Hip
            L 145 110
            C 145 95, 140 85, 125 85 // Right Shoulder
            Q 100 90 75 85 Z

            // Pectorals / Chest line
            M 80 110 Q 100 120 120 110
            // Abs / Center line
            M 100 115 L 100 145
            // Ribcage suggestion
            M 85 125 Q 95 130 85 135
            M 115 125 Q 105 130 115 135
        `,
        // Arms (Resting on table - Foreshortened muscles)
        arms: `
            // Left Arm
            M 55 110 
            Q 40 125 45 140
            L 60 150
            // Right Arm
            M 145 110
            Q 160 125 155 140
            L 140 150
        `,
        // Legs (Seated - Thighs coming forward)
        legs: `
            // Left Thigh
            M 85 150 
            C 80 170, 75 180, 80 200
            L 115 200
            C 120 180, 125 170, 115 150
            
            // Shin lines (vertical fading)
            M 85 200 L 85 240
            M 115 200 L 115 240
        `
    },

    // -------------------------------------------------------------------------
    // RIGHT PROFILE (Looking Right)
    // -------------------------------------------------------------------------
    right: {
        head: `
            // Profile Head shape
            M 105 25 
            C 125 25, 135 40, 130 60 // Forehead/Nose
            C 130 70, 110 75, 100 70 // Jaw/Chin
            C 90 65, 90 40, 105 25   // Back of head
            
            // Neck
            M 105 70 Q 100 80 100 85
        `,
        torso: `
            // Back curve (Spine)
            M 95 85
            C 85 100, 80 120, 85 145
            
            // Abdomen profile
            M 115 85
            C 125 100, 120 120, 110 145
            
            // Close bottom
            L 85 145
        `,
        arms: `
            // Shoulder / Upper Arm
            M 105 85
            C 120 90, 130 100, 140 110 // Elboy area
            L 160 110 // Lower arm extending to table
        `,
        legs: `
            // Thigh (Horizontal-ish)
            M 90 145 
            C 110 140, 130 140, 150 145 // Knee
            
            // Calf (Vertical)
            L 150 210
            
            // Foot
            L 165 210
        `,
        chair: `
            M 80 160 L 75 60
            M 80 160 L 130 160
        `
    },

    // -------------------------------------------------------------------------
    // LEFT PROFILE (Looking Left)
    // -------------------------------------------------------------------------
    left: {
        head: `
            // Profile Head shape (Mirrored)
            M 95 25 
            C 75 25, 65 40, 70 60 
            C 70 70, 90 75, 100 70
            C 110 65, 110 40, 95 25
            
            // Neck
            M 95 70 Q 100 80 100 85
        `,
        torso: `
            // Back curve (Spine)
            M 105 85
            C 115 100, 120 120, 115 145
            
            // Abdomen profile
            M 85 85
            C 75 100, 80 120, 90 145
            
            // Close bottom
            L 115 145
        `,
        arms: `
            // Shoulder / Upper Arm
            M 95 85
            C 80 90, 70 100, 60 110
            L 40 110 
        `,
        legs: `
            // Thigh
            M 110 145 
            C 90 140, 70 140, 50 145
            
            // Calf
            L 50 210
            
            // Foot
            L 35 210
        `,
        chair: `
            M 120 160 L 125 60
            M 120 160 L 70 160
        `
    }
};
