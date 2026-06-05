"use client";

import { createPortal } from "react-dom";
import type { CSSProperties, ReactNode } from "react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type PopoverPlacement = "bottom" | "top" | "right";

export function PopoverMenu({
  trigger,
  children,
  align = "left",
  placement = "bottom",
  className,
  triggerClassName,
  panelClassName,
  ariaLabel
}: {
  trigger: (open: boolean) => ReactNode;
  children: ReactNode | ((close: () => void) => ReactNode);
  align?: "left" | "right";
  placement?: PopoverPlacement;
  className?: string;
  triggerClassName?: string;
  panelClassName?: string;
  ariaLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<CSSProperties>({});
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const close = () => setOpen(false);

  const updatePosition = useCallback(() => {
    const triggerNode = triggerRef.current;
    const panelNode = panelRef.current;
    if (!triggerNode || !panelNode) return;

    const triggerRect = triggerNode.getBoundingClientRect();
    const panelWidth = panelNode.offsetWidth || 288;
    const panelHeight = panelNode.offsetHeight || 0;
    const gap = 8;
    const viewportPadding = 12;
    let top = triggerRect.bottom + gap;
    let left = align === "right" ? triggerRect.right - panelWidth : triggerRect.left;

    if (placement === "top") {
      top = triggerRect.top - panelHeight - gap;
      if (top < viewportPadding) top = triggerRect.bottom + gap;
    }

    if (placement === "right") {
      left = triggerRect.right + gap;
      top = align === "right" ? triggerRect.bottom - panelHeight : triggerRect.top;
      if (left + panelWidth > window.innerWidth - viewportPadding) {
        left = triggerRect.left - panelWidth - gap;
      }
    }

    if (placement === "bottom" && top + panelHeight > window.innerHeight - viewportPadding) {
      top = Math.max(viewportPadding, triggerRect.top - panelHeight - gap);
    }

    left = Math.min(Math.max(viewportPadding, left), Math.max(viewportPadding, window.innerWidth - panelWidth - viewportPadding));
    top = Math.min(Math.max(viewportPadding, top), Math.max(viewportPadding, window.innerHeight - panelHeight - viewportPadding));

    setPosition((current) => {
      if (current.top === top && current.left === left) return current;
      return { top, left };
    });
  }, [align, placement]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      close();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("pointerdown", onPointerDown, true);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown, true);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
    const frame = window.requestAnimationFrame(updatePosition);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, updatePosition]);

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        ref={triggerRef}
        type="button"
        aria-label={ariaLabel}
        aria-expanded={open}
        className={cn("block w-full rounded-button text-left", triggerClassName)}
        onClick={() => setOpen((current) => !current)}
      >
        {trigger(open)}
      </button>
      {typeof document !== "undefined"
        ? createPortal(
            open ? (
              <div
                ref={panelRef}
                className={cn(
                  "fixed z-[80] max-h-[420px] w-72 overflow-y-auto rounded-card border border-surface-darkBorder bg-surface-darkElevated/98 p-2 shadow-glow backdrop-blur-xl transition duration-150",
                  panelClassName
                )}
                style={position}
              >
                {typeof children === "function" ? children(close) : children}
              </div>
            ) : null,
            document.body
          )
        : null}
    </div>
  );
}
