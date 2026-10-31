import type { Metadata } from "next";
import { posterFontVariables } from "./fonts";
import { themeFontVariables } from "./themeFonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Poster Generator",
  description: "Preview and export print-on-demand posters at 300 DPI.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${posterFontVariables} ${themeFontVariables} h-full antialiased`}>
      <body className="min-h-full bg-neutral-50 text-neutral-900">{children}</body>
    </html>
  );
}
