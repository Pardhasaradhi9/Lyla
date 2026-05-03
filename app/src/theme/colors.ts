/**
 * Lyla Color Palette
 * Deep dark theme optimized for OLED screens (battery saving)
 * and eye comfort during extended use.
 */

export const colors = {
  // ── Background Layers (darkest → lightest) ──────────────────────
  background: {
    primary: '#FDFBF7',     // Main app background (soft oatmeal)
    secondary: '#F5F2EB',   // Cards, elevated surfaces
    tertiary: '#EBE6D8',    // Input fields, secondary surfaces
    overlay: 'rgba(42, 40, 37, 0.65)', // Modal/sheet overlays
  },

  // ── Brand Accent ────────────────────────────────────────────────
  accent: {
    primary: '#C76A58',     // Subdued Terracotta
    primaryLight: '#DDA095', // Lighter variant
    secondary: '#748C76',   // Sage Green
    secondaryLight: '#A3B5A4',
    gradient: ['#C76A58', '#748C76'] as const, // Brand gradient
  },

  // ── Text ────────────────────────────────────────────────────────
  text: {
    primary: '#2A2825',     // Primary text (charcoal)
    secondary: '#53504A',   // Secondary / muted text
    tertiary: '#8C877E',    // Placeholder, hints
    inverse: '#FDFBF7',     // Text on dark backgrounds (buttons, user bubble)
    accent: '#C76A58',      // Accent-colored text
  },

  // ── Chat Bubbles ────────────────────────────────────────────────
  chat: {
    user: '#C76A58',
    userText: '#FDFBF7',
    assistant: '#F5F2EB',
    assistantText: '#2A2825',
  },

  // ── Status / Semantic ───────────────────────────────────────────
  status: {
    success: '#748C76',     // Sage Green
    warning: '#D4A373',     // Warm Sand
    error: '#B05E51',       // Deep Terracotta
    info: '#7DA4B5',        // Muted Blue
    offline: '#8C877E',     // Muted Gray-Brown
  },

  // ── Borders & Dividers ──────────────────────────────────────────
  border: {
    subtle: 'rgba(42, 40, 37, 0.05)',  // Barely visible
    default: 'rgba(42, 40, 37, 0.12)', // Default border
    strong: 'rgba(42, 40, 37, 0.20)',  // Prominent border
  },
} as const;

export type Colors = typeof colors;
