import {
  Alfa_Slab_One,
  Atkinson_Hyperlegible_Next,
  Anton,
  Barlow_Condensed,
  Bebas_Neue,
  Big_Shoulders_Stencil,
  Caprasimo,
  Caveat,
  DM_Serif_Display,
  Fira_Code,
  Fredoka,
  Graduate,
  IBM_Plex_Mono,
  Jersey_10,
  Kalam,
  Lilita_One,
  Monoton,
  Orbitron,
  Oswald,
  Pacifico,
  Permanent_Marker,
  Pixelify_Sans,
  Racing_Sans_One,
  Righteous,
  Russo_One,
  Shrikhand,
  Silkscreen,
  Space_Mono,
  Titan_One,
  VT323,
  Work_Sans,
} from "next/font/google";

// next/font rejects spread options, so each call is written out.
// Poster faces (JetBrains Mono, Press Start 2P, Playfair Display) stay in app/fonts.ts.

const shrikhand = Shrikhand({ subsets: ["latin"], weight: "400", preload: false, variable: "--font-theme-shrikhand" });
const caprasimo = Caprasimo({ subsets: ["latin"], weight: "400", preload: false, variable: "--font-theme-caprasimo" });
const righteous = Righteous({ subsets: ["latin"], weight: "400", preload: false, variable: "--font-theme-righteous" });
const lilitaOne = Lilita_One({ subsets: ["latin"], weight: "400", preload: false, variable: "--font-theme-lilita-one" });
const anton = Anton({ subsets: ["latin"], weight: "400", preload: false, variable: "--font-theme-anton" });
const bebasNeue = Bebas_Neue({ subsets: ["latin"], weight: "400", preload: false, variable: "--font-theme-bebas-neue" });
const alfaSlabOne = Alfa_Slab_One({
  subsets: ["latin"],
  weight: "400",
  preload: false,
  variable: "--font-theme-alfa-slab-one",
});
const titanOne = Titan_One({ subsets: ["latin"], weight: "400", preload: false, variable: "--font-theme-titan-one" });
const fredoka = Fredoka({ subsets: ["latin"], preload: false, variable: "--font-theme-fredoka" });
const monoton = Monoton({ subsets: ["latin"], weight: "400", preload: false, variable: "--font-theme-monoton" });
const oswald = Oswald({ subsets: ["latin"], preload: false, variable: "--font-theme-oswald" });
const workSans = Work_Sans({ subsets: ["latin"], preload: false, variable: "--font-theme-work-sans" });
const caveat = Caveat({ subsets: ["latin"], preload: false, variable: "--font-theme-caveat" });
const permanentMarker = Permanent_Marker({
  subsets: ["latin"],
  weight: "400",
  preload: false,
  variable: "--font-theme-permanent-marker",
});
const firaCode = Fira_Code({ subsets: ["latin"], preload: false, variable: "--font-theme-fira-code" });
const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  preload: false,
  variable: "--font-theme-space-mono",
});
const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  preload: false,
  variable: "--font-theme-ibm-plex-mono",
});
const graduate = Graduate({ subsets: ["latin"], weight: "400", preload: false, variable: "--font-theme-graduate" });
const racingSansOne = Racing_Sans_One({
  subsets: ["latin"],
  weight: "400",
  preload: false,
  variable: "--font-theme-racing-sans-one",
});
const russoOne = Russo_One({ subsets: ["latin"], weight: "400", preload: false, variable: "--font-theme-russo-one" });
const orbitron = Orbitron({ subsets: ["latin"], preload: false, variable: "--font-theme-orbitron" });
const pacifico = Pacifico({ subsets: ["latin"], weight: "400", preload: false, variable: "--font-theme-pacifico" });
const silkscreen = Silkscreen({
  subsets: ["latin"],
  weight: "400",
  preload: false,
  variable: "--font-theme-silkscreen",
});
const pixelifySans = Pixelify_Sans({ subsets: ["latin"], preload: false, variable: "--font-theme-pixelify-sans" });
const vt323 = VT323({ subsets: ["latin"], weight: "400", preload: false, variable: "--font-theme-vt323" });
const dmSerif = DM_Serif_Display({
  subsets: ["latin"],
  weight: "400",
  preload: false,
  variable: "--font-theme-dm-serif-display",
});
const jersey10 = Jersey_10({
  subsets: ["latin"],
  weight: "400",
  preload: false,
  variable: "--font-theme-jersey-10",
});
const bigShouldersStencil = Big_Shoulders_Stencil({
  subsets: ["latin"],
  weight: "800",
  preload: false,
  variable: "--font-theme-big-shoulders-stencil",
});
const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: "600",
  preload: false,
  variable: "--font-theme-barlow-condensed",
});
const kalam = Kalam({ subsets: ["latin"], weight: "400", preload: false, variable: "--font-theme-kalam" });
const atkinsonNext = Atkinson_Hyperlegible_Next({
  subsets: ["latin"],
  weight: ["400", "700"],
  preload: false,
  variable: "--font-theme-atkinson-next",
});

/** Class string for the root element. Poster faces stay in app/fonts.ts. */
export const themeFontVariables = [
  shrikhand,
  caprasimo,
  righteous,
  lilitaOne,
  anton,
  bebasNeue,
  alfaSlabOne,
  titanOne,
  fredoka,
  monoton,
  oswald,
  workSans,
  caveat,
  permanentMarker,
  firaCode,
  spaceMono,
  ibmPlexMono,
  graduate,
  racingSansOne,
  russoOne,
  orbitron,
  pacifico,
  atkinsonNext,
  silkscreen,
  pixelifySans,
  vt323,
  dmSerif,
  jersey10,
  bigShouldersStencil,
  barlowCondensed,
  kalam,
]
  .map((font) => font.variable)
  .join(" ");
