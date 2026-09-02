export interface SavedPrinterInfo {
  usbVendorId?: number;
  usbProductId?: number;
}

const PRINTER_STORAGE_KEY = "worscoi_pos_printer_info";

function readSavedPrinterInfo(): SavedPrinterInfo | null {
  try {
    const savedInfoStr = localStorage.getItem(PRINTER_STORAGE_KEY);
    return savedInfoStr ? JSON.parse(savedInfoStr) as SavedPrinterInfo : null;
  } catch {
    localStorage.removeItem(PRINTER_STORAGE_KEY);
    return null;
  }
}

/**
 * Procura uma porta previamente autorizada ou solicita autorização se não existir.
 */
export async function getOrReconnectSerialPort(): Promise<SerialPort> {
  if (typeof navigator === "undefined" || !("serial" in navigator)) {
    throw new Error("A Web Serial API não é suportada neste navegador.");
  }

  const authorizedPorts = await navigator.serial.getPorts();
  const savedInfo = readSavedPrinterInfo();
  let targetPort: SerialPort | undefined;

  if (authorizedPorts.length > 0 && savedInfo) {
    targetPort = authorizedPorts.find((port) => {
      const info = port.getInfo();
      return info.usbVendorId === savedInfo.usbVendorId
        && info.usbProductId === savedInfo.usbProductId;
    });
  }

  if (!targetPort && authorizedPorts.length > 0) {
    targetPort = authorizedPorts[0];
  }

  if (!targetPort) {
    targetPort = await navigator.serial.requestPort();
  }

  const info = targetPort.getInfo();
  if (info.usbVendorId !== undefined && info.usbProductId !== undefined) {
    localStorage.setItem(
      PRINTER_STORAGE_KEY,
      JSON.stringify({
        usbVendorId: info.usbVendorId,
        usbProductId: info.usbProductId,
      } satisfies SavedPrinterInfo)
    );
  }

  if (!targetPort.writable) {
    await targetPort.open({ baudRate: 9600 });
  }

  return targetPort;
}

/**
 * Envia um buffer ESC/POS usando a porta recuperada automaticamente.
 */
export async function printSilentESCPOSToSerial(data: Uint8Array): Promise<void> {
  const port = await getOrReconnectSerialPort();
  const writer = port.writable?.getWriter();

  if (!writer) {
    throw new Error("Não foi possível obter o fluxo de escrita da porta serial.");
  }

  try {
    await writer.write(data);
  } finally {
    writer.releaseLock();
  }
}
