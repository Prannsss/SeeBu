"use client"

import Script from "next/script"
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react"

type TurnstileWidgetId = string
type TurnstileApi = {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string
      action: string
      theme?: "auto" | "light" | "dark"
      size?: "normal" | "flexible" | "compact"
      callback: (token: string) => void
      "expired-callback"?: () => void
      "error-callback"?: () => void
    }
  ) => TurnstileWidgetId
  reset: (widgetId: TurnstileWidgetId) => void
  remove: (widgetId: TurnstileWidgetId) => void
}

declare global {
  interface Window {
    turnstile?: TurnstileApi
  }
}

// Site keys are public; the env var wins so another widget can be swapped in per deployment.
export const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "0x4AAAAAAFnoa1A9M88kr-ps"

export type TurnstileHandle = {
  /** Tokens are single-use: call after every submission attempt to get a fresh one. */
  reset: () => void
}

/**
 * Cloudflare Turnstile, rendered explicitly so this surface keeps its own widget ID.
 * `onToken` receives the token, or null whenever it expires, errors, is reset or unmounts.
 */
export const TurnstileWidget = forwardRef<TurnstileHandle, { action: string; onToken: (token: string | null) => void; className?: string }>(
  function TurnstileWidget({ action, onToken, className }, ref) {
    const container = useRef<HTMLDivElement>(null)
    const widgetId = useRef<TurnstileWidgetId | null>(null)
    const onTokenRef = useRef(onToken)
    onTokenRef.current = onToken
    const [scriptReady, setScriptReady] = useState(false)

    useEffect(() => {
      const turnstile = window.turnstile
      if (!scriptReady || !turnstile || !container.current || widgetId.current !== null) return
      widgetId.current = turnstile.render(container.current, {
        sitekey: TURNSTILE_SITE_KEY,
        action,
        // The site is always light; "auto" would follow the OS and turn dark on a light page.
        theme: "light",
        size: "flexible",
        callback: (token) => onTokenRef.current(token),
        "expired-callback": () => onTokenRef.current(null),
        "error-callback": () => onTokenRef.current(null),
      })
      return () => {
        if (widgetId.current !== null) turnstile.remove(widgetId.current)
        widgetId.current = null
        onTokenRef.current(null)
      }
    }, [scriptReady, action])

    useImperativeHandle(ref, () => ({
      reset: () => {
        if (widgetId.current !== null) window.turnstile?.reset(widgetId.current)
        onTokenRef.current(null)
      },
    }), [])

    return (
      <>
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
          strategy="afterInteractive"
          onReady={() => setScriptReady(true)}
        />
        <div ref={container} className={className} />
      </>
    )
  }
)
