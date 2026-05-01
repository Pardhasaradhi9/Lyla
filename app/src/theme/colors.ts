/**
 * Lyla Color Palette
 * Deep dark theme optimized for OLED screens (battery saving)
 * and eye comfort during extended use.
 */

export const colors = {
  // ── Background Layers (darkest → lightest) ──────────────────────
  background: {
    primary: '#0D0B1A',     // Main app background (true dark for OLED)
    secondary: '#141225',   // Cards, elevated surfaces
    tertiary: '#1C1932',    // Input fields, secondary surfaces
    overlay: 'rgba(13, 11, 26, 0.85)', // Modal/sheet overlays
  },

  // ── Brand Accent ────────────────────────────────────────────────
  accent: {
    primary: '#7C3AED',     // Primary purple accent
    primaryLight: '#A78BFA', // Lighter variant for text on dark
    secondary: '#06B6D4',   // Cyan for secondary actions
    secondaryLight: '#67E8F9',
    gradient: ['#7C3AED', '#06B6D4'] as const, // Brand gradient
  },

  // ── Text ────────────────────────────────────────────────────────
  text: {
    primary: '#F1F0F5',     // Primary text (high contrast)
    secondary: '#A09BB5',   // Secondary / muted text
    tertiary: '#6B6580',    // Placeholder, hints
    inverse: '#0D0B1A',     // Text on light backgrounds
    accent: '#A78BFA',      // Accent-colored text
  },

  // ── Chat Bubbles ────────────────────────────────────────────────
  chat: {
    user: '#7C3AED',
    userText: '#FFFFFF',
    assistant: '#1C1932',
    assistantText: '#F1F0F5',
  },

  // ── Status / Semantic ───────────────────────────────────────────
  status: {
    success: '#10B981',     // Online, confirmed
    warning: '#F59E0B',     // Caution, downloading
    error: '#EF4444',       // Error, destructive
    info: '#06B6D4',        // Information
    offline: '#6B6580',     // Offline indicator
  },

  // ── Borders & Dividers ──────────────────────────────────────────
  border: {
    subtle: 'rgba(255, 255, 255, 0.06)',  // Barely visible
    default: 'rgba(255, 255, 255, 0.10)', // Default border
    strong: 'rgba(255, 255, 255, 0.16)',  // Prominent border
  },
} as const;

export type Colors = typeof colors;
