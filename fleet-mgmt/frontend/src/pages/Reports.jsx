import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { Spinner } from '../components/common';
import { format } from 'date-fns';

const COLORS = ['#2196ff', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
const TOOLTIP_STYLE = { background: '#181b22', border: '1px solid #252b35', borderRadius: '8px', fontSize: '12px', color: '#e2e8f0' };

export default function Reports() {
  const toast = useToast();
  const [summary, setSummary] = useState(null);
  const [vehicleCosts, setVehicleCosts] = useState([]);
  const [tripAnalytics, setTripAnalytics] = useState(null);
  const [compliance, setCompliance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [s, vc, ta, c] = await Promise.all([
          api.get('/reports/summary'),
          api.get('/reports/vehicle-costs'),
          api.get('/reports/trip-analytics'),
          api.get('/reports/compliance')
        ]);
        setSummary(s.data.data);
        setVehicleCosts(vc.data.data);
        setTripAnalytics(ta.data.data);
        setCompliance(c.data.data);
      } catch { toast.error('Failed to load reports'); }
      finally { setLoading(false); }
    };
    fetchAll();
  }, []);

  const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlyData = tripAnalytics?.monthlyTrips?.map(m => ({
    month: monthLabels[m._id.month - 1],
    total: m.count,
    completed: m.completed,
    cancelled: m.count - m.completed
  })) || [];

  const tripStatusData = tripAnalytics?.tripsByStatus?.map(s => ({
    name: s._id.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()),
    value: s.count
  })) || [];

  const topVehicleCosts = vehicleCosts.slice(0, 8).map(v => ({
    name: v.vehicle?.plateNumber || 'Unknown',
    fuel: v.fuel,
    maintenance: v.maintenance,
    expenses: v.expenses
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3">
          <Spinner size="lg" />
          <p className="text-sm text-slate-500">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="page-title">Reports & Analytics</h1>
        <p className="text-slate-500 text-sm mt-1">Fleet-wide operational insights</p>
      </div>

      {/* Tab nav */}
      <div className="flex gap-1 mb-6 bg-surface-2 p-1 rounded-xl w-fit border border-surface-3">
        {[
          { key: 'overview', label: 'Overview' },
          { key: 'costs', label: 'Cost Analysis' },
          { key: 'trips', label: 'Trip Analytics' },
          { key: 'compliance', label: 'Compliance' }
        ].map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === t.key ? 'bg-brand-500 text-white' : 'text-slate-400 hover:text-slate-200'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && summary && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card text-center">
              <p className="font-display font-bold text-3xl text-slate-100">{summary.fleet.total}</p>
              <p className="text-xs text-slate-500 mt-1">Total Vehicles</p>
            </div>
            <div className="card text-center">
              <p className="font-display font-bold text-3xl text-slate-100">{summary.drivers.total}</p>
              <p className="text-xs text-slate-500 mt-1">Total Drivers</p>
            </div>
            <div className="card text-center">
              <p className="font-display font-bold text-3xl text-slate-100">{summary.trips.completed}</p>
              <p className="text-xs text-slate-500 mt-1">Completed Trips</p>
            </div>
            <div className="card text-center">
              <p className="font-display font-bold text-3xl text-accent-amber">${(summary.financials.totalOperationalCost / 1000).toFixed(1)}k</p>
              <p className="text-xs text-slate-500 mt-1">Total OpCost</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="card">
              <h3 className="section-title mb-4">Cost Breakdown</h3>
              <div className="space-y-3">
                {[
                  { label: 'Fuel', value: summary.financials.totalFuelCost, color: '#2196ff' },
                  { label: 'Maintenance', value: summary.financials.totalMaintenance, color: '#f59e0b' },
                  { label: 'Expenses', value: summary.financials.totalExpenses, color: '#10b981' }
                ].map(item => {
                  const total = summary.financials.totalOperationalCost || 1;
                  const pct = ((item.value / total) * 100).toFixed(1);
                  return (
                    <div key={item.label}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-400">{item.label}</span>
                        <span className="text-slate-200 font-medium">${item.value.toFixed(0)}</span>
                      </div>
                      <div className="h-2 bg-surface-3 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: item.color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="card lg:col-span-2">
              <h3 className="section-title mb-4">Trip Status Distribution</h3>
              {tripStatusData.length > 0 ? (
                <div className="flex items-center gap-6">
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie data={tripStatusData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3}>
                        {tripStatusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={TOOLTIP_STYLE} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2 min-w-[160px]">
                    {tripStatusData.map((d, i) => (
                      <div key={d.name} className="flex items-center gap-2 text-sm">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                        <span className="text-slate-400 flex-1">{d.name}</span>
                        <span className="font-medium text-slate-200">{d.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : <p className="text-slate-500 text-sm text-center py-8">No trip data</p>}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'costs' && (
        <div className="space-y-6">
          <div className="card">
            <h3 className="section-title mb-6">Cost by Vehicle</h3>
            {topVehicleCosts.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={topVehicleCosts} barSize={24}>
                  <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Bar dataKey="fuel" name="Fuel" fill="#2196ff" radius={[2, 2, 0, 0]} stackId="stack" />
                  <Bar dataKey="maintenance" name="Maintenance" fill="#f59e0b" radius={[2, 2, 0, 0]} stackId="stack" />
                  <Bar dataKey="expenses" name="Expenses" fill="#10b981" radius={[4, 4, 0, 0]} stackId="stack" />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-slate-500 text-sm text-center py-16">No cost data yet</p>}
          </div>

          <div className="card p-0 overflow-hidden">
            <div className="px-5 py-4 border-b border-surface-3">
              <h3 className="section-title">Vehicle Cost Ranking</h3>
            </div>
            {vehicleCosts.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-8">No data</p>
            ) : (
              <table className="w-full">
                <thead className="border-b border-surface-3">
                  <tr>
                    {['#', 'Vehicle', 'Fuel', 'Maintenance', 'Expenses', 'Total'].map(h => (
                      <th key={h} className="table-head">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {vehicleCosts.map((v, i) => (
                    <tr key={v.vehicle?._id} className="table-row">
                      <td className="table-cell text-slate-500 text-sm">{i + 1}</td>
                      <td className="table-cell">
                        <p className="font-mono text-brand-400 text-sm">{v.vehicle?.plateNumber}</p>
                        <p className="text-xs text-slate-500">{v.vehicle?.make} {v.vehicle?.model}</p>
                      </td>
                      <td className="table-cell text-slate-300">${v.fuel.toFixed(0)}</td>
                      <td className="table-cell text-slate-300">${v.maintenance.toFixed(0)}</td>
                      <td className="table-cell text-slate-300">${v.expenses.toFixed(0)}</td>
                      <td className="table-cell font-medium text-slate-100">${v.total.toFixed(0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {activeTab === 'trips' && (
        <div className="space-y-6">
          <div className="card">
            <h3 className="section-title mb-6">Monthly Trip Volume</h3>
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={monthlyData} barSize={20}>
                  <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Bar dataKey="completed" name="Completed" fill="#10b981" radius={[2, 2, 0, 0]} stackId="a" />
                  <Bar dataKey="cancelled" name="Cancelled/Other" fill="#ef4444" opacity={0.4} radius={[4, 4, 0, 0]} stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-slate-500 text-sm text-center py-16">No trip data yet</p>}
          </div>

          <div className="card p-0 overflow-hidden">
            <div className="px-5 py-4 border-b border-surface-3">
              <h3 className="section-title">Recent Trip Log</h3>
            </div>
            <table className="w-full">
              <thead className="border-b border-surface-3">
                <tr>
                  {['Trip #', 'Vehicle', 'Driver', 'Route', 'Status', 'Date'].map(h => <th key={h} className="table-head">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {tripAnalytics?.recentTrips?.map(t => (
                  <tr key={t._id} className="table-row">
                    <td className="table-cell font-mono text-brand-400 text-sm">{t.tripNumber}</td>
                    <td className="table-cell font-mono text-xs text-slate-300">{t.vehicle?.plateNumber}</td>
                    <td className="table-cell text-slate-300 text-sm">{t.driver?.name}</td>
                    <td className="table-cell text-xs text-slate-400 max-w-[200px]">
                      <p className="truncate">{t.origin?.address}</p>
                      <p className="truncate text-slate-300">→ {t.destination?.address}</p>
                    </td>
                    <td className="table-cell">
                      <span className={`status-pill ${t.status === 'completed' ? 'bg-accent-green/10 text-accent-green border border-accent-green/20' : t.status === 'in_progress' ? 'bg-brand-500/10 text-brand-400 border border-brand-500/20' : 'bg-surface-3 text-slate-400 border border-surface-4'}`}>
                        {t.status?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="table-cell text-xs text-slate-400">{t.createdAt ? format(new Date(t.createdAt), 'MMM d, yyyy') : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'compliance' && compliance && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Expired Insurance */}
            <ComplianceTable
              title="❌ Expired Insurance"
              items={compliance.expiredInsurance}
              columns={['Plate', 'Vehicle', 'Expired']}
              renderRow={v => [
                <span className="font-mono text-brand-400">{v.plateNumber}</span>,
                `${v.make} ${v.model}`,
                <span className="text-accent-red text-xs">{v.insuranceExpiry ? format(new Date(v.insuranceExpiry), 'MMM d, yyyy') : '—'}</span>
              ]}
              emptyMsg="No expired insurance" />

            <ComplianceTable
              title="⚠️ Insurance Expiring Soon"
              items={compliance.expiringInsurance}
              columns={['Plate', 'Vehicle', 'Expires']}
              renderRow={v => [
                <span className="font-mono text-brand-400">{v.plateNumber}</span>,
                `${v.make} ${v.model}`,
                <span className="text-accent-amber text-xs">{v.insuranceExpiry ? format(new Date(v.insuranceExpiry), 'MMM d, yyyy') : '—'}</span>
              ]}
              emptyMsg="No upcoming expirations" />

            <ComplianceTable
              title="❌ Expired Driver Licenses"
              items={compliance.expiredLicenses}
              columns={['Employee ID', 'Driver', 'Expired']}
              renderRow={d => [
                <span className="font-mono text-xs">{d.employeeId}</span>,
                d.name,
                <span className="text-accent-red text-xs">{d.licenseExpiry ? format(new Date(d.licenseExpiry), 'MMM d, yyyy') : '—'}</span>
              ]}
              emptyMsg="No expired licenses" />

            <ComplianceTable
              title="⚠️ Licenses Expiring Soon"
              items={compliance.expiringLicenses}
              columns={['Employee ID', 'Driver', 'Expires']}
              renderRow={d => [
                <span className="font-mono text-xs">{d.employeeId}</span>,
                d.name,
                <span className="text-accent-amber text-xs">{d.licenseExpiry ? format(new Date(d.licenseExpiry), 'MMM d, yyyy') : '—'}</span>
              ]}
              emptyMsg="No upcoming expirations" />
          </div>
        </div>
      )}
    </div>
  );
}

function ComplianceTable({ title, items, columns, renderRow, emptyMsg }) {
  return (
    <div className="card p-0 overflow-hidden">
      <div className="px-5 py-4 border-b border-surface-3">
        <h3 className="section-title text-sm">{title}
          {items.length > 0 && <span className="ml-2 text-xs bg-accent-red/10 text-accent-red px-2 py-0.5 rounded-full">{items.length}</span>}
        </h3>
      </div>
      {items.length === 0 ? (
        <p className="text-slate-500 text-sm text-center py-6">✅ {emptyMsg}</p>
      ) : (
        <table className="w-full">
          <thead className="border-b border-surface-3">
            <tr>{columns.map(c => <th key={c} className="table-head">{c}</th>)}</tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={item._id || i} className="table-row">
                {renderRow(item).map((cell, j) => <td key={j} className="table-cell text-slate-300 text-sm">{cell}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
