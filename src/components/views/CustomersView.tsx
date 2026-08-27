import React, { useState } from 'react';
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

interface CustomersViewProps {
  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
}

export const CustomersView: React.FC<CustomersViewProps> = ({
  customers,
  setCustomers,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

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
    if (window.confirm('Eliminar cliente do cadastro?')) {
      setCustomers(prev => prev.filter(c => c.id !== id));
    }
  };

  return (
    <div id="view-customers" className="space-y-6 animate-in fade-in duration-200">
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
                  <tr key={c.id} className="hover:bg-zinc-50/60 transition-colors">
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
    </div>
  );
};
