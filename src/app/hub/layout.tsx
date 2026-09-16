import type { Metadata, Viewport } from "next";

export const viewport: Viewport = {
  themeColor: "#f4efe4",
};

export const metadata: Metadata = {
  title: "digest — семья и прогулки",
  description: "Новости для многодетных и прогулок по Петербургу и Ленобласти.",
};

export default function HubLayout({ children }: { children: React.ReactNode }) {
  return children;
}
