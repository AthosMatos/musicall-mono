// musicall design tokens — dark-only, tuned for stage/low-light use.
// Source: design handoff (musicall.dc.html). Mirrors apps/web/src/index.css.

export const colors = {
  bg: "#17140f",
  bgDeep: "#15120d",
  surface: "#1c1810",
  surfaceAlt: "#1f1a13",
  surfaceActive: "#241d15",
  surfaceDrag: "#211a12",

  border: "#221d16",
  borderAlt: "#261f17",
  borderStrong: "#2c261d",
  borderChip: "#322c22",
  borderActive: "#33291d",
  borderDrag: "#38301f",
  borderDashed: "#34302a",

  ink: "#f0ebe1",
  ink2: "#cfc7ba",
  ink3: "#b7b0a5",
  lyric: "#ddd5c8",
  meta: "#9b948a",
  meta2: "#8a8276",
  faint: "#6b655c",
  faint2: "#5b554d",

  accent: "#c25e44",
  accentSoft: "#e08a72",
  onAccent: "#1a120e",
  amber: "#cf9b3f",
  success: "#83b58f",
  draft: "#837a6e",

  wavePlayed: "#c25e44",
  waveWarm: "#5a4a3a",
  waveMuted: "#3a2f24",
} as const;

export const fonts = {
  ui: "BricolageGrotesque_400Regular",
  uiMedium: "BricolageGrotesque_500Medium",
  uiSemiBold: "BricolageGrotesque_600SemiBold",
  uiBold: "BricolageGrotesque_700Bold",
  mono: "JetBrainsMono_400Regular",
  monoMedium: "JetBrainsMono_500Medium",
  monoSemiBold: "JetBrainsMono_600SemiBold",
} as const;

export const coverGradients: Record<string, readonly [string, string]> = {
  warm: ["#2c2419", "#3a2f20"],
  neutral: ["#22201c", "#2b2823"],
  terracotta: ["#3a2a1c", "#28201a"],
  sage: ["#23302a", "#1c2620"],
  demos: ["#262320", "#2e2a25"],
};

export const statusDotColor = {
  finished: colors.accent,
  in_progress: colors.amber,
  draft: colors.draft,
} as const;
