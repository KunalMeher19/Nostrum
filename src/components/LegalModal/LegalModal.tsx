"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import "./legal-modal.css";
import { getLenis } from "../SmoothScroll/lenisStore";
import { legalDocs, type LegalDoc, type LegalLocale } from "@/lib/legal-content";

/**
 * LegalModal — Premium legal document viewer
 *
 * A luxury full-screen modal that displays legal documents (Privacy Policy,
 * Cookie Policy, Terms of Sale, Legal Notice) with a premium reading experience.
 * Dark brand design with gold accents, generous spacing, smooth scrolling.
 *
 * Behaviour:
 *  - Opens when triggered via showLegalModal() exported function
 *  - ESC, backdrop click, and the ✕ all close
 *  - Scroll is paused while open (Lenis stop/start)
 *  - Content is organized in sections with smooth scroll-to navigation
 *  - Tables are rendered with premium styling
 *  - Reduced-motion safe
 */

interface LegalModalState {
  isOpen: boolean;
  docType: string;
  locale: LegalLocale;
}

let modalStateListeners: Array<(state: LegalModalState) => void> = [];
let currentModalState: LegalModalState = {
  isOpen: false,
  docType: "legal",
  locale: "en",
};

export function showLegalModal(docType: string, locale: LegalLocale) {
  currentModalState = { isOpen: true, docType, locale };
  modalStateListeners.forEach((listener) => listener(currentModalState));
}

export function hideLegalModal() {
  currentModalState = { ...currentModalState, isOpen: false };
  modalStateListeners.forEach((listener) => listener(currentModalState));
}

export default function LegalModal() {
  const [state, setState] = useState<LegalModalState>(currentModalState);
  const [closing, setClosing] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const lenisWasRunning = useRef(false);

  // Subscribe to modal state changes
  useEffect(() => {
    const listener = (newState: LegalModalState) => setState(newState);
    modalStateListeners.push(listener);
    return () => {
      modalStateListeners = modalStateListeners.filter((l) => l !== listener);
    };
  }, []);

  const doc = legalDocs[state.locale]?.[state.docType] || legalDocs.en?.[state.docType];

  /* ---- Lenis pause/resume ------------------------------------------------ */
  useEffect(() => {
    if (!state.isOpen) return;
    const lenis = getLenis();
    if (!lenis) return;
    lenisWasRunning.current = !lenis.isStopped;
    lenis.stop();
    return () => {
      if (lenisWasRunning.current) lenis.start();
    };
  }, [state.isOpen]);

  /* ---- ESC to close ------------------------------------------------------ */
  useEffect(() => {
    if (!state.isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [state.isOpen]);

  /* ---- Close logic ------------------------------------------------------- */
  const handleClose = useCallback(() => {
    setClosing(true);
    setTimeout(() => {
      hideLegalModal();
      setClosing(false);
      if (contentRef.current) contentRef.current.scrollTop = 0;
    }, 300);
  }, []);

  const onBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) handleClose();
    },
    [handleClose]
  );

  /* ---- Scroll to section ------------------------------------------------- */
  const scrollToSection = useCallback((index: number) => {
    if (!contentRef.current) return;
    const section = contentRef.current.querySelector(
      `[data-section-index="${index}"]`
    );
    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  if (!state.isOpen || !doc) return null;

  return (
    <div
      className={`legal-modal ${closing ? "is--closing" : ""}`}
      onClick={onBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="legal-modal-title"
    >
      <div className="legal-modal__panel" ref={panelRef}>
        {/* Header */}
        <div className="legal-modal__header">
          <h1 id="legal-modal-title" className="legal-modal__title">
            {doc.title}
          </h1>
          <button
            className="legal-modal__close"
            onClick={handleClose}
            aria-label="Close"
            type="button"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M18 6L6 18M6 6l12 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {/* Navigation (Table of Contents) */}
        {doc.sections.length > 3 && (
          <nav className="legal-modal__nav">
            <div className="legal-modal__nav-label">Contents</div>
            <div className="legal-modal__nav-items">
              {doc.sections.map((section, i) => (
                section.heading && (
                  <button
                    key={i}
                    className="legal-modal__nav-item"
                    onClick={() => scrollToSection(i)}
                    type="button"
                  >
                    {section.heading}
                  </button>
                )
              ))}
            </div>
          </nav>
        )}

        {/* Content */}
        <div
          className="legal-modal__content"
          ref={contentRef}
          data-lenis-prevent
        >
          {doc.sections.map((section, sectionIdx) => (
            <section
              key={sectionIdx}
              className="legal-modal__section"
              data-section-index={sectionIdx}
            >
              {section.heading && (
                <h2 className="legal-modal__section-title">{section.heading}</h2>
              )}

              {section.body.map((para, paraIdx) => (
                <p key={paraIdx} className="legal-modal__paragraph">
                  {para}
                </p>
              ))}

              {section.table && (
                <div className="legal-modal__table-wrapper">
                  <table className="legal-modal__table">
                    <thead>
                      <tr>
                        {section.table.headers.map((header, i) => (
                          <th key={i}>{header}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {section.table.rows.map((row, i) => (
                        <tr key={i}>
                          {row.map((cell, j) => (
                            <td key={j}>{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
