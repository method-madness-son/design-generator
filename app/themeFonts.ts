import {
  Alfa_Slab_One,
  Anton,
  Bebas_Neue,
  Caprasimo,
  Caveat,
  Fira_Code,
  Fredoka,
  Graduate,
  IBM_Plex_Mono,
  Lilita_One,
  Monoton,
  Orbitron,
  Oswald,
  Pacifico,
  Permanent_Marker,
  Racing_Sans_One,
  Righteous,
  Russo_One,
  Shrikhand,
  Space_Mono,
  Titan_One,
  Work_Sans,
} from "next/font/google";

const load = { subsets: ["latin"], preload: false } as const;

const shrikhand = Shrikhand({ ...load, weight: "400", variable: "--font-theme-shrikhand" });
const caprasimo = Caprasimo({ ...load, weight: "400", variable: "--font-theme-caprasimo" });
const righteous = Righteous({ ...load, weight: "400", variable: "--font-theme-righteous" });
const lilitaOne = Lilita_One({ ...load, weight: "400", variable: "--font-theme-lilita-one" });
const anton = Anton({ ...load, weight: "400", variable: "--font-theme-anton" });
const bebasNeue = Bebas_Neue({ ...load, weight: "400", variable: "--font-theme-bebas-neue" });
const alfaSlabOne = Alfa_Slab_One({ ...load, weight: "400", variable: "--font-theme-alfa-slab-one" });
const titanOne = Titan_One({ ...load, weight: "400", variable: "--font-theme-titan-one" });
const fredoka = Fredoka({ subsets: ["latin"], preload: false, variable: "--font-theme-fredoka" });
const monoton = Monoton({ ...load, weight: "400", variable: "--font-theme-monoton" });
const oswald = Oswald({ subsets: ["latin"], preload: false, variable: "--font-theme-oswald" });
const workSans = Work_Sans({ subsets: ["latin"], preload: false, variable: "--font-theme-work-sans" });
const caveat = Caveat({ subsets: ["latin"], preload: false, variable: "--font-theme-caveat" });
const permanentMarker = Permanent_Marker({
  ...load,
  weight: "400",
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
const graduate = Graduate({ ...load, weight: "400", variable: "--font-theme-graduate" });
const racingSansOne = Racing_Sans_One({ ...load, weight: "400", variable: "--font-theme-racing-sans-one" });
const russoOne = Russo_One({ ...load, weight: "400", variable: "--font-theme-russo-one" });
const orbitron = Orbitron({ subsets: ["latin"], preload: false, variable: "--font-theme-orbitron" });
const pacifico = Pacifico({ ...load, weight: "400", variable: "--font-theme-pacifico" });

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
]
  .map((font) => font.variable)
  .join(" ");
