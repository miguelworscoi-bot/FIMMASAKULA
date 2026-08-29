import React from 'react';

export interface ReceiptItem {
  name?: string;
  product_name?: string;
  quantity: number;
  price?: number;
  unit_price?: string | number;
  vatRate?: number;
  subtotal?: string | number;
}

export interface ReceiptData {
  saleNumber?: string;
  saleId?: string;
  invoiceNumber?: string;
  date: string;
  operatorName?: string;
  customerName?: string;
  customerNif?: string;
  items: ReceiptItem[];
  totalAmount?: number;
  total?: string | number;
  subtotal?: string | number;
  discount?: string | number;
  tax?: string | number;
  paidAmount?: number;
  amountPaid?: string | number;
  changeAmount?: number;
  changeGiven?: string | number;
  paymentMethod: string;
}

interface ThermalReceiptProps {
  data: ReceiptData;
  width?: string;
}

export function ThermalReceipt({ data, width = '80mm' }: ThermalReceiptProps) {
  const receiptNum = data.saleNumber || data.invoiceNumber || data.saleId || '0000';
  const operator = data.operatorName || 'Operador Padrão';
  const customer = data.customerName || 'Consumidor Final';
  const nif = data.customerNif || 'Consumidor Final';

  const formatMoney = (val: string | number | undefined, fallback: number = 0) => {
    if (val === undefined || val === null) return `${fallback.toLocaleString('pt-AO')} Kz`;
    if (typeof val === 'number') return `${val.toLocaleString('pt-AO')} Kz`;
    if (typeof val === 'string' && val.includes('Kz')) return val;
    return `${val} Kz`;
  };

  const totalDisplay = data.total !== undefined ? formatMoney(data.total) : formatMoney(data.totalAmount, 0);
  const paidDisplay = data.amountPaid !== undefined ? formatMoney(data.amountPaid) : formatMoney(data.paidAmount, 0);
  const changeDisplay = data.changeGiven !== undefined ? formatMoney(data.changeGiven) : formatMoney(data.changeAmount, 0);

  return (
    <div
      id="printable-thermal-receipt"
      className="hidden print:block p-2 text-black font-mono text-[11px] leading-tight mx-auto"
      style={{ width }}
    >
      {/* Cabeçalho */}
      <div className="text-center space-y-1 mb-3">
        <h2 className="font-bold text-sm tracking-widest uppercase">MASAKULA</h2>
        <p className="text-[10px]">"Um nome, várias soluções"</p>
        <p className="text-[10px]">NIF: 5417082910</p>
        <p className="text-[10px]">Rua Rainha Ginga, Luanda</p>
        <p className="border-b border-dashed border-black pt-1"></p>
      </div>

      {/* Dados da Venda */}
      <div className="space-y-0.5 mb-2 text-[10px]">
        <p><strong>TALÃO:</strong> #{receiptNum}</p>
        <p><strong>DATA:</strong> {data.date}</p>
        <p><strong>OPERADOR:</strong> {operator}</p>
        
        {/* Cliente (Menores de idade / Sem NIF) */}
        <p><strong>CLIENTE:</strong> {customer}</p>
        <p><strong>NIF CLIENTE:</strong> {nif}</p>
      </div>

      <p className="border-b border-dashed border-black mb-2"></p>

      {/* Tabela de Itens */}
      <table className="w-full text-left mb-2">
        <thead>
          <tr className="border-b border-black text-[10px]">
            <th className="py-0.5">QTD x ARTIGO</th>
            <th className="py-0.5 text-right">TOTAL</th>
          </tr>
        </thead>
        <tbody>
          {data.items.map((item, i) => {
            const itemName = item.name || item.product_name || 'Artigo';
            const itemPrice = item.price ?? (typeof item.unit_price === 'number' ? item.unit_price : 0);
            const unitPriceText = typeof item.unit_price === 'string' ? item.unit_price : `${itemPrice.toLocaleString('pt-AO')} Kz`;
            const subtotalText = item.subtotal 
              ? (typeof item.subtotal === 'string' ? item.subtotal : `${item.subtotal.toLocaleString('pt-AO')} Kz`)
              : `${(item.quantity * itemPrice).toLocaleString('pt-AO')} Kz`;

            return (
              <tr key={i}>
                <td className="py-1">
                  <div>{itemName}</div>
                  <div className="text-[9px] text-gray-700">
                    {item.quantity}x {unitPriceText} {item.vatRate !== undefined ? `(IVA ${item.vatRate}%)` : ''}
                  </div>
                </td>
                <td className="py-1 text-right font-bold align-top">
                  {subtotalText}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <p className="border-b border-dashed border-black mb-2"></p>

      {/* Totais */}
      <div className="space-y-1 text-right text-[11px]">
        {data.subtotal && (
          <div className="flex justify-between text-[10px]">
            <span>SUBTOTAL:</span>
            <span>{typeof data.subtotal === 'string' ? data.subtotal : formatMoney(data.subtotal)}</span>
          </div>
        )}
        {data.discount && (
          <div className="flex justify-between text-[10px] text-gray-700">
            <span>DESCONTO:</span>
            <span>-{typeof data.discount === 'string' ? data.discount : formatMoney(data.discount)}</span>
          </div>
        )}
        {data.tax && (
          <div className="flex justify-between text-[10px]">
            <span>IVA:</span>
            <span>{typeof data.tax === 'string' ? data.tax : formatMoney(data.tax)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-xs">
          <span>TOTAL COMPRA:</span>
          <span>{totalDisplay}</span>
        </div>
        <div className="flex justify-between text-[10px]">
          <span>MÉTODO:</span>
          <span>{data.paymentMethod}</span>
        </div>
        <div className="flex justify-between text-[10px]">
          <span>VALOR PAGO:</span>
          <span>{paidDisplay}</span>
        </div>
        <div className="flex justify-between text-[10px]">
          <span>TROCO:</span>
          <span>{changeDisplay}</span>
        </div>
      </div>

      <p className="border-b border-dashed border-black my-2"></p>

      <div className="text-center text-[9px] space-y-1">
        <p>Obrigado pela preferência!</p>
        <p className="font-bold">Software Masakula PDV</p>
      </div>
    </div>
  );
}

export default ThermalReceipt;
