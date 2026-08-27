import React, { useState } from 'react';
import { 
  Settings, 
  Building2, 
  Printer, 
  ShieldCheck, 
  Save, 
  CheckCircle2, 
  Coins, 
  Volume2, 
  Sliders
} from 'lucide-react';
import { CompanySettings } from '../../types';

interface SettingsViewProps {
  settings: CompanySettings;
  setSettings: React.Dispatch<React.SetStateAction<CompanySettings>>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  setSettings,
}) => {
  const [formData, setFormData] = useState<CompanySettings>({ ...settings });
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSettings(formData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div id="view-settings" className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-gray-100 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-zinc-950">Configurações do Masakula ERP & PDV</h2>
          <p className="text-xs text-zinc-400">
            Parâmetros fiscais AGT, dados da loja, impressoras e moeda padrão em Kz
          </p>
        </div>

        {saveSuccess && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold animate-in fade-in">
            <CheckCircle2 size={16} />
            <span>Configurações gravadas com sucesso!</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 text-xs">
        {/* Section 1: Company & AGT Fiscal Data */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-100 text-zinc-900 font-bold text-sm">
            <Building2 size={18} className="text-zinc-600" />
            <span>Identificação da Empresa & Conformidade Fiscal AGT</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-semibold text-zinc-700">Razão Social</label>
              <input
                type="text"
                required
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-50 border border-gray-200 text-zinc-900 focus:bg-white focus:ring-2 focus:ring-zinc-950 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-zinc-700">Nome Fantasia / Loja</label>
              <input
                type="text"
                required
                value={formData.tradingName}
                onChange={(e) => setFormData({ ...formData, tradingName: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-50 border border-gray-200 text-zinc-900 focus:bg-white focus:ring-2 focus:ring-zinc-950 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-zinc-700">NIF (Número de Identificação Fiscal)</label>
              <input
                type="text"
                required
                value={formData.nif}
                onChange={(e) => setFormData({ ...formData, nif: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-50 border border-gray-200 text-zinc-900 font-mono focus:bg-white focus:ring-2 focus:ring-zinc-950 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-zinc-700">Regime de IVA</label>
              <select
                value={formData.regimeIva}
                onChange={(e) => setFormData({ ...formData, regimeIva: e.target.value as any })}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-50 border border-gray-200 text-zinc-900 focus:bg-white focus:ring-2 focus:ring-zinc-950 focus:outline-none"
              >
                <option value="Regime Geral (14%)">Regime Geral (14%)</option>
                <option value="Regime Simplificado (7%)">Regime Simplificado (7%)</option>
                <option value="Regime de Exclusão (0%)">Regime de Exclusão (0%)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-zinc-700">Certificado AGT</label>
              <input
                type="text"
                value={formData.agtCertificateNumber}
                onChange={(e) => setFormData({ ...formData, agtCertificateNumber: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-50 border border-gray-200 text-zinc-900 font-mono focus:bg-white focus:ring-2 focus:ring-zinc-950 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-zinc-700">Identificador do Terminal POS</label>
              <input
                type="text"
                value={formData.posTerminalId}
                onChange={(e) => setFormData({ ...formData, posTerminalId: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-50 border border-gray-200 text-zinc-900 font-mono focus:bg-white focus:ring-2 focus:ring-zinc-950 focus:outline-none"
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="font-semibold text-zinc-700">Endereço Comercial / Província</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-50 border border-gray-200 text-zinc-900 focus:bg-white focus:ring-2 focus:ring-zinc-950 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Hardware & POS Settings */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-100 text-zinc-900 font-bold text-sm">
            <Printer size={18} className="text-zinc-600" />
            <span>Impressoras & Periféricos de Balcão</span>
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-3 p-3 rounded-2xl bg-zinc-50 hover:bg-zinc-100/70 cursor-pointer transition-colors border border-gray-100">
              <input
                type="checkbox"
                checked={formData.printReceiptOnCheckout}
                onChange={(e) => setFormData({ ...formData, printReceiptOnCheckout: e.target.checked })}
                className="w-4 h-4 rounded text-zinc-950 focus:ring-zinc-950"
              />
              <div>
                <span className="font-bold text-zinc-900 block">Imprimir talão automaticamente ao fechar venda</span>
                <span className="text-[11px] text-zinc-500">Envia o documento para a impressora térmica USB/Rede de 80mm</span>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 rounded-2xl bg-zinc-50 hover:bg-zinc-100/70 cursor-pointer transition-colors border border-gray-100">
              <input
                type="checkbox"
                checked={formData.allowNegativeStock}
                onChange={(e) => setFormData({ ...formData, allowNegativeStock: e.target.checked })}
                className="w-4 h-4 rounded text-zinc-950 focus:ring-zinc-950"
              />
              <div>
                <span className="font-bold text-zinc-900 block">Permitir venda de produtos sem stock</span>
                <span className="text-[11px] text-zinc-500">Desativa o bloqueio caso o inventário esteja em zero</span>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 rounded-2xl bg-zinc-50 hover:bg-zinc-100/70 cursor-pointer transition-colors border border-gray-100">
              <input
                type="checkbox"
                checked={formData.soundAlerts}
                onChange={(e) => setFormData({ ...formData, soundAlerts: e.target.checked })}
                className="w-4 h-4 rounded text-zinc-950 focus:ring-zinc-950"
              />
              <div>
                <span className="font-bold text-zinc-900 block">Sinais sonoros de leitor de código de barras</span>
                <span className="text-[11px] text-zinc-500">Toca confirmação sonora ao registar artigos no carrinho</span>
              </div>
            </label>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            id="btn-save-settings"
            type="submit"
            className="px-6 py-3 rounded-2xl bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-colors"
          >
            <Save size={16} className="text-emerald-400" />
            <span>Guardar Configurações</span>
          </button>
        </div>
      </form>
    </div>
  );
};
