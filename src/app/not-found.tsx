import { redirect } from "next/navigation";

/* ------------------------------------------------------------------ */
/* Root 404 handler — redirects to the default locale's not-found     */
/* ------------------------------------------------------------------ */

export default function RootNotFound() {
  // Redirect to English locale's 404 page as default
  redirect("/en/not-found");
}
