import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "../components/theme-provider";

export const metadata: Metadata = {
  title: "Trenova",
  description: "La miglior piattaforma per Personal Trainer",
  icons: {
    icon: "/icons/logo-gemini.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-neutral-50 cf-text dark:bg-neutral-950 dark:text-neutral-50">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
