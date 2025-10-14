import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { AlertTriangle, CheckCircle, Info, Bell } from 'lucide-react';

interface Alert {
  id: string;
  title: string;
  message: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  status: 'PENDING' | 'VIEWED' | 'RESOLVED';
  due_date: string | null;
  due_mileage: number | null;
  created_at: string;
  vehicle: {
    plate: string;
    brand: string;
    model: string;
  };
}

export function Alerts() {
  const { user, isManager } = useAuth();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'VIEWED' | 'RESOLVED'>('ALL');

  const loadAlerts = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      let query = supabase
        .from('alerts')
        .select(`
          id,
          title,
          message,
          severity,
          status,
          due_date,
          due_mileage,
          created_at,
          vehicle_id
        `)
        .order('created_at', { ascending: false });

      if (!isManager) {
        const { data: userVehicles } = await supabase
          .from('vehicles')
          .select('id')
          .eq('user_id', user.id);

        const vehicleIds = userVehicles?.map(v => v.id) || [];
        query = query.in('vehicle_id', vehicleIds);
      }

      const { data: alertsData } = await query;

      const vehicleIds = [...new Set(alertsData?.map(a => a.vehicle_id) || [])];
      const { data: vehiclesData } = await supabase
        .from('vehicles')
        .select('id, plate, brand, model')
        .in('id', vehicleIds);

      const vehicleMap = new Map(vehiclesData?.map(v => [v.id, v]) || []);

      const enrichedAlerts = (alertsData || []).map(alert => ({
        ...alert,
        vehicle: vehicleMap.get(alert.vehicle_id) || { plate: 'N/A', brand: '', model: '' }
      }));

      setAlerts(enrichedAlerts);
    } catch (error) {
      console.error('Error loading alerts:', error);
    } finally {
      setLoading(false);
    }
  }, [user, isManager]);

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  async function markAsViewed(alertId: string) {
    try {
      const { error } = await supabase
        .from('alerts')
        .update({
          status: 'VIEWED',
          viewed_at: new Date().toISOString()
        })
        .eq('id', alertId);

      if (error) throw error;
      loadAlerts();
    } catch (error) {
      console.error('Error marking alert as viewed:', error);
    }
  }

  async function markAsResolved(alertId: string) {
    try {
      const { error } = await supabase
        .from('alerts')
        .update({
          status: 'RESOLVED',
          resolved_at: new Date().toISOString()
        })
        .eq('id', alertId);

      if (error) throw error;
      loadAlerts();
    } catch (error) {
      console.error('Error marking alert as resolved:', error);
    }
  }

  const filteredAlerts = filter === 'ALL'
    ? alerts
    : alerts.filter(alert => alert.status === filter);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'WARNING':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return <AlertTriangle size={24} className="text-red-600" />;
      case 'WARNING':
        return <AlertTriangle size={24} className="text-amber-600" />;
      default:
        return <Info size={24} className="text-blue-600" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  const pendingCount = alerts.filter(a => a.status === 'PENDING').length;
  const viewedCount = alerts.filter(a => a.status === 'VIEWED').length;
  const resolvedCount = alerts.filter(a => a.status === 'RESOLVED').length;

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900">Alertas</h2>
        <p className="text-slate-600 mt-1">Acompanhe notificações e manutenções</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <button
          onClick={() => setFilter('ALL')}
          className={`p-4 rounded-xl border-2 transition-all ${
            filter === 'ALL'
              ? 'border-slate-900 bg-slate-50'
              : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <p className="text-sm text-slate-600 mb-1">Total</p>
          <p className="text-2xl font-bold text-slate-900">{alerts.length}</p>
        </button>

        <button
          onClick={() => setFilter('PENDING')}
          className={`p-4 rounded-xl border-2 transition-all ${
            filter === 'PENDING'
              ? 'border-slate-900 bg-slate-50'
              : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <p className="text-sm text-slate-600 mb-1">Pendentes</p>
          <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
        </button>

        <button
          onClick={() => setFilter('VIEWED')}
          className={`p-4 rounded-xl border-2 transition-all ${
            filter === 'VIEWED'
              ? 'border-slate-900 bg-slate-50'
              : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <p className="text-sm text-slate-600 mb-1">Visualizados</p>
          <p className="text-2xl font-bold text-blue-600">{viewedCount}</p>
        </button>

        <button
          onClick={() => setFilter('RESOLVED')}
          className={`p-4 rounded-xl border-2 transition-all ${
            filter === 'RESOLVED'
              ? 'border-slate-900 bg-slate-50'
              : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <p className="text-sm text-slate-600 mb-1">Resolvidos</p>
          <p className="text-2xl font-bold text-green-600">{resolvedCount}</p>
        </button>
      </div>

      {filteredAlerts.length === 0 ? (
        <div className="bg-white rounded-xl p-12 border border-slate-200 text-center">
          <Bell className="mx-auto mb-4 text-slate-400" size={48} />
          <h3 className="text-xl font-semibold text-slate-900 mb-2">
            Nenhum alerta encontrado
          </h3>
          <p className="text-slate-600">
            {filter === 'ALL'
              ? 'Não há alertas no momento'
              : `Não há alertas com status "${filter.toLowerCase()}"`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`bg-white rounded-xl p-6 border-2 ${getSeverityColor(alert.severity)}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className="mt-1">
                    {getSeverityIcon(alert.severity)}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-slate-900">
                        {alert.title}
                      </h3>
                      <span className="px-2 py-1 bg-white rounded text-xs font-medium">
                        {alert.vehicle.plate}
                      </span>
                    </div>

                    <p className="text-slate-700 mb-3">{alert.message}</p>

                    <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                      <div>
                        <span className="font-medium">Veículo:</span>{' '}
                        {alert.vehicle.brand} {alert.vehicle.model}
                      </div>
                      {alert.due_date && (
                        <div>
                          <span className="font-medium">Prazo:</span>{' '}
                          {new Date(alert.due_date).toLocaleDateString('pt-BR')}
                        </div>
                      )}
                      {alert.due_mileage && (
                        <div>
                          <span className="font-medium">Quilometragem:</span>{' '}
                          {alert.due_mileage.toLocaleString('pt-BR')} km
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  {alert.status === 'PENDING' && (
                    <>
                      <button
                        onClick={() => markAsViewed(alert.id)}
                        className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 whitespace-nowrap"
                      >
                        Marcar como Visto
                      </button>
                      <button
                        onClick={() => markAsResolved(alert.id)}
                        className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 whitespace-nowrap"
                      >
                        Resolver
                      </button>
                    </>
                  )}
                  {alert.status === 'VIEWED' && (
                    <button
                      onClick={() => markAsResolved(alert.id)}
                      className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 whitespace-nowrap"
                    >
                      Resolver
                    </button>
                  )}
                  {alert.status === 'RESOLVED' && (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle size={20} />
                      <span className="text-sm font-medium">Resolvido</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
