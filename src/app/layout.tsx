import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Nunito, Source_Serif_4, Unbounded } from "next/font/google";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["cyrillic", "latin"],
});

const sourceSerif = Source_Serif_4({
  variable: "--font-source",
  subsets: ["cyrillic", "latin"],
});

const unbounded = Unbounded({
  variable: "--font-display",
  subsets: ["cyrillic", "latin"],
  weight: ["700", "800"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-ticket",
  subsets: ["cyrillic", "latin"],
  weight: ["700"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#0c2f1e",
};

export const metadata: Metadata = {
  title: "Приём к Алексею Пуликову",
  description:
    "Электронный терминал записи на приём к Алексею Пуликову. Талоны как в Сбере, очередь обнуляется каждый день.",
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
      className={`${nunito.variable} ${sourceSerif.variable} ${unbounded.variable} ${jetbrains.variable} h-full antialiased`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
