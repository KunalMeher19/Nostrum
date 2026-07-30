"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { useLocale } from "../LocaleContext/LocaleContext";
import "./account-section.css";

/* ------------------------------------------------------------------ */
/* SignedInCard — the signed-in landing on /account.                    */
/* Holds the door open to the portals (customer portal + admin) which   */
/* are the next build step; for now it greets, shows the role, links    */
/* to the Shop, and offers sign-out.                                    */
/* ------------------------------------------------------------------ */

export default function SignedInCard({
  name,
  email,
  role,
}: {
  name: string | null;
  email: string | null;
  role: "customer" | "admin";
}) {
  const { t, locale } = useLocale();
  const first = (name ?? "").split(" ")[0] || t("account.friend");

  return (
    <section className="ac" aria-labelledby="ac-title">
      <div className="ac__card">
        <div className="ac__glow" aria-hidden="true" />
        <div className="ac__grain" aria-hidden="true" />

        <header className="ac__head">
          <p className="ac__eyebrow">{t("account.eyebrow")}</p>
          <h1 id="ac-title" className="ac__headline">
            {t("account.welcome")} {first}.
          </h1>
          <p className="ac__lede">
            {email}
            {role === "admin" ? ` · ${t("account.role_admin")}` : ""}
          </p>
        </header>

        <div className="ac__signed-links">
          {role === "admin" && (
            <Link className="ac__google" href={`/${locale}/admin`}>
              <span>{t("account.go_admin")}</span>
            </Link>
          )}
          <Link className="ac__google" href={`/${locale}/products`}>
            <span>{t("account.go_shop")}</span>
          </Link>
          <button
            type="button"
            className="ac__forgot"
            onClick={() => void signOut({ callbackUrl: `/${locale}` })}
          >
            {t("account.signout")}
          </button>
        </div>
      </div>
    </section>
  );
}
