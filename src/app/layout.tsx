import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: "Гуляй, СПб — утренний дайджест для многодетных",
  description:
    "Свежие новости Петербурга о парках, дворах, площадках и местах, куда можно выйти с детьми.",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ru"
      className={`${nunito.variable} ${sourceSerif.variable} h-full antialiased`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
