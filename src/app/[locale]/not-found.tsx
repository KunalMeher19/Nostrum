import NotFoundSection from "@/components/NotFound/NotFoundSection";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "404 · Page Not Found · Nostrum",
  description: "The page you're looking for doesn't exist or has been moved.",
};

export default function NotFound() {
  return <NotFoundSection />;
}
