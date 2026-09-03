import React from 'react';
import { Printer, Download, CheckSquare, X, Tag, Trash2 } from 'lucide-react';
import { Product } from '../../types';

interface InventoryBatchBarProps {
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onBatchPrintLabels: () => void;
  onBatchExport: () => void;
  onBatchDelete?: () => void;
}

export const InventoryBatchBar: React.FC<InventoryBatchBarProps> = ({
  selectedCount,
  totalCount,
  onSelectAll,
  onClearSelection,
  onBatchPrintLabels,
  onBatchExport,
  onBatchDelete,
}) => {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-zinc-900 border border-zinc-700/80 text-white rounded-2xl px-5 py-3 shadow-2xl flex items-center gap-4 animate-in slide-in-from-bottom-5 duration-200">
      <div className="flex items-center gap-2 border-r border-zinc-700 pr-4">
        <span className="w-6 h-6 rounded-full bg-[#E1FB15] text-black font-black text-xs flex items-center justify-center">
          {selectedCount}
        </span>
        <span className="text-xs font-bold text-zinc-200">
          artigo{selectedCount > 1 ? 's' : ''} selecionado{selectedCount > 1 ? 's' : ''}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onBatchPrintLabels}
          className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
        >
          <Printer size={13} className="text-[#E1FB15]" />
          <span>Imprimir Etiquetas</span>
        </button>

        <button
          type="button"
          onClick={onBatchExport}
          className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
        >
          <Download size={13} className="text-[#32D583]" />
          <span>Exportar ({selectedCount})</span>
        </button>

        {onBatchDelete && (
          <button
            type="button"
            onClick={onBatchDelete}
            className="px-3 py-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/50 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            title="Eliminar artigos selecionados"
          >
            <Trash2 size={13} className="text-rose-400" />
            <span>Eliminar ({selectedCount})</span>
          </button>
        )}

        {selectedCount < totalCount && (
          <button
            type="button"
            onClick={onSelectAll}
            className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-300 transition cursor-pointer"
          >
            Selecionar Todos ({totalCount})
          </button>
        )}

        <button
          type="button"
          onClick={onClearSelection}
          className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
          title="Desmarcar todos"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
};
