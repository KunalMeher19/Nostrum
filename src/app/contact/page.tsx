import type { Metadata } from "next";
import ContactSection from "@/components/ContactSection/ContactSection";
import "./contact.css";

export const metadata: Metadata = {
  title: "Contact — Nostrum",
  description:
    "Write to Nostrum. For orders, professional enquiries or anything else — we answer personally.",
};

/**
 * Contact — dark brand page (NOSTRUM-DESIGN §7 "Contact · dark").
 * Split layout: a cinematic panel on the left (headline + direct contact
 * details + WhatsApp, the §12 contextual CTA), the form on the right.
 * Contact details are placeholders — the client hasn't provided real
 * email/phone/address/WhatsApp yet (§20.6); they match SiteFooter's.
 */
export default function ContactPage() {
  return (
    <main data-main className="contact-page">
      <ContactSection />
    </main>
  );
}
