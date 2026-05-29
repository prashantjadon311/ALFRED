"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Button } from "@/components/shared/Button";
import { Tooltip } from "@/components/shared/Tooltip";
import { cn } from "@/lib/utils";

export function IconButton({
  label,
  children,
  className,
  tooltip = true,
  variant = "ghost",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  children: ReactNode;
  tooltip?: boolean;
  variant?: "primary" | "secondary" | "ghost" | "danger" | "success";
}) {
  const button = (
    <Button size="icon" variant={variant} aria-label={label} title={tooltip ? undefined : label} className={cn("h-8 w-8", className)} {...props}>
      {children}
    </Button>
  );
  return tooltip ? <Tooltip label={label}>{button}</Tooltip> : button;
}
