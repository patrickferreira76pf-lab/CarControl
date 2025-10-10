import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Receipt, Filter } from 'lucide-react';

interface Expense {
  id: string;
  date: string;
  category: string;
  amount: number;
  description: string | null;
  mileage: number | null;
  vehicle: {
    plate: string;
    brand: string;
    model: string;
  };
}

interface Vehicle {
  id: string;
  plate: string;
  brand: string;
  model: string;
}

const CATEGORIES = [
  { value: 'FUEL', label: 'Abastecimento' },
  { value: 'MAINTENANCE_PREVENTIVE', label: 'Manutenção Preventiva' },
  { value: 'MAINTENANCE_CORRECTIVE', label: 'Manutenção Corretiva' },
  { value: 'FINE', label: 'Multas' },
  { value: 'TOLL_PARKING', label: 'Pedágios e Estacionamento' },
  { value: 'INSURANCE_TAXES', label: 'Seguro e Impostos' },
  { value: 'OTHER', label: 'Outros' },
];

export function Expenses() {
  const { user, isManager } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    category: 'FUEL',
    amount: 0,
    description: '',
    mileage: 0,
    fuel_type: 'GASOLINA',
    fuel_quantity: 0,
    vehicle_id: '',
  });

  useEffect(() => {
    loadData();
  }, [user]);

  async function loadData() {
    if (!user) return;

    try {
      let vehiclesQuery = supabase
        .from('vehicles')
        .select('id, plate, brand, model')
        .eq('active', true);

      if (!isManager) {
        vehiclesQuery = vehiclesQuery.eq('user_id', user.id);
      }

      const { data: vehiclesData } = await vehiclesQuery;
      setVehicles(vehiclesData || []);

      let expensesQuery = supabase
        .from('expenses')
        .select(`
          id,
          date,
          category,
          amount,
          description,
          mileage,
          vehicle_id
        `)
        .order('date', { ascending: false });

      if (!isManager) {
        expensesQuery = expensesQuery.eq('user_id', user.id);
      }

      const { data: expensesData } = await expensesQuery;

      const vehicleMap = new Map(vehiclesData?.map(v => [v.id, v]) || []);

      const enrichedExpenses = (expensesData || []).map(exp => ({
        ...exp,
        vehicle: vehicleMap.get(exp.vehicle_id) || { plate: 'N/A', brand: '', model: '' }
      }));

      setExpenses(enrichedExpenses);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    try {
      const expenseData: any = {
        date: formData.date,
        category: formData.category,
        amount: formData.amount,
        description: formData.description || null,
        vehicle_id: formData.vehicle_id,
        user_id: user.id,
      };

      if (formData.category === 'FUEL') {
        expenseData.mileage = formData.mileage;
        expenseData.fuel_type = formData.fuel_type;
        expenseData.fuel_quantity = formData.fuel_quantity;
        expenseData.price_per_liter = formData.fuel_quantity > 0
          ? formData.amount / formData.fuel_quantity
          : 0;

        await supabase
          .from('vehicles')
          .update({ current_mileage: formData.mileage })
          .eq('id', formData.vehicle_id);
      }

      const { error } = await supabase
        .from('expenses')
        .insert(expenseData);

      if (error) throw error;

      setShowModal(false);
      setFormData({
        date: new Date().toISOString().split('T')[0],
        category: 'FUEL',
        amount: 0,
        description: '',
        mileage: 0,
        fuel_type: 'GASOLINA',
        fuel_quantity: 0,
        vehicle_id: '',
      });
      loadData();
    } catch (error: any) {
      alert(error.message || 'Erro ao registrar despesa');
    }
  }

  const filteredExpenses = categoryFilter === 'ALL'
    ? expenses
    : expenses.filter(exp => exp.category === categoryFilter);

  const totalAmount = filteredExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Despesas</h2>
          <p className="text-slate-600 mt-1">Registre e acompanhe os gastos</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          <Plus size={20} />
          Adicionar Despesa
        </button>
      </div>

      <div className="bg-white rounded-xl p-6 border border-slate-200 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={20} className="text-slate-600" />
          <span className="font-medium text-slate-900">Filtrar por categoria</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setCategoryFilter('ALL')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              categoryFilter === 'ALL'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Todas
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setCategoryFilter(cat.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                categoryFilter === cat.value
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 border border-slate-200 mb-6">
        <div className="text-center">
          <p className="text-sm text-slate-600 mb-1">Total</p>
          <p className="text-3xl font-bold text-slate-900">
            R$ {totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {filteredExpenses.length === 0 ? (
        <div className="bg-white rounded-xl p-12 border border-slate-200 text-center">
          <Receipt className="mx-auto mb-4 text-slate-400" size={48} />
          <h3 className="text-xl font-semibold text-slate-900 mb-2">
            Nenhuma despesa encontrada
          </h3>
          <p className="text-slate-600 mb-6">
            Comece registrando suas despesas diárias
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800"
          >
            <Plus size={20} />
            Adicionar Despesa
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Data</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Veículo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Categoria</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Descrição</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 uppercase">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredExpenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm text-slate-900">
                      {new Date(expense.date).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-900">
                      {expense.vehicle.plate}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs">
                        {CATEGORIES.find(c => c.value === expense.category)?.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {expense.description || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900 text-right">
                      R$ {Number(expense.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-2xl font-bold text-slate-900">Adicionar Despesa</h3>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Data *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Veículo *
                  </label>
                  <select
                    required
                    value={formData.vehicle_id}
                    onChange={(e) => setFormData({ ...formData, vehicle_id: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                  >
                    <option value="">Selecione</option>
                    {vehicles.map((vehicle) => (
                      <option key={vehicle.id} value={vehicle.id}>
                        {vehicle.plate} - {vehicle.brand} {vehicle.model}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Categoria *
                  </label>
                  <select
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Valor *
                  </label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                {formData.category === 'FUEL' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Quilometragem *
                      </label>
                      <input
                        type="number"
                        required
                        value={formData.mileage}
                        onChange={(e) => setFormData({ ...formData, mileage: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Litros *
                      </label>
                      <input
                        type="number"
                        required
                        step="0.01"
                        value={formData.fuel_quantity}
                        onChange={(e) => setFormData({ ...formData, fuel_quantity: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Tipo de Combustível
                      </label>
                      <select
                        value={formData.fuel_type}
                        onChange={(e) => setFormData({ ...formData, fuel_type: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                      >
                        <option value="GASOLINA">Gasolina</option>
                        <option value="ETANOL">Etanol</option>
                        <option value="DIESEL">Diesel</option>
                      </select>
                    </div>
                  </>
                )}

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Descrição
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                    rows={3}
                    placeholder="Observações adicionais..."
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800"
                >
                  Registrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
