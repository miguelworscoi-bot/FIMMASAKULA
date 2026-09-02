// Mapeamento de Control Bytes ESC/POS Padrão Epson / Star
const ESC = 0x1b;
const FS = 0x1c;
const GS = 0x1d;

export type ESCPOSAlignment = 0 | 1 | 2; // 0: Esquerda, 1: Centro, 2: Direita

export interface ESCPOSReceiptOptions {
  paperWidth?: 80 | 58; // 80mm (48 colunas padrão) ou 58mm (32 colunas)
}

export class ESCPOSBuilder {
  private buffer: number[] = [];
  private cols: number = 48;

  constructor(options?: ESCPOSReceiptOptions) {
    this.cols = options?.paperWidth === 58 ? 32 : 48;
    this.init();
  }

  // 1. Inicializar impressora térmica e resetar configurações
  init(): this {
    this.buffer.push(ESC, 0x40);
    // Configurar tabela de caracteres para Latin-1 / CodePage 858 / CP860 (Português)
    this.buffer.push(ESC, 0x74, 0x02);
    return this;
  }

  // 2. Alinhamento de Texto (0: Esquerda, 1: Centro, 2: Direita)
  align(alignment: ESCPOSAlignment): this {
    this.buffer.push(ESC, 0x61, alignment);
    return this;
  }

  // 3. Negrito (Bold)
  bold(enable: boolean = true): this {
    this.buffer.push(ESC, 0x45, enable ? 1 : 0);
    return this;
  }

  // 4. Sublinhado (Underline)
  underline(enable: boolean = true): this {
    this.buffer.push(ESC, 0x2d, enable ? 1 : 0);
    return this;
  }

  // 5. Inverter Cores (Fundo Preto com Texto Branco)
  invert(enable: boolean = true): this {
    this.buffer.push(GS, 0x42, enable ? 1 : 0);
    return this;
  }

  // 6. Tamanho da Fonte (Largura e Altura de 1x a 8x)
  size(width: number = 1, height: number = 1): this {
    const clampedW = Math.max(1, Math.min(8, width)) - 1;
    const clampedH = Math.max(1, Math.min(8, height)) - 1;
    const n = (clampedW << 4) | clampedH;
    this.buffer.push(GS, 0x21, n);
    return this;
  }

  // 7. Escrever Texto Simples
  text(str: string): this {
    if (!str) return this;
    const encoder = new TextEncoder();
    const bytes = Array.from(encoder.encode(str));
    this.buffer.push(...bytes);
    return this;
  }

  // 8. Escrever Linha com Quebra (\n)
  textLine(str: string = ""): this {
    this.text(str + "\n");
    return this;
  }

  // 9. Linha divisória para talões de 80mm (48 colunas) ou 58mm (32 colunas)
  divider(cols?: number, char: string = "-"): this {
    const totalCols = cols || this.cols;
    this.textLine(char.repeat(totalCols));
    return this;
  }

  // 10. Formatação de Linha Dupla (Item + Preço)
  row(left: string, right: string, cols?: number): this {
    const totalCols = cols || this.cols;
    const spaceCount = Math.max(0, totalCols - left.length - right.length);
    const line = left + " ".repeat(spaceCount) + right;
    this.textLine(line);
    return this;
  }

  // 11. Alimentar Linhas em Branco (Feed)
  feed(lines: number = 1): this {
    this.buffer.push(ESC, 0x64, Math.max(1, lines));
    return this;
  }

  // 12. Impressão de QR Code Nativo ESC/POS (Modelo 2)
  qrCode(data: string, size: number = 6): this {
    if (!data) return this;
    const bytes = Array.from(new TextEncoder().encode(data));
    const len = bytes.length + 3;
    const pL = len % 256;
    const pH = Math.floor(len / 256);

    this.buffer.push(GS, 0x28, 0x6b, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00);
    this.buffer.push(GS, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x43, Math.min(16, Math.max(1, size)));
    this.buffer.push(GS, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x45, 0x31);
    this.buffer.push(GS, 0x28, 0x6b, pL, pH, 0x31, 0x50, 0x30, ...bytes);
    this.buffer.push(GS, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x51, 0x30);
    return this;
  }

  // 13. Abrir Gaveta de Dinheiro (Pulso de 24V no Pino 2)
  openCashDrawer(): this {
    this.buffer.push(ESC, 0x70, 0x00, 0x19, 0xfa);
    return this;
  }

  // 14. Cortar Papel (Guilhotina Total/Parcial)
  cut(fullCut: boolean = false): this {
    this.buffer.push(GS, 0x56, fullCut ? 0x41 : 0x00, 0x03);
    return this;
  }

  // 15. Retorna o buffer binário final
  generate(): Uint8Array {
    return new Uint8Array(this.buffer);
  }
}

export interface ReceiptData {
  companyName: string;
  nif: string;
  operatorName: string;
  saleId: string;
  items: Array<{ name: string; qty: number; price: number }>;
  total: number;
  paymentMethod: string;
}

export async function printReceiptWebUSB(data: ReceiptData): Promise<boolean> {
  try {
    if (typeof navigator === "undefined" || !("usb" in navigator)) {
      console.warn("WebUSB API não é suportada neste navegador.");
      return false;
    }

    // 1. Solicita permissão ao operador para o dispositivo USB
    const device = await (navigator as any).usb.requestDevice({
      filters: [] // Aceita qualquer impressora USB (Vendor ID opcional)
    });

    await device.open();
    await device.selectConfiguration(1);
    await device.claimInterface(0);

    // 2. Constrói o recibo em comandos ESC/POS
    const builder = new ESCPOSBuilder()
      .init()
      .openCashDrawer() // Abre a gaveta no início
      .align(1)
      .bold(true)
      .size(2, 2)
      .textLine(data.companyName)
      .size(1, 1)
      .bold(false)
      .textLine(`NIF: ${data.nif}`)
      .textLine("DOCUMENTO DE CONSULTA / RECIBO")
      .divider(48)
      .align(0)
      .textLine(`Venda #: ${data.saleId.slice(0, 8)}`)
      .textLine(`Operador: ${data.operatorName}`)
      .textLine(`Data: ${new Date().toLocaleString("pt-AO")}`)
      .divider(48);

    // Adiciona Itens
    data.items.forEach((item) => {
      const lineLeft = `${item.qty}x ${item.name}`;
      const lineRight = `${(item.qty * item.price).toFixed(2)} Kz`;
      builder.row(lineLeft, lineRight, 48);
    });

    // Totais e Fecho
    builder
      .divider(48)
      .bold(true)
      .size(1, 2)
      .row("TOTAL:", `${data.total.toFixed(2)} Kz`, 48)
      .size(1, 1)
      .bold(false)
      .textLine(`Pagamento: ${data.paymentMethod}`)
      .divider(48)
      .align(1)
      .textLine("Obrigado pela sua preferência!")
      .textLine("Processado por Worscoi POS")
      .textLine("\n\n")
      .cut();

    const bytes = builder.generate();

    // 3. Procura o Endpoint de Escrita (OUT Endpoint)
    const endpoint = device.configuration?.interfaces?.[0]?.alternate?.endpoints?.find(
      (e: any) => e.direction === "out"
    );

    if (endpoint) {
      await device.transferOut(endpoint.endpointNumber, bytes);
    }

    await device.close();
    return true;
  } catch (error) {
    console.error("Erro na impressão WebUSB:", error);
    return false;
  }
}
