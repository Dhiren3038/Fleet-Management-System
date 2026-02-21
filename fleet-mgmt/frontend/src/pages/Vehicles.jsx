import { useState, useEffect } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { StatusPill, Spinner, EmptyState, Modal, ConfirmModal, Pagination, Field } from '../components/common';
import { format } from 'date-fns';

const INITIAL_FORM = {
  plateNumber: '', make: '', model: '', year: new Date().getFullYear(),
  type: 'truck', capacityKg: '', fuelType: 'diesel', currentMileage: 0,
  insuranceExpiry: '', registrationExpiry: '', notes: ''
};

export default function Vehicles() {
  const { hasRole } = useAuth();
  const toast = useToast();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [filters, setFilters] = useState({ status: '', type: '' });
  const [modal, setModal] = useState({ open: false, vehicle: null });
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [saving, setSaving] = useState(false);

  const fetchVehicles = async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 15, ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)) };
      const res = await api.get('/vehicles', { params });
      setVehicles(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      toast.error('Failed to load vehicles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchVehicles(); }, [filters]);

  const openCreate = () => { setForm(INITIAL_FORM); setModal({ open: true, vehicle: null }); };
  const openEdit = (v) => {
    setForm({
      plateNumber: v.plateNumber, make: v.make, model: v.model, year: v.year,
      type: v.type, capacityKg: v.capacityKg, fuelType: v.fuelType,
      currentMileage: v.currentMileage || 0,
      insuranceExpiry: v.insuranceExpiry?.slice(0, 10) || '',
      registrationExpiry: v.registrationExpiry?.slice(0, 10) || '',
      notes: v.notes || ''
    });
    setModal({ open: true, vehicle: v });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (modal.vehicle) {
        await api.put(`/vehicles/${modal.vehicle._id}`, form);
        toast.success('Vehicle updated');
      } else {
        await api.post('/vehicles', form);
        toast.success('Vehicle added');
      }
      setModal({ open: false, vehicle: null });
      fetchVehicles();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/vehicles/${confirmDelete._id}`);
      toast.success('Vehicle deleted');
      setConfirmDelete(null);
      fetchVehicles();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  const f = (key) => (e) => setForm(p => ({ ...p, [key]: e.target.value }));

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="page-title">Vehicle Fleet</h1>
          <p className="text-slate-500 text-sm mt-1">{pagination.total} total vehicles</p>
        </div>
        {hasRole('manager', 'dispatcher') && (
          <button onClick={openCreate} className="btn-primary">+ Add Vehicle</button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <select className="select w-40" value={filters.status} onChange={e => setFilters(p => ({ ...p, status: e.target.value }))}>
          <option value="">All Status</option>
          <option value="available">Available</option>
          <option value="on_trip">On Trip</option>
          <option value="in_service">In Service</option>
          <option value="retired">Retired</option>
        </select>
        <select className="select w-40" value={filters.type} onChange={e => setFilters(p => ({ ...p, type: e.target.value }))}>
          <option value="">All Types</option>
          <option value="truck">Truck</option>
          <option value="van">Van</option>
          <option value="pickup">Pickup</option>
          <option value="sedan">Sedan</option>
          <option value="bus">Bus</option>
        </select>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : vehicles.length === 0 ? (
          <EmptyState icon="🚛" title="No vehicles found" description="Add your first vehicle to start managing your fleet."
            action={hasRole('manager', 'dispatcher') ? <button onClick={openCreate} className="btn-primary">Add Vehicle</button> : null} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-surface-3">
                <tr>
                  {['Plate', 'Vehicle', 'Type', 'Capacity', 'Status', 'Insurance', 'Registration', ''].map(h => (
                    <th key={h} className="table-head">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {vehicles.map(v => (
                  <tr key={v._id} className="table-row">
                    <td className="table-cell font-mono text-brand-400 font-medium">{v.plateNumber}</td>
                    <td className="table-cell">
                      <p className="font-medium text-slate-200">{v.make} {v.model}</p>
                      <p className="text-xs text-slate-500">{v.year} · {v.fuelType}</p>
                    </td>
                    <td className="table-cell capitalize text-slate-300">{v.type}</td>
                    <td className="table-cell text-slate-300">{v.capacityKg?.toLocaleString()}kg</td>
                    <td className="table-cell"><StatusPill status={v.status} /></td>
                    <td className="table-cell">
                      <span className={v.isInsuranceValid ? 'text-accent-green text-xs' : 'text-accent-red text-xs font-medium'}>
                        {v.insuranceExpiry ? format(new Date(v.insuranceExpiry), 'MMM d, yyyy') : '—'}
                      </span>
                    </td>
                    <td className="table-cell">
                      <span className={v.isRegistrationValid ? 'text-accent-green text-xs' : 'text-accent-red text-xs font-medium'}>
                        {v.registrationExpiry ? format(new Date(v.registrationExpiry), 'MMM d, yyyy') : '—'}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="flex gap-1">
                        {hasRole('manager', 'dispatcher') && (
                          <button onClick={() => openEdit(v)} className="btn-ghost text-xs px-2 py-1">Edit</button>
                        )}
                        {hasRole('manager') && v.status !== 'on_trip' && (
                          <button onClick={() => setConfirmDelete(v)} className="btn-ghost text-xs px-2 py-1 text-accent-red/70 hover:text-accent-red">Del</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && vehicles.length > 0 && (
          <div className="flex justify-end px-4 py-3 border-t border-surface-3">
            <Pagination page={pagination.page} pages={pagination.pages} onPageChange={fetchVehicles} />
          </div>
        )}
      </div>

      {/* Vehicle Modal */}
      <Modal isOpen={modal.open} onClose={() => setModal({ open: false, vehicle: null })}
        title={modal.vehicle ? 'Edit Vehicle' : 'Add Vehicle'} width="max-w-2xl">
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
          <Field label="Plate Number" required>
            <input className="input uppercase" value={form.plateNumber} onChange={f('plateNumber')} required placeholder="TRK-001" />
          </Field>
          <Field label="Type" required>
            <select className="select" value={form.type} onChange={f('type')}>
              {['truck', 'van', 'pickup', 'sedan', 'motorcycle', 'bus'].map(t => (
                <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
              ))}
            </select>
          </Field>
          <Field label="Make" required>
            <input className="input" value={form.make} onChange={f('make')} required placeholder="Volvo" />
          </Field>
          <Field label="Model" required>
            <input className="input" value={form.model} onChange={f('model')} required placeholder="FH16" />
          </Field>
          <Field label="Year" required>
            <input className="input" type="number" value={form.year} onChange={f('year')} required min={1990} max={2030} />
          </Field>
          <Field label="Fuel Type">
            <select className="select" value={form.fuelType} onChange={f('fuelType')}>
              {['diesel', 'petrol', 'electric', 'hybrid'].map(ft => (
                <option key={ft} value={ft}>{ft.charAt(0).toUpperCase() + ft.slice(1)}</option>
              ))}
            </select>
          </Field>
          <Field label="Capacity (kg)" required>
            <input className="input" type="number" value={form.capacityKg} onChange={f('capacityKg')} required min={0} placeholder="20000" />
          </Field>
          <Field label="Current Mileage (km)">
            <input className="input" type="number" value={form.currentMileage} onChange={f('currentMileage')} min={0} />
          </Field>
          <Field label="Insurance Expiry" required>
            <input className="input" type="date" value={form.insuranceExpiry} onChange={f('insuranceExpiry')} required />
          </Field>
          <Field label="Registration Expiry" required>
            <input className="input" type="date" value={form.registrationExpiry} onChange={f('registrationExpiry')} required />
          </Field>
          <div className="col-span-2">
            <Field label="Notes">
              <textarea className="input min-h-[60px] resize-none" value={form.notes} onChange={f('notes')} placeholder="Optional notes..." />
            </Field>
          </div>
          <div className="col-span-2 flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => setModal({ open: false, vehicle: null })} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? <Spinner size="sm" /> : (modal.vehicle ? 'Update' : 'Add Vehicle')}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal isOpen={!!confirmDelete} title="Delete Vehicle"
        message={`Delete ${confirmDelete?.plateNumber}? This action cannot be undone.`}
        onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} confirmText="Delete" />
    </div>
  );
}
