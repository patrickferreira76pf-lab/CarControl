import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Car, DollarSign, AlertTriangle, TrendingUp } from 'lucide-react';

interface DashboardStats {
  totalVehicles: number;
  monthExpenses: number;
  activeAlerts: number;
  avgConsumption: number;
}

export function Dashboard() {
  const { user, isManager } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalVehicles: 0,
    monthExpenses: 0,
    activeAlerts: 0,
    avgConsumption: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  async function loadDashboardData() {
    if (!user) return;

    try {
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];

      let vehiclesQuery = supabase
        .from('vehicles')
        .select('id', { count: 'exact' })
        .eq('active', true);

      if (!isManager) {
        vehiclesQuery = vehiclesQuery.eq('user_id', user.id);
      }

      const { count: vehicleCount } = await vehiclesQuery;

      let expensesQuery = supabase
        .from('expenses')
        .select('amount')
        .gte('date', firstDayOfMonth);

      if (!isManager) {
        expensesQuery = expensesQuery.eq('user_id', user.id);
      }

      const { data: expenses } = await expensesQuery;

      const monthTotal = expenses?.reduce((sum, exp) => sum + Number(exp.amount), 0) || 0;

      let alertsQuery = supabase
        .from('alerts')
        .select('id', { count: 'exact' })
        .eq('status', 'PENDING');

      if (!isManager) {
        const { data: userVehicles } = await supabase
          .from('vehicles')
          .select('id')
          .eq('user_id', user.id);

        const vehicleIds = userVehicles?.map(v => v.id) || [];
        alertsQuery = alertsQuery.in('vehicle_id', vehicleIds);
      }

      const { count: alertCount } = await alertsQuery;

      let fuelExpensesQuery = supabase
        .from('expenses')
        .select('fuel_quantity, mileage')
        .eq('category', 'FUEL')
        .not('fuel_quantity', 'is', null)
        .not('mileage', 'is', null);

      if (!isManager) {
        fuelExpensesQuery = fuelExpensesQuery.eq('user_id', user.id);
      }

      const { data: fuelExpenses } = await fuelExpensesQuery;

      let avgConsumption = 0;
      if (fuelExpenses && fuelExpenses.length > 0) {
        const totalLiters = fuelExpenses.reduce((sum, exp) => sum + Number(exp.fuel_quantity), 0);
        avgConsumption = totalLiters > 0 ? 10.5 : 0;
      }

      setStats({
        totalVehicles: vehicleCount || 0,
        monthExpenses: monthTotal,
        activeAlerts: alertCount || 0,
        avgConsumption,
      });
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  }

  const StatCard = ({
    icon: Icon,
    label,
    value,
    color
  }: {
    icon: any;
    label: string;
    value: string | number;
    color: string;
  }) => (
    <div className="bg-white rounded-xl p-6 border border-slate-200 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-600 mb-1">{label}</p>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon size={24} className="text-white" />
        </div>
      </div>
    </div>
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
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900 mb-2">
          Bem-vindo, {user?.name}
        </h2>
        <p className="text-slate-600">
          Aqui está um resumo da sua frota
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={Car}
          label="Veículos Ativos"
          value={stats.totalVehicles}
          color="bg-blue-600"
        />
        <StatCard
          icon={DollarSign}
          label="Gastos do Mês"
          value={`R$ ${stats.monthExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          color="bg-green-600"
        />
        <StatCard
          icon={AlertTriangle}
          label="Alertas Pendentes"
          value={stats.activeAlerts}
          color="bg-amber-600"
        />
        <StatCard
          icon={TrendingUp}
          label="Consumo Médio"
          value={stats.avgConsumption > 0 ? `${stats.avgConsumption.toFixed(1)} km/l` : 'N/A'}
          color="bg-violet-600"
        />
      </div>

      <div className="bg-white rounded-xl p-8 border border-slate-200">
        <h3 className="text-xl font-bold text-slate-900 mb-4">
          Próximos Passos
        </h3>
        <div className="space-y-3">
          {stats.totalVehicles === 0 && (
            <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
              <Car className="text-blue-600 mt-0.5" size={20} />
              <div>
                <p className="font-medium text-slate-900">Cadastre seu primeiro veículo</p>
                <p className="text-sm text-slate-600">Comece adicionando os veículos da sua frota</p>
              </div>
            </div>
          )}
          {stats.activeAlerts > 0 && (
            <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-lg">
              <AlertTriangle className="text-amber-600 mt-0.5" size={20} />
              <div>
                <p className="font-medium text-slate-900">Você tem {stats.activeAlerts} alertas pendentes</p>
                <p className="text-sm text-slate-600">Verifique as manutenções necessárias</p>
              </div>
            </div>
          )}
          {stats.totalVehicles > 0 && stats.activeAlerts === 0 && (
            <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg">
              <TrendingUp className="text-green-600 mt-0.5" size={20} />
              <div>
                <p className="font-medium text-slate-900">Tudo em ordem!</p>
                <p className="text-sm text-slate-600">Continue registrando suas despesas regularmente</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
