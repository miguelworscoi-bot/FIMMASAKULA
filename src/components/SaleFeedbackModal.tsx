import React, { useEffect } from 'react';
import { X, Check } from 'lucide-react';

export interface SaleFeedbackModalProps {
  type: 'SUCCESS' | 'CANCELED' | null;
  isOpen: boolean;
  totalAmount: number;
  changeAmount?: number;
  onClose: () => void;
}

export default function SaleFeedbackModal({
  type,
  isOpen,
  totalAmount,
  changeAmount = 0,
  onClose
}: SaleFeedbackModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Enter' || e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !type) return null;

  const isSuccess = type === 'SUCCESS';

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[36px] max-w-md w-full p-8 text-center shadow-2xl border border-gray-100 flex flex-col items-center space-y-6 relative">
        
        {/* Botão de Fechar no topo */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-gray-50 text-gray-400 hover:text-black flex items-center justify-center transition cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* Ilustração SVG do Sacola (Feliz / Triste) */}
        <div className="relative">
          <div
            className={`w-36 h-36 rounded-full flex items-center justify-center transition-transform scale-100 ${
              isSuccess ? 'bg-[#D1FADF]' : 'bg-[#FEE4E2]'
            }`}
          >
            {isSuccess ? (
              /* Sacola Feliz */
              <svg width="72" height="72" viewBox="0 0 64 64" fill="none" stroke="#131313" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 22V16a12 12 0 0 1 24 0v6" />
                <rect x="14" y="22" width="36" height="34" rx="8" fill="white" />
                <circle cx="25" cy="32" r="2" fill="#131313" stroke="none" />
                <circle cx="39" cy="32" r="2" fill="#131313" stroke="none" />
                <path d="M24 42c3 4 13 4 16 0" strokeWidth="3.5" />
              </svg>
            ) : (
              /* Sacola Triste */
              <svg width="72" height="72" viewBox="0 0 64 64" fill="none" stroke="#131313" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 22V16a12 12 0 0 1 24 0v6" />
                <rect x="14" y="22" width="36" height="34" rx="8" fill="white" />
                <circle cx="25" cy="32" r="2" fill="#131313" stroke="none" />
                <circle cx="39" cy="32" r="2" fill="#131313" stroke="none" />
                <path d="M24 44c3-4 13-4 16 0" strokeWidth="3.5" />
              </svg>
            )}
          </div>

          {/* Badge flutuante de Check / X */}
          <div
            className={`absolute bottom-1 right-1 w-10 h-10 rounded-full flex items-center justify-center text-white border-2 border-white shadow-md ${
              isSuccess ? 'bg-[#12B76A]' : 'bg-[#F04438]'
            }`}
          >
            {isSuccess ? <Check size={22} strokeWidth={3} /> : <X size={22} strokeWidth={3} />}
          </div>
        </div>

        {/* Textos e Valores */}
        {isSuccess ? (
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-[#131313] tracking-tight">Venda Feita!</h2>
            <p className="text-4xl font-black text-[#131313]">
              {totalAmount.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}
            </p>
            <p className="text-sm font-semibold text-gray-500 pt-1">
              Troco {changeAmount.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-[#131313] tracking-tight">Pagamento Cancelado</h2>
            <p className="text-4xl font-black text-[#D92D20]">
              {totalAmount.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}
            </p>
            <p className="text-sm font-semibold text-gray-600 pt-1">Sua compra não foi concluída.</p>
            <p className="text-xs font-medium text-gray-400">Tente novamente.</p>
          </div>
        )}

        {/* Botão de Ação */}
        <button
          onClick={onClose}
          className={`w-full py-3.5 rounded-2xl font-black text-xs transition shadow-md cursor-pointer ${
            isSuccess
              ? 'bg-[#131313] hover:bg-black text-[#E1FB15]'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
          }`}
        >
          {isSuccess ? 'Concluir (Pressione Enter)' : 'Entendido'}
        </button>

      </div>
    </div>
  );
}
