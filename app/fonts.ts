import { Andika, Atkinson_Hyperlegible, Fraunces, Lexend, Nunito } from "next/font/google";

// Fonts available to poster "fontPairs" as CSS variables, e.g. var(--font-lexend).
const lexend = Lexend({ subsets: ["latin"], variable: "--font-lexend", preload: false });
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", preload: false });
const nunito = Nunito({ subsets: ["latin"], variable: "--font-nunito", preload: false });
const atkinson = Atkinson_Hyperlegible({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-atkinson",
  preload: false,
});
const andika = Andika({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-andika", preload: false });

export const posterFontVariables = [lexend, fraunces, nunito, atkinson, andika].map((font) => font.variable).join(" ");
