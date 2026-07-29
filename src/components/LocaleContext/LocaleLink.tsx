"use client";

import Link from "next/link";
import { useLocale } from "./LocaleContext";
import type { ComponentProps } from "react";

type Props = Omit<ComponentProps<typeof Link>, "href"> & { href: string };

export function LocaleLink({ href, ...props }: Props) {
  const { locale } = useLocale();
  const localizedHref = href.startsWith("/") ? `/${locale}${href}` : href;
  return <Link href={localizedHref} {...props} />;
}
