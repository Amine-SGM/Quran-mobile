// Design system — mirrors the desktop CSS variables
import { StyleSheet } from 'react-native';

export const colors = {
    bgPrimary: '#0C0F1A',
    bgSecondary: '#111827',
    bgSurface: '#1A2035',
    bgSurfaceActive: '#243050',
    borderSubtle: 'rgba(255,255,255,0.06)',
    borderHover: 'rgba(255,255,255,0.15)',
    textPrimary: '#F0F4FF',
    textSecondary: '#A8B4CC',
    textMuted: '#5A6A8A',
    emerald: '#10B981',
    emeraldDim: '#0D9268',
    emeraldGlow: 'rgba(16,185,129,0.12)',
    gold: '#D4AF37',
    goldSoft: 'rgba(212,175,55,0.12)',
    ruby: '#EF4444',
    rubySoft: 'rgba(239,68,68,0.12)',
    white: '#FFFFFF',
};

export const spacing = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
};

export const radius = {
    sm: 8,
    md: 12,
    lg: 16,
    full: 9999,
};

export const typography = {
    h1: { fontSize: 24, fontWeight: '700' as const, color: colors.textPrimary, letterSpacing: -0.3 },
    h2: { fontSize: 20, fontWeight: '700' as const, color: colors.textPrimary },
    h3: { fontSize: 16, fontWeight: '600' as const, color: colors.textPrimary },
    body: { fontSize: 14, color: colors.textSecondary },
    small: { fontSize: 12, color: colors.textMuted },
    arabic: { fontSize: 20, color: colors.textPrimary },
};

export const commonStyles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: colors.bgPrimary,
    },
    scrollContent: {
        padding: spacing.md,
        paddingBottom: spacing.xxl,
    },
    card: {
        backgroundColor: colors.bgSurface,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
        padding: spacing.md,
        marginBottom: spacing.sm,
    },
    sectionTitle: {
        fontSize: 11,
        fontWeight: '600' as const,
        color: colors.textMuted,
        textTransform: 'uppercase' as const,
        letterSpacing: 1,
        marginBottom: spacing.sm,
        marginTop: spacing.md,
    },
    btnPrimary: {
        backgroundColor: colors.emerald,
        borderRadius: radius.md,
        paddingVertical: 14,
        paddingHorizontal: spacing.lg,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
    },
    btnPrimaryText: {
        color: colors.white,
        fontSize: 15,
        fontWeight: '600' as const,
    },
    btnSecondary: {
        backgroundColor: colors.bgSurface,
        borderRadius: radius.md,
        paddingVertical: 12,
        paddingHorizontal: spacing.md,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
        borderWidth: 1,
        borderColor: colors.borderHover,
    },
    btnSecondaryText: {
        color: colors.textPrimary,
        fontSize: 14,
        fontWeight: '500' as const,
    },
    btnGhost: {
        paddingVertical: 8,
        paddingHorizontal: spacing.sm,
    },
    btnGhostText: {
        color: colors.textSecondary,
        fontSize: 14,
    },
    input: {
        backgroundColor: colors.bgSurface,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
        color: colors.textPrimary,
        fontSize: 14,
        paddingHorizontal: spacing.md,
        paddingVertical: 12,
    },
    chip: {
        paddingVertical: 8,
        paddingHorizontal: spacing.md,
        borderRadius: radius.full,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
        backgroundColor: colors.bgSurface,
        marginRight: spacing.xs,
        marginBottom: spacing.xs,
    },
    chipActive: {
        backgroundColor: colors.emeraldGlow,
        borderColor: colors.emerald,
    },
    chipText: {
        fontSize: 13,
        fontWeight: '500' as const,
        color: colors.textSecondary,
    },
    chipTextActive: {
        color: colors.emerald,
        fontWeight: '600' as const,
    },
    row: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
    },
    spaceBetween: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        justifyContent: 'space-between' as const,
    },
    errorBox: {
        backgroundColor: colors.rubySoft,
        borderRadius: radius.sm,
        padding: spacing.md,
        marginBottom: spacing.md,
    },
    warningBox: {
        backgroundColor: colors.goldSoft,
        borderRadius: radius.sm,
        padding: spacing.md,
        marginBottom: spacing.md,
    },
    center: {
        flex: 1,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
    },
});
