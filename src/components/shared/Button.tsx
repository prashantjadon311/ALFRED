import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "success";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: "sm" | "md" | "icon";
  icon?: ReactNode;
}

const variantClass: Record<ButtonVariant, string> = {
  primary: "bg-primary text-white shadow-glow hover:bg-primary/90",
  secondary:
    "border border-surface-darkBorder bg-surface-darkElevated/80 text-slate-100 hover:border-primary/45 hover:bg-surface-darkElevated",
  ghost: "text-slate-300 hover:bg-white/7 hover:text-white",
  danger: "bg-danger/15 text-danger hover:bg-danger/20",
  success: "bg-success/15 text-success hover:bg-success/20"
};

const sizeClass = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  icon: "h-9 w-9 p-0"
};

export function Button({ className, variant = "secondary", size = "md", icon, children, type, ...props }: ButtonProps) {
  return (
    <button
      type={type ?? "button"}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-button font-medium transition duration-200 hover:-translate-y-px active:translate-y-0 disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-50",
        variantClass[variant],
        sizeClass[size],
        className
      )}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}
