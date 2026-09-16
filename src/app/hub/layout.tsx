import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "digest — семья и прогулки",
  description: "Новости для многодетных и прогулок по Петербургу и Ленобласти.",
};

export default function HubLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
