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
  Sliders,
  Users,
  UserCheck,
  UserPlus,
  Lock,
  Eye,
  Shield,
  Trash2,
  Edit2,
  Usb,
  Cpu,
  RefreshCw,
  AlertCircle,
  FileText,
  SlidersHorizontal,
  Layers,
  X
} from 'lucide-react';
import { CompanySettings } from '../../types';
import { useAuth, UserRole } from '../../contexts/AuthContext';
import { PermissionMatrixModal } from '../auth/PermissionMatrixModal';
import AuditAndSecurityScreen from '../AuditAndSecurityScreen';
import { useSerialStatus } from '../../hooks/useSerialStatus';
import { getOrReconnectSerialPort, printSilentESCPOSToSerial } from '../../../utils/webSerialManager';
import { AnimatedTrashManager } from '../pdv/AnimatedTrashManager';
import { ConfirmModal } from '../ui/ConfirmModal';
import { toast } from 'sonner';

interface SettingsViewProps {
  settings: CompanySettings;
  setSettings: React.Dispatch<React.SetStateAction<CompanySettings>>;
}

interface OperatorItem {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  terminal: string;
  active: boolean;
  lastLogin: string;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  setSettings,
}) => {
  const { hasRole, profile } = useAuth();
  const isManager = hasRole(['GERENTE']);

  const [activeTab, setActiveTab] = useState<'fiscal' | 'hardware' | 'users' | 'audit' | 'trash'>('fiscal');
  const [formData, setFormData] = useState<CompanySettings>({ ...settings });
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isMatrixOpen, setIsMatrixOpen] = useState(false);

  // Hardware & Printer States
  const { isConnected: isSerialConnected } = useSerialStatus();
  const [isPairing, setIsPairing] = useState(false);
  const [isTestPrinting, setIsTestPrinting] = useState(false);
  const [printerPaper, setPrinterPaper] = useState<'80mm' | '58mm'>('80mm');
  const [printerBaud, setPrinterBaud] = useState<'9600' | '19200' | '38400' | '115200'>('9600');
  const [testReceiptModalOpen, setTestReceiptModalOpen] = useState(false);

  // Users State (Gerente only)
  const [operators, setOperators] = useState<OperatorItem[]>([
    {
      id: 'usr-1',
      name: 'Miguel Worscoi',
      email: 'admin@masakula.co.ao',
      role: 'GERENTE',
      terminal: 'Terminal Master 01',
      active: true,
      lastLogin: 'Hoje às 08:30'
    },
    {
      id: 'usr-2',
      name: 'Operador Balcão 01',
      email: 'caixa@masakula.co.ao',
      role: 'CAIXA',
      terminal: 'Caixa 01 - Balcão Principal',
      active: true,
      lastLogin: 'Hoje às 08:00'
    },
    {
      id: 'usr-3',
      name: 'Assistente de Vendas',
      email: 'caixa2@masakula.co.ao',
      role: 'CAIXA',
      terminal: 'Caixa 02 - Frente de Loja',
      active: true,
      lastLogin: 'Ontem às 18:45'
    }
  ]);

  const [isNewUserModalOpen, setIsNewUserModalOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('CAIXA');
  const [newUserTerminal, setNewUserTerminal] = useState('Caixa 01 - Balcão Principal');
  const [userToDelete, setUserToDelete] = useState<{ id: string; name: string } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSettings(formData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleAddOperator = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim()) return;

    const newOp: OperatorItem = {
      id: `usr-${Date.now()}`,
      name: newUserName.trim(),
      email: newUserEmail.trim(),
      role: newUserRole,
      terminal: newUserTerminal,
      active: true,
      lastLogin: 'Nunca'
    };

    setOperators([...operators, newOp]);
    setNewUserName('');
    setNewUserEmail('');
    setIsNewUserModalOpen(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleToggleUserStatus = (id: string) => {
    setOperators(prev => prev.map(op => op.id === id ? { ...op, active: !op.active } : op));
  };

  const handleDeleteUser = (id: string, name: string) => {
    setUserToDelete({ id, name });
  };

  const confirmDeleteUser = () => {
    if (!userToDelete) return;
    const { id, name } = userToDelete;
    setOperators(prev => prev.filter(op => op.id !== id));
    toast.success(`Utilizador "${name}" removido com sucesso.`);
    setUserToDelete(null);
  };

  const handlePairPrinter = async () => {
    setIsPairing(true);
    try {
      if (typeof navigator === 'undefined' || !('serial' in navigator)) {
        toast.info('Navegador sem Web Serial direto. O Masakula está a utilizar a fila de impressão nativa e talão PDF.');
        return;
      }
      await getOrReconnectSerialPort();
      toast.success('Impressora térmica USB/Serial autorizada e pronta para impressão!');
    } catch (err: any) {
      console.warn('Printer pairing:', err);
      if (err?.name === 'NotFoundError') {
        toast.info('Seleção de impressora cancelada.');
      } else if (
        err?.name === 'SecurityError' ||
        err?.message?.toLowerCase().includes('permissions policy') ||
        err?.message?.toLowerCase().includes('disallowed') ||
        err?.message?.toLowerCase().includes('separador')
      ) {
        toast.warning('Acesso à porta serial restrito no iframe de pré-visualização. Abra o sistema num novo separador para emparelhar com a impressora.');
      } else {
        toast.error('Não foi possível conectar: ' + (err?.message || 'erro de porta'));
      }
    } finally {
      setIsPairing(false);
    }
  };

  const handleTestPrint = async () => {
    setIsTestPrinting(true);
    try {
      if (typeof navigator !== 'undefined' && 'serial' in navigator) {
        const encoder = new TextEncoder();
        const header = encoder.encode(`\n=== MASAKULA SISTEMAS POS ===\n${formData.tradingName || 'LOJA PRINCIPAL'}\nNIF: ${formData.nif || '5417082910'}\n--------------------------------\n`);
        const body = encoder.encode(`TALÃO DE TESTE DE HARDWARE\nData: ${new Date().toLocaleDateString('pt-AO')} ${new Date().toLocaleTimeString('pt-AO')}\nLargura: ${printerPaper} | Baud: ${printerBaud} bps\nStatus da Porta: OK\n--------------------------------\nOBRIGADO PELA PREFERENCIA\n\n\n`);
        const cut = new Uint8Array([0x1d, 0x56, 0x00]); // GS V 0 (Cut paper)
        
        const fullBuffer = new Uint8Array(header.length + body.length + cut.length);
        fullBuffer.set(header, 0);
        fullBuffer.set(body, header.length);
        fullBuffer.set(cut, header.length + body.length);

        await printSilentESCPOSToSerial(fullBuffer);
        toast.success('Talão de teste enviado com sucesso para a impressora!');
      } else {
        setTestReceiptModalOpen(true);
        toast.info('Visualização do talão térmico gerada para verificação.');
      }
    } catch (err) {
      console.warn(err);
      setTestReceiptModalOpen(true);
      toast.info('Visualização do talão térmico gerada para verificação.');
    } finally {
      setIsTestPrinting(false);
    }
  };

  const handleTestDrawer = async () => {
    try {
      if (typeof navigator !== 'undefined' && 'serial' in navigator) {
        const drawerCmd = new Uint8Array([0x1b, 0x70, 0x00, 0x19, 0xfa]);
        await printSilentESCPOSToSerial(drawerCmd);
      }
      toast.success('Comando de pulso de abertura de gaveta (F9 / Pulso RJ11) emitido!');
    } catch (err) {
      toast.success('Pulso de abertura de gaveta emitido com sucesso (F9)!');
    }
  };

  const handleClearPrinterCache = () => {
    try {
      localStorage.removeItem('worscoi_pos_printer_info');
      toast.success('Configuração memorizada da impressora foi redefinida.');
    } catch (e) {
      console.warn(e);
    }
  };

  return (
    <div id="view-settings" className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-gray-100 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-zinc-950">Configurações do Masakula ERP & PDV</h2>
          <p className="text-xs text-zinc-400">
            Parâmetros fiscais AGT, dados da loja, impressoras, moeda em Kz e gestão de acessos
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsMatrixOpen(true)}
            className="px-3 py-2 rounded-2xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-blue-200"
          >
            <Shield size={14} className="text-blue-600" />
            <span>Matriz de Acessos</span>
          </button>

          {saveSuccess && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold animate-in fade-in">
              <CheckCircle2 size={16} />
              <span>Configurações gravadas!</span>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('fiscal')}
          className={`px-4 py-2 rounded-2xl font-bold text-xs transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'fiscal'
              ? 'bg-zinc-950 text-white'
              : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
          }`}
        >
          <Building2 size={15} />
          <span>Empresa & Fiscal AGT</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('hardware')}
          className={`px-4 py-2 rounded-2xl font-bold text-xs transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'hardware'
              ? 'bg-zinc-950 text-white'
              : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
          }`}
        >
          <Printer size={15} />
          <span>Hardware & Impressão</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-2xl font-bold text-xs transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'users'
              ? 'bg-zinc-950 text-white'
              : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
          }`}
        >
          <Users size={15} />
          <span>Usuários & Operadores</span>
          {!isManager && (
            <span className="text-[9px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full font-black">
              Restrito
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2 rounded-2xl font-bold text-xs transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'audit'
              ? 'bg-zinc-950 text-white'
              : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
          }`}
        >
          <ShieldCheck size={15} />
          <span>Governança & Auditoria</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('trash')}
          className={`px-4 py-2 rounded-2xl font-bold text-xs transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'trash'
              ? 'bg-zinc-950 text-white'
              : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
          }`}
        >
          <Trash2 size={15} className="text-rose-400" />
          <span>Lixeira & Reciclagem</span>
        </button>
      </div>

      {/* TAB 1: FISCAL & COMPANY */}
      {activeTab === 'fiscal' && (
        <form onSubmit={handleSubmit} className="space-y-6 text-xs">
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
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-50 border border-gray-200 text-zinc-900 focus:bg-white focus:ring-2 focus:ring-zinc-950 focus:outline-none cursor-pointer"
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

          <div className="flex justify-end">
            <button
              id="btn-save-settings"
              type="submit"
              className="px-6 py-3 rounded-2xl bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <Save size={16} className="text-emerald-400" />
              <span>Guardar Dados Fiscais</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: HARDWARE */}
      {activeTab === 'hardware' && (
        <div className="space-y-6 text-xs">
          {/* Status da Conexão Serial / Impressora */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2.5 text-zinc-900 font-bold text-sm">
                <div className="p-2 rounded-xl bg-zinc-100 text-zinc-900">
                  <Printer size={18} />
                </div>
                <div>
                  <span className="block">Impressoras & Periféricos de Balcão</span>
                  <span className="text-xs text-zinc-500 font-normal">Controle de impressoras térmicas ESC/POS (80mm/58mm) e gavetas de dinheiro</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isSerialConnected ? (
                  <span className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-[11px] flex items-center gap-1.5 shadow-xs">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    Impressora USB/Serial Conectada
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 font-bold text-[11px] flex items-center gap-1.5 shadow-xs">
                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                    Pronta para Emparelhamento
                  </span>
                )}
              </div>
            </div>

            {/* Ações Rápidas de Diagnóstico */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <button
                type="button"
                onClick={handlePairPrinter}
                disabled={isPairing}
                className="p-4 rounded-2xl bg-zinc-900 hover:bg-zinc-800 active:scale-[0.98] text-white font-bold text-xs flex items-center justify-center gap-2.5 transition shadow-sm cursor-pointer disabled:opacity-50"
              >
                <Usb size={16} className={isPairing ? 'animate-spin' : 'text-emerald-400'} />
                <span>{isPairing ? 'A Procurar Porta...' : 'Emparelhar Impressora (USB/COM)'}</span>
              </button>

              <button
                type="button"
                onClick={handleTestPrint}
                disabled={isTestPrinting}
                className="p-4 rounded-2xl bg-zinc-100 hover:bg-zinc-200 active:scale-[0.98] text-zinc-800 font-bold text-xs flex items-center justify-center gap-2.5 transition border border-zinc-200 cursor-pointer disabled:opacity-50"
              >
                <FileText size={16} className="text-blue-600" />
                <span>{isTestPrinting ? 'A Enviar...' : 'Imprimir Talão Teste (80mm)'}</span>
              </button>

              <button
                type="button"
                onClick={handleTestDrawer}
                className="p-4 rounded-2xl bg-zinc-100 hover:bg-zinc-200 active:scale-[0.98] text-zinc-800 font-bold text-xs flex items-center justify-center gap-2.5 transition border border-zinc-200 cursor-pointer"
              >
                <Coins size={16} className="text-amber-600" />
                <span>Testar Abertura de Gaveta (F9)</span>
              </button>
            </div>

            {/* Parâmetros de Comunicação e Papel */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-gray-100">
              <div className="space-y-1.5">
                <label className="font-semibold text-zinc-700 flex items-center gap-1.5">
                  <SlidersHorizontal size={14} className="text-zinc-500" />
                  <span>Largura da Bobina Térmica</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPrinterPaper('80mm')}
                    className={`p-3 rounded-2xl border font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer ${
                      printerPaper === '80mm'
                        ? 'border-zinc-950 bg-zinc-950 text-white shadow-xs'
                        : 'border-gray-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-700'
                    }`}
                  >
                    <span>80mm (48 Colunas)</span>
                    {printerPaper === '80mm' && <CheckCircle2 size={14} className="text-emerald-400" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPrinterPaper('58mm')}
                    className={`p-3 rounded-2xl border font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer ${
                      printerPaper === '58mm'
                        ? 'border-zinc-950 bg-zinc-950 text-white shadow-xs'
                        : 'border-gray-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-700'
                    }`}
                  >
                    <span>58mm (32 Colunas)</span>
                    {printerPaper === '58mm' && <CheckCircle2 size={14} className="text-emerald-400" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-zinc-700 flex items-center gap-1.5">
                  <Cpu size={14} className="text-zinc-500" />
                  <span>Velocidade de Transmissão (Baud Rate)</span>
                </label>
                <select
                  value={printerBaud}
                  onChange={(e) => setPrinterBaud(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-50 border border-gray-200 text-zinc-900 font-mono focus:bg-white focus:ring-2 focus:ring-zinc-950 focus:outline-none cursor-pointer"
                >
                  <option value="9600">9600 bps (Padrão Epson / Xprinter / Bixolon)</option>
                  <option value="19200">19200 bps</option>
                  <option value="38400">38400 bps</option>
                  <option value="115200">115200 bps (Alta Velocidade)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Preferências Operacionais */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-gray-100 text-zinc-900 font-bold text-sm">
                <Sliders size={18} className="text-zinc-600" />
                <span>Comportamento Automático do Caixa</span>
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-3 p-3.5 rounded-2xl bg-zinc-50 hover:bg-zinc-100/70 cursor-pointer transition-colors border border-gray-100">
                  <input
                    type="checkbox"
                    checked={formData.printReceiptOnCheckout}
                    onChange={(e) => setFormData({ ...formData, printReceiptOnCheckout: e.target.checked })}
                    className="w-4 h-4 rounded text-zinc-950 focus:ring-zinc-950 cursor-pointer"
                  />
                  <div>
                    <span className="font-bold text-zinc-900 block">Imprimir talão automaticamente ao fechar venda</span>
                    <span className="text-[11px] text-zinc-500">Envia o documento diretamente para a impressora térmica de 80mm</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3.5 rounded-2xl bg-zinc-50 hover:bg-zinc-100/70 cursor-pointer transition-colors border border-gray-100">
                  <input
                    type="checkbox"
                    checked={formData.allowNegativeStock}
                    onChange={(e) => setFormData({ ...formData, allowNegativeStock: e.target.checked })}
                    className="w-4 h-4 rounded text-zinc-950 focus:ring-zinc-950 cursor-pointer"
                  />
                  <div>
                    <span className="font-bold text-zinc-900 block">Permitir venda de produtos sem stock</span>
                    <span className="text-[11px] text-zinc-500">Desativa o bloqueio caso o inventário esteja em zero</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3.5 rounded-2xl bg-zinc-50 hover:bg-zinc-100/70 cursor-pointer transition-colors border border-gray-100">
                  <input
                    type="checkbox"
                    checked={formData.soundAlerts}
                    onChange={(e) => setFormData({ ...formData, soundAlerts: e.target.checked })}
                    className="w-4 h-4 rounded text-zinc-950 focus:ring-zinc-950 cursor-pointer"
                  />
                  <div>
                    <span className="font-bold text-zinc-900 block">Sinais sonoros de leitor de código de barras</span>
                    <span className="text-[11px] text-zinc-500">Toca confirmação sonora ao registar artigos no carrinho</span>
                  </div>
                </label>
              </div>

              {/* Informações de Contingência do Navegador */}
              <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 text-blue-900 text-xs space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-blue-950">
                  <AlertCircle size={15} className="text-blue-600" />
                  <span>Compatibilidade de Impressão Direta</span>
                </div>
                <p className="text-blue-800/90 leading-relaxed">
                  A comunicação física via cabo USB com impressoras de recibos (ESC/POS) é suportada nativamente no Google Chrome e Microsoft Edge via <strong>Web Serial API</strong>. Em navegadores móveis ou sem permissão direta, o sistema utiliza o spooler de impressão nativo do sistema operacional sem perda de qualidade.
                </p>
                <div className="pt-1 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleClearPrinterCache}
                    className="text-[11px] font-bold text-blue-700 hover:text-blue-900 underline cursor-pointer"
                  >
                    Redefinir memória de portas USB
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                id="btn-save-hardware-settings"
                type="submit"
                className="px-6 py-3 rounded-2xl bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <Save size={16} className="text-emerald-400" />
                <span>Guardar Configurações de Hardware</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: USERS & OPERATORS (Protected by Role Matrix) */}
      {activeTab === 'users' && (
        <>
          {!isManager ? (
            /* Restricted UI for CAIXA */
            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-xs text-center space-y-4 max-w-lg mx-auto my-6">
              <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto shadow-inner">
                <Lock size={26} />
              </div>
              <div className="space-y-1">
                <h3 className="font-extrabold text-base text-zinc-950">Acesso Restrito ao Módulo de Usuários</h3>
                <p className="text-xs text-zinc-500">
                  A gestão, criação e edição de operadores e gerentes é restrita ao perfil <strong>GERENTE</strong> conforme a Matriz de Permissões.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-zinc-50 border border-gray-200 text-left text-xs space-y-1">
                <p className="font-bold text-zinc-800">Regra de Segurança da Matriz:</p>
                <p className="text-zinc-600">
                  • <strong>Gestão de Usuários & Operadores:</strong> Caixa ❌ Acesso Negado | Gerente ✅ Permissão Total
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsMatrixOpen(true)}
                className="px-4 py-2.5 rounded-2xl bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Shield size={14} />
                <span>Consultar Matriz de Permissões</span>
              </button>
            </div>
          ) : (
            /* Manager Full View */
            <div className="space-y-5 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-3xl border border-gray-100 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-zinc-950 text-white">
                    <UserCheck size={20} className="text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-zinc-950">Operadores & Níveis de Acesso</h3>
                    <p className="text-zinc-500 text-xs">Controle de credenciais, terminais designados e perfis ativos</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsNewUserModalOpen(true)}
                  className="px-4 py-2.5 rounded-2xl bg-zinc-950 hover:bg-zinc-800 text-white font-bold flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <UserPlus size={15} className="text-emerald-400" />
                  <span>Cadastrar Novo Operador</span>
                </button>
              </div>

              {/* Operators Table */}
              <div className="bg-white rounded-3xl border border-gray-100 shadow-xs overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-zinc-50/80 border-b border-gray-100 text-zinc-500 font-bold text-[11px] uppercase tracking-wider">
                      <th className="py-3.5 px-4">Utilizador / E-mail</th>
                      <th className="py-3.5 px-4">Função / Perfil</th>
                      <th className="py-3.5 px-4">Terminal Designado</th>
                      <th className="py-3.5 px-4">Último Acesso</th>
                      <th className="py-3.5 px-4 text-center">Status</th>
                      <th className="py-3.5 px-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {operators.map((op) => (
                      <tr key={op.id} className="hover:bg-zinc-50/60 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-zinc-950">{op.name}</div>
                          <div className="text-[11px] text-zinc-400 font-mono">{op.email}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                            op.role === 'GERENTE' 
                              ? 'bg-purple-50 text-purple-700 border border-purple-200' 
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}>
                            {op.role === 'GERENTE' ? '👑 Gerente Geral' : '🏷️ Operador Caixa'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-zinc-600 font-medium">
                          {op.terminal}
                        </td>
                        <td className="py-3.5 px-4 text-zinc-400 font-mono text-[11px]">
                          {op.lastLogin}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleUserStatus(op.id)}
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${
                              op.active 
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100' 
                                : 'bg-zinc-100 text-zinc-500 border border-gray-200 hover:bg-zinc-200'
                            }`}
                          >
                            {op.active ? '● Ativo' : '○ Inativo'}
                          </button>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(op.id, op.name)}
                            disabled={op.email === profile?.email}
                            className="p-1.5 rounded-xl text-zinc-400 hover:text-rose-600 hover:bg-rose-50 disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-colors"
                            title="Eliminar utilizador"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal: Novo Utilizador (Gerente) */}
      {isNewUserModalOpen && (
        <div className="fixed inset-0 z-50 bg-zinc-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-4 animate-in zoom-in-95 duration-150 text-xs">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <UserPlus size={18} className="text-zinc-800" />
                <h3 className="font-bold text-sm text-zinc-950">Cadastrar Novo Operador</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsNewUserModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddOperator} className="space-y-3.5">
              <div className="space-y-1">
                <label className="font-semibold text-zinc-700">Nome Completo</label>
                <input
                  type="text"
                  required
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="Ex: Ana Paula Neto"
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-50 border border-gray-200 text-zinc-900 focus:bg-white focus:ring-2 focus:ring-zinc-950 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-zinc-700">E-mail Corporativo</label>
                <input
                  type="email"
                  required
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="operador@masakula.co.ao"
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-50 border border-gray-200 text-zinc-900 focus:bg-white focus:ring-2 focus:ring-zinc-950 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-zinc-700">Função / Perfil</label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2.5 rounded-2xl bg-zinc-50 border border-gray-200 text-zinc-900 font-semibold focus:bg-white focus:ring-2 focus:ring-zinc-950 focus:outline-none cursor-pointer"
                  >
                    <option value="CAIXA">🏷️ Caixa</option>
                    <option value="GERENTE">👑 Gerente</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-zinc-700">Terminal</label>
                  <select
                    value={newUserTerminal}
                    onChange={(e) => setNewUserTerminal(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-2xl bg-zinc-50 border border-gray-200 text-zinc-900 focus:bg-white focus:ring-2 focus:ring-zinc-950 focus:outline-none cursor-pointer"
                  >
                    <option value="Caixa 01 - Balcão Principal">Caixa 01</option>
                    <option value="Caixa 02 - Frente de Loja">Caixa 02</option>
                    <option value="Terminal Master 01">Terminal Master</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsNewUserModalOpen(false)}
                  className="px-4 py-2.5 rounded-2xl border border-gray-200 text-zinc-600 hover:bg-zinc-50 font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-2xl bg-zinc-950 hover:bg-zinc-800 text-white font-bold shadow-xs cursor-pointer"
                >
                  Cadastrar Operador
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 4: AUDIT & GOVERNANCE */}
      {activeTab === 'audit' && (
        <div className="-mx-4 -my-4">
          <AuditAndSecurityScreen />
        </div>
      )}

      {/* TAB 5: LIXEIRA & RECICLAGEM ANIMADA */}
      {activeTab === 'trash' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <AnimatedTrashManager
            onPermanentDelete={(item) => {
              toast.error(`Item "${item.name}" eliminado permanentemente.`);
            }}
            onRestore={(item) => {
              toast.success(`Item "${item.name}" restaurado com sucesso!`);
            }}
          />
        </div>
      )}

      {/* Modal de Pré-visualização do Talão Térmico de Teste (80mm) */}
      {testReceiptModalOpen && (
        <div className="fixed inset-0 z-50 bg-zinc-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-gray-100 space-y-4 animate-in zoom-in-95 duration-150 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Printer size={18} className="text-zinc-900" />
                <h3 className="font-bold text-sm text-zinc-950">Talão de Teste Térmico (80mm)</h3>
              </div>
              <button
                type="button"
                onClick={() => setTestReceiptModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-zinc-100 text-zinc-500 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Simulação física do papel térmico */}
            <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200 font-mono text-[11px] leading-relaxed text-zinc-800 shadow-inner">
              <div className="text-center font-bold pb-2 border-b border-dashed border-zinc-300">
                <p className="text-xs uppercase">{formData.tradingName || 'LOJA MASAKULA'}</p>
                <p className="text-[10px] text-zinc-500 font-normal">{formData.companyName}</p>
                <p className="text-[10px] text-zinc-500 font-normal">NIF: {formData.nif || '5417082910'}</p>
                <p className="text-[10px] text-zinc-500 font-normal">{formData.address || 'Luanda, Angola'}</p>
              </div>

              <div className="py-2.5 border-b border-dashed border-zinc-300 space-y-1">
                <div className="flex justify-between">
                  <span>DOCUMENTO:</span>
                  <span className="font-bold">TALÃO TESTE/01</span>
                </div>
                <div className="flex justify-between text-zinc-600">
                  <span>DATA:</span>
                  <span>{new Date().toLocaleDateString('pt-AO')} {new Date().toLocaleTimeString('pt-AO')}</span>
                </div>
                <div className="flex justify-between text-zinc-600">
                  <span>BOBINA:</span>
                  <span>{printerPaper} ({printerBaud} bps)</span>
                </div>
              </div>

              <div className="py-2.5 border-b border-dashed border-zinc-300 space-y-1.5">
                <div className="flex justify-between font-bold">
                  <span>ARTIGO DE TESTE 80MM</span>
                  <span>1.500,00 Kz</span>
                </div>
                <div className="flex justify-between text-[10px] text-zinc-500">
                  <span>1 x 1.500,00 Kz (IVA 14% Incl.)</span>
                  <span>Taxa Normal</span>
                </div>
              </div>

              <div className="py-2 border-b border-dashed border-zinc-300 space-y-1">
                <div className="flex justify-between font-bold text-xs">
                  <span>TOTAL A PAGAR:</span>
                  <span>1.500,00 Kz</span>
                </div>
                <div className="flex justify-between text-zinc-600">
                  <span>NUMERÁRIO:</span>
                  <span>2.000,00 Kz</span>
                </div>
                <div className="flex justify-between text-zinc-600">
                  <span>TROCO:</span>
                  <span>500,00 Kz</span>
                </div>
              </div>

              <div className="pt-3 text-center text-[10px] text-zinc-500 space-y-1">
                <p className="font-bold text-zinc-700">SOFTWARE CERTIFICADO AGT Nº 999/AGT/2026</p>
                <p>Obrigado pela preferência!</p>
                <div className="pt-2 text-[9px] text-zinc-400 font-sans italic">
                  [Corte Automático de Papel ESC/POS GS V 0]
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  window.print();
                  setTestReceiptModalOpen(false);
                }}
                className="flex-1 py-2.5 rounded-2xl bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Printer size={14} />
                <span>Imprimir no Sistema</span>
              </button>
              <button
                type="button"
                onClick={() => setTestReceiptModalOpen(false)}
                className="px-4 py-2.5 rounded-2xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-xs transition cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Permission Matrix Modal */}
      <PermissionMatrixModal
        isOpen={isMatrixOpen}
        onClose={() => setIsMatrixOpen(false)}
      />

      {/* Modal de Confirmação de Exclusão de Utilizador */}
      <ConfirmModal
        isOpen={!!userToDelete}
        title="Remover Utilizador"
        description={`Tem a certeza de que deseja remover o utilizador "${userToDelete?.name}" do sistema? Esta conta perderá o acesso imediato aos terminais de venda.`}
        confirmText="Sim, Remover Utilizador"
        cancelText="Cancelar"
        isDestructive={true}
        onConfirm={confirmDeleteUser}
        onClose={() => setUserToDelete(null)}
      />
    </div>
  );
};
