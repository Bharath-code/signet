import type { Metadata } from "next";
import { Space_Grotesk, Hanken_Grotesk } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { PostHogProvider } from "./components/PostHogProvider";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
});

const hanken = Hanken_Grotesk({
  variable: "--font-hanken",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "On-brand email signatures in ten seconds",
  description:
    "Paste your website. We read your logo, colors, and font and build a perfectly branded email signature — instantly.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${hanken.variable}`}>
      <body>
        <PostHogProvider>{children}</PostHogProvider>
        <Analytics />
      </body>
    </html>
  );
}