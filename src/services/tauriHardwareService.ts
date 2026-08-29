/**
 * Serviço de Integração de Hardware POS (Tauri 2.0 / SerialPort / ESC/POS)
 * Suporte nativo a comandos ESC/POS para impressoras térmicas e abertura de gavetas físicas.
 */

// Tabela de Comandos Físicos ESC/POS
export const ESC_POS = {
  INIT: [0x1b, 0x40], // ESC @ (Inicializar impressora)
  DRAWER_PULSE: [0x1b, 0x70, 0x00, 0x19, 0xfa], // ESC p 0 25 250 (Abrir gaveta Pino 2)
  CUT_PAPER: [0x1d, 0x56, 0x00], // GS V 0 (Corte total do papel)
  ALIGN_LEFT: [0x1b, 0x61, 0x00],
  ALIGN_CENTER: [0x1b, 0x61, 0x01],
  ALIGN_RIGHT: [0x1b, 0x61, 0x02],
  BOLD_ON: [0x1b, 0x45, 0x01],
  BOLD_OFF: [0x1b, 0x45, 0x00],
  DOUBLE_HEIGHT: [0x1d, 0x21, 0x01],
  NORMAL_TEXT: [0x1d, 0x21, 0x00],
  FEED_3_LINES: [0x0a, 0x0a, 0x0a],
};

export interface SerialResponse {
  success: boolean;
  message: string;
}

export interface PrintReceiptOptions {
  portName?: string;
  baudRate?: number;
  openDrawer?: boolean;
  cut?: boolean;
}

// Verifica se está rodando dentro do ambiente Desktop Tauri
export const isTauriEnvironment = (): boolean => {
  return typeof window !== 'undefined' && ('__TAURI__' in window || '__TAURI_INTERNALS__' in window);
};

/**
 * Utilitário para converter string UTF-8 para array de bytes
 */
export function textToBytes(text: string): number[] {
  if (typeof TextEncoder !== 'undefined') {
    return Array.from(new TextEncoder().encode(text));
  }
  const bytes: number[] = [];
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i);
    if (charCode < 0x80) {
      bytes.push(charCode);
    } else {
      bytes.push(...Array.from(new TextEncoder().encode(text.charAt(i))));
    }
  }
  return bytes;
}

export const tauriHardwareService = {
  /**
   * Lista nomes de portas seriais/COM disponíveis no SO (ex: ["COM1", "COM3", "/dev/ttyUSB0"])
   */
  async listSerialPorts(): Promise<string[]> {
    if (isTauriEnvironment()) {
      try {
        const { invoke } = (window as any).__TAURI__.core || (window as any).__TAURI__.tauri;
        return await invoke('list_serial_ports');
      } catch (err: any) {
        console.error('[TauriHardware] Erro ao listar portas:', err);
        throw new Error(err?.message || 'Erro ao listar portas seriais no Tauri');
      }
    }

    // Fallback Web Serial API
    if (typeof navigator !== 'undefined' && 'serial' in navigator) {
      try {
        const ports = await (navigator as any).serial.getPorts();
        if (ports.length > 0) {
          return ports.map((_: any, index: number) => `WebSerial-${index + 1}`);
        }
      } catch {
        // ignora erro silenciosamente
      }
    }

    // Portas padrão para preview e simulação
    return ['COM1', 'COM2', 'COM3', '/dev/ttyUSB0'];
  },

  /**
   * Aciona a abertura física da gaveta de dinheiro via pulso serial (Pino 2)
   */
  async openCashDrawer(portName: string = 'COM1', baudRate: number = 9600): Promise<void> {
    if (isTauriEnvironment()) {
      try {
        const { invoke } = (window as any).__TAURI__.core || (window as any).__TAURI__.tauri;
        await invoke('open_cash_drawer', {
          portName,
          baudRate,
        });
        return;
      } catch (err: any) {
        console.error('[TauriHardware] Erro ao abrir gaveta:', err);
        throw new Error(err?.message || `Falha ao acionar gaveta em ${portName}`);
      }
    }

    console.info(`[Simulador Hardware] Pulso ESC/POS para gaveta enviado na porta ${portName} (${baudRate} baud).`);
  },

  /**
   * Envia payload binário bruto ESC/POS com opções de abertura de gaveta e corte de papel
   */
  async printEscposRaw(
    portName: string = 'COM1',
    baudRate: number = 9600,
    payload: number[] | Uint8Array,
    openDrawer: boolean = false,
    cut: boolean = true
  ): Promise<void> {
    const rawArray = Array.isArray(payload) ? payload : Array.from(payload);

    if (isTauriEnvironment()) {
      try {
        const { invoke } = (window as any).__TAURI__.core || (window as any).__TAURI__.tauri;
        await invoke('print_escpos_raw', {
          portName,
          baudRate,
          payload: rawArray,
          openDrawer,
          cut,
        });
        return;
      } catch (err: any) {
        console.error('[TauriHardware] Erro ao imprimir payload ESC/POS:', err);
        throw new Error(err?.message || `Impressora inacessível em ${portName}`);
      }
    }

    console.info(
      `[Simulador Hardware] ${rawArray.length} bytes ESC/POS transmitidos para ${portName}. (Gaveta: ${openDrawer}, Corte: ${cut})`
    );
  },

  /**
   * Utilitário amigável para imprimir texto formatado
   */
  async printReceiptText(
    text: string,
    options: PrintReceiptOptions = {}
  ): Promise<SerialResponse> {
    const {
      portName = 'COM1',
      baudRate = 9600,
      openDrawer = false,
      cut = true,
    } = options;

    try {
      const payload = textToBytes(text);
      await this.printEscposRaw(portName, baudRate, payload, openDrawer, cut);
      return {
        success: true,
        message: `Impressão transmitida com sucesso para ${portName}`,
      };
    } catch (err: any) {
      return {
        success: false,
        message: err?.message || 'Erro ao transmitir dados para a impressora',
      };
    }
  },
};

export default tauriHardwareService;
