import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { KpiCard, StatusPill, Spinner, Skeleton } from '../components/common';

const CHART_COLORS = ['#2196ff', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function Dashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [tripAnalytics, setTripAnalytics] = useState(null);
  const [compliance, setCompliance] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [s, t, c] = await Promise.all([
          api.get('/reports/summary'),
          api.get('/reports/trip-analytics'),
          api.get('/reports/compliance')
        ]);
        setSummary(s.data.data);
        setTripAnalytics(t.data.data);
        setCompliance(c.data.data);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const fleetStatusData = summary ? [
    { name: 'Available', value: summary.fleet.available },
    { name: 'On Trip', value: summary.fleet.onTrip },
    { name: 'In Service', value: summary.fleet.inService }
  ].filter(d => d.value > 0) : [];

  const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlyData = tripAnalytics?.monthlyTrips?.map(m => ({
    month: monthLabels[m._id.month - 1],
    total: m.count,
    completed: m.completed
  })) || [];

  const complianceAlerts = compliance ? [
    ...compliance.expiredInsurance.map(v => ({ type: 'error', msg: `${v.plateNumber} insurance expired` })),
    ...compliance.expiredRegistration.map(v => ({ type: 'error', msg: `${v.plateNumber} registration expired` })),
    ...compliance.expiredLicenses.map(d => ({ type: 'error', msg: `${d.name} license expired` })),
    ...compliance.expiringInsurance.map(v => ({ type: 'warning', msg: `${v.plateNumber} insurance expiring soon` })),
    ...compliance.expiringRegistration.map(v => ({ type: 'warning', msg: `${v.plateNumber} registration expiring soon` })),
    ...compliance.expiringLicenses.map(d => ({ type: 'warning', msg: `${d.name} license expiring soon` }))
  ] : [];

  if (loading) {
    return (
      <div>
        <div className="mb-8">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="page-title">Good {getGreeting()}, {user?.name?.split(' ')[0]}</h1>
          <p className="text-slate-500 text-sm mt-1">Fleet operational overview · {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        </div>
        <Link to="/trips" className="btn-primary flex items-center gap-2">
          <span>+</span> New Dispatch
        </Link>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Total Fleet" value={summary?.fleet.total ?? '—'} icon="🚛" color="brand"
          sub={`${summary?.fleet.available} available`} />
        <KpiCard label="Active Drivers" value={summary?.drivers.total ?? '—'} icon="👤" color="green"
          sub={`${summary?.drivers.onTrip} on trip`} />
        <KpiCard label="Trips Today" value={summary?.trips.inProgress ?? '—'} icon="🗺" color="amber"
          sub={`${summary?.trips.completed} completed total`} />
        <KpiCard label="Total OpCost" value={`$${((summary?.financials.totalOperationalCost ?? 0) / 1000).toFixed(1)}k`}
          icon="💰" color="purple" sub={`$${((summary?.financials.totalFuelCost ?? 0) / 1000).toFixed(1)}k fuel`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Fleet Status Chart */}
        <div className="card">
          <h3 className="section-title mb-4">Fleet Status</h3>
          {fleetStatusData.length > 0 ? (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={fleetStatusData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value" paddingAngle={3}>
                    {fleetStatusData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#181b22', border: '1px solid #252b35', borderRadius: '8px', fontSize: '12px', color: '#e2e8f0' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {fleetStatusData.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-2 text-sm">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: CHART_COLORS[i] }} />
                    <span className="text-slate-400">{d.name}</span>
                    <span className="font-medium text-slate-200 ml-auto">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-slate-500 text-sm text-center py-8">No fleet data</p>
          )}
        </div>

        {/* Trip Trends */}
        <div className="card lg:col-span-2">
          <h3 className="section-title mb-4">Trip Trends (12 months)</h3>
          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={monthlyData} barSize={12}>
                <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#181b22', border: '1px solid #252b35', borderRadius: '8px', fontSize: '12px', color: '#e2e8f0' }} />
                <Bar dataKey="total" fill="#2196ff" opacity={0.3} radius={[3, 3, 0, 0]} />
                <Bar dataKey="completed" fill="#2196ff" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-slate-500 text-sm text-center py-8">No trip data yet</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Compliance Alerts */}
        <div className="card">
          <h3 className="section-title mb-4">
            Compliance Alerts
            {complianceAlerts.length > 0 && (
              <span className="ml-2 text-xs bg-accent-red/10 text-accent-red px-2 py-0.5 rounded-full">{complianceAlerts.length}</span>
            )}
          </h3>
          {complianceAlerts.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-2xl mb-2">✅</p>
              <p className="text-sm text-slate-500">All documents compliant</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {complianceAlerts.map((alert, i) => (
                <div key={i} className={`flex items-start gap-2.5 px-3 py-2.5 rounded-lg text-sm
                  ${alert.type === 'error' ? 'bg-accent-red/5 border border-accent-red/10' : 'bg-accent-amber/5 border border-accent-amber/10'}`}>
                  <span>{alert.type === 'error' ? '🔴' : '🟡'}</span>
                  <span className="text-slate-300">{alert.msg}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Trips */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title">Recent Trips</h3>
            <Link to="/trips" className="text-xs text-brand-400 hover:text-brand-300">View all →</Link>
          </div>
          <div className="space-y-2">
            {tripAnalytics?.recentTrips?.slice(0, 5).map(trip => (
              <div key={trip._id} className="flex items-center justify-between py-2 border-b border-surface-3 last:border-0">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-300 truncate font-mono">{trip.tripNumber}</p>
                  <p className="text-xs text-slate-500 truncate">{trip.driver?.name} · {trip.vehicle?.plateNumber}</p>
                </div>
                <StatusPill status={trip.status} />
              </div>
            )) || <p className="text-sm text-slate-500 text-center py-4">No trips yet</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
