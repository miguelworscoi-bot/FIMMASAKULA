"use client";

import React, { useEffect, useState } from "react";
import { Download } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PWAInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(display-mode: standalone)");
    setIsStandalone(mediaQuery.matches);

    const handleBeforeInstall = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsStandalone(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
      setIsStandalone(true);
    }
  };

  if (isStandalone || !deferredPrompt) return null;

  return (
    <button
      type="button"
      onClick={() => void handleInstallClick()}
      aria-label="Instalar aplicação PDV"
      className="flex items-center gap-2 rounded-2xl border border-[#E1FB15]/40 bg-[#E1FB15]/10 px-3.5 py-1.5 text-xs font-extrabold text-[#E1FB15] transition hover:bg-[#E1FB15] hover:text-black active:scale-95"
    >
      <Download className="h-4 w-4" />
      <span>Instalar App PDV</span>
    </button>
  );
}
