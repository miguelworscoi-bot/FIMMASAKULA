import React, { useMemo, useState } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Phone, 
  Mail, 
  MapPin, 
  CreditCard, 
  Edit, 
  Trash2, 
  X,
  Building,
  UserCheck
} from 'lucide-react';
import { Customer } from '../../types';
import { formatKz, formatDate } from '../../utils/formatters';
import { ConfirmModal } from '../ui/ConfirmModal';
import { toast } from 'sonner';
import { useTrash } from '../../contexts/TrashContext';
import { InlinePageUndoBanner } from '../ui/InlinePageUndoBanner';

interface CustomersViewProps {
  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
}

export const CustomersView: React.FC<CustomersViewProps> = ({
  customers,
  setCustomers,
}) => {
  const { trash } = useTrash();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    nifOrBi: '',
    email: '',
    phone: '+244 9',
    city: 'Luanda',
  });

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.nifOrBi.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm)
  );
  const customerStats = useMemo(() => ({
    total: customers.length,
    active: customers.filter((customer) => customer.status === 'active').length,
    newCustomers: customers.filter((customer) => customer.lastPurchaseDate === new Date().toISOString().split('T')[0]).length,
    value: customers.reduce((total, customer) => total + customer.totalSpent, 0),
  }), [customers]);

  const handleOpenModal = (customer?: Customer) => {
    if (customer) {
      setEditingCustomer(customer);
      setFormData({
        name: customer.name,
        nifOrBi: customer.nifOrBi,
        email: customer.email,
        phone: customer.phone,
        city: customer.city,
      });
    } else {
      setEditingCustomer(null);
      setFormData({
        name: '',
        nifOrBi: '',
        email: '',
        phone: '+244 9',
        city: 'Luanda',
      });
    }
    setIsModalOpen(true);
  };

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCustomer) {
      setCustomers(prev => prev.map(c => c.id === editingCustomer.id ? {
        ...c,
        name: formData.name,
        nifOrBi: formData.nifOrBi,
        email: formData.email,
        phone: formData.phone,
        city: formData.city,
      } : c));
    } else {
      const newCust: Customer = {
        id: `cust-${Date.now()}`,
        name: formData.name,
        nifOrBi: formData.nifOrBi,
        email: formData.email,
        phone: formData.phone,
        city: formData.city,
        totalOrders: 0,
        totalSpent: 0,
        status: 'active',
        lastPurchaseDate: new Date().toISOString().split('T')[0],
      };
      setCustomers(prev => [newCust, ...prev]);
    }
    setIsModalOpen(false);
  };

  const handleDeleteCustomer = (id: string) => {
    const cust = customers.find(c => c.id === id);
    if (cust) {
      setCustomerToDelete(cust);
    }
  };

  const confirmDeleteCustomer = (e?: React.MouseEvent) => {
    if (!customerToDelete) return;
    const targetCust = customerToDelete;
    setCustomers(prev => prev.filter(c => c.id !== targetCust.id));

    trash({
      id: targetCust.id,
      name: targetCust.name,
      type: 'customer',
      typeLabel: 'Cliente',
      data: targetCust,
      onRestore: (restored: Customer) => {
        setCustomers(prev => [restored, ...prev]);
      },
    }, e ? { clientX: e.clientX, clientY: e.clientY } : undefined);

    toast.success(`Cliente "${targetCust.name}" movido para a lixeira.`);
    setCustomerToDelete(null);
  };

  return (
    <div id="view-customers" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* BANNER DE UNDO NA PRÓPRIA PÁGINA (aparece instantaneamente aqui quando se apaga um cliente) */}
      <InlinePageUndoBanner pageType="customer" />
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-gray-100 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-zinc-950">Gestão de Clientes & NIF</h2>
          <p className="text-xs text-zinc-400">
            {customers.length} clientes registados para emissão de faturas e recibos em Kz
          </p>
        </div>

        <button
          id="btn-add-customer"
          type="button"
          onClick={() => handleOpenModal()}
          className="px-4 py-2.5 rounded-2xl bg-zinc-950 hover:bg-zinc-800 text-white font-semibold text-xs flex items-center gap-2 shadow-xs transition-colors"
        >
          <Plus size={16} className="text-emerald-400" />
          <span>Novo Cliente</span>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'Total de clientes', value: customerStats.total, tone: 'text-zinc-950' },
          { label: 'Clientes ativos', value: customerStats.active, tone: 'text-emerald-600' },
          { label: 'Novos hoje', value: customerStats.newCustomers, tone: 'text-amber-600' },
          { label: 'Volume comprado', value: formatKz(customerStats.value), tone: 'text-zinc-950' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-xs transition-transform hover:-translate-y-0.5">
            <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400">{stat.label}</p>
            <p className={`mt-2 text-xl font-black ${stat.tone}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
        <input
          id="search-customers-input"
          type="text"
          placeholder="Pesquisar por nome, NIF/BI ou telefone de contacto..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-gray-200 text-xs text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-950"
        />
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-zinc-50/70 border-b border-gray-100 text-zinc-400 font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4">Nome do Cliente</th>
                <th className="py-3.5 px-4">NIF / BI</th>
                <th className="py-3.5 px-4">Contactos</th>
                <th className="py-3.5 px-4">Localização</th>
                <th className="py-3.5 px-4 text-center">Compras</th>
                <th className="py-3.5 px-4 text-right">Total Faturado (Kz)</th>
                <th className="py-3.5 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-400">
                    Nenhum cliente encontrado.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c) => (
                  <tr key={c.id} onClick={() => setSelectedCustomer(c)} className="cursor-pointer hover:bg-zinc-50/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-zinc-950">{c.name}</div>
                      <span className="text-[10px] text-zinc-400">Última compra: {formatDate(c.lastPurchaseDate)}</span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-zinc-800">
                      {c.nifOrBi || 'Isento / Não inf.'}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-zinc-800">{c.phone}</div>
                      <div className="text-[11px] text-zinc-400">{c.email}</div>
                    </td>
                    <td className="py-3.5 px-4 text-zinc-600">
                      {c.city}
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-zinc-800">
                      {c.totalOrders}
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-zinc-950">
                      {formatKz(c.totalSpent)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenModal(c)}
                          className="p-1.5 rounded-xl hover:bg-zinc-100 text-zinc-600 transition-colors"
                        >
                          <Edit size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCustomer(c.id)}
                          className="p-1.5 rounded-xl hover:bg-rose-50 text-zinc-400 hover:text-rose-600 transition-colors"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedCustomer && (
        <div className="rounded-3xl border border-zinc-200 bg-zinc-950 p-5 text-white shadow-xl animate-in fade-in slide-in-from-right-2">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-[#E1FB15]">Perfil selecionado</p>
              <h3 className="mt-1 text-lg font-black">{selectedCustomer.name}</h3>
              <p className="text-xs text-zinc-400">{selectedCustomer.phone} · {selectedCustomer.email || 'Sem email'}</p>
            </div>
            <button type="button" onClick={() => setSelectedCustomer(null)} className="rounded-xl p-2 text-zinc-400 hover:bg-white/10 hover:text-white" aria-label="Fechar perfil do cliente">
              <X size={16} />
            </button>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div><p className="text-[10px] text-zinc-500">Total gasto</p><p className="mt-1 font-mono font-bold">{formatKz(selectedCustomer.totalSpent)}</p></div>
            <div><p className="text-[10px] text-zinc-500">Compras</p><p className="mt-1 font-mono font-bold">{selectedCustomer.totalOrders}</p></div>
            <div><p className="text-[10px] text-zinc-500">Ticket médio</p><p className="mt-1 font-mono font-bold">{formatKz(selectedCustomer.totalOrders ? selectedCustomer.totalSpent / selectedCustomer.totalOrders : 0)}</p></div>
            <div><p className="text-[10px] text-zinc-500">Última atividade</p><p className="mt-1 font-mono font-bold">{formatDate(selectedCustomer.lastPurchaseDate)}</p></div>
          </div>
        </div>
      )}

      {/* Add / Edit Customer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-zinc-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 space-y-4 animate-in zoom-in-95 duration-150 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-base text-zinc-950">
                  {editingCustomer ? 'Editar Cliente' : 'Registar Novo Cliente'}
                </h3>
                <p className="text-zinc-400 text-[11px]">Dados cadastrais e identificação fiscal</p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-800"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="space-y-3.5">
              <div className="space-y-1">
                <label className="font-semibold text-zinc-700">Nome Completo / Razão Social</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Manuel Domingos dos Santos..."
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-50 border border-gray-200 text-zinc-900 focus:bg-white focus:ring-2 focus:ring-zinc-950 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-zinc-700">NIF ou BI (Angola)</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: 5409182736 ou 00492..."
                    value={formData.nifOrBi}
                    onChange={(e) => setFormData({ ...formData, nifOrBi: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-50 border border-gray-200 text-zinc-900 focus:bg-white focus:ring-2 focus:ring-zinc-950 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-zinc-700">Telefone</label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-50 border border-gray-200 text-zinc-900 focus:bg-white focus:ring-2 focus:ring-zinc-950 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-zinc-700">E-mail</label>
                  <input
                    type="email"
                    placeholder="cliente@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-50 border border-gray-200 text-zinc-900 focus:bg-white focus:ring-2 focus:ring-zinc-950 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-zinc-700">Cidade / Província</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-50 border border-gray-200 text-zinc-900 focus:bg-white focus:ring-2 focus:ring-zinc-950 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-2xl border border-gray-200 text-zinc-700 hover:bg-zinc-50 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-2xl bg-zinc-950 hover:bg-zinc-800 text-white font-semibold shadow-xs"
                >
                  Gravar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão de Cliente */}
      <ConfirmModal
        isOpen={!!customerToDelete}
        title="Eliminar Cliente"
        description={`Tem a certeza de que deseja eliminar o cliente "${customerToDelete?.name}" do cadastro? Esta ação não pode ser desfeita.`}
        confirmText="Sim, Eliminar Cliente"
        cancelText="Cancelar"
        isDestructive={true}
        onConfirm={confirmDeleteCustomer}
        onClose={() => setCustomerToDelete(null)}
      />
    </div>
  );
};
