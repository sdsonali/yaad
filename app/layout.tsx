import type { Metadata, Viewport } from "next";
import { Figtree, Fraunces, Noto_Sans_Devanagari } from "next/font/google";
import "./globals.css";

const sans = Figtree({ subsets: ["latin"], variable: "--font-sans", weight: ["400", "500", "600", "700"] });
const display = Fraunces({ subsets: ["latin"], variable: "--font-display" });
const devanagari = Noto_Sans_Devanagari({ subsets: ["devanagari"], variable: "--font-deva", weight: ["500", "600", "700"] });

export const metadata: Metadata = {
  title: "Yaad",
  description: "Search a sample photo library by chatting, in Hindi, Hinglish or English.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f6f1e7",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${sans.variable} ${display.variable} ${devanagari.variable} font-sans antialiased`}>{children}</body>
    </html>
  );
}
