"use client";

import { useEffect, useState } from "react";

export function useSerialStatus() {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (typeof navigator === "undefined" || !("serial" in navigator)) return;

    const serial = navigator.serial;
    let isActive = true;

    const checkConnection = async () => {
      try {
        const ports = await serial.getPorts();
        if (ports.length > 0) {
          console.log("Impressora configurada e pronta para impressão instantânea!");
        }
        if (isActive) {
          setIsConnected(ports.length > 0);
        }
      } catch (error) {
        console.error("Erro ao verificar impressoras seriais:", error);
        if (isActive) {
          setIsConnected(false);
        }
      }
    };

    void checkConnection();

    const handleConnect = (event: Event) => {
      console.log("Impressora ligada via USB:", event);
      setIsConnected(true);
    };

    const handleDisconnect = (event: Event) => {
      console.log("Impressora desligada:", event);
      void checkConnection();
    };

    serial.addEventListener("connect", handleConnect);
    serial.addEventListener("disconnect", handleDisconnect);

    return () => {
      isActive = false;
      serial.removeEventListener("connect", handleConnect);
      serial.removeEventListener("disconnect", handleDisconnect);
    };
  }, []);

  return { isConnected };
}
