import React, { useState } from 'react';
import ReportZModal, { ReportZData } from './components/ReportZModal';
import { SecureCashCloseModal } from './components/auth/SecureCashCloseModal';
import { Lock, ShieldCheck, FileText } from 'lucide-react';

export default function CashRegisterClose() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isReportZOpen, setIsReportZOpen] = useState(false);
  const [authSuccessNotice, setAuthSuccessNotice] = useState<string | null>(null);

  const mockReportZ: ReportZData = {
    reportNumber: 'RZ 2026/00189',
    openingDate: '28/08/2026 08:00',
    closingDate: '28/08/2026 18:30',
    posTerminal: 'CAIXA-01',
    operatorName: 'Miguel António (Operador)',
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
      { rate: 0, baseAmount: 425000, vatAmount: 0, exemptionReason: 'Operação sem incidência de IVA' },
    ],
  };

  const handleVerifiedClose = (verificationData: { method: "PIN" | "PASSWORD"; verifiedBy: string; timestamp: string }) => {
    setIsAuthModalOpen(false);
    setAuthSuccessNotice(`Sessão autorizada por ${verificationData.verifiedBy} via ${verificationData.method}.`);
    setIsReportZOpen(true);
  };

  return (
    <div className="p-6 max-w-xl mx-auto bg-white border border-gray-100 rounded-3xl shadow-sm space-y-4 text-[#131313]">
      <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
        <div className="w-10 h-10 rounded-2xl bg-zinc-950 text-[#E1FB15] flex items-center justify-center">
          <Lock size={18} />
        </div>
        <div>
          <h2 className="font-extrabold text-base text-zinc-950">Fechamento do Caixa Diário (Relatório Z)</h2>
          <p className="text-xs text-zinc-500">Exige autorização por PIN ou Senha do Operador</p>
        </div>
      </div>

      {authSuccessNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2">
          <ShieldCheck size={16} className="text-emerald-600" />
          <span>{authSuccessNotice}</span>
        </div>
      )}

      <div className="bg-zinc-50 p-4 rounded-2xl border border-gray-100 space-y-2 text-xs">
        <div className="flex justify-between text-zinc-500">
          <span>Terminal:</span>
          <span className="font-bold text-zinc-900">{mockReportZ.posTerminal}</span>
        </div>
        <div className="flex justify-between text-zinc-500">
          <span>Operador Ativo:</span>
          <span className="font-bold text-zinc-900">{mockReportZ.operatorName}</span>
        </div>
        <div className="flex justify-between text-zinc-500">
          <span>Faturamento Líquido:</span>
          <span className="font-mono font-black text-zinc-950">{mockReportZ.summary.netTotal.toLocaleString('pt-AO')} Kz</span>
        </div>
      </div>

      <div className="pt-2">
        <button
          onClick={() => setIsAuthModalOpen(true)}
          className="w-full px-6 py-3.5 bg-zinc-950 text-[#E1FB15] hover:bg-black font-black text-xs rounded-2xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
        >
          <Lock size={15} />
          <span>Autenticar & Emitir Relatório Z</span>
        </button>
      </div>

      {/* Modal de Verificação Segura */}
      <SecureCashCloseModal
        isOpen={isAuthModalOpen}
        operatorName={mockReportZ.operatorName}
        terminalName={mockReportZ.posTerminal}
        countedAmount={mockReportZ.paymentsBreakdown.cash}
        expectedAmount={mockReportZ.paymentsBreakdown.cash}
        differenceAmount={0}
        notes="Fechamento do dia e emissão de Relatório Z Fiscal"
        onSuccess={handleVerifiedClose}
        onCancel={() => setIsAuthModalOpen(false)}
      />

      {/* Relatório Z Modal */}
      <ReportZModal
        isOpen={isReportZOpen}
        onClose={() => setIsReportZOpen(false)}
        data={mockReportZ}
      />
    </div>
  );
}

