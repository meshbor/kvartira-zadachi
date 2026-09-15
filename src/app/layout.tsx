import type { Metadata, Viewport } from "next";
import { Nunito, Source_Serif_4 } from "next/font/google";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["cyrillic", "latin"],
});

const sourceSerif = Source_Serif_4({
  variable: "--font-source",
  subsets: ["cyrillic", "latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#f4efe4",
};

export const metadata: Metadata = {
  title: "digest — семья, прогулки, нацпроекты",
  description:
    "Новости для многодетных и прогулок по Петербургу и Ленобласти, плюс список национальных проектов 2025–2030.",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ru"
      className={`${nunito.variable} ${sourceSerif.variable} h-full antialiased`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
