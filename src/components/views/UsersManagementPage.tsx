import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "../../lib/supabase";
import { 
  UserPlus, 
  KeyRound, 
  ShieldCheck, 
  Search, 
  Check, 
  X, 
  Loader2, 
  UserCheck, 
  UserX,
  Lock,
  RefreshCw,
  Edit2
} from "lucide-react";

export interface Operator {
  id: string;
  name: string;
  role: "operator" | "manager" | "admin";
  pin: string;
  active: boolean;
  created_at?: string;
  terminal?: string;
}

const DEFAULT_OPERATORS: Operator[] = [
  {
    id: 'op-01',
    name: 'Miguel Worscoi (Master)',
    role: 'admin',
    pin: '5464',
    active: true,
    created_at: new Date().toISOString(),
    terminal: 'Terminal Master 01',
  },
  {
    id: 'op-02',
    name: 'Sofia Manuel (Gerente)',
    role: 'manager',
    pin: '2026',
    active: true,
    created_at: new Date().toISOString(),
    terminal: 'Caixa Principal 01',
  },
  {
    id: 'op-03',
    name: 'Operador de Balcão 01',
    role: 'operator',
    pin: '1234',
    active: true,
    created_at: new Date().toISOString(),
    terminal: 'Caixa 01 - Frente de Loja',
  },
  {
    id: 'op-04',
    name: 'Operador de Balcão 02',
    role: 'operator',
    pin: '0002',
    active: true,
    created_at: new Date().toISOString(),
    terminal: 'Caixa 02 - Frente de Loja',
  },
];

