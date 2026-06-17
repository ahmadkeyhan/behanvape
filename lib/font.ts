import localFont from "next/font/local";

/*
 * Self-hosted font family (no Google Fonts / CDN).
 * The four weight files under app/fonts/ are currently Vazirmatn stand-ins
 * (SIL OFL) named generically so the real brand font can be dropped in by
 * simply overwriting Regular/Medium/SemiBold/Bold.woff2 — no code change needed.
 * One family for both UI and headings; contrast comes from weight, not a 2nd typeface.
 */
export const sans = localFont({
  src: [
    { path: "../app/fonts/RaviFaNum-Regular.woff2", weight: "400", style: "normal" },
    // { path: "../app/fonts/RaviFaNum-Medium.woff2", weight: "500", style: "normal" },
    { path: "../app/fonts/RaviFaNum-Bold.woff2", weight: "700", style: "normal" },
    { path: "../app/fonts/RaviFaNum-ExtraBlack.woff2", weight: "900", style: "normal" },
  ],
  variable: "--font-sans",
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
  adjustFontFallback: false,
});
