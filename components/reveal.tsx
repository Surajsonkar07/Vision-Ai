"use client";

import { useEffect } from "react";

/**
 * Progressive scroll reveal. Content is visible in the server HTML; after hydration we
 * arm only the [data-reveal] blocks that start below the fold and fade them in on scroll.
 */
export function RevealController() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const nodes = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    const below = nodes.filter((n) => n.getBoundingClientRect().top > window.innerHeight * 0.9);
    if (!below.length) return;
    document.documentElement.classList.add("reveal-armed");
    nodes.filter((n) => !below.includes(n)).forEach((n) => n.classList.add("is-in"));
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    below.forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, []);
  return null;
}