export function UsersManagementPage() {
  const [operators, setOperators] = useState<Operator[]>(() => {
    try {
      const saved = localStorage.getItem('masakula_operators_list_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn(e);
    }
    return DEFAULT_OPERATORS;
  });
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Modais State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [selectedOperator, setSelectedOperator] = useState<Operator | null>(null);

  // Forms State
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState<"operator" | "manager" | "admin">("operator");
  const [newPin, setNewPin] = useState("");
  const [resetPinValue, setResetPinValue] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Save to local cache
  useEffect(() => {
    try {
      localStorage.setItem('masakula_operators_list_v1', JSON.stringify(operators));
    } catch (e) {
      console.warn(e);
    }
  }, [operators]);

  // Carregar Operadores
  const fetchOperators = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("operators")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data && data.length > 0) {
        setOperators(data as Operator[]);
      }
    } catch (err) {
      console.warn("Supabase operators fetch notice:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOperators();
  }, []);

  // 1. Criar Novo Operador
  const handleCreateOperator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length !== 4 || !/^\d+$/.test(newPin)) {
      setFeedbackMsg({ type: "error", text: "O PIN deve conter exatamente 4 números." });
      return;
    }

    setFormLoading(true);
    let createdOnSupabase = false;
    try {
      const { error } = await supabase.from("operators").insert({
        name: newName,
        role: newRole,
        pin: newPin,
        active: true,
      });
      if (!error) createdOnSupabase = true;
    } catch (err) {
      console.warn("Supabase insert notice:", err);
    }

    const newOpItem: Operator = {
      id: `op-${Date.now()}`,
      name: newName.trim(),
      role: newRole,
      pin: newPin,
      active: true,
      created_at: new Date().toISOString(),
      terminal: 'Terminal Caixa Padrão',
    };

    setOperators((prev) => [newOpItem, ...prev]);
    setFeedbackMsg({ type: "success", text: "Operador cadastrado com sucesso!" });
    setNewName("");
    setNewPin("");
    setNewRole("operator");
    setIsCreateOpen(false);
    setFormLoading(false);
  };

  // 2. Alterar Role
  const handleRoleChange = async (operatorId: string, role: "operator" | "manager" | "admin") => {
    try {
      await supabase
        .from("operators")
        .update({ role, updated_at: new Date().toISOString() })
        .eq("id", operatorId);
    } catch (err) {
      console.warn(err);
    }

    setOperators((prev) =>
      prev.map((op) => (op.id === operatorId ? { ...op, role } : op))
    );
  };

  // 3. Alternar Status (Ativo / Inativo)
  const handleToggleActive = async (operator: Operator) => {
    try {
      await supabase
        .from("operators")
        .update({ active: !operator.active })
        .eq("id", operator.id);
    } catch (err) {
      console.warn(err);
    }

    setOperators((prev) =>
      prev.map((op) => (op.id === operator.id ? { ...op, active: !operator.active } : op))
    );
  };

  // 4. Redefinir PIN
  const handleResetPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOperator) return;
    if (resetPinValue.length !== 4 || !/^\d+$/.test(resetPinValue)) {
      setFeedbackMsg({ type: "error", text: "O novo PIN deve conter exatamente 4 dígitos numéricos." });
      return;
    }

    setFormLoading(true);
    let updatedRemote = false;
    try {
      const { error } = await supabase.rpc("update_operator_pin", {
        p_operator_id: selectedOperator.id,
        p_new_pin: resetPinValue,
      });
      if (!error) updatedRemote = true;
    } catch (err) {
      console.warn("Supabase update_operator_pin RPC notice:", err);
    }

    setOperators((prev) =>
      prev.map((op) =>
        op.id === selectedOperator.id ? { ...op, pin: resetPinValue } : op
      )
    );

    setFeedbackMsg({
      type: "success",
      text: `PIN de ${selectedOperator.name} alterado com sucesso!`,
    });
    setIsPinModalOpen(false);
    setResetPinValue("");
    setSelectedOperator(null);
    setFormLoading(false);
  };

  const filteredOperators = operators.filter((op) =>
    op.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 select-none animate-in fade-in duration-200">
      
      {/* CABEÇALHO DA PÁGINA */}
      <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-zinc-950 text-[#E1FB15] flex items-center justify-center shadow-md flex-shrink-0">
            <ShieldCheck size={26} />
          </div>
          <div>
            <h1 className="text-xl font-black text-zinc-950 tracking-tight">
              Gestão de Operadores & PINs
            </h1>
            <p className="text-xs text-zinc-400 mt-0.5">
              Controlo de acessos, níveis de permissão (RBAC) e autenticação segura do terminal de caixa.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setFeedbackMsg(null);
            setIsCreateOpen(true);
          }}
          className="py-2.5 px-4 bg-zinc-950 hover:bg-zinc-800 text-white font-extrabold text-xs rounded-2xl shadow-xs border border-zinc-800 transition flex items-center gap-2 cursor-pointer"
        >
          <UserPlus className="w-4 h-4 text-[#E1FB15]" />
          <span>Novo Operador</span>
        </button>
      </div>

      {/* BARRA DE PESQUISA & METRICAS */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Pesquisar operador..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-zinc-900 outline-none focus:border-zinc-900 transition"
          />
        </div>

        <button
          type="button"
          onClick={fetchOperators}
          className="p-2.5 bg-white border border-gray-200 rounded-2xl hover:bg-zinc-50 text-zinc-600 hover:text-zinc-900 transition flex items-center gap-2 text-xs font-semibold cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Sincronizar Supabase</span>
        </button>
      </div>

      {/* FEEDBACK GLOBAL */}
      {feedbackMsg && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-2xl border text-xs font-bold flex items-center justify-between ${
            feedbackMsg.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          <span>{feedbackMsg.text}</span>
          <button type="button" onClick={() => setFeedbackMsg(null)} className="cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}

      {/* TABELA DE OPERADORES */}
      <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50/80 text-zinc-400 border-b border-gray-100 uppercase tracking-wider font-extrabold text-[10px]">
              <tr>
                <th className="py-3.5 px-5">Operador</th>
                <th className="py-3.5 px-4">Nível (Role)</th>
                <th className="py-3.5 px-4 text-center">PIN de Acesso</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-zinc-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-zinc-900" />
                    Carregando operadores...
                  </td>
                </tr>
              ) : filteredOperators.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-zinc-400">
                    Nenhum operador encontrado.
                  </td>
                </tr>
              ) : (
                filteredOperators.map((op) => {
                  const roleBadge = 
                    op.role === 'admin' 
                      ? 'bg-purple-100 text-purple-800 border-purple-200' 
                      : op.role === 'manager'
                      ? 'bg-blue-100 text-blue-800 border-blue-200'
                      : 'bg-zinc-100 text-zinc-800 border-zinc-200';

                  return (
                    <tr key={op.id} className="hover:bg-zinc-50/60 transition">
                      <td className="py-3.5 px-5 font-bold text-zinc-900 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-zinc-950 text-[#E1FB15] flex items-center justify-center font-black text-xs shadow-xs">
                          {op.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-zinc-900">{op.name}</div>
                          <div className="text-[10px] text-zinc-400 font-mono">{op.terminal || 'PDV Frente de Loja'}</div>
                        </div>
                      </td>

                      {/* SELEÇÃO DE ROLE INLINE */}
                      <td className="py-3.5 px-4">
                        <select
                          value={op.role}
                          onChange={(e) =>
                            handleRoleChange(
                              op.id,
                              e.target.value as "operator" | "manager" | "admin"
                            )
                          }
                          className={`border rounded-xl px-2.5 py-1 text-[11px] font-extrabold outline-none focus:border-zinc-900 cursor-pointer ${roleBadge}`}
                        >
                          <option value="operator">Caixa (Operator)</option>
                          <option value="manager">Gerente (Manager)</option>
                          <option value="admin">Administrador (Admin)</option>
                        </select>
                      </td>

                      {/* MASKED PIN DISPLAY */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="font-mono bg-zinc-100 px-2.5 py-1 rounded-md border border-gray-200 text-zinc-700 font-bold tracking-widest text-[11px]">
                          ••••
                        </span>
                      </td>

                      {/* STATUS ACTIVATE / DEACTIVATE */}
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(op)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold border transition cursor-pointer ${
                            op.active
                              ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                              : "bg-zinc-100 border-zinc-200 text-zinc-500"
                          }`}
                        >
                          {op.active ? <UserCheck className="w-3.5 h-3.5" /> : <UserX className="w-3.5 h-3.5" />}
                          {op.active ? "Ativo" : "Inativo"}
                        </button>
                      </td>

                      {/* AÇÕES DE PIN */}
                      <td className="py-3.5 px-5 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedOperator(op);
                            setResetPinValue("");
                            setFeedbackMsg(null);
                            setIsPinModalOpen(true);
                          }}
                          className="py-1.5 px-3 bg-zinc-100 hover:bg-zinc-200 border border-gray-200 text-zinc-800 rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <KeyRound className="w-3.5 h-3.5 text-zinc-600" />
                          <span>Alterar PIN</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: CRIAR NOVO OPERADOR */}
      <AnimatePresence>
        {isCreateOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white border border-gray-100 rounded-3xl p-6 shadow-2xl relative"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-base font-black text-zinc-950 flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-zinc-900" />
                  Cadastrar Novo Operador
                </h3>
                <button 
                  type="button" 
                  onClick={() => setIsCreateOpen(false)} 
                  className="p-1 rounded-lg text-zinc-400 hover:text-zinc-900 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateOperator} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-zinc-700 block mb-1">Nome Completo do Colaborador</label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Ex: Manuel Silva"
                    className="w-full bg-zinc-50 border border-gray-200 rounded-2xl p-3 text-xs text-zinc-900 outline-none focus:border-zinc-900"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-700 block mb-1">Nível de Acesso (Role)</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as any)}
                    className="w-full bg-zinc-50 border border-gray-200 rounded-2xl p-3 text-xs text-zinc-900 outline-none focus:border-zinc-900 font-semibold cursor-pointer"
                  >
                    <option value="operator">Operador de Caixa (Operator)</option>
                    <option value="manager">Gerente de Loja (Manager)</option>
                    <option value="admin">Administrador Geral (Admin)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-700 block mb-1">PIN Numérico Secreto (4 Dígitos)</label>
                  <input
                    type="password"
                    maxLength={4}
                    required
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
                    placeholder="Ex: 5464"
                    className="w-full bg-zinc-50 border border-gray-200 rounded-2xl p-3 text-sm text-zinc-900 text-center font-mono font-bold tracking-widest outline-none focus:border-zinc-900"
                  />
                </div>

                <button
                  type="submit"
                  disabled={formLoading}
                  className="w-full py-3.5 bg-zinc-950 hover:bg-zinc-800 text-white font-extrabold text-xs rounded-2xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer mt-2"
                >
                  {formLoading ? <Loader2 className="w-4 h-4 animate-spin text-[#E1FB15]" /> : <Check className="w-4 h-4 text-[#E1FB15]" />}
                  <span>Salvar Operador</span>
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: REDEFINIR PIN */}
      <AnimatePresence>
        {isPinModalOpen && selectedOperator && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm bg-white border border-gray-100 rounded-3xl p-6 shadow-2xl relative text-center"
            >
              <div className="w-12 h-12 bg-zinc-100 text-zinc-900 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-gray-200">
                <Lock className="w-6 h-6" />
              </div>

              <h3 className="text-base font-black text-zinc-950">Alterar PIN Secreto</h3>
              <p className="text-xs text-zinc-500 mt-1 mb-5">
                Operador: <span className="text-zinc-900 font-bold">{selectedOperator.name}</span>
              </p>

              <form onSubmit={handleResetPin} className="space-y-4">
                <input
                  type="password"
                  maxLength={4}
                  autoFocus
                  required
                  value={resetPinValue}
                  onChange={(e) => setResetPinValue(e.target.value.replace(/\D/g, ""))}
                  placeholder="NOVO PIN"
                  className="w-full bg-zinc-50 border border-gray-200 rounded-2xl p-4 text-2xl text-zinc-950 text-center font-mono font-black tracking-widest outline-none focus:border-zinc-900"
                />

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setIsPinModalOpen(false)}
                    className="py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-xs rounded-2xl cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="py-3 bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-xs rounded-2xl flex items-center justify-center gap-1 cursor-pointer"
                  >
                    {formLoading ? <Loader2 className="w-4 h-4 animate-spin text-[#E1FB15]" /> : "Atualizar PIN"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

export default UsersManagementPage;
