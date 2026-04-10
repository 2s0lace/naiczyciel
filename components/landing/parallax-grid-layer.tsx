"use client";

import type { CSSProperties } from "react";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

const GRID_SIZE = 32;
const PARALLAX_SPEED = 0.2;

const GRID_STYLE = {
  backgroundImage:
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32'%3E%3Crect x='0' y='0' width='2' height='2' fill='white' fill-opacity='0.10'/%3E%3C/svg%3E\"), linear-gradient(rgba(255,255,255,0.09) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.09) 1px, transparent 1px)",
  backgroundSize: "32px 32px, 32px 32px, 32px 32px",
  backgroundRepeat: "repeat, repeat, repeat",
  backgroundPosition: "0 0, 0 0, 0 0",
} as const;

type ParallaxGridLayerProps = {
  className?: string;
  fixed?: boolean;
  style?: CSSProperties;
};

export function ParallaxGridLayer({
  className,
  fixed = true,
  style,
}: ParallaxGridLayerProps) {
  const layerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let rafId = 0;

    const applyParallax = () => {
      rafId = 0;
      const layer = layerRef.current;
      if (!layer) {
        return;
      }

      // Shift the repeating background pattern itself, so the grid never runs out of bounds.
      const rawOffset = window.scrollY * PARALLAX_SPEED;
      const offset = ((rawOffset % GRID_SIZE) + GRID_SIZE) % GRID_SIZE;
      const position = `0 ${offset.toFixed(2)}px`;
      layer.style.backgroundPosition = `${position}, ${position}, ${position}`;
    };

    const onScroll = () => {
      if (rafId) {
        return;
      }
      rafId = window.requestAnimationFrame(applyParallax);
    };

    applyParallax();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      if (rafId) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, []);

  return (
    <div
      aria-hidden
      ref={layerRef}
      className={cn("pointer-events-none inset-0 z-0", fixed ? "fixed" : "absolute", className)}
      style={{ ...GRID_STYLE, ...style }}
    />
  );
}
