"use client";

import { useLayoutEffect, useRef } from "react";

export function useScrollRestoration(storageKey: string, deps: unknown[] = []) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const container = containerRef.current;
    if (!container) {
      return;
    }

    const savedScrollTop = window.sessionStorage.getItem(storageKey);
    if (savedScrollTop !== null) {
      container.scrollTop = Number(savedScrollTop) || 0;
    }

    let frameRequest: number | null = null;

    const handleScroll = () => {
      if (frameRequest) {
        window.cancelAnimationFrame(frameRequest);
      }

      frameRequest = window.requestAnimationFrame(() => {
        window.sessionStorage.setItem(storageKey, String(container.scrollTop));
        frameRequest = null;
      });
    };

    container.addEventListener("scroll", handleScroll);

    return () => {
      if (frameRequest) {
        window.cancelAnimationFrame(frameRequest);
        frameRequest = null;
      }

      window.sessionStorage.setItem(storageKey, String(container.scrollTop));
      container.removeEventListener("scroll", handleScroll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey, ...deps]);

  return containerRef;
}


