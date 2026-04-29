/**
 * Lyla Spacing System
 * Based on a 4px grid for consistent rhythm.
 */

export const spacing = {
  /** 2px — Hairline separators */
  xxs: 2,
  /** 4px — Tight internal padding */
  xs: 4,
  /** 8px — Compact spacing */
  sm: 8,
  /** 12px — Between related elements */
  md: 12,
  /** 16px — Standard padding */
  lg: 16,
  /** 20px — Section padding */
  xl: 20,
  /** 24px — Major section gaps */
  '2xl': 24,
  /** 32px — Large gaps */
  '3xl': 32,
  /** 40px — Extra large gaps */
  '4xl': 40,
  /** 48px — Touch target minimum (Android) */
  '5xl': 48,
  /** 64px — Major layout spacing */
  '6xl': 64,
} as const;

/** Border radius presets */
export const radius = {
  /** 4px */
  xs: 4,
  /** 8px — Buttons, small cards */
  sm: 8,
  /** 12px — Cards, inputs */
  md: 12,
  /** 16px — Large cards */
  lg: 16,
  /** 24px — Chat bubbles */
  xl: 24,
  /** 32px — Rounded elements */
  '2xl': 32,
  /** 9999px — Full circle / pill shape */
  full: 9999,
} as const;

/** Shadow presets for elevation */
export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
} as const;

export type Spacing = typeof spacing;
export type Radius = typeof radius;
