/**
 * Lyla Typography System
 * Uses system fonts (SF Pro on iOS, Roboto on Android) for native feel.
 * Inter can be loaded later for a custom look.
 */
import { Platform, TextStyle } from 'react-native';

const fontFamily = Platform.select({
  ios: 'System',
  android: 'Roboto',
  default: 'System',
});

const fontFamilyMono = Platform.select({
  ios: 'Menlo',
  android: 'monospace',
  default: 'monospace',
});

/**
 * Type scale based on a 1.25 ratio, starting from 14px body.
 * Each size has a name for semantic usage.
 */
export const typography = {
  // ── Display / Headlines ─────────────────────────────────────────
  displayLarge: {
    fontFamily,
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '700',
    letterSpacing: -0.5,
  } as TextStyle,

  displayMedium: {
    fontFamily,
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '700',
    letterSpacing: -0.3,
  } as TextStyle,

  // ── Headings ────────────────────────────────────────────────────
  headingLarge: {
    fontFamily,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '600',
    letterSpacing: 0,
  } as TextStyle,

  headingMedium: {
    fontFamily,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600',
    letterSpacing: 0,
  } as TextStyle,

  headingSmall: {
    fontFamily,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
    letterSpacing: 0,
  } as TextStyle,

  // ── Body ────────────────────────────────────────────────────────
  bodyLarge: {
    fontFamily,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
    letterSpacing: 0.15,
  } as TextStyle,

  bodyMedium: {
    fontFamily,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
    letterSpacing: 0.1,
  } as TextStyle,

  bodySmall: {
    fontFamily,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
    letterSpacing: 0.2,
  } as TextStyle,

  // ── Labels & Captions ───────────────────────────────────────────
  label: {
    fontFamily,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
    letterSpacing: 0.3,
  } as TextStyle,

  caption: {
    fontFamily,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '400',
    letterSpacing: 0.3,
  } as TextStyle,

  // ── Monospace (for code or debug) ───────────────────────────────
  mono: {
    fontFamily: fontFamilyMono,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
    letterSpacing: 0,
  } as TextStyle,
} as const;

export type Typography = typeof typography;
