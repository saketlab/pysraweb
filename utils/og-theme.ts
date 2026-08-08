export const OG_FG = "#ffffff";
export const OG_MUTED = "#94a3b8";
export const OG_SUBTLE = "#cbd5e1";

export const OG_SEARCH = {
  primary: "#0ea5e9",
  secondary: "#0c4a6e",
  accent: "#7dd3fc",
} as const;

export const ogBackground = (accent: string): string =>
  `linear-gradient(135deg, ${accent} 0%, #0f172a 50%, #1e293b 100%)`;

export const ogGlow = (accent: string): string =>
  `radial-gradient(circle, ${accent} 0%, transparent 70%)`;
