import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldAlert,
  ShieldCheck,
  Building2,
  Users,
  TrendingUp,
  BarChart3,
  Settings,
  Lock,
  Unlock,
  KeyRound,
  UserPlus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Coins,
  CreditCard,
  Banknote,
  Send,
  Sliders,
  DollarSign,
  Receipt,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Search,
  Filter,
  Save,
  RefreshCw,
  Clock,
  Laptop,
  Check,
  X,
  Eye,
  EyeOff
} from 'lucide-react';
import { 
  Product, 
  SaleTransaction, 
  CompanySettings, 
  UserSession, 
  Expense, 
  CashSession 
} from '../../types';
import { formatKz } from '../../utils/formatters';
import { useAuth, UserRole } from '../../contexts/AuthContext';
import { PermissionMatrixModal } from '../auth/PermissionMatrixModal';
import { UsersManagementPage } from './UsersManagementPage';
import { supabase } from '../../lib/supabase';

export interface AdminUserItem {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'operator' | 'technician';
  terminal: string;
  active: boolean;
  pin: string;
  phone?: string;
  lastLogin: string;
  permissions: {
    canCancelInvoices: boolean;
    canGiveDiscounts: boolean;
    canPerformSangria: boolean;
    canViewCostPrices: boolean;
    canExportSaft: boolean;
    canManageProducts: boolean;
  };
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  user: string;
  role: string;
  action: string;
  module: string;
  details: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface AdminDashboardViewProps {
  sales: SaleTransaction[];
  products: Product[];
  expenses: Expense[];
  cashSessions?: CashSession[];
  settings: CompanySettings;
  setSettings: React.Dispatch<React.SetStateAction<CompanySettings>>;
  userSession?: UserSession;
  onNavigateToTab?: (tab: string) => void;
}

const INITIAL_ADMIN_USERS: AdminUserItem[] = [
  {
    id: 'usr-admin-01',
    name: 'Miguel Worscoi',
    email: 'admin@masakula.co.ao',
    role: 'admin',
    terminal: 'Terminal Master 01 (HQ)',
    active: true,
    pin: '9988',
    phone: '+244 923 000 111',
    lastLogin: 'Hoje às 08:30',
    permissions: {
      canCancelInvoices: true,
      canGiveDiscounts: true,
      canPerformSangria: true,
      canViewCostPrices: true,
      canExportSaft: true,
      canManageProducts: true,
    },
  },
  {
    id: 'usr-manager-02',
    name: 'Sofia Manuel (Gerente de Loja)',
    email: 'gerencia@masakula.co.ao',
    role: 'manager',
    terminal: 'Caixa Principal 01',
    active: true,
    pin: '1234',
    phone: '+244 934 112 233',
    lastLogin: 'Hoje às 08:15',
    permissions: {
      canCancelInvoices: true,
      canGiveDiscounts: true,
      canPerformSangria: true,
      canViewCostPrices: true,
      canExportSaft: true,
      canManageProducts: true,
    },
  },
  {
    id: 'usr-cashier-03',
    name: 'Operador de Balcão 01',
    email: 'caixa01@masakula.co.ao',
    role: 'operator',
    terminal: 'Caixa 01 - Frente de Loja',
    active: true,
    pin: '0001',
    phone: '+244 945 223 344',
    lastLogin: 'Hoje às 08:00',
    permissions: {
      canCancelInvoices: false,
      canGiveDiscounts: false,
      canPerformSangria: false,
      canViewCostPrices: false,
      canExportSaft: false,
      canManageProducts: false,
    },
  },
  {
    id: 'usr-cashier-04',
    name: 'Operador de Balcão 02',
    email: 'caixa02@masakula.co.ao',
    role: 'operator',
    terminal: 'Caixa 02 - Frente de Loja',
    active: true,
    pin: '0002',
    phone: '+244 912 334 455',
    lastLogin: 'Ontem às 19:40',
    permissions: {
      canCancelInvoices: false,
      canGiveDiscounts: false,
      canPerformSangria: false,
      canViewCostPrices: false,
      canExportSaft: false,
      canManageProducts: false,
    },
  },
  {
    id: 'usr-tech-05',
    name: 'Técnico Especialista de Reparações',
    email: 'tecnico@masakula.co.ao',
    role: 'technician',
    terminal: 'Bancada Técnica O.S.',
    active: true,
    pin: '4455',
    phone: '+244 928 776 655',
    lastLogin: 'Hoje às 09:10',
    permissions: {
      canCancelInvoices: false,
      canGiveDiscounts: false,
      canPerformSangria: false,
      canViewCostPrices: false,
      canExportSaft: false,
      canManageProducts: true,
    },
  }
];

const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'log-01',
    timestamp: 'Hoje às 09:42',
    user: 'Miguel Worscoi',
    role: 'admin',
    action: 'Alteração de Configuração Fiscal AGT',
    module: 'Configurações',
    details: 'Atualizada série de faturação para FT MSK2026/01 com certificação ativa.',
    severity: 'medium',
  },
  {
    id: 'log-02',
    timestamp: 'Hoje às 09:15',
    user: 'Sofia Manuel',
    role: 'manager',
    action: 'Aprovação de Desconto Extraordinário',
    module: 'PDV',
    details: 'Autorizado desconto de 12% na fatura FT MSK2026/089 para cliente VIP.',
    severity: 'low',
  },
  {
    id: 'log-03',
    timestamp: 'Hoje às 08:30',
    user: 'Miguel Worscoi',
    role: 'admin',
    action: 'Login Administrativo Master',
    module: 'Autenticação',
    details: 'Sessão autenticada via IP 192.168.1.10 (Terminal Master 01).',
    severity: 'low',
  },
  {
    id: 'log-04',
    timestamp: 'Ontem às 18:45',
    user: 'Operador de Balcão 01',
    role: 'operator',
    action: 'Fechamento de Caixa com Apuração',
    module: 'Sessão de Caixa',
    details: 'Sessão diária encerrada sem quebra ou sobra de caixa (Kz 0,00).',
    severity: 'low',
  },
  {
    id: 'log-05',
    timestamp: 'Ontem às 16:10',
    user: 'Sofia Manuel',
    role: 'manager',
    action: 'Sangria de Caixa Autorizada',
    module: 'Caixa',
    details: 'Sangria de Kz 150.000,00 transferida para cofre central com comprovativo.',
    severity: 'medium',
  }
];

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  sales,
  products,
  expenses,
  cashSessions = [],
  settings,
  setSettings,
  userSession,
  onNavigateToTab,
}) => {
  const { profile, hasRole, switchRole } = useAuth();
  
  // Strict check: Only admin, manager, GERENTE, or Master session
  const isAuthorized = useMemo(() => {
    if (hasRole(['GERENTE'])) return true;
    const sessionRole = (userSession?.role || '').toLowerCase();
    return (
      sessionRole.includes('admin') || 
      sessionRole.includes('manager') || 
      sessionRole.includes('gerente') ||
      sessionRole.includes('master')
    );
  }, [hasRole, userSession]);

  // Main internal sub-tab state
  const [activeAdminSubTab, setActiveAdminSubTab] = useState<'metrics' | 'users' | 'settings' | 'audit'>('metrics');
  
  // Modals & Forms
  const [isMatrixOpen, setIsMatrixOpen] = useState(false);
  const [isNewUserModalOpen, setIsNewUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUserItem | null>(null);

  // Local state for Users
  const [adminUsers, setAdminUsers] = useState<AdminUserItem[]>(() => {
    try {
      const saved = localStorage.getItem('masakula_admin_users_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Erro ao carregar utilizadores administrativos:', e);
    }
    return INITIAL_ADMIN_USERS;
  });

  // Local state for Audit Logs
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => {
    try {
      const saved = localStorage.getItem('masakula_audit_logs_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Erro ao carregar logs:', e);
    }
    return INITIAL_AUDIT_LOGS;
  });

  // User search & filter
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'manager' | 'operator' | 'technician'>('all');

  // Company Settings Form State
  const [companyFormData, setCompanyFormData] = useState<CompanySettings>({ ...settings });
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [saveSettingsSuccess, setSaveSettingsSuccess] = useState(false);

  // New/Edit User Form State
  const [userFormName, setUserFormName] = useState('');
  const [userFormEmail, setUserFormEmail] = useState('');
  const [userFormRole, setUserFormRole] = useState<'admin' | 'manager' | 'operator' | 'technician'>('operator');
  const [userFormTerminal, setUserFormTerminal] = useState('Caixa 01 - Balcão Principal');
  const [userFormPin, setUserFormPin] = useState('');
  const [userFormPhone, setUserFormPhone] = useState('');
  const [userFormPermissions, setUserFormPermissions] = useState({
    canCancelInvoices: false,
    canGiveDiscounts: false,
    canPerformSangria: false,
    canViewCostPrices: false,
    canExportSaft: false,
    canManageProducts: false,
  });

  // Save users to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('masakula_admin_users_v1', JSON.stringify(adminUsers));
    } catch (e) {
      console.warn(e);
    }
  }, [adminUsers]);

  // Save audit logs to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('masakula_audit_logs_v1', JSON.stringify(auditLogs));
    } catch (e) {
      console.warn(e);
    }
  }, [auditLogs]);

  // Synchronize company settings if parent changes
  useEffect(() => {
    setCompanyFormData({ ...settings });
  }, [settings]);

  // ==========================================
  // CALCULATIONS: Global Sales & Business KPIs
  // ==========================================
  const metrics = useMemo(() => {
    const totalGrossSales = sales.reduce((acc, s) => acc + (s.total || 0), 0);
    const totalTransactions = sales.length;
    const avgTicket = totalTransactions > 0 ? totalGrossSales / totalTransactions : 0;
    
    const totalPaidExpenses = expenses
      .filter(e => e.status === 'PAID')
      .reduce((acc, e) => acc + (e.amount || 0), 0);

    const netOperatingProfit = totalGrossSales - totalPaidExpenses;
    const grossMarginPercent = totalGrossSales > 0 ? ((netOperatingProfit / totalGrossSales) * 100) : 0;

    // Payment methods breakdown
    let multicaixaTotal = 0;
    let cashTotal = 0;
    let transferTotal = 0;
    let otherTotal = 0;

    sales.forEach(s => {
      const amt = s.total || 0;
      const method = (s.paymentMethod || '').toUpperCase();
      if (method.includes('TPA') || method.includes('MULTICAIXA') || method.includes('CARTAO')) {
        multicaixaTotal += amt;
      } else if (method.includes('DINHEIRO') || method.includes('CASH') || method.includes('NUMERARIO')) {
        cashTotal += amt;
      } else if (method.includes('TRANSF') || method.includes('EXPRESS') || method.includes('BANCO')) {
        transferTotal += amt;
      } else {
        otherTotal += amt;
      }
    });

    // Fallback if sales list is empty in demo mode
    const displayGrossSales = totalGrossSales > 0 ? totalGrossSales : 4850900;
    const displayTransactions = totalTransactions > 0 ? totalTransactions : 38;
    const displayAvgTicket = totalTransactions > 0 ? avgTicket : (displayGrossSales / displayTransactions);
    const displayExpenses = totalPaidExpenses > 0 ? totalPaidExpenses : 620000;
    const displayNetProfit = displayGrossSales - displayExpenses;
    
    // Operator leaderboard computation
    const operatorMap: Record<string, { name: string; totalKz: number; tickets: number }> = {};
    sales.forEach(s => {
      const opName = s.attendantName || s.operatorName || 'Operador de Balcão';
      if (!operatorMap[opName]) {
        operatorMap[opName] = { name: opName, totalKz: 0, tickets: 0 };
      }
      operatorMap[opName].totalKz += s.total || 0;
      operatorMap[opName].tickets += 1;
    });

    let leaderboard = Object.values(operatorMap).sort((a, b) => b.totalKz - a.totalKz);
    if (leaderboard.length === 0) {
      leaderboard = [
        { name: 'Sofia Manuel (Gerente de Loja)', totalKz: 2150000, tickets: 16 },
        { name: 'Operador de Balcão 01', totalKz: 1850000, tickets: 14 },
        { name: 'Operador de Balcão 02', totalKz: 850900, tickets: 8 },
      ];
    }

    return {
      grossSales: displayGrossSales,
      transactions: displayTransactions,
      avgTicket: displayAvgTicket,
      expenses: displayExpenses,
      netProfit: displayNetProfit,
      grossMargin: grossMarginPercent > 0 ? grossMarginPercent : 87.2,
      multicaixa: multicaixaTotal > 0 ? multicaixaTotal : (displayGrossSales * 0.62),
      cash: cashTotal > 0 ? cashTotal : (displayGrossSales * 0.28),
      transfer: transferTotal > 0 ? transferTotal : (displayGrossSales * 0.10),
      leaderboard,
    };
  }, [sales, expenses]);

  // Filtered Users List
  const filteredUsers = useMemo(() => {
    return adminUsers.filter(u => {
      const matchesSearch = 
        u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.terminal.toLowerCase().includes(userSearch.toLowerCase());
      
      const matchesRole = roleFilter === 'all' || u.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [adminUsers, userSearch, roleFilter]);

  // ==========================================
  // HANDLERS: User Management
  // ==========================================
  const handleOpenCreateUser = () => {
    setEditingUser(null);
    setUserFormName('');
    setUserFormEmail('');
    setUserFormRole('operator');
    setUserFormTerminal('Caixa 01 - Balcão Principal');
    setUserFormPin('1234');
    setUserFormPhone('');
    setUserFormPermissions({
      canCancelInvoices: false,
      canGiveDiscounts: false,
      canPerformSangria: false,
      canViewCostPrices: false,
      canExportSaft: false,
      canManageProducts: false,
    });
    setIsNewUserModalOpen(true);
  };

  const handleOpenEditUser = (user: AdminUserItem) => {
    setEditingUser(user);
    setUserFormName(user.name);
    setUserFormEmail(user.email);
    setUserFormRole(user.role);
    setUserFormTerminal(user.terminal);
    setUserFormPin(user.pin || '1234');
    setUserFormPhone(user.phone || '');
    setUserFormPermissions({ ...user.permissions });
    setIsNewUserModalOpen(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userFormName.trim() || !userFormEmail.trim()) return;

    if (editingUser) {
      // Update existing
      setAdminUsers(prev => prev.map(u => {
        if (u.id === editingUser.id) {
          return {
            ...u,
            name: userFormName.trim(),
            email: userFormEmail.trim(),
            role: userFormRole,
            terminal: userFormTerminal,
            pin: userFormPin || '1234',
            phone: userFormPhone.trim(),
            permissions: { ...userFormPermissions },
          };
        }
        return u;
      }));

      // Log action
      addAuditLog(
        `Edição do Utilizador "${userFormName}"`,
        'Utilizadores',
        `Atualizado perfil, função (${userFormRole}) e permissões operacionais.`,
        'medium'
      );
    } else {
      // Create new
      const newUser: AdminUserItem = {
        id: `usr-${Date.now()}`,
        name: userFormName.trim(),
        email: userFormEmail.trim(),
        role: userFormRole,
        terminal: userFormTerminal,
        active: true,
        pin: userFormPin || '1234',
        phone: userFormPhone.trim(),
        lastLogin: 'Aguardando 1º acesso',
        permissions: { ...userFormPermissions },
      };

      setAdminUsers(prev => [newUser, ...prev]);

      // Log action
      addAuditLog(
        `Criação do Utilizador "${userFormName}"`,
        'Utilizadores',
        `Novo utilizador registado com perfil ${userFormRole} e terminal ${userFormTerminal}.`,
        'medium'
      );
    }

    setIsNewUserModalOpen(false);
  };

  const handleToggleUserActive = (user: AdminUserItem) => {
    setAdminUsers(prev => prev.map(u => {
      if (u.id === user.id) {
        const nextState = !u.active;
        addAuditLog(
          nextState ? `Reativação de Conta: ${u.name}` : `Desativação de Conta: ${u.name}`,
          'Segurança',
          `Conta do utilizador ${u.email} foi ${nextState ? 'reativada' : 'bloqueada temporariamente'}.`,
          nextState ? 'low' : 'high'
        );
        return { ...u, active: nextState };
      }
      return u;
    }));
  };

  const handleDeleteUser = (user: AdminUserItem) => {
    if (user.role === 'admin' && adminUsers.filter(u => u.role === 'admin').length <= 1) {
      alert('Não é permitido remover o único Administrador Master do sistema.');
      return;
    }

    if (window.confirm(`Tem certeza de que deseja eliminar definitivamente o utilizador "${user.name}"?`)) {
      setAdminUsers(prev => prev.filter(u => u.id !== user.id));
      addAuditLog(
        `Eliminação de Utilizador: ${user.name}`,
        'Utilizadores',
        `Registo de conta ${user.email} (#${user.id}) excluído do sistema.`,
        'high'
      );
    }
  };

  const addAuditLog = (action: string, module: string, details: string, severity: 'low' | 'medium' | 'high' | 'critical') => {
    const now = new Date();
    const timeStr = `Hoje às ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const newLog: AuditLogEntry = {
      id: `log-${Date.now()}`,
      timestamp: timeStr,
      user: profile?.full_name || userSession?.name || 'Administrador',
      role: (profile?.role || userSession?.role || 'admin').toLowerCase(),
      action,
      module,
      details,
      severity,
    };
    setAuditLogs(prev => [newLog, ...prev.slice(0, 49)]);
  };

  // ==========================================
  // HANDLERS: Company Settings Save
  // ==========================================
  const handleSaveCompanySettings = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);

    try {
      setSettings(companyFormData);
      setSaveSettingsSuccess(true);
      
      addAuditLog(
        'Atualização dos Parâmetros da Empresa e Fiscais',
        'Configurações',
        `Alterados dados da Razão Social (${companyFormData.legalName}), NIF (${companyFormData.nif}) e série ativa (${companyFormData.billingSeries}).`,
        'medium'
      );

      setTimeout(() => {
        setSaveSettingsSuccess(false);
        setIsSavingSettings(false);
      }, 2000);
    } catch (err) {
      console.error(err);
      setIsSavingSettings(false);
    }
  };

  // =========================================================================
  // ACCESS DENIED RENDERER (If authenticated profile is not admin or manager)
  // =========================================================================
  if (!isAuthorized) {
    return (
      <div 
        id="admin-access-restricted" 
        className="p-8 max-w-xl mx-auto my-12 bg-white rounded-3xl border border-gray-200/80 shadow-2xl text-center space-y-5 animate-in fade-in"
      >
        <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
          <ShieldAlert size={32} />
        </div>

        <div className="space-y-2">
          <span className="px-3.5 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-black uppercase tracking-wider">
            Acesso Restrito • Painel Administrativo
          </span>
          <h2 className="text-xl font-black text-zinc-950 tracking-tight">
            Módulo Exclusivo para Perfis 'Admin' e 'Manager'
          </h2>
          <p className="text-xs text-zinc-500 leading-relaxed max-w-md mx-auto">
            O seu perfil de utilizador atual não possui credenciais executivas para aceder às métricas globais de vendas, gestão de utilizadores e configurações fiscais corporativas.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-50 border border-gray-200 text-left text-xs text-zinc-600 space-y-1.5">
          <div className="font-bold text-zinc-900 flex items-center gap-1.5">
            <Lock size={14} className="text-amber-500" />
            <span>Política de Segurança Masakula (AGT):</span>
          </div>
          <p className="leading-relaxed">
            De acordo com as diretrizes de governança, o acesso a faturamento consolidado, alteração de séries fiscais e parametrização de permissões é estritamente reservado aos perfis <strong>Administrador Geral</strong> ou <strong>Gerente (Manager)</strong>.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsMatrixOpen(true)}
            className="w-full sm:w-auto px-4 py-2.5 rounded-2xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <ShieldCheck size={14} className="text-emerald-600" />
            <span>Consultar Matriz de Acessos</span>
          </button>

          <button
            type="button"
            onClick={() => switchRole('GERENTE')}
            className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
          >
            <span>Autenticar como Gerente</span>
            <ArrowUpRight size={14} className="text-[#E1FB15]" />
          </button>
        </div>

        <PermissionMatrixModal
          isOpen={isMatrixOpen}
          onClose={() => setIsMatrixOpen(false)}
        />
      </div>
    );
  }

  // =========================================================================
  // AUTHORIZED ADMIN PANEL RENDERER
  // =========================================================================
  return (
    <div id="view-admin-dashboard" className="space-y-6 animate-in fade-in duration-200 pb-12">
      {/* 👑 HEADER PRINCIPAL: Centro de Administração Executiva */}
      <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-zinc-950 text-[#E1FB15] flex items-center justify-center shadow-md flex-shrink-0">
            <ShieldCheck size={26} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-wider border border-emerald-200">
                Acesso Seguro • Admin & Manager
              </span>
              <span className="text-zinc-400 text-xs">•</span>
              <span className="text-xs text-zinc-500 font-mono">
                Sessão Ativa: <strong>{profile?.full_name || userSession?.name || 'Miguel Worscoi'}</strong>
              </span>
            </div>
            <h2 className="text-xl font-black text-zinc-950 tracking-tight mt-1">
              Painel Administrativo Centralizado
            </h2>
            <p className="text-xs text-zinc-400">
              Controlo executivo de vendas globais, gestão de equipa e parametrização corporativa AGT em Kwanzas (Kz)
            </p>
          </div>
        </div>

        {/* Status Badge & Global Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => setIsMatrixOpen(true)}
            className="px-3.5 py-2 rounded-2xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-zinc-200/80"
          >
            <KeyRound size={14} className="text-zinc-600" />
            <span>Matriz de Segurança</span>
          </button>

          <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Ambiente Faturador Conforme AGT</span>
          </div>
        </div>
      </div>

      {/* 🧭 NAVEGAÇÃO INTERNA ENTRE ABAS DO PAINEL ADMIN */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-2 overflow-x-auto select-none">
        <button
          type="button"
          onClick={() => setActiveAdminSubTab('metrics')}
          className={`px-4 py-2.5 rounded-2xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeAdminSubTab === 'metrics'
              ? 'bg-zinc-950 text-white shadow-xs'
              : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
          }`}
        >
          <TrendingUp size={15} className={activeAdminSubTab === 'metrics' ? 'text-[#E1FB15]' : 'text-zinc-500'} />
          <span>Métricas Globais de Vendas</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveAdminSubTab('users')}
          className={`px-4 py-2.5 rounded-2xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeAdminSubTab === 'users'
              ? 'bg-zinc-950 text-white shadow-xs'
              : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
          }`}
        >
          <Users size={15} className={activeAdminSubTab === 'users' ? 'text-[#E1FB15]' : 'text-zinc-500'} />
          <span>Gestão de Utilizadores</span>
          <span className="px-1.5 py-0.2 rounded-full bg-zinc-800 text-zinc-300 text-[10px] font-mono">
            {adminUsers.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveAdminSubTab('settings')}
          className={`px-4 py-2.5 rounded-2xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeAdminSubTab === 'settings'
              ? 'bg-zinc-950 text-white shadow-xs'
              : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
          }`}
        >
          <Building2 size={15} className={activeAdminSubTab === 'settings' ? 'text-[#E1FB15]' : 'text-zinc-500'} />
          <span>Configurações da Empresa & AGT</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveAdminSubTab('audit')}
          className={`px-4 py-2.5 rounded-2xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeAdminSubTab === 'audit'
              ? 'bg-zinc-950 text-white shadow-xs'
              : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
          }`}
        >
          <ShieldAlert size={15} className={activeAdminSubTab === 'audit' ? 'text-[#E1FB15]' : 'text-zinc-500'} />
          <span>Auditoria & Logs de Segurança</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* ABA 1: MÉTRICAS GLOBAIS DE VENDAS & RENTABILIDADE                        */}
      {/* ========================================================================= */}
      {activeAdminSubTab === 'metrics' && (
        <div className="space-y-6">
          {/* 4 Cards Principais de Indicadores Financeiros */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Faturação Bruta Total */}
            <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-xs flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-400">
                  Faturação Bruta Consolidada
                </span>
                <span className="p-2 rounded-2xl bg-emerald-50 text-emerald-600">
                  <Coins size={18} />
                </span>
              </div>
              <div className="mt-3">
                <h3 className="text-2xl font-black text-zinc-950 tracking-tight font-mono">
                  {formatKz(metrics.grossSales)}
                </h3>
                <p className="text-[11px] text-emerald-600 flex items-center gap-1 mt-1 font-semibold">
                  <ArrowUpRight size={13} /> {metrics.transactions} talões e faturas emitidas
                </p>
              </div>
            </div>

            {/* Ticket Médio Global */}
            <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-xs flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-400">
                  Ticket Médio por Venda
                </span>
                <span className="p-2 rounded-2xl bg-blue-50 text-blue-600">
                  <Receipt size={18} />
                </span>
              </div>
              <div className="mt-3">
                <h3 className="text-2xl font-black text-zinc-950 tracking-tight font-mono">
                  {formatKz(metrics.avgTicket)}
                </h3>
                <p className="text-[11px] text-zinc-500 mt-1">
                  Média ponderada de consumo por cliente
                </p>
              </div>
            </div>

            {/* Despesas Operacionais Totais */}
            <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-xs flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-400">
                  Despesas Liquidadas
                </span>
                <span className="p-2 rounded-2xl bg-rose-50 text-rose-600">
                  <ArrowDownRight size={18} />
                </span>
              </div>
              <div className="mt-3">
                <h3 className="text-2xl font-black text-rose-600 tracking-tight font-mono">
                  {formatKz(metrics.expenses)}
                </h3>
                <p className="text-[11px] text-zinc-500 mt-1">
                  Custos fixos, saídas e fornecedores pagos
                </p>
              </div>
            </div>

            {/* Lucro Operacional Líquido */}
            <div className="bg-zinc-950 text-white rounded-3xl p-5 shadow-xl flex flex-col justify-between relative overflow-hidden">
              <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-[#E1FB15]/10 rounded-full blur-xl pointer-events-none" />
              <div className="flex justify-between items-start relative z-10">
                <span className="text-[11px] font-black uppercase tracking-wider text-[#E1FB15]">
                  Resultado Líquido do Período
                </span>
                <span className="p-2 rounded-2xl bg-zinc-900 text-[#E1FB15] border border-zinc-800">
                  <Activity size={18} />
                </span>
              </div>
              <div className="mt-3 relative z-10">
                <h3 className="text-2xl font-black text-white tracking-tight font-mono">
                  {formatKz(metrics.netProfit)}
                </h3>
                <div className="flex items-center justify-between text-[11px] text-zinc-400 mt-1">
                  <span>Margem Operacional:</span>
                  <span className="font-bold text-[#E1FB15] font-mono">{metrics.grossMargin.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Segunda linha: Breakdown por Método de Pagamento & Ranking de Atendentes */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Distribuição por Método de Pagamento */}
            <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-xs flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <CreditCard size={18} className="text-zinc-700" />
                  <h4 className="font-extrabold text-sm text-zinc-900">
                    Métodos de Liquidação
                  </h4>
                </div>
                <span className="text-[10px] uppercase font-mono font-bold text-zinc-400">
                  Mix de Caixa
                </span>
              </div>

              <div className="space-y-3.5">
                {/* Multicaixa / TPA */}
                <div>
                  <div className="flex justify-between text-xs font-bold text-zinc-700 mb-1">
                    <span className="flex items-center gap-1.5">
                      <CreditCard size={14} className="text-blue-600" />
                      Multicaixa / TPA
                    </span>
                    <span className="font-mono">{formatKz(metrics.multicaixa)}</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-600 rounded-full"
                      style={{ width: `${(metrics.multicaixa / metrics.grossSales) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Dinheiro Vivo / Cash */}
                <div>
                  <div className="flex justify-between text-xs font-bold text-zinc-700 mb-1">
                    <span className="flex items-center gap-1.5">
                      <Banknote size={14} className="text-emerald-600" />
                      Numerário / Dinheiro
                    </span>
                    <span className="font-mono">{formatKz(metrics.cash)}</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${(metrics.cash / metrics.grossSales) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Transferência Bancária Instantânea */}
                <div>
                  <div className="flex justify-between text-xs font-bold text-zinc-700 mb-1">
                    <span className="flex items-center gap-1.5">
                      <Send size={14} className="text-purple-600" />
                      Transferência Express
                    </span>
                    <span className="font-mono">{formatKz(metrics.transfer)}</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-purple-600 rounded-full"
                      style={{ width: `${(metrics.transfer / metrics.grossSales) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-zinc-500">
                <span>Retenção de IVA (14%):</span>
                <span className="font-mono font-bold text-zinc-800">
                  {formatKz(metrics.grossSales * 0.14)}
                </span>
              </div>
            </div>

            {/* Ranking de Produtividade dos Atendentes/Caixas */}
            <div className="lg:col-span-2 bg-white border border-gray-100 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <Users size={18} className="text-zinc-700" />
                  <div>
                    <h4 className="font-extrabold text-sm text-zinc-900">
                      Produtividade e Vendas por Atendente
                    </h4>
                    <p className="text-[11px] text-zinc-400">
                      Desempenho individual nos terminais de balcão e frente de loja
                    </p>
                  </div>
                </div>

                {onNavigateToTab && (
                  <button
                    type="button"
                    onClick={() => onNavigateToTab('goals')}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                  >
                    <span>Ver Metas Detalhadas</span>
                    <ArrowUpRight size={14} />
                  </button>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 text-zinc-400 font-bold uppercase text-[10px]">
                      <th className="pb-2.5">Atendente / Operador</th>
                      <th className="pb-2.5 text-center">Nº Atendimentos</th>
                      <th className="pb-2.5 text-right">Ticket Médio</th>
                      <th className="pb-2.5 text-right">Volume Faturado (Kz)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {metrics.leaderboard.map((op, idx) => (
                      <tr key={idx} className="hover:bg-zinc-50/80 transition-colors">
                        <td className="py-3 font-semibold text-zinc-800 flex items-center gap-2">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                            idx === 0 ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-zinc-600'
                          }`}>
                            {idx + 1}
                          </span>
                          <span>{op.name}</span>
                        </td>
                        <td className="py-3 text-center font-mono font-medium text-zinc-600">
                          {op.tickets} tickets
                        </td>
                        <td className="py-3 text-right font-mono font-medium text-zinc-600">
                          {formatKz(op.tickets > 0 ? op.totalKz / op.tickets : 0)}
                        </td>
                        <td className="py-3 text-right font-mono font-bold text-zinc-950">
                          {formatKz(op.totalKz)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 2: GESTÃO DE UTILIZADORES & PERMISSÕES                                 */}
      {/* ========================================================================= */}
      {activeAdminSubTab === 'users' && (
        <div className="space-y-6">
          {/* Barra de Ações e Filtros de Utilizadores */}
          <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Pesquisar por nome, email ou terminal..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-2xl bg-zinc-50 border border-gray-200 text-xs text-zinc-900 focus:outline-none focus:border-zinc-900"
                />
              </div>

              {/* Filtro por Role */}
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as any)}
                className="px-3 py-2 rounded-2xl bg-zinc-50 border border-gray-200 text-xs font-semibold text-zinc-700 focus:outline-none focus:border-zinc-900"
              >
                <option value="all">Todas as Funções</option>
                <option value="admin">Administradores (Admin)</option>
                <option value="manager">Gerentes (Manager)</option>
                <option value="operator">Operadores de Balcão</option>
                <option value="technician">Técnicos</option>
              </select>
            </div>

            <button
              type="button"
              onClick={handleOpenCreateUser}
              className="px-4 py-2.5 rounded-2xl bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <UserPlus size={15} className="text-[#E1FB15]" />
              <span>Adicionar Utilizador</span>
            </button>
          </div>

          {/* Tabela de Utilizadores */}
          <div className="bg-white border border-gray-100 rounded-3xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-zinc-50/80 border-b border-gray-100 text-zinc-400 font-extrabold uppercase text-[10px]">
                    <th className="py-3.5 px-5">Colaborador / Email</th>
                    <th className="py-3.5 px-4">Função / Perfil</th>
                    <th className="py-3.5 px-4">Terminal Associado</th>
                    <th className="py-3.5 px-4 text-center">PIN de Caixa</th>
                    <th className="py-3.5 px-4">Estado</th>
                    <th className="py-3.5 px-4">Último Acesso</th>
                    <th className="py-3.5 px-5 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredUsers.map((user) => {
                    const roleBadge = 
                      user.role === 'admin' 
                        ? 'bg-purple-100 text-purple-800 border-purple-200' 
                        : user.role === 'manager'
                        ? 'bg-blue-100 text-blue-800 border-blue-200'
                        : user.role === 'technician'
                        ? 'bg-amber-100 text-amber-800 border-amber-200'
                        : 'bg-zinc-100 text-zinc-800 border-zinc-200';

                    const roleLabel = 
                      user.role === 'admin' ? 'Administrador' :
                      user.role === 'manager' ? 'Gerente (Manager)' :
                      user.role === 'technician' ? 'Técnico O.S.' : 'Operador de Caixa';

                    return (
                      <tr key={user.id} className="hover:bg-zinc-50/60 transition-colors">
                        {/* Nome & Email */}
                        <td className="py-3.5 px-5">
                          <div className="font-bold text-zinc-900">{user.name}</div>
                          <div className="text-[11px] text-zinc-400 font-mono">{user.email}</div>
                        </td>

                        {/* Função */}
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${roleBadge}`}>
                            {roleLabel}
                          </span>
                        </td>

                        {/* Terminal */}
                        <td className="py-3.5 px-4 text-zinc-600 font-medium">
                          <div className="flex items-center gap-1.5">
                            <Laptop size={13} className="text-zinc-400" />
                            <span>{user.terminal}</span>
                          </div>
                        </td>

                        {/* PIN */}
                        <td className="py-3.5 px-4 text-center">
                          <span className="font-mono bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded-md text-[11px] font-bold">
                            ••••
                          </span>
                        </td>

                        {/* Estado */}
                        <td className="py-3.5 px-4">
                          {user.active ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Ativo
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                              Inativo / Bloqueado
                            </span>
                          )}
                        </td>

                        {/* Último Acesso */}
                        <td className="py-3.5 px-4 text-[11px] text-zinc-500">
                          {user.lastLogin}
                        </td>

                        {/* Ações */}
                        <td className="py-3.5 px-5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleToggleUserActive(user)}
                              className={`p-1.5 rounded-xl border transition-colors cursor-pointer ${
                                user.active 
                                  ? 'bg-zinc-50 hover:bg-zinc-100 text-zinc-600 border-gray-200' 
                                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                              }`}
                              title={user.active ? 'Bloquear/Desativar conta' : 'Reativar conta'}
                            >
                              {user.active ? <Lock size={13} /> : <Unlock size={13} />}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenEditUser(user)}
                              className="p-1.5 rounded-xl bg-zinc-50 hover:bg-zinc-100 text-zinc-700 border border-gray-200 transition-colors cursor-pointer"
                              title="Editar utilizador e permissões"
                            >
                              <Edit2 size={13} />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteUser(user)}
                              className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition-colors cursor-pointer"
                              title="Remover utilizador"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 3: CONFIGURAÇÕES DA EMPRESA & PARÂMETROS FISCAIS AGT                  */}
      {/* ========================================================================= */}
      {activeAdminSubTab === 'settings' && (
        <form onSubmit={handleSaveCompanySettings} className="space-y-6 text-xs">
          {/* Identificação Fiscal & Corporativa */}
          <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <Building2 size={18} className="text-zinc-700" />
                <h4 className="font-extrabold text-sm text-zinc-900">
                  Identificação Fiscal & Dados da Empresa
                </h4>
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Certificação AGT
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-bold text-zinc-700">Razão Social Oficial</label>
                <input
                  type="text"
                  value={companyFormData.legalName}
                  onChange={(e) => setCompanyFormData(prev => ({ ...prev, legalName: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-50 border border-gray-200 text-zinc-900 font-medium focus:outline-none focus:border-zinc-900"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-zinc-700">Nome Comercial da Loja</label>
                <input
                  type="text"
                  value={companyFormData.tradeName}
                  onChange={(e) => setCompanyFormData(prev => ({ ...prev, tradeName: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-50 border border-gray-200 text-zinc-900 font-medium focus:outline-none focus:border-zinc-900"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-zinc-700">NIF (Número de Identificação Fiscal - Angola)</label>
                <input
                  type="text"
                  value={companyFormData.nif}
                  onChange={(e) => setCompanyFormData(prev => ({ ...prev, nif: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-50 border border-gray-200 text-zinc-900 font-mono font-bold focus:outline-none focus:border-zinc-900"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-zinc-700">Cidade & Província</label>
                <input
                  type="text"
                  value={companyFormData.city}
                  onChange={(e) => setCompanyFormData(prev => ({ ...prev, city: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-50 border border-gray-200 text-zinc-900 font-medium focus:outline-none focus:border-zinc-900"
                />
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="font-bold text-zinc-700">Endereço Completo</label>
                <input
                  type="text"
                  value={companyFormData.address}
                  onChange={(e) => setCompanyFormData(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-50 border border-gray-200 text-zinc-900 font-medium focus:outline-none focus:border-zinc-900"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-zinc-700">Telefone de Contacto</label>
                <input
                  type="text"
                  value={companyFormData.phone}
                  onChange={(e) => setCompanyFormData(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-50 border border-gray-200 text-zinc-900 font-medium focus:outline-none focus:border-zinc-900"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-zinc-700">Email Corporativo</label>
                <input
                  type="email"
                  value={companyFormData.email}
                  onChange={(e) => setCompanyFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-50 border border-gray-200 text-zinc-900 font-medium focus:outline-none focus:border-zinc-900"
                />
              </div>
            </div>
          </div>

          {/* Parâmetros Fiscais AGT & SAF-T AO */}
          <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
              <FileSpreadsheet size={18} className="text-zinc-700" />
              <h4 className="font-extrabold text-sm text-zinc-900">
                Parâmetros Fiscais AGT & Séries de Faturação
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="font-bold text-zinc-700">Série de Faturação Ativa</label>
                <input
                  type="text"
                  value={companyFormData.billingSeries}
                  onChange={(e) => setCompanyFormData(prev => ({ ...prev, billingSeries: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-50 border border-gray-200 text-zinc-900 font-mono font-bold focus:outline-none focus:border-zinc-900"
                />
                <span className="text-[10px] text-zinc-400">Exemplo: FT MSK2026/01</span>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-zinc-700">Regime de IVA</label>
                <select
                  value={companyFormData.taxRegime}
                  onChange={(e) => setCompanyFormData(prev => ({ ...prev, taxRegime: e.target.value as any }))}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-50 border border-gray-200 text-zinc-900 font-semibold focus:outline-none focus:border-zinc-900"
                >
                  <option value="GERAL">Regime Geral (IVA 14%)</option>
                  <option value="SIMPLIFICADO">Regime Simplificado (IVA 7%)</option>
                  <option value="EXCLUSAO">Regime de Exclusão / Isento</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-zinc-700">Moeda Padrão de Circulação</label>
                <input
                  type="text"
                  value="Kwanza Angolano (Kz / AOA)"
                  disabled
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-100 border border-gray-200 text-zinc-600 font-bold cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Políticas de Segurança & Controlo Operacional */}
          <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
              <Sliders size={18} className="text-zinc-700" />
              <h4 className="font-extrabold text-sm text-zinc-900">
                Políticas Comerciais & Segurança Operacional
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-zinc-50 border border-gray-200/80 space-y-2">
                <label className="font-bold text-zinc-800 block">
                  Desconto Máximo sem Autorização de Gerente
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="20"
                    defaultValue="5"
                    className="w-24 px-3.5 py-2 rounded-xl bg-white border border-gray-200 text-zinc-900 font-mono font-bold focus:outline-none focus:border-zinc-900"
                  />
                  <span className="font-bold text-zinc-600">% no total da venda</span>
                </div>
                <p className="text-[10px] text-zinc-500">
                  Descontos acima desta percentagem solicitam o PIN de um Administrador ou Gerente.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-50 border border-gray-200/80 space-y-2">
                <label className="font-bold text-zinc-800 block">
                  Bloqueio Automático por Inatividade
                </label>
                <div className="flex items-center gap-2">
                  <select
                    defaultValue="15"
                    className="px-3.5 py-2 rounded-xl bg-white border border-gray-200 text-zinc-900 font-semibold focus:outline-none focus:border-zinc-900"
                  >
                    <option value="5">5 minutos</option>
                    <option value="15">15 minutos (Padrão)</option>
                    <option value="30">30 minutos</option>
                    <option value="60">60 minutos</option>
                  </select>
                </div>
                <p className="text-[10px] text-zinc-500">
                  Exige PIN para desbloquear o terminal de balcão após o período sem atividade.
                </p>
              </div>
            </div>
          </div>

          {/* Botão de Gravação com Feedback */}
          <div className="flex items-center justify-end gap-3 pt-2">
            {saveSettingsSuccess && (
              <div className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-xs animate-in fade-in">
                <CheckCircle2 size={16} />
                <span>Configurações corporativas gravadas com sucesso!</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSavingSettings}
              className="px-6 py-3 rounded-2xl bg-zinc-950 hover:bg-zinc-800 text-white font-black text-xs flex items-center gap-2 transition-all shadow-md cursor-pointer disabled:opacity-50"
            >
              {isSavingSettings ? (
                <RefreshCw size={15} className="animate-spin text-[#E1FB15]" />
              ) : (
                <Save size={15} className="text-[#E1FB15]" />
              )}
              <span>Guardar Alterações da Empresa</span>
            </button>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* ABA 4: AUDITORIA & LOGS DE SEGURANÇA                                      */}
      {/* ========================================================================= */}
      {activeAdminSubTab === 'audit' && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert size={18} className="text-zinc-700" />
                <div>
                  <h4 className="font-extrabold text-sm text-zinc-900">
                    Trilha de Auditoria & Ações Administrativas Críticas
                  </h4>
                  <p className="text-[11px] text-zinc-400">
                    Registo em tempo real para conformidade AGT e controlo interno
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono text-zinc-400 bg-zinc-100 px-2.5 py-1 rounded-full">
                {auditLogs.length} eventos registados
              </span>
            </div>

            <div className="space-y-3">
              {auditLogs.map((log) => {
                const severityConfig = 
                  log.severity === 'critical' || log.severity === 'high'
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : log.severity === 'medium'
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-zinc-50 text-zinc-700 border-gray-200';

                return (
                  <div 
                    key={log.id}
                    className="p-4 rounded-2xl bg-zinc-50/70 border border-gray-200/60 hover:bg-zinc-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase border ${severityConfig}`}>
                          {log.module}
                        </span>
                        <strong className="text-zinc-900 font-bold">{log.action}</strong>
                      </div>
                      <p className="text-zinc-600 text-[11px]">{log.details}</p>
                    </div>

                    <div className="text-right flex-shrink-0 text-[11px]">
                      <div className="font-semibold text-zinc-900">{log.user}</div>
                      <div className="text-zinc-400 text-[10px] font-mono">{log.timestamp}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CRIAR OU EDITAR UTILIZADOR COM PERMISSÕES GRANULARES               */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isNewUserModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl max-w-lg w-full border border-gray-100 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="p-5 bg-zinc-950 text-white flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#E1FB15]/10 text-[#E1FB15] border border-[#E1FB15]/20 flex items-center justify-center">
                    <UserPlus size={16} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm">
                      {editingUser ? 'Editar Utilizador & Acessos' : 'Adicionar Novo Utilizador'}
                    </h3>
                    <p className="text-[10px] text-zinc-400">
                      Definição de perfil, terminal e permissões granulares
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsNewUserModalOpen(false)}
                  className="p-1 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleSaveUser} className="p-6 space-y-4 overflow-y-auto text-xs flex-1">
                <div className="space-y-1">
                  <label className="font-bold text-zinc-700">Nome Completo</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Manuel dos Santos"
                    value={userFormName}
                    onChange={(e) => setUserFormName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-50 border border-gray-200 text-zinc-900 font-medium focus:outline-none focus:border-zinc-900"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-zinc-700">Email de Acesso</label>
                    <input
                      type="email"
                      required
                      placeholder="usuario@masakula.co.ao"
                      value={userFormEmail}
                      onChange={(e) => setUserFormEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-50 border border-gray-200 text-zinc-900 font-medium focus:outline-none focus:border-zinc-900"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-zinc-700">Telefone</label>
                    <input
                      type="text"
                      placeholder="+244 9..."
                      value={userFormPhone}
                      onChange={(e) => setUserFormPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-50 border border-gray-200 text-zinc-900 font-medium focus:outline-none focus:border-zinc-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-zinc-700">Função / Perfil</label>
                    <select
                      value={userFormRole}
                      onChange={(e) => setUserFormRole(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-50 border border-gray-200 text-zinc-900 font-semibold focus:outline-none focus:border-zinc-900"
                    >
                      <option value="operator">Operador de Balcão (Caixa)</option>
                      <option value="manager">Gerente de Loja (Manager)</option>
                      <option value="admin">Administrador Master</option>
                      <option value="technician">Técnico de Reparações O.S.</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-zinc-700">PIN de Autorização Rápida</label>
                    <input
                      type="password"
                      maxLength={6}
                      placeholder="Ex: 1234"
                      value={userFormPin}
                      onChange={(e) => setUserFormPin(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-50 border border-gray-200 text-zinc-900 font-mono font-bold tracking-widest focus:outline-none focus:border-zinc-900"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-zinc-700">Terminal Padrão Associado</label>
                  <input
                    type="text"
                    value={userFormTerminal}
                    onChange={(e) => setUserFormTerminal(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-50 border border-gray-200 text-zinc-900 font-medium focus:outline-none focus:border-zinc-900"
                  />
                </div>

                {/* Matriz de Permissões Granulares */}
                <div className="pt-2 space-y-2 border-t border-gray-100">
                  <label className="font-extrabold text-zinc-900 block">
                    Permissões Operacionais Granulares:
                  </label>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer text-zinc-700">
                      <input
                        type="checkbox"
                        checked={userFormPermissions.canCancelInvoices}
                        onChange={(e) => setUserFormPermissions(prev => ({ ...prev, canCancelInvoices: e.target.checked }))}
                        className="rounded border-gray-300 text-zinc-950 focus:ring-zinc-950"
                      />
                      <span>Pode anular faturas emitidas e notas de crédito</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-zinc-700">
                      <input
                        type="checkbox"
                        checked={userFormPermissions.canGiveDiscounts}
                        onChange={(e) => setUserFormPermissions(prev => ({ ...prev, canGiveDiscounts: e.target.checked }))}
                        className="rounded border-gray-300 text-zinc-950 focus:ring-zinc-950"
                      />
                      <span>Pode conceder descontos superiores ao limite padrão</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-zinc-700">
                      <input
                        type="checkbox"
                        checked={userFormPermissions.canPerformSangria}
                        onChange={(e) => setUserFormPermissions(prev => ({ ...prev, canPerformSangria: e.target.checked }))}
                        className="rounded border-gray-300 text-zinc-950 focus:ring-zinc-950"
                      />
                      <span>Pode realizar sangrias e saídas de caixa</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-zinc-700">
                      <input
                        type="checkbox"
                        checked={userFormPermissions.canExportSaft}
                        onChange={(e) => setUserFormPermissions(prev => ({ ...prev, canExportSaft: e.target.checked }))}
                        className="rounded border-gray-300 text-zinc-950 focus:ring-zinc-950"
                      />
                      <span>Pode gerar e exportar ficheiro SAF-T AO para AGT</span>
                    </label>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="pt-4 flex items-center justify-end gap-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setIsNewUserModalOpen(false)}
                    className="px-4 py-2.5 rounded-2xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-xs cursor-pointer"
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-2xl bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <Check size={14} className="text-[#E1FB15]" />
                    <span>{editingUser ? 'Guardar Alterações' : 'Criar Utilizador'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <PermissionMatrixModal
        isOpen={isMatrixOpen}
        onClose={() => setIsMatrixOpen(false)}
      />
    </div>
  );
};
