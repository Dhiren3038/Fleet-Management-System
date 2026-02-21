import { useState, useEffect } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { StatusPill, Spinner, EmptyState, Modal, Pagination, Field } from '../components/common';
import { format } from 'date-fns';

const FUEL_INITIAL = { vehicle: '', driver: '', liters: '', pricePerLiter: '', mileageAtFueling: '', fuelStation: '', date: new Date().toISOString().slice(0, 10), notes: '' };
const EXP_INITIAL = { vehicle: '', driver: '', category: 'toll', description: '', amount: '', date: new Date().toISOString().slice(0, 10), receiptNumber: '', notes: '' };

export default function FuelExpenses() {
  const { hasRole } = useAuth();
  const toast = useToast();
  const [tab, setTab] = useState('fuel');
  const [fuelLogs, setFuelLogs] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fuelPagination, setFuelPagination] = useState({ page: 1, pages: 1 });
  const [expPagination, setExpPagination] = useState({ page: 1, pages: 1 });
  const [fuelModal, setFuelModal] = useState(false);
  const [expModal, setExpModal] = useState(false);
  const [fuelForm, setFuelForm] = useState(FUEL_INITIAL);
  const [expForm, setExpForm] = useState(EXP_INITIAL);
  const [saving, setSaving] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [f, e, v, d] = await Promise.all([
        api.get('/fuel', { params: { limit: 15 } }),
        api.get('/expenses', { params: { limit: 15 } }),
        api.get('/vehicles', { params: { limit: 100 } }),
        api.get('/drivers', { params: { limit: 100 } })
      ]);
      setFuelLogs(f.data.data);
      setFuelPagination(f.data.pagination);
      setExpenses(e.data.data);
      setExpPagination(e.data.pagination);
      setVehicles(v.data.data);
      setDrivers(d.data.data);
    } catch { toast.error('Load failed'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleFuelSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/fuel', fuelForm);
      toast.success('Fuel log recorded');
      setFuelModal(false);
      fetchAll();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleExpSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/expenses', expForm);
      toast.success('Expense recorded');
      setExpModal(false);
      fetchAll();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleApprove = async (id, status) => {
    try {
      await api.patch(`/expenses/${id}/approve`, { status });
      toast.success(`Expense ${status}`);
      fetchAll();
    } catch (err) { toast.error('Failed'); }
  };

  const ff = (key) => (e) => setFuelForm(p => ({ ...p, [key]: e.target.value }));
  const fe = (key) => (e) => setExpForm(p => ({ ...p, [key]: e.target.value }));

  const totalFuel = fuelLogs.reduce((s, l) => s + (l.totalCost || 0), 0);
  const totalExp = expenses.reduce((s, e) => s + (e.amount || 0), 0);

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="page-title">Fuel & Expenses</h1>
          <p className="text-slate-500 text-sm mt-1">Track operational costs</p>
        </div>
        <div className="flex gap-2">
          {hasRole('manager', 'dispatcher', 'finance_analyst') && (
            <button onClick={() => { setFuelForm(FUEL_INITIAL); setFuelModal(true); }} className="btn-secondary">+ Fuel Log</button>
          )}
          <button onClick={() => { setExpForm(EXP_INITIAL); setExpModal(true); }} className="btn-primary">+ Expense</button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="card">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Total Fuel Cost</p>
          <p className="font-display font-bold text-2xl text-slate-100">${totalFuel.toFixed(0)}</p>
        </div>
        <div className="card">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Total Expenses</p>
          <p className="font-display font-bold text-2xl text-slate-100">${totalExp.toFixed(0)}</p>
        </div>
        <div className="card">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Fuel Records</p>
          <p className="font-display font-bold text-2xl text-slate-100">{fuelPagination.total || fuelLogs.length}</p>
        </div>
        <div className="card">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Pending Approval</p>
          <p className="font-display font-bold text-2xl text-accent-amber">{expenses.filter(e => e.approvalStatus === 'pending').length}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-surface-2 p-1 rounded-xl w-fit border border-surface-3">
        {[{ key: 'fuel', label: '⛽ Fuel Logs' }, { key: 'expenses', label: '💰 Expenses' }].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.key ? 'bg-brand-500 text-white' : 'text-slate-400 hover:text-slate-200'}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : tab === 'fuel' ? (
          fuelLogs.length === 0 ? (
            <EmptyState icon="⛽" title="No fuel logs" description="Start recording fuel entries." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-surface-3">
                  <tr>
                    {['Date', 'Vehicle', 'Driver', 'Liters', 'Price/L', 'Total', 'Mileage', 'Station'].map(h => (
                      <th key={h} className="table-head">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {fuelLogs.map(l => (
                    <tr key={l._id} className="table-row">
                      <td className="table-cell text-xs text-slate-400">{l.date ? format(new Date(l.date), 'MMM d, yyyy') : '—'}</td>
                      <td className="table-cell font-mono text-brand-400 text-xs">{l.vehicle?.plateNumber}</td>
                      <td className="table-cell text-slate-300 text-sm">{l.driver?.name || '—'}</td>
                      <td className="table-cell text-slate-300">{l.liters}L</td>
                      <td className="table-cell text-slate-300">${l.pricePerLiter}</td>
                      <td className="table-cell font-medium text-slate-200">${l.totalCost?.toFixed(2)}</td>
                      <td className="table-cell text-slate-300 text-xs">{l.mileageAtFueling?.toLocaleString()}km</td>
                      <td className="table-cell text-slate-400 text-xs">{l.fuelStation || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          expenses.length === 0 ? (
            <EmptyState icon="💰" title="No expenses logged" description="Record operational expenses." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-surface-3">
                  <tr>
                    {['Date', 'Category', 'Description', 'Amount', 'Vehicle', 'Status', ''].map(h => (
                      <th key={h} className="table-head">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {expenses.map(e => (
                    <tr key={e._id} className="table-row">
                      <td className="table-cell text-xs text-slate-400">{e.date ? format(new Date(e.date), 'MMM d, yyyy') : '—'}</td>
                      <td className="table-cell capitalize text-slate-300 text-sm">{e.category}</td>
                      <td className="table-cell text-slate-300 text-sm max-w-[200px] truncate">{e.description}</td>
                      <td className="table-cell font-medium text-slate-200">${e.amount?.toFixed(2)}</td>
                      <td className="table-cell font-mono text-brand-400 text-xs">{e.vehicle?.plateNumber || '—'}</td>
                      <td className="table-cell"><StatusPill status={e.approvalStatus} /></td>
                      <td className="table-cell">
                        {e.approvalStatus === 'pending' && hasRole('manager', 'finance_analyst') && (
                          <div className="flex gap-1">
                            <button onClick={() => handleApprove(e._id, 'approved')} className="btn-primary text-xs px-2 py-1">✓</button>
                            <button onClick={() => handleApprove(e._id, 'rejected')} className="btn-danger text-xs px-2 py-1">✕</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      {/* Fuel Modal */}
      <Modal isOpen={fuelModal} onClose={() => setFuelModal(false)} title="Record Fuel Log">
        <form onSubmit={handleFuelSubmit} className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Field label="Vehicle" required>
              <select className="select" value={fuelForm.vehicle} onChange={ff('vehicle')} required>
                <option value="">Select vehicle...</option>
                {vehicles.map(v => <option key={v._id} value={v._id}>{v.plateNumber} — {v.make} {v.model}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Driver">
            <select className="select" value={fuelForm.driver} onChange={ff('driver')}>
              <option value="">Select driver (optional)...</option>
              {drivers.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
            </select>
          </Field>
          <Field label="Date" required><input className="input" type="date" value={fuelForm.date} onChange={ff('date')} required /></Field>
          <Field label="Liters" required><input className="input" type="number" step="0.01" value={fuelForm.liters} onChange={ff('liters')} required min={0.1} placeholder="0.00" /></Field>
          <Field label="Price per Liter ($)" required><input className="input" type="number" step="0.001" value={fuelForm.pricePerLiter} onChange={ff('pricePerLiter')} required min={0} placeholder="0.000" /></Field>
          <Field label="Mileage at Fueling (km)" required><input className="input" type="number" value={fuelForm.mileageAtFueling} onChange={ff('mileageAtFueling')} required min={0} /></Field>
          <Field label="Fuel Station"><input className="input" value={fuelForm.fuelStation} onChange={ff('fuelStation')} placeholder="Station name..." /></Field>
          <div className="col-span-2 flex gap-3 justify-end">
            <button type="button" onClick={() => setFuelModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? <Spinner size="sm" /> : 'Save Fuel Log'}</button>
          </div>
        </form>
      </Modal>

      {/* Expense Modal */}
      <Modal isOpen={expModal} onClose={() => setExpModal(false)} title="Record Expense">
        <form onSubmit={handleExpSubmit} className="grid grid-cols-2 gap-4">
          <Field label="Category" required>
            <select className="select" value={expForm.category} onChange={fe('category')} required>
              {['toll', 'parking', 'repair', 'fine', 'accommodation', 'meals', 'miscellaneous'].map(c => (
                <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
              ))}
            </select>
          </Field>
          <Field label="Date" required><input className="input" type="date" value={expForm.date} onChange={fe('date')} required /></Field>
          <div className="col-span-2">
            <Field label="Description" required><input className="input" value={expForm.description} onChange={fe('description')} required placeholder="Describe the expense..." /></Field>
          </div>
          <Field label="Amount ($)" required><input className="input" type="number" step="0.01" value={expForm.amount} onChange={fe('amount')} required min={0} /></Field>
          <Field label="Receipt Number"><input className="input" value={expForm.receiptNumber} onChange={fe('receiptNumber')} /></Field>
          <Field label="Vehicle">
            <select className="select" value={expForm.vehicle} onChange={fe('vehicle')}>
              <option value="">None</option>
              {vehicles.map(v => <option key={v._id} value={v._id}>{v.plateNumber} — {v.make} {v.model}</option>)}
            </select>
          </Field>
          <Field label="Driver">
            <select className="select" value={expForm.driver} onChange={fe('driver')}>
              <option value="">None</option>
              {drivers.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
            </select>
          </Field>
          <div className="col-span-2 flex gap-3 justify-end">
            <button type="button" onClick={() => setExpModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? <Spinner size="sm" /> : 'Save Expense'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
