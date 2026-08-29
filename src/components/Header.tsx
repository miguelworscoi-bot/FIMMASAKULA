import React from 'react';
import { BrainCircuit } from 'lucide-react';

export interface HeaderProps {
  currentScreen?: string;
  setCurrentScreen?: (screen: string) => void;
  activeTab?: string;
  setActiveTab?: (tab: any) => void;
}

export default function Header({ 
  currentScreen = 'pdv', 
  setCurrentScreen,
  activeTab,
  setActiveTab
}: HeaderProps) {
  const active = currentScreen || activeTab || 'pdv';
  const handleToggleAI = () => {
    const next = active === 'ai_engine' ? 'pdv' : 'ai_engine';
    if (setCurrentScreen) {
      setCurrentScreen(next);
    }
    if (setActiveTab) {
      setActiveTab(next === 'pdv' ? 'sales' : next);
    }
  };

  return (
    <header className="flex justify-between items-center p-4 bg-[#131313] border-b border-white/10">
      {/* SEUS ELEMENTOS E TÍTULOS ATUAIS PERMANECEM EXATAMENTE IGUAIS AQUI */}
      <h1 className="text-lg font-bold text-white">Sistema Masakula</h1>

      {/* Ícone Disparador do Motor de IA (Única adição) */}
      <button
        type="button"
        onClick={handleToggleAI}
        title="Abrir Motor de IA e Previsão"
        className={`p-2.5 rounded-2xl transition-all border cursor-pointer ${
          active === 'ai_engine'
            ? 'bg-[#E1FB15] text-[#131313] border-[#E1FB15] shadow-[inset_2px_2px_4px_rgba(0,0,0,0.4)]'
            : 'bg-[#131313] text-[#E1FB15] border-white/10 hover:border-[#E1FB15]/50 shadow-[4px_4px_10px_rgba(0,0,0,0.5)]'
        }`}
      >
        <BrainCircuit size={20} />
      </button>
    </header>
  );
}

export { Header };
