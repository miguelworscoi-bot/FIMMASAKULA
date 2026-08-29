import React, { useState } from 'react';
import ReportZModal, { ReportZData } from './components/ReportZModal';

export default function CashRegisterClose() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const mockReportZ: ReportZData = {
    reportNumber: 'RZ 2026/00189',
    openingDate: '28/08/2026 08:00',
    closingDate: '28/08/2026 18:30',
    posTerminal: 'CAIXA-01',
    operatorName: 'Miguel António',
    company: {
      name: 'Masakula - Prestação de Serviços, Lda',
      tradeName: 'Masakula',
      slogan: 'Um nome, várias soluções',
      nif: '5417082910',
      address: 'Rua Rainha Ginga, Edifício Masakula, Luanda - Angola',
      phone: '+244 923 000 000',
      email: 'comercial@masakula.co.ao',
    },
    summary: {
      grossTotal: 450000,
      discountsTotal: 25000,
      netTotal: 425000,
      totalSalesCount: 38,
      voidedSalesCount: 2,
      voidedSalesTotal: 15000,
    },
    paymentsBreakdown: {
      cash: 120000,
      multicaixa: 255000,
      transfer: 50000,
    },
    vatBreakdown: [
      { rate: 14, baseAmount: 350000, vatAmount: 49000 },
      { rate: 0, baseAmount: 75000, vatAmount: 0, exemptionReason: 'Artigo 12.º do CIVA' },
    ],
  };

  return (
    <div className="p-4">
      <button
        onClick={() => setIsModalOpen(true)}
        className="px-6 py-3 bg-black text-[#E1FB15] font-black rounded-2xl shadow-lg hover:bg-gray-800 transition cursor-pointer"
      >
        Emitir Relatório Z
      </button>

      <ReportZModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        data={mockReportZ}
      />
    </div>
  );
}
