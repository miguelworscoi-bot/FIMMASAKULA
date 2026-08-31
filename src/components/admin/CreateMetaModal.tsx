import React, { useState } from "react";
import { supabase } from "../../lib/supabase";
import { Target, X, Check, Cloud, Loader2 } from "lucide-react";

interface CreateMetaModalProps {
  onMetaCreated: () => void;
  onClose?: () => void;
}

export function CreateMetaModal({ onMetaCreated, onClose }: CreateMetaModalProps) {
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [period, setPeriod] = useState("monthly");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !targetAmount) return;

    setLoading(true);

    try {
      // INSERÇÃO DIRETA NO SUPABASE
      const { data, error } = await supabase
        .from("metas")
        .insert([
          {
            title: title,
            target_amount: parseFloat(targetAmount),
            current_amount: 0,
            period: period,
          },
        ])
        .select();

      if (error) {
        console.error("Erro ao guardar no Supabase:", error.message);
        alert(`Falha ao guardar a meta na nuvem: ${error.message}`);
        setLoading(false);
        return;
      }

      // Sucesso: Atualiza o estado da página principal e fecha o modal
      onMetaCreated();
      if (onClose) onClose();
    } catch (err: any) {
      console.error("Erro inesperado:", err);
      alert(`Falha ao conectar à nuvem: ${err.message || 'Erro de rede'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-neutral-900 border border-neutral-800 rounded-3xl p-6 text-white shadow-2xl space-y-4 select-none">
      <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-neutral-950 border border-neutral-800 text-white">
            <Target size={18} className="text-[#E1FB15]" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-white">Criar Meta na Nuvem</h3>
            <p className="text-[11px] text-neutral-400 flex items-center gap-1">
              <Cloud size={12} className="text-[#32D583]" />
              Sincronização persistente no Supabase
            </p>
          </div>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg cursor-pointer transition"
          >
            <X size={18} />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs font-bold text-neutral-300 block mb-1.5">Título da Meta *</label>
          <input
            type="text"
            placeholder="Ex: Meta de Faturamento Mensal"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-neutral-950 border border-neutral-800 p-3 rounded-xl text-white text-sm focus:border-[#E1FB15] focus:outline-none transition font-medium"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-neutral-300 block mb-1.5">Valor Alvo (Kz) *</label>
            <input
              type="number"
              placeholder="Ex: 500000"
              min="1"
              step="any"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 p-3 rounded-xl text-white text-sm focus:border-[#E1FB15] focus:outline-none transition font-bold"
              required
            />
          </div>
          <div>
            <label className="text-xs font-bold text-neutral-300 block mb-1.5">Período</label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 p-3 rounded-xl text-white text-sm focus:border-[#E1FB15] focus:outline-none transition font-bold cursor-pointer"
            >
              <option value="daily">Diário</option>
              <option value="weekly">Semanal</option>
              <option value="monthly">Mensal</option>
              <option value="annual">Anual</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#E1FB15] hover:bg-[#d4ec13] text-black font-extrabold py-3.5 rounded-xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin text-black" />
              <span>A guardar na nuvem...</span>
            </>
          ) : (
            <>
              <Check size={16} className="stroke-[3]" />
              <span>Criar Meta Permanentemente</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}

export default CreateMetaModal;
