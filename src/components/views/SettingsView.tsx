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
  Edit2
} from 'lucide-react';
import { CompanySettings } from '../../types';
import { useAuth, UserRole } from '../../contexts/AuthContext';
import { PermissionMatrixModal } from '../auth/PermissionMatrixModal';
import AuditAndSecurityScreen from '../AuditAndSecurityScreen';

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

  const [activeTab, setActiveTab] = useState<'fiscal' | 'hardware' | 'users' | 'audit'>('fiscal');
  const [formData, setFormData] = useState<CompanySettings>({ ...settings });
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isMatrixOpen, setIsMatrixOpen] = useState(false);

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
    if (window.confirm(`Tem certeza de que deseja remover o utilizador "${name}"?`)) {
      setOperators(prev => prev.filter(op => op.id !== id));
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
        <form onSubmit={handleSubmit} className="space-y-6 text-xs">
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
                  className="w-4 h-4 rounded text-zinc-950 focus:ring-zinc-950 cursor-pointer"
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
                  className="w-4 h-4 rounded text-zinc-950 focus:ring-zinc-950 cursor-pointer"
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
                  className="w-4 h-4 rounded text-zinc-950 focus:ring-zinc-950 cursor-pointer"
                />
                <div>
                  <span className="font-bold text-zinc-900 block">Sinais sonoros de leitor de código de barras</span>
                  <span className="text-[11px] text-zinc-500">Toca confirmação sonora ao registar artigos no carrinho</span>
                </div>
              </label>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              id="btn-save-hardware-settings"
              type="submit"
              className="px-6 py-3 rounded-2xl bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <Save size={16} className="text-emerald-400" />
              <span>Guardar Hardware</span>
            </button>
          </div>
        </form>
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

      {/* Permission Matrix Modal */}
      <PermissionMatrixModal
        isOpen={isMatrixOpen}
        onClose={() => setIsMatrixOpen(false)}
      />
    </div>
  );
};
