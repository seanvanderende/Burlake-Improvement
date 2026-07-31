/**
 * Semantic design tokens — derived from burlake-web/src/index.css so both
 * artifacts share the same visual identity.
 *
 * Light-mode HSL values converted to hex:
 *   background  hsl(45,33%,96%)   → #f8f6f0
 *   foreground  hsl(140,32%,9%)   → #0f1d14
 *   primary     hsl(37,46%,55%)   → #c29957  (gold)
 *   secondary   hsl(137,30%,16%)  → #1d3a24  (dark forest green)
 *   accent      hsl(138,27%,24%)  → #2d4c35  (medium green)
 *   muted       hsl(45,20%,88%)   → #e4ddd0
 *   border      hsl(45,20%,82%)   → #d9d2c0
 */

const colors = {
  light: {
    // Legacy aliases (used by scaffold hooks)
    text: '#0f1d14',
    tint: '#c29957',

    // Core surfaces
    background: '#f8f6f0',
    foreground: '#0f1d14',

    // Cards / elevated surfaces
    card: '#ffffff',
    cardForeground: '#0f1d14',

    // Primary action — gold (buttons, active states)
    primary: '#c29957',
    primaryForeground: '#0f1d14',

    // Secondary — dark forest green (headers, hero areas)
    secondary: '#1d3a24',
    secondaryForeground: '#f8f6f0',

    // Muted
    muted: '#e4ddd0',
    mutedForeground: '#5c6861',

    // Accent — medium green (dots, chips, highlights)
    accent: '#2d4c35',
    accentForeground: '#f8f6f0',

    // Destructive
    destructive: '#ef4444',
    destructiveForeground: '#ffffff',

    // Borders / inputs
    border: '#d9d2c0',
    input: '#d9d2c0',
  },

  // Border radius (px). Web uses 0rem; we use a small value on mobile
  // for touch-friendliness while keeping the brand feel minimal.
  radius: 6,
};

export default colors;
