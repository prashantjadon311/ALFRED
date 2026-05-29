"use client";

import Link, { type LinkProps } from "next/link";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { useUiStore } from "@/store/ui-store";

export function AppLink({
  children,
  onClick,
  ...props
}: LinkProps & AnchorHTMLAttributes<HTMLAnchorElement> & { children: ReactNode }) {
  const setPageLoading = useUiStore((state) => state.setPageLoading);

  return (
    <Link
      {...props}
      onClick={(event) => {
        setPageLoading(true);
        onClick?.(event);
      }}
    >
      {children}
    </Link>
  );
}
