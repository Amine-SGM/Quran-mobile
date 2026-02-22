// Core Design Tokens for Quran Shorts App
// Aesthetic: Refined Luxury / Ethereal Dark Mode
// Designed with ui-ux-pro-max and frontend-design principles.

export const colors = {
    // Backgrounds: Deep, immersive midnight tones
    bgBase: '#030712', // slate-950
    bgSurface: '#0F172A', // slate-900
    bgSurfaceElevated: '#1E293B', // slate-800
    
    // Glassmorphism surfaces
    glassBase: 'rgba(15, 23, 42, 0.6)',
    glassElevated: 'rgba(30, 41, 59, 0.65)',
    
    // Borders: Subtle definition
    borderSubtle: 'rgba(248, 250, 252, 0.08)',
    borderFocus: 'rgba(16, 185, 129, 0.4)',
    borderHighlight: 'rgba(255, 255, 255, 0.15)',

    // Typography: High contrast for readability
    textPrimary: '#F8FAFC', // slate-50
    textSecondary: '#94A3B8', // slate-400
    textMuted: '#64748B', // slate-500

    // Accents: Elegant Gold & Emerald
    accentEmerald: '#10B981',
    accentEmeraldDim: '#059669',
    accentEmeraldGlow: 'rgba(16, 185, 129, 0.15)',
    
    accentGold: '#D4AF37', // Classic gold
    accentGoldGlow: 'rgba(212, 175, 55, 0.15)',

    // Semantic / Feedback
    error: '#EF4444',
    errorGlow: 'rgba(239, 68, 68, 0.15)',
    success: '#10B981',
    
    // Utilities
    transparent: 'transparent',
    white: '#FFFFFF',
    black: '#000000',
};

// 4px Baseline Grid
export const spacing = {
    '2xs': 4,
    xs: 8,
    sm: 12,
    md: 16,
    lg: 24,
    xl: 32,
    '2xl': 48,
    '3xl': 64,
};

export const radius = {
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    full: 9999,
};

export const typography = {
    // English/System Typography
    h1: { fontSize: 32, fontWeight: '700' as const, letterSpacing: -0.5 },
    h2: { fontSize: 24, fontWeight: '700' as const, letterSpacing: -0.3 },
    h3: { fontSize: 20, fontWeight: '600' as const, letterSpacing: -0.2 },
    bodyLg: { fontSize: 18, fontWeight: '400' as const, letterSpacing: 0 },
    body: { fontSize: 16, fontWeight: '400' as const, letterSpacing: 0.1 }, // Min 16px for readability
    small: { fontSize: 13, fontWeight: '500' as const, letterSpacing: 0.2 },
    
    // Arabic Typography - Needs distinct scaling
    arabicH1: { fontSize: 40, fontWeight: '700' as const, lineHeight: 56 },
    arabicH2: { fontSize: 32, fontWeight: '600' as const, lineHeight: 48 },
    arabicBody: { fontSize: 24, fontWeight: '400' as const, lineHeight: 40 },
};

// Touch target helpers (44x44 minimum per ui-ux-pro-max)
export const accessibility = {
    minTouchTarget: {
        minWidth: 44,
        minHeight: 44,
    }
};
