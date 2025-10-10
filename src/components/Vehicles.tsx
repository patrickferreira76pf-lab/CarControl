import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Car, Plus, Edit, Trash2, Search } from 'lucide-react';

interface Vehicle {
  id: string;
  plate: string;
  brand: string;
  model: string;
  year: number;
  current_mileage: number;
  fuel_type: string | null;
  color: string | null;
}

export function Vehicles() {
  const { user, isManager } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    plate: '',
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    initial_mileage: 0,
    current_mileage: 0,
    acquisition_date: new Date().toISOString().split('T')[0],
    fuel_type: 'FLEX',
    color: '',
  });

  useEffect(() => {
    loadVehicles();
  }, [user]);

  async function loadVehicles() {
    if (!user) return;

    try {
      let query = supabase
        .from('vehicles')
        .select('id, plate, brand, model, year, current_mileage, fuel_type, color')
        .eq('active', true)
        .order('created_at', { ascending: false });

      if (!isManager) {
        query = query.eq('user_id', user.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setVehicles(data || []);
    } catch (error) {
      console.error('Error loading vehicles:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    try {
      const { error } = await supabase
        .from('vehicles')
        .insert({
          ...formData,
          user_id: user.id,
          active: true,
        });

      if (error) throw error;

      setShowModal(false);
      setFormData({
        plate: '',
        brand: '',
        model: '',
        year: new Date().getFullYear(),
        initial_mileage: 0,
        current_mileage: 0,
        acquisition_date: new Date().toISOString().split('T')[0],
        fuel_type: 'FLEX',
        color: '',
      });
      loadVehicles();
    } catch (error: any) {
      alert(error.message || 'Erro ao cadastrar veículo');
    }
  }

  const filteredVehicles = vehicles.filter(vehicle =>
    vehicle.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.model.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <h2 className="text-3xl font-bold text-slate-900">Veículos</h2>
          <p className="text-slate-600 mt-1">Gerencie a frota de veículos</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          <Plus size={20} />
          Adicionar Veículo
        </button>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por placa, marca ou modelo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>
      </div>

      {filteredVehicles.length === 0 ? (
        <div className="bg-white rounded-xl p-12 border border-slate-200 text-center">
          <Car className="mx-auto mb-4 text-slate-400" size={48} />
          <h3 className="text-xl font-semibold text-slate-900 mb-2">
            {searchTerm ? 'Nenhum veículo encontrado' : 'Nenhum veículo cadastrado'}
          </h3>
          <p className="text-slate-600 mb-6">
            {searchTerm
              ? 'Tente outra busca'
              : 'Comece adicionando o primeiro veículo da sua frota'}
          </p>
          {!searchTerm && (
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800"
            >
              <Plus size={20} />
              Adicionar Veículo
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVehicles.map((vehicle) => (
            <div
              key={vehicle.id}
              className="bg-white rounded-xl p-6 border border-slate-200 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-slate-100 rounded-lg">
                  <Car size={24} className="text-slate-700" />
                </div>
              </div>

              <h3 className="text-lg font-bold text-slate-900 mb-1">
                {vehicle.brand} {vehicle.model}
              </h3>
              <p className="text-2xl font-bold text-slate-600 mb-4">{vehicle.plate}</p>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Ano:</span>
                  <span className="font-medium text-slate-900">{vehicle.year}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Quilometragem:</span>
                  <span className="font-medium text-slate-900">
                    {vehicle.current_mileage.toLocaleString('pt-BR')} km
                  </span>
                </div>
                {vehicle.fuel_type && (
                  <div className="flex justify-between">
                    <span className="text-slate-600">Combustível:</span>
                    <span className="font-medium text-slate-900">{vehicle.fuel_type}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-2xl font-bold text-slate-900">Adicionar Veículo</h3>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Placa *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.plate}
                    onChange={(e) => setFormData({ ...formData, plate: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                    placeholder="ABC-1234"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Ano *
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Marca *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                    placeholder="Toyota"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Modelo *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                    placeholder="Corolla"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Quilometragem Inicial *
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.initial_mileage}
                    onChange={(e) => setFormData({ ...formData, initial_mileage: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Quilometragem Atual *
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.current_mileage}
                    onChange={(e) => setFormData({ ...formData, current_mileage: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Data de Aquisição *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.acquisition_date}
                    onChange={(e) => setFormData({ ...formData, acquisition_date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Combustível
                  </label>
                  <select
                    value={formData.fuel_type}
                    onChange={(e) => setFormData({ ...formData, fuel_type: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                  >
                    <option value="GASOLINA">Gasolina</option>
                    <option value="ETANOL">Etanol</option>
                    <option value="DIESEL">Diesel</option>
                    <option value="FLEX">Flex</option>
                    <option value="ELETRICO">Elétrico</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Cor
                  </label>
                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                    placeholder="Prata"
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
                  Cadastrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
