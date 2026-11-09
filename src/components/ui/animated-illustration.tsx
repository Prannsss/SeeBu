"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

type Props = {
  /** Base name of the animation in /public/gifs (e.g. "auth" → auth.webp and auth-poster.webp). */
  name: "auth" | "build" | "info" | "verify";
  alt: string;
  width: number;
  height: number;
  className?: string;
  /** Above-the-fold illustration: load the still with high priority. */
  priority?: boolean;
};

/**
 * The illustrations are 3–5 MB animated WebPs. Loading them up front delayed the first paint by
 * several seconds on phones (and the auth one downloaded even where it's hidden on mobile).
 * This shows a ~30 KB still of the first frame right away, then swaps in the animation after the
 * page has loaded, only if the illustration is actually on screen and the user hasn't asked for
 * reduced motion.
 */
export function AnimatedIllustration({ name, alt, width, height, className, priority }: Props) {
  const ref = useRef<HTMLImageElement>(null);
  const [animated, setAnimated] = useState(false);
  const still = `/gifs/${name}-poster.webp`;
  const animation = `/gifs/${name}.webp`;

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    let cancelled = false;
    let observer: IntersectionObserver | null = null;

    const start = () => {
      if (cancelled) return;
      observer = new IntersectionObserver((entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        observer?.disconnect();
        // Download first, then swap, so the still stays up until the animation is ready.
        const img = new window.Image();
        img.onload = () => !cancelled && setAnimated(true);
        img.src = animation;
      }, { rootMargin: "200px" });
      observer.observe(el);
    };

    if (document.readyState === "complete") start();
    else window.addEventListener("load", start, { once: true });
    return () => {
      cancelled = true;
      observer?.disconnect();
      window.removeEventListener("load", start);
    };
  }, [animation]);

  return (
    <Image
      ref={ref}
      src={animated ? animation : still}
      alt={alt}
      width={width}
      height={height}
      unoptimized
      priority={priority}
      className={className}
    />
  );
}
