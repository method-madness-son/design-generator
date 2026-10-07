import type { Metadata } from "next";
import { posterFontVariables } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Poster Generator",
  description: "Preview and export print-on-demand posters at 300 DPI.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${posterFontVariables} h-full antialiased`}>
      <body className="min-h-full bg-neutral-50 text-neutral-900">
        <main className="mx-auto max-w-5xl px-6 py-10">{children}</main>
      </body>
    </html>
  );
}
