"use client";

type SkeletonVariant = "ledger" | "table" | "product" | "content";

export default function AdminSkeleton({
  variant,
  count = 4,
}: {
  variant: SkeletonVariant;
  count?: number;
}) {
  const rows = Array.from({ length: count }, (_, index) => index);

  if (variant === "table") {
    return (
      <div className="ad__skeleton-table" aria-hidden="true">
        {rows.map((row) => (
          <div className="ad__skeleton-table-row" key={row}>
            <span className="ad__skeleton-line ad__skeleton-line--wide" />
            <span className="ad__skeleton-line" />
            <span className="ad__skeleton-line ad__skeleton-line--short" />
            <span className="ad__skeleton-line ad__skeleton-line--short" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === "product") {
    return (
      <ul className="ad__list ad__skeleton-list" aria-hidden="true">
        {rows.map((row) => (
          <li className="ad__skeleton-product" key={row}>
            <span className="ad__skeleton-thumb" />
            <span className="ad__skeleton-line ad__skeleton-line--wide" />
            <span className="ad__skeleton-line ad__skeleton-line--medium" />
            <span className="ad__skeleton-pill" />
          </li>
        ))}
      </ul>
    );
  }

  if (variant === "content") {
    return (
      <div className="ad__skeleton-content" aria-hidden="true">
        {rows.map((row) => (
          <section className="ad__skeleton-content-step" key={row}>
            <span className="ad__skeleton-line ad__skeleton-line--label" />
            <span className="ad__skeleton-picker">
              <span className="ad__skeleton-thumb" />
              <span className="ad__skeleton-line ad__skeleton-line--medium" />
            </span>
            <span className="ad__skeleton-line ad__skeleton-line--input" />
          </section>
        ))}
      </div>
    );
  }

  return (
    <ul className="ad__list ad__skeleton-list" aria-hidden="true">
      {rows.map((row) => (
        <li className="ad__skeleton-ledger" key={row}>
          <span className="ad__skeleton-line ad__skeleton-line--medium" />
          <span className="ad__skeleton-line ad__skeleton-line--wide" />
          <span className="ad__skeleton-line" />
          <span className="ad__skeleton-line ad__skeleton-line--short" />
          <span className="ad__skeleton-pill" />
        </li>
      ))}
    </ul>
  );
}