"use client"

import { useEffect, useState } from "react"
import { gooeyToast } from "goey-toast"

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

/**
 * Footer "Install App" item. Shown only where SeeBu can be installed and isn't already running
 * as the installed app. iOS has no install prompt, so there it explains Share → Add to Home Screen.
 */
export function InstallAppLink({ className }: { className?: string }) {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [isIos, setIsIos] = useState(false)

  useEffect(() => {
    const installed =
      window.matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true
    if (installed) return

    // iPadOS reports itself as a Mac, so also check for touch.
    const ua = navigator.userAgent
    setIsIos(/iphone|ipad|ipod/i.test(ua) || (/macintosh/i.test(ua) && navigator.maxTouchPoints > 1))

    const onPrompt = (e: Event) => {
      e.preventDefault() // keep the browser's mini-infobar away; we prompt from the footer instead
      setInstallEvent(e as BeforeInstallPromptEvent)
    }
    const onInstalled = () => {
      setInstallEvent(null)
      setIsIos(false)
    }
    window.addEventListener("beforeinstallprompt", onPrompt)
    window.addEventListener("appinstalled", onInstalled)
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt)
      window.removeEventListener("appinstalled", onInstalled)
    }
  }, [])

  if (!installEvent && !isIos) return null

  const install = async () => {
    if (!installEvent) {
      gooeyToast.info("Install SeeBu", { description: "Tap the Share button, then “Add to Home Screen”." })
      return
    }
    await installEvent.prompt()
    await installEvent.userChoice
    // A prompt can only be shown once; the browser fires a fresh event if it's installable again.
    setInstallEvent(null)
  }

  return (
    <li>
      <button type="button" onClick={install} className={className}>
        Install App
      </button>
    </li>
  )
}
