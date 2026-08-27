import React, { useState } from 'react';
import { 
  Lock, 
  Mail, 
  KeyRound, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  Building2, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  ArrowLeft, 
  UserCheck, 
  Monitor, 
  Zap, 
  Smartphone, 
  Store,
  LayoutGrid,
  ChevronRight
} from 'lucide-react';
import { UserSession } from '../../types';

interface LoginModalProps {
  onLoginSuccess: (session: UserSession) => void;
  onBackToOnboarding: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  onLoginSuccess,
  onBackToOnboarding,
}) => {
  // Step State: 1 = Credentials, 2 = Terminal & Profile selection
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);

  // Form State
  const [email, setEmail] = useState('miguelworscoi@gmail.com');
  const [password, setPassword] = useState('admin2026');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Step 2 Selection State
  const [selectedTerminal, setSelectedTerminal] = useState('Caixa 01 - Balcão Principal');
  const [selectedRole, setSelectedRole] = useState<'Administrador' | 'Operador de Caixa' | 'Técnico de Serviços'>('Administrador');

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loginSuccessNotice, setLoginSuccessNotice] = useState(false);

  // Handle Step 1 Validation & Proceed to Step 2
  const handleProceedToStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email || !email.includes('@')) {
      setErrorMessage('Por favor, introduza um endereço de e-mail corporativo válido.');
      return;
    }

    if (!password || password.trim().length < 4) {
      setErrorMessage('A palavra-passe deve conter pelo menos 4 caracteres.');
      return;
    }

    setCurrentStep(2);
  };

  // Handle Final Submission (Step 2)
  const handleFinalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    // Simulate authentication verification
    setTimeout(() => {
      setIsSubmitting(false);
      setLoginSuccessNotice(true);

      const session: UserSession = {
        email: email.trim(),
        name: email.split('@')[0].replace('.', ' ').toUpperCase(),
        role: selectedRole,
        terminalId: selectedTerminal,
        isLoggedIn: true,
      };

      setTimeout(() => {
        onLoginSuccess(session);
      }, 500);
    }, 800);
  };

  // Quick fill demo accounts
  const handleQuickFill = (role: 'admin' | 'cashier') => {
    if (role === 'admin') {
      setEmail('miguelworscoi@gmail.com');
      setPassword('admin2026');
      setSelectedRole('Administrador');
      setSelectedTerminal('Caixa 01 - Balcão Principal');
    } else {
      setEmail('caixa.operador@masakula.co.ao');
      setPassword('operador2026');
      setSelectedRole('Operador de Caixa');
      setSelectedTerminal('Caixa 02 - Frente de Loja');
    }
  };

  return (
    <div 
      id="view-login-modal-container"
      className="min-h-screen w-full bg-[#f8f9fa] flex items-center justify-center p-4 sm:p-6 font-sans relative overflow-hidden"
    >
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px] opacity-70 pointer-events-none" />
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-red-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Main Corporate Login Card */}
      <div 
        id="login-corporate-card" 
        className="relative z-10 w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/90 shadow-2xl shadow-zinc-950/5 space-y-6"
      >
        {/* Indicador de etapas no topo: 1 -> 2 -> Ícone de Cadeado azul ativo -> Ícone de Grid */}
        <div id="login-top-step-flow" className="flex items-center justify-between px-3 py-2 rounded-2xl bg-zinc-50 border border-gray-100">
          {/* Step 1 */}
          <div className="flex items-center gap-1.5">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-all ${
              currentStep === 1
                ? 'bg-zinc-950 text-white shadow-xs'
                : 'bg-emerald-500 text-white'
            }`}>
              {currentStep > 1 ? '✓' : '1'}
            </span>
            <span className={`text-[11px] font-semibold hidden sm:inline ${currentStep === 1 ? 'text-zinc-900' : 'text-zinc-500'}`}>
              Conta
            </span>
          </div>

          <ChevronRight size={14} className="text-zinc-400" />

          {/* Step 2 */}
          <div className="flex items-center gap-1.5">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-all ${
              currentStep === 2
                ? 'bg-zinc-950 text-white shadow-xs'
                : 'bg-zinc-200 text-zinc-600'
            }`}>
              2
            </span>
            <span className={`text-[11px] font-semibold hidden sm:inline ${currentStep === 2 ? 'text-zinc-900' : 'text-zinc-400'}`}>
              Terminal
            </span>
          </div>

          <ChevronRight size={14} className="text-zinc-400" />

          {/* Ícone de Cadeado azul ativo */}
          <div 
            id="step-indicator-lock"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-600 text-white text-[11px] font-bold shadow-xs shadow-blue-600/20"
            title="Conexão Segura Ativa"
          >
            <Lock size={12} className="text-white" />
            <span className="text-[10px] uppercase tracking-wider">Seguro</span>
          </div>

          <ChevronRight size={14} className="text-zinc-400" />

          {/* Ícone de Grid */}
          <div 
            id="step-indicator-grid"
            className="w-7 h-7 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-500"
            title="Módulo ERP & Painel Geral"
          >
            <LayoutGrid size={14} />
          </div>
        </div>

        {/* Corporate Brand Header: Logótipo "MK" e Slogan "Um nome, várias soluções" */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-3">
            {/* MK Emblem Logo */}
            <div className="w-11 h-11 rounded-2xl bg-zinc-950 flex items-center justify-center text-white font-black text-base relative shadow-md shadow-zinc-950/10">
              <span className="tracking-tighter">MK</span>
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-white" />
            </div>
            <div>
              <div className="flex items-baseline gap-1.5">
                <h1 className="font-extrabold text-base tracking-tight text-zinc-950">MASAKULA</h1>
                <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider bg-red-50 px-1.5 py-0.5 rounded-md border border-red-100">
                  ERP
                </span>
              </div>
              <p className="text-xs text-zinc-500 font-medium italic">
                Um nome, várias soluções
              </p>
            </div>
          </div>

          {/* AGT Certification Tag */}
          <div 
            id="security-lock-badge"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/80 text-[10px] font-semibold"
          >
            <ShieldCheck size={12} className="text-emerald-600" />
            <span>AGT Homologado</span>
          </div>
        </div>

        {/* Form Content Area */}
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-zinc-950">
            {currentStep === 1 ? 'Autenticação de Operador' : 'Configuração da Sessão de Caixa'}
          </h2>
          <p className="text-xs text-zinc-500">
            {currentStep === 1 
              ? 'Introduza o seu e-mail e palavra-passe para aceder ao sistema.'
              : 'Selecione o terminal de atendimento e perfil de acesso para esta sessão.'}
          </p>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 animate-in fade-in">
            <AlertCircle size={16} className="shrink-0 text-red-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* STEP 1: CREDENTIALS */}
        {currentStep === 1 && (
          <form onSubmit={handleProceedToStep2} className="space-y-4 text-xs">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="font-semibold text-zinc-800 flex items-center gap-1.5">
                <Mail size={14} className="text-zinc-500" />
                <span>E-mail Corporativo</span>
              </label>
              <input
                id="login-input-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="miguelworscoi@gmail.com"
                className="w-full px-3.5 py-3 rounded-2xl bg-zinc-50 border border-gray-200 text-zinc-900 focus:bg-white focus:ring-2 focus:ring-zinc-950 focus:outline-none transition-colors"
              />
            </div>

            {/* Password Field with Toggle */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-zinc-800 flex items-center gap-1.5">
                  <KeyRound size={14} className="text-zinc-500" />
                  <span>Palavra-passe</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[11px] text-zinc-500 hover:text-zinc-900 font-medium flex items-center gap-1 transition-colors cursor-pointer"
                >
                  {showPassword ? (
                    <>
                      <EyeOff size={13} />
                      <span>Ocultar</span>
                    </>
                  ) : (
                    <>
                      <Eye size={13} />
                      <span>Visualizar</span>
                    </>
                  )}
                </button>
              </div>

              <div className="relative">
                <input
                  id="login-input-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3.5 py-3 pr-10 rounded-2xl bg-zinc-50 border border-gray-200 text-zinc-900 focus:bg-white focus:ring-2 focus:ring-zinc-950 focus:outline-none font-mono transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 cursor-pointer"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Remember Me & Recover Link */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-zinc-950 focus:ring-zinc-950"
                />
                <span className="text-zinc-600 text-xs">Lembrar credenciais</span>
              </label>

              <button
                type="button"
                onClick={() => setPassword('admin2026')}
                className="text-xs text-zinc-500 hover:text-zinc-950 font-medium underline cursor-pointer"
              >
                Preencher padrão
              </button>
            </div>

            {/* Step 1 Actions */}
            <div className="pt-3 space-y-3">
              <button
                id="btn-login-proceed-step-2"
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <span>Continuar para Terminal & Caixa</span>
                <ArrowRight size={16} />
              </button>

              <button
                type="button"
                onClick={onBackToOnboarding}
                className="w-full py-2.5 rounded-2xl bg-zinc-100 hover:bg-zinc-200/70 text-zinc-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <ArrowLeft size={14} />
                <span>Rever Apresentação / Onboarding</span>
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: TERMINAL & ROLE SELECTION */}
        {currentStep === 2 && (
          <form onSubmit={handleFinalSubmit} className="space-y-4 text-xs">
            {/* Terminal Selector */}
            <div className="space-y-2">
              <label className="font-semibold text-zinc-800 flex items-center gap-1.5">
                <Monitor size={14} className="text-zinc-500" />
                <span>Identificador do Terminal / Caixa Ativo</span>
              </label>

              <div className="grid grid-cols-1 gap-2.5">
                {[
                  { id: 'Caixa 01 - Balcão Principal', desc: 'Faturação rápida & TPA Multicaixa', icon: Store },
                  { id: 'Caixa 02 - Assistência Técnica', desc: 'Ordens de Serviço & Peças', icon: Building2 },
                  { id: 'Terminal Móvel - Gestão Master', desc: 'Acesso executivo & Auditoria', icon: Smartphone },
                ].map((term) => {
                  const Icon = term.icon;
                  const isSelected = selectedTerminal === term.id;
                  return (
                    <button
                      key={term.id}
                      type="button"
                      onClick={() => setSelectedTerminal(term.id)}
                      className={`p-3 rounded-2xl text-left border flex items-center justify-between transition-all cursor-pointer ${
                        isSelected 
                          ? 'bg-zinc-950 text-white border-zinc-950 shadow-xs' 
                          : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-800 border-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon size={18} className={isSelected ? 'text-emerald-400' : 'text-zinc-500'} />
                        <div>
                          <p className="font-bold text-xs">{term.id}</p>
                          <p className={`text-[10px] ${isSelected ? 'text-zinc-300' : 'text-zinc-400'}`}>
                            {term.desc}
                          </p>
                        </div>
                      </div>
                      {isSelected && <CheckCircle2 size={16} className="text-emerald-400" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Role Profile */}
            <div className="space-y-1.5 pt-1">
              <label className="font-semibold text-zinc-800 flex items-center gap-1.5">
                <UserCheck size={14} className="text-zinc-500" />
                <span>Perfil de Acesso do Operador</span>
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-50 border border-gray-200 text-zinc-900 font-semibold focus:bg-white focus:ring-2 focus:ring-zinc-950 focus:outline-none"
              >
                <option value="Administrador">Administrador Geral (Acesso Completo)</option>
                <option value="Operador de Caixa">Operador de Caixa (PDV & Vendas)</option>
                <option value="Técnico de Serviços">Técnico de Manutenção (Ordens de Serviço)</option>
              </select>
            </div>

            {/* Success Animation Banner */}
            {loginSuccessNotice && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 size={18} className="text-emerald-600 animate-bounce" />
                <span>Autenticação confirmada! Carregando painel Masakula...</span>
              </div>
            )}

            {/* Actions */}
            <div className="pt-3 space-y-2.5">
              <button
                id="btn-login-submit-final"
                type="submit"
                disabled={isSubmitting || loginSuccessNotice}
                className="w-full py-3.5 rounded-2xl bg-zinc-950 hover:bg-zinc-800 disabled:opacity-75 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Validando na AGT...</span>
                  </>
                ) : (
                  <>
                    <Zap size={15} className="text-amber-400" />
                    <span>Iniciar Sessão no Masakula ERP</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="w-full py-2.5 rounded-2xl bg-zinc-100 hover:bg-zinc-200/70 text-zinc-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <ArrowLeft size={14} />
                <span>Voltar ao Passo 1</span>
              </button>
            </div>
          </form>
        )}

        {/* Quick Demo Accounts Footer Bar */}
        <div className="pt-2 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-zinc-500">
          <span className="font-medium">Acessos Rápidos de Demonstração:</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleQuickFill('admin')}
              className="px-2.5 py-1 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-semibold transition-colors cursor-pointer"
            >
              Admin Master
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('cashier')}
              className="px-2.5 py-1 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-semibold transition-colors cursor-pointer"
            >
              Operador Caixa
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
