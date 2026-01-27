// AURA Mobile - Enhanced Theme System
// Based on AURA_MOBILE_DESIGN_SYSTEM.md

export const Theme = {
    // Core Colors (matching Web Dashboard)
    colors: {
        // Foundation
        background: '#000000',      // Pure black
        surface: '#111111',         // Slightly lighter for cards

        // Semantic Accent Colors
        cyan: '#00F0FF',           // AI, Family
        gold: '#FFD600',           // Finance
        green: '#00FF94',          // Health
        purple: '#7000FF',         // Focus, Tasks
        red: '#FF0055',            // Alerts, Stress

        // Neutral Colors
        white: '#FFFFFF',
        gray: {
            100: 'rgba(255, 255, 255, 0.1)',
            200: 'rgba(255, 255, 255, 0.2)',
            300: 'rgba(255, 255, 255, 0.3)',
            400: 'rgba(255, 255, 255, 0.4)',
            500: 'rgba(255, 255, 255, 0.5)',
            600: 'rgba(255, 255, 255, 0.6)',
            700: 'rgba(255, 255, 255, 0.7)',
            800: 'rgba(255, 255, 255, 0.8)',
            900: 'rgba(255, 255, 255, 0.9)',
        },

        // Module Colors (for module cards)
        modules: {
            finance: '#FFD600',
            health: '#00FF94',
            focus: '#7000FF',
            tasks: '#7000FF',
            food: '#FF6B35',
            interests: '#00F0FF',
            family: '#00F0FF',
            mind: '#FF0055',
        },
    },

    // Typography
    typography: {
        fonts: {
            heading: 'SpaceGrotesk-Bold',  // Used for module titles
            body: 'Inter-Regular',          // Used for descriptions
            mono: 'SpaceMono-Regular',      // Used for numbers (finance, health)
        },
        sizes: {
            xs: 12,
            sm: 14,
            base: 16,
            lg: 18,
            xl: 20,
            '2xl': 24,
            '3xl': 30,
            '4xl': 36,
            '5xl': 48,
        },
        weights: {
            normal: '400',
            medium: '500',
            semibold: '600',
            bold: '700',
        },
    },

    // Spacing (8pt grid system)
    spacing: {
        xs: 4,
        sm: 8,
        md: 16,
        lg: 24,
        xl: 32,
        '2xl': 40,
        '3xl': 48,
        '4xl': 64,
    },

    // Border Radius
    radius: {
        sm: 8,
        md: 12,
        lg: 16,
        xl: 20,
        '2xl': 24,
        full: 9999,
    },

    // Glassmorphism Settings
    glass: {
        // For cards
        card: {
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            // Note: backdrop-filter not supported in React Native
            // We'll simulate with overlays
        },

        // For buttons
        button: {
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            borderColor: 'rgba(255, 255, 255, 0.15)',
            borderWidth: 1,
        },

        // For inputs
        input: {
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
        },
    },

    // Shadows (Platform-specific)
    shadows: {
        sm: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
            elevation: 2,
        },
        md: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.30,
            shadowRadius: 4.65,
            elevation: 4,
        },
        lg: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.37,
            shadowRadius: 7.49,
            elevation: 8,
        },
        xl: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.44,
            shadowRadius: 10.32,
            elevation: 12,
        },
    },

    // Colored Glows (for module cards)
    glows: {
        cyan: {
            shadowColor: '#00F0FF',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.5,
            shadowRadius: 15,
            elevation: 8,
        },
        gold: {
            shadowColor: '#FFD600',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.5,
            shadowRadius: 15,
            elevation: 8,
        },
        green: {
            shadowColor: '#00FF94',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.5,
            shadowRadius: 15,
            elevation: 8,
        },
        purple: {
            shadowColor: '#7000FF',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.5,
            shadowRadius: 15,
            elevation: 8,
        },
        red: {
            shadowColor: '#FF0055',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.5,
            shadowRadius: 15,
            elevation: 8,
        },
    },

    // Animation Durations
    animation: {
        fast: 150,
        normal: 300,
        slow: 500,
    },

    // Layout
    layout: {
        maxWidth: 1200,  // For tablet landscape
        padding: 16,     // Screen padding
        cardGap: 16,     // Gap between cards
    },
};

// Helper function to get module color
export const getModuleColor = (moduleName) => {
    return Theme.colors.modules[moduleName?.toLowerCase()] || Theme.colors.cyan;
};

// Helper function to get module glow
export const getModuleGlow = (moduleName) => {
    const colorMap = {
        finance: 'gold',
        health: 'green',
        focus: 'purple',
        tasks: 'purple',
        food: 'gold', // Using gold as fallback
        interests: 'cyan',
        family: 'cyan',
        mind: 'red',
    };
    const glowKey = colorMap[moduleName?.toLowerCase()] || 'cyan';
    return Theme.glows[glowKey];
};
