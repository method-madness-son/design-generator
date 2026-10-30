import {
  Amaranth,
  Andika,
  Archivo_Black,
  Asap,
  Atkinson_Hyperlegible,
  Big_Shoulders,
  Bitter,
  Castoro,
  Cinzel,
  Crimson_Pro,
  Datatype,
  Doto,
  Fraunces,
  Galada,
  Geist,
  JetBrains_Mono,
  Lexend,
  Montserrat,
  Noto_Sans_Mono,
  Nunito,
  Onest,
  Overpass,
  Petrona,
  Playfair_Display,
  Press_Start_2P,
  Public_Sans,
  Sarina,
  Sora,
  Source_Sans_3,
  Yomogi,
} from "next/font/google";

// Fonts available to posters as CSS variables (see lib/fontOptions.ts), e.g. var(--font-lexend).
// Variable fonts (no `weight` option) carry their full weight range in one file; static fonts
// pass every weight Google publishes for them.
const lexend = Lexend({ subsets: ["latin"], variable: "--font-lexend", preload: false });
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", preload: false });
const nunito = Nunito({ subsets: ["latin"], variable: "--font-nunito", preload: false });
const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-montserrat", preload: false });
const bigShoulders = Big_Shoulders({ subsets: ["latin"], variable: "--font-big-shoulders", preload: false });
const archivoBlack = Archivo_Black({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-archivo-black",
  preload: false,
});
const atkinson = Atkinson_Hyperlegible({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-atkinson",
  preload: false,
});
const andika = Andika({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-andika", preload: false });
const cinzel = Cinzel({ subsets: ["latin"], weight: ["400", "600", "700"], variable: "--font-cinzel", preload: false });
const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  style: ["normal", "italic"],
  variable: "--font-playfair-display",
  preload: false,
});

// Variable, full weight range
const asap = Asap({ subsets: ["latin"], style: ["normal", "italic"], variable: "--font-asap", preload: false });
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-jetbrains-mono",
  preload: false,
});
const sourceSans3 = Source_Sans_3({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-source-sans-3",
  preload: false,
});
const bitter = Bitter({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-bitter",
  preload: false,
});
const sora = Sora({ subsets: ["latin"], variable: "--font-sora", preload: false });
const overpass = Overpass({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-overpass",
  preload: false,
});
const publicSans = Public_Sans({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-public-sans",
  preload: false,
});
const geist = Geist({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-geist",
  preload: false,
});
const onest = Onest({ subsets: ["latin"], variable: "--font-onest", preload: false });
const datatype = Datatype({ subsets: ["latin"], variable: "--font-datatype", preload: false });
const notoSansMono = Noto_Sans_Mono({ subsets: ["latin"], variable: "--font-noto-sans-mono", preload: false });
const crimsonPro = Crimson_Pro({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-crimson-pro",
  preload: false,
});
const petrona = Petrona({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-petrona",
  preload: false,
});
const doto = Doto({ subsets: ["latin"], variable: "--font-doto", preload: false });

// Static, every published weight/style
const pressStart2P = Press_Start_2P({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-press-start-2p",
  preload: false,
});
const amaranth = Amaranth({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--font-amaranth",
  preload: false,
});
const castoro = Castoro({
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  variable: "--font-castoro",
  preload: false,
});
const yomogi = Yomogi({ subsets: ["latin"], weight: ["400"], variable: "--font-yomogi", preload: false });
const galada = Galada({ subsets: ["latin"], weight: ["400"], variable: "--font-galada", preload: false });
const sarina = Sarina({ subsets: ["latin"], weight: ["400"], variable: "--font-sarina", preload: false });

export const posterFontVariables = [
  lexend,
  fraunces,
  nunito,
  atkinson,
  andika,
  cinzel,
  playfairDisplay,
  montserrat,
  bigShoulders,
  archivoBlack,
  asap,
  jetbrainsMono,
  sourceSans3,
  bitter,
  sora,
  overpass,
  publicSans,
  geist,
  pressStart2P,
  onest,
  datatype,
  notoSansMono,
  amaranth,
  crimsonPro,
  castoro,
  petrona,
  yomogi,
  galada,
  sarina,
  doto,
]
  .map((font) => font.variable)
  .join(" ");
