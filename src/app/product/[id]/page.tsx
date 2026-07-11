"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import "./product.css";

/**
 * Product page — LIGHT/white (§7). Minimal on-brand placeholder for now: the
 * full detail layout (big image(s) · name·€price · size · quantity · add-to-cart
 * · tight description) is built later. It pins the shop inversion variable
 * (--page-t: 1) so the global nav is black ink over this white route, matching
 * the fully-inverted Shop.
 */
export default function ProductPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--page-t", "1");
    root.style.setProperty("--nav-col", "rgb(20, 22, 15)"); // ink nav on white
    return () => {
      root.style.setProperty("--page-t", "0");
      root.style.setProperty("--nav-col", "rgb(245, 245, 243)");
    };
  }, []);

  return (
    <main data-main className="product">
      <div className="product__inner">
        <p className="product__eyebrow">Product</p>
        <h1 className="product__title">{id || "—"}</h1>
        <p className="product__note">
          This product page is being prepared. Big imagery, size &amp; quantity
          selection and add-to-cart land here soon.
        </p>
        <Link href="/#products" className="product__back">
          ← Back to the collection
        </Link>
      </div>
    </main>
  );
}
