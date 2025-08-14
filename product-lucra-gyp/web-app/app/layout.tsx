import type { Metadata } from "next";
import { Geist, Geist_Mono, Pacifico } from "next/font/google";
import "./globals.css";
import { LucraJourneyProvider } from "@/contexts/LucraJourneyContext";
import { RedirectProvider } from "@/contexts/RedirectContext";

const pacifico = Pacifico({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-pacifico",
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RNG",
  description: "We love RNG",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${pacifico.variable} antialiased`}
      >
        <RedirectProvider>
          <LucraJourneyProvider>{children}</LucraJourneyProvider>
        </RedirectProvider>
        {/* Lucra iframe container - SDK will inject iframe here */}
        <div
          id="lucra-iframe-container"
          className="fixed inset-0 z-[9999] bg-white opacity-0 pointer-events-none"
        >
          {/* Your SDK will inject the iframe here */}
        </div>
      </body>
    </html>
  );
}
