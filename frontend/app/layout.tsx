import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import ThemeProvider from "@/components/ThemeProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "SiftPaper",
  description: "Ask questions across arXiv CS.AI research papers",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'><rect width='40' height='40' rx='8' fill='%230a0a0a'/><circle cx='20' cy='20' r='6' fill='%232563eb'/><circle cx='8' cy='12' r='3.5' fill='%232563eb' opacity='0.6'/><circle cx='32' cy='12' r='3.5' fill='%232563eb' opacity='0.6'/><circle cx='8' cy='28' r='3.5' fill='%232563eb' opacity='0.6'/><circle cx='32' cy='28' r='3.5' fill='%232563eb' opacity='0.6'/><line x1='14' y1='20' x2='8' y2='12' stroke='%232563eb' stroke-width='1.5' opacity='0.5'/><line x1='26' y1='20' x2='32' y2='12' stroke='%232563eb' stroke-width='1.5' opacity='0.5'/><line x1='14' y1='20' x2='8' y2='28' stroke='%232563eb' stroke-width='1.5' opacity='0.5'/><line x1='26' y1='20' x2='32' y2='28' stroke='%232563eb' stroke-width='1.5' opacity='0.5'/></svg>",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${mono.variable}`}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}