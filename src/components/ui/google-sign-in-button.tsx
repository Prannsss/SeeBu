"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import { Button } from "@/components/ui/button";

// Google's rendered button (size="large") is 40px tall and only accepts a pixel width of
// 200-400px. Rendered at "100%" it fell back to a ~184px button, so only the left part of our
// visible button (the logo) opened the sign-in popup.
const GSI_HEIGHT = 40;
const GSI_MIN = 200;
const GSI_MAX = 400;

/**
 * "Continue with Google" in SeeBu's own style. Google's official button sits invisibly on top
 * (it must receive the click to return an ID token) and is scaled to cover the whole button.
 */
export function GoogleSignInButton({
  onSuccess,
  onError,
}: {
  onSuccess: (response: CredentialResponse) => void;
  onError: () => void;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<{ w: number; h: number } | null>(null);

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const measure = () => {
      const { width, height } = el.getBoundingClientRect();
      const w = Math.round(width);
      const h = Math.round(height);
      setBox((prev) => (prev && prev.w === w && prev.h === h ? prev : { w, h }));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const gsiWidth = box ? Math.min(GSI_MAX, Math.max(GSI_MIN, box.w)) : 0;

  return (
    <div
      ref={boxRef}
      className="relative w-full h-12 rounded-md focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2"
    >
      <Button
        type="button"
        variant="outline"
        tabIndex={-1}
        aria-hidden="true"
        className="w-full h-12 flex items-center justify-center gap-3 font-semibold text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 pointer-events-none"
      >
        <Image src="/assets/google.svg" alt="" width={20} height={20} />
        Continue with Google
      </Button>
      {box && box.w > 0 && (
        <div className="absolute inset-0 overflow-hidden opacity-0">
          <div
            style={{
              width: gsiWidth,
              height: GSI_HEIGHT,
              transform: `scale(${box.w / gsiWidth}, ${box.h / GSI_HEIGHT})`,
              transformOrigin: "top left",
            }}
          >
            <GoogleLogin
              // Re-render Google's button when the available width changes.
              key={gsiWidth}
              onSuccess={onSuccess}
              onError={onError}
              width={gsiWidth}
              size="large"
              text="continue_with"
            />
          </div>
        </div>
      )}
    </div>
  );
}
