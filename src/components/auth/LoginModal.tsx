import React, { useState, useRef, useEffect, KeyboardEvent, ClipboardEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Lock, 
  Mail, 
  KeyRound, 
  Eye, 
  EyeOff, 
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
  ChevronRight,
  Shield,
  Sparkles,
  Check,
  Loader2
} from 'lucide-react';
import { UserSession } from '../../types';
import { useAuth, UserRole, DEMO_PROFILES } from '../../contexts/AuthContext';
import { PermissionMatrixModal } from './PermissionMatrixModal';

interface LoginModalProps {
  onLoginSuccess: (session: UserSession) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  onLoginSuccess,
}) => {
  const { signIn, switchRole, setProfile } = useAuth();

  // Step State: 1 = Credentials, 2 = Terminal & Profile selection
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);

  // Form State
  const [email, setEmail] = useState('admin@masakula.co.ao');
  const [password, setPassword] = useState('5464');
  const [rememberMe, setRememberMe] = useState(true);

  // PIN Input State
  const [pin, setPin] = useState<string[]>(['5', '4', '6', '4']);
  const [pinStatus, setPinStatus] = useState<'idle' | 'verifying' | 'success' | 'error'>('idle');

  // Input refs for 4 PIN boxes
  const pinInputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  // Step 2 Selection State
  const [selectedTerminal, setSelectedTerminal] = useState('Caixa 01 - Balcão Principal');
  const [selectedRole, setSelectedRole] = useState<UserRole>('GERENTE');

  // Matrix Modal
  const [isMatrixOpen, setIsMatrixOpen] = useState(false);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loginSuccessNotice, setLoginSuccessNotice] = useState(false);

  // Handle PIN change
  const handlePinChange = (index: number, value: string) => {
    if (pinStatus === 'success' || pinStatus === 'verifying') return;

    const digit = value.replace(/\D/g, '').slice(-1);
    const newPin = [...pin];
    newPin[index] = digit;
    setPin(newPin);
    setPassword(newPin.join(''));

    if (digit && index < 3) {
      pinInputRefs[index + 1].current?.focus();
    }

    if (newPin.every((d) => d !== '') && digit !== '') {
      verifyAndAdvance(newPin.join(''));
    }
  };

  // Handle PIN keydown backspace
  const handlePinKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!pin[index] && index > 0) {
        pinInputRefs[index - 1].current?.focus();
      }
      setPinStatus('idle');
      setErrorMessage(null);
    }
  };

  // Handle PIN paste
  const handlePinPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);

    if (pastedData.length === 4) {
      const newPin = pastedData.split('');
      setPin(newPin);
      setPassword(pastedData);
      pinInputRefs[3].current?.focus();
      verifyAndAdvance(pastedData);
    }
  };

  // Verify PIN with animation
  const verifyAndAdvance = async (fullPin: string) => {
    setPinStatus('verifying');
    setErrorMessage(null);

    await new Promise((res) => setTimeout(res, 500));

    // Valid PIN check strictly against registered credentials
    const validPins: Record<string, { role: UserRole; name: string }> = {
      '5464': { role: 'GERENTE', name: 'Administrador Geral' },
      '1234': { role: 'CAIXA', name: 'Operador de Caixa' },
      '0000': { role: 'GERENTE', name: 'Gerente Master' },
      '2026': { role: 'GERENTE', name: 'Gestão 2026' },
    };

    // Check if user is in demo mode with specific credentials
    const targetMatch = validPins[fullPin];

    if (targetMatch) {
      setPinStatus('success');

      // Set matched role or keep explicit role if matched
      setSelectedRole(targetMatch.role);

      setTimeout(() => {
        setPinStatus('idle');
        setCurrentStep(2);
      }, 900);
    } else {
      setPinStatus('error');
      setErrorMessage('Código PIN incorreto. Introduza um PIN válido de 4 dígitos (ex: 5464 para Gerente ou 1234 para Caixa).');
      setTimeout(() => {
        setPin(['', '', '', '']);
        pinInputRefs[0].current?.focus();
        setPinStatus('idle');
      }, 1200);
    }
  };

  // Handle Step 1 Validation & Proceed to Step 2
  const handleProceedToStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email || !email.includes('@')) {
      setErrorMessage('Por favor, introduza um endereço de e-mail corporativo válido.');
      return;
    }

    const currentPin = pin.join('');
    if (currentPin.length !== 4) {
      setErrorMessage('O código PIN de operador deve conter exatamente 4 dígitos.');
      return;
    }

    verifyAndAdvance(currentPin);
  };

  // Handle Final Submission (Step 2)
  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      await signIn(email.trim(), password.trim(), selectedRole);

      setLoginSuccessNotice(true);

      const targetProfile = DEMO_PROFILES[selectedRole];
      setProfile({
        ...targetProfile,
        email: email.trim(),
        full_name: email.toLowerCase().includes('admin') || email.toLowerCase().includes('miguel')
          ? 'Miguel Worscoi (Gerente Geral)'
          : selectedRole === 'GERENTE' ? 'Gerente Geral Masakula' : 'Operador de Caixa',
        terminalId: selectedTerminal
      });

      const session: UserSession = {
        email: email.trim(),
        name: email.toLowerCase().includes('admin') || email.toLowerCase().includes('miguel')
          ? 'Miguel Worscoi'
          : selectedRole === 'GERENTE' ? 'Gerente Geral' : 'Operador de Caixa',
        role: selectedRole === 'GERENTE' ? 'Administrador Geral' : 'Operador de Caixa',
        terminalId: selectedTerminal,
        isLoggedIn: true,
      };

      setTimeout(() => {
        setIsSubmitting(false);
        onLoginSuccess(session);
      }, 500);
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMessage(err?.message || 'Falha ao autenticar utilizador.');
    }
  };

  // Quick fill demo accounts
  const handleQuickFill = (role: UserRole) => {
    if (role === 'GERENTE') {
      setEmail('admin@masakula.co.ao');
      setPassword('5464');
      setPin(['5', '4', '6', '4']);
      setSelectedRole('GERENTE');
      setSelectedTerminal('Terminal Master 01 - Gestão');
    } else {
      setEmail('caixa@masakula.co.ao');
      setPassword('1234');
      setPin(['1', '2', '3', '4']);
      setSelectedRole('CAIXA');
      setSelectedTerminal('Caixa 01 - Balcão Principal');
    }
    setPinStatus('idle');
    setErrorMessage(null);
  };

  return (
    <div 
      id="view-login-modal-container"
      className="min-h-screen w-full bg-[#f8f9fa] flex items-center justify-center p-4 sm:p-6 font-sans relative overflow-hidden"
    >
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px] opacity-70 pointer-events-none" />
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-6xl grid lg:grid-cols-[1.05fr_0.95fr] items-center gap-8 lg:gap-16">
        {/* Editorial brand panel */}
        <section className="hidden lg:flex min-h-[680px] flex-col justify-center items-center px-6 py-8" aria-label="Marca Masakula">
          <div className="flex flex-col items-center gap-10">
            <div className="max-w-md text-center">
              <p className="text-6xl font-black leading-[1.05] tracking-tight text-zinc-950">Masakula</p>
              <p className="mt-6 text-3xl font-black leading-[1.1] tracking-tight text-zinc-900">“Um nome,<br />várias soluções”</p>
            </div>
          </div>
        </section>

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
              Credenciais
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
              Terminal & Perfil
            </span>
          </div>

          <ChevronRight size={14} className="text-zinc-400" />

          {/* Botão de Matriz de Permissões */}
          <button
            type="button"
            onClick={() => setIsMatrixOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-700 text-[11px] font-bold transition-colors cursor-pointer border border-blue-200/80"
            title="Abrir Matriz de Permissões (Gerente vs. Caixa)"
          >
            <Shield size={12} className="text-blue-600" />
            <span className="text-[10px] tracking-tight">Matriz de Acessos</span>
          </button>
        </div>

        {/* Corporate Brand Header */}
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
              </div>
              <p className="text-xs text-zinc-500 font-medium italic">
                Um nome, várias soluções
              </p>
            </div>
          </div>

        </div>

        {/* Quick Role Selector Cards */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => handleQuickFill('GERENTE')}
            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
              selectedRole === 'GERENTE' && email.includes('admin')
                ? 'bg-zinc-950 text-white border-zinc-950 shadow-sm'
                : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-700 border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-xs">👑 Gerente</span>
              {selectedRole === 'GERENTE' && email.includes('admin') && (
                <CheckCircle2 size={14} className="text-emerald-400" />
              )}
            </div>
            <p className={`text-[10px] ${selectedRole === 'GERENTE' && email.includes('admin') ? 'text-zinc-300' : 'text-zinc-500'}`}>
              Controle Total & Gestão
            </p>
          </button>

          <button
            type="button"
            onClick={() => handleQuickFill('CAIXA')}
            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
              selectedRole === 'CAIXA' && email.includes('caixa')
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-700 border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-xs">🏷️ Caixa</span>
              {selectedRole === 'CAIXA' && email.includes('caixa') && (
                <CheckCircle2 size={14} className="text-white" />
              )}
            </div>
            <p className={`text-[10px] ${selectedRole === 'CAIXA' && email.includes('caixa') ? 'text-blue-100' : 'text-zinc-500'}`}>
              PDV & Faturamento
            </p>
          </button>
        </div>

        {/* Form Content Area */}
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-zinc-950">
            {currentStep === 1 ? 'Autenticação de Operador' : 'Configuração da Sessão de Caixa'}
          </h2>
          <p className="text-xs text-zinc-500">
            {currentStep === 1 
              ? 'Introduza o seu e-mail e palavra-passe para aceder ao sistema.'
              : 'Selecione o terminal de atendimento e confirme o nível de acesso.'}
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
                placeholder="admin@masakula.co.ao"
                className="w-full px-3.5 py-3 rounded-2xl bg-zinc-50 border border-gray-200 text-zinc-900 focus:bg-white focus:ring-2 focus:ring-zinc-950 focus:outline-none transition-colors"
              />
            </div>

            {/* 🔮 ÁREA DOS 4 DÍGITOS DO PIN COM ANIMAÇÃO E FEEDBACK VISUAL */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-zinc-800 flex items-center gap-1.5">
                  <KeyRound size={14} className="text-zinc-500" />
                  <span>Código PIN do Operador (4 Dígitos)</span>
                </label>
                <span className="text-[11px] text-zinc-400 font-medium">
                  {pinStatus === 'verifying' ? 'A verificar...' : 'Autenticação rápida'}
                </span>
              </div>

              {/* Contêiner dos 4 Quadrados / Banner de Sucesso */}
              <div className="relative w-full flex justify-center items-center min-h-[72px] py-1">
                <AnimatePresence mode="wait">
                  {pinStatus !== 'success' ? (
                    <motion.div
                      key="pin-boxes"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="flex items-center gap-2.5 sm:gap-3"
                    >
                      {pin.map((digit, index) => (
                        <motion.div
                          key={index}
                          animate={
                            pinStatus === 'error'
                              ? { x: [-6, 6, -4, 4, 0] }
                              : { scale: digit ? 1.02 : 1 }
                          }
                          transition={{ duration: 0.2 }}
                          className={`relative w-12 sm:w-14 h-14 sm:h-16 rounded-2xl flex items-center justify-center transition-all duration-200 overflow-hidden shadow-xs ${
                            digit
                              ? 'bg-zinc-150 bg-zinc-200/70 border-2 border-zinc-400 text-zinc-950'
                              : 'bg-zinc-50 border-2 border-zinc-200 text-zinc-900 hover:border-zinc-300'
                          }`}
                        >
                          <input
                            id={index === 0 ? "login-input-password" : `login-input-pin-${index}`}
                            ref={pinInputRefs[index]}
                            type="password"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handlePinChange(index, e.target.value)}
                            onKeyDown={(e) => handlePinKeyDown(index, e)}
                            onPaste={handlePinPaste}
                            disabled={pinStatus === 'verifying'}
                            className="w-full h-full text-center text-2xl font-black bg-transparent outline-none cursor-pointer relative z-10 transition-colors text-zinc-950"
                          />
                        </motion.div>
                      ))}
                    </motion.div>
                  ) : (
                    /* Banner Verde Fluido de Sucesso */
                    <motion.div
                      key="success-banner"
                      initial={{ scale: 0.85, opacity: 0, y: 8 }}
                      animate={{ scale: 1, opacity: 1, y: 0 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                      className="w-full py-3 px-5 bg-gradient-to-r from-emerald-500 to-teal-400 rounded-2xl shadow-lg shadow-emerald-500/25 border border-emerald-300/40 flex items-center justify-center gap-5 text-slate-950"
                    >
                      <div className="flex items-center gap-3 text-xl font-black tracking-widest">
                        {pin.map((d, i) => (
                          <motion.span
                            key={i}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: i * 0.06 }}
                          >
                            {d}
                          </motion.span>
                        ))}
                      </div>

                      <motion.div
                        initial={{ scale: 0, rotate: -45 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: 0.2, type: 'spring' }}
                        className="w-6 h-6 bg-slate-950 text-[#32D583] rounded-full flex items-center justify-center shadow-xs"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Indicador de verificação em progresso */}
              {pinStatus === 'verifying' && (
                <div className="flex items-center justify-center gap-2 text-xs font-semibold text-indigo-600 pt-1">
                  <Loader2 size={14} className="animate-spin" />
                  <span>A validar código PIN...</span>
                </div>
              )}
            </div>

            {/* Remember Me & Quick Reset */}
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
                onClick={() => {
                  setPin(['', '', '', '']);
                  setPassword('');
                  setPinStatus('idle');
                  setErrorMessage(null);
                  pinInputRefs[0].current?.focus();
                }}
                className="text-xs text-zinc-500 hover:text-zinc-900 font-medium underline cursor-pointer"
              >
                Limpar PIN
              </button>
            </div>

            {/* Step 1 Actions */}
            <div className="pt-3 space-y-3">
              <button
                id="btn-login-proceed-step-2"
                type="submit"
                disabled={pinStatus === 'verifying'}
                className="w-full py-3.5 rounded-2xl bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                <span>Continuar para Terminal & Caixa</span>
                <ArrowRight size={16} />
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
              <label className="font-semibold text-zinc-800 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <UserCheck size={14} className="text-zinc-500" />
                  <span>Perfil de Acesso do Operador</span>
                </span>
                <button
                  type="button"
                  onClick={() => setIsMatrixOpen(true)}
                  className="text-[10px] text-blue-600 hover:underline font-semibold"
                >
                  Ver Níveis de Acesso
                </button>
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-50 border border-gray-200 text-zinc-900 font-semibold focus:bg-white focus:ring-2 focus:ring-zinc-950 focus:outline-none cursor-pointer"
              >
                <option value="GERENTE">👑 Gerente Geral (Controle Total & Gestão)</option>
                <option value="CAIXA">🏷️ Operador de Caixa (PDV, Fechamento & Leitura Estoque)</option>
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
        </div>
      </div>

      {/* Permission Matrix Modal */}
      <PermissionMatrixModal
        isOpen={isMatrixOpen}
        onClose={() => setIsMatrixOpen(false)}
        onSelectRole={(role) => {
          handleQuickFill(role);
          setIsMatrixOpen(false);
        }}
      />
    </div>
  );
};
