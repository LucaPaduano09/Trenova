import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "../components/theme-provider";

export const metadata: Metadata = {
  title: "Trenova",
  description: "La miglior piattaforma per Personal Trainer",
  icons: {
    icon: "/landing/logo-final2.png",
    shortcut: "/landing/logo-final2.png",
    apple: "/landing/logo-final2.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-[var(--background)] cf-text">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
