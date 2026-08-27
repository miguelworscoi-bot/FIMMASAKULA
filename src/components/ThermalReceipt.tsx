import React from 'react';

export interface ReceiptItem {
  product_name: string;
  quantity: number;
  unit_price: string;
  subtotal: string;
}

export interface ReceiptData {
  saleId: string;
  invoiceNumber?: string;
  date: string;
  customerName?: string;
  customerNif?: string;
  items: ReceiptItem[];
  subtotal?: string;
  discount?: string;
  tax?: string;
  total: string;
  paymentMethod: string;
  amountPaid: string;
  changeGiven: string;
}

interface Props {
  data: ReceiptData | null;
  width?: '58mm' | '80mm';
}

export const ThermalReceipt: React.FC<Props> = ({ data, width = '80mm' }) => {
  if (!data) return null;

  return (
    <div id="printable-receipt" style={{ width }} className="hidden print:block text-black font-mono bg-white p-2">
      {/* Cabeçalho do Estabelecimento */}
      <div className="text-center space-y-0.5">
        <h2 className="text-base font-black uppercase tracking-wider">MASAKULA</h2>
        <p className="text-[10px] font-bold">Sistema de Gestão & PDV</p>
        <p className="text-[9px]">Avenida 4 de Fevereiro, Luanda - Angola</p>
        <p className="text-[9px]">NIF: 5417082910 • Tel: +244 923 000 111</p>
        <p className="text-[10px] pt-1">--------------------------------</p>
      </div>

      {/* Dados da Transação */}
      <div className="my-2 text-[10px] space-y-0.5">
        <div className="flex justify-between">
          <span>Recibo / Doc:</span>
          <span className="font-bold">{data.invoiceNumber || data.saleId.slice(0, 10)}</span>
        </div>
        <div className="flex justify-between">
          <span>Data:</span>
          <span>{data.date}</span>
        </div>
        {data.customerName && (
          <div className="flex justify-between">
            <span>Cliente:</span>
            <span className="font-medium truncate max-w-[160px]">{data.customerName}</span>
          </div>
        )}
        {data.customerNif && (
          <div className="flex justify-between">
            <span>NIF Cliente:</span>
            <span>{data.customerNif}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span>Pagamento:</span>
          <span className="font-bold uppercase">{data.paymentMethod}</span>
        </div>
      </div>

      <p className="text-[10px]">--------------------------------</p>

      {/* Cabeçalho da Tabela de Itens */}
      <div className="flex justify-between text-[10px] font-bold my-1">
        <span className="w-1/2">Item</span>
        <span className="w-1/4 text-center">Qtd x P.Un</span>
        <span className="w-1/4 text-right">Subtotal</span>
      </div>

      <p className="text-[10px]">--------------------------------</p>

      {/* Lista de Produtos */}
      <div className="space-y-1 my-1 text-[10px]">
        {data.items.map((item, idx) => (
          <div key={idx} className="flex justify-between items-start">
            <span className="w-1/2 truncate pr-1">{item.product_name}</span>
            <span className="w-1/4 text-center">{item.quantity}x {item.unit_price}</span>
            <span className="w-1/4 text-right font-bold">{item.subtotal}</span>
          </div>
        ))}
      </div>

      <p className="text-[10px]">--------------------------------</p>

      {/* Resumo Financeiro */}
      <div className="space-y-1 text-[10px] my-2">
        {data.subtotal && (
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>{data.subtotal}</span>
          </div>
        )}
        {data.discount && (
          <div className="flex justify-between">
            <span>Desconto:</span>
            <span>-{data.discount}</span>
          </div>
        )}
        {data.tax && (
          <div className="flex justify-between">
            <span>IVA Geral (14%):</span>
            <span>{data.tax}</span>
          </div>
        )}
        <div className="flex justify-between text-xs font-black pt-1 border-t border-black">
          <span>TOTAL KZ:</span>
          <span>{data.total}</span>
        </div>
        <div className="flex justify-between">
          <span>Valor Entregue:</span>
          <span>{data.amountPaid}</span>
        </div>
        <div className="flex justify-between font-bold">
          <span>Troco:</span>
          <span>{data.changeGiven}</span>
        </div>
      </div>

      <p className="text-[10px]">--------------------------------</p>

      {/* Rodapé Fiscal & Certificação AGT */}
      <div className="text-center text-[9px] mt-3 space-y-1">
        <p className="font-bold">AGT-CERT/2026/8920 • Software Certificado</p>
        <p className="font-semibold">Obrigado pela sua preferência!</p>
        <p>Conserve este recibo para eventuais trocas.</p>
        <p className="text-[8px] pt-1 text-gray-700">Processado por Masakula OS</p>
      </div>
    </div>
  );
};

export default ThermalReceipt;
