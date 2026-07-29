import { redirect } from "next/navigation";
import { DEFAULT_LOCALE } from "@/lib/i18n";

// Middleware handles all locale redirects. This is a safety fallback only.
export default function RootPage() {
  redirect(`/${DEFAULT_LOCALE}`);
}
