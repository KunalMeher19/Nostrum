import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Products — Nostrum",
  description:
    "The Nostrum collection. Extra virgin olive oil, bottled with intent.",
};

export default function ProductsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
