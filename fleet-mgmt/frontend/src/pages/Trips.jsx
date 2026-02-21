import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { StatusPill, Spinner, EmptyState, Modal, ConfirmModal, Pagination, Field } from '../components/common';
import { format } from 'date-fns';

const INITIAL_FORM = {
  vehicleId: '', driverId: '',
  'origin.address': '', 'destination.address': '',
  cargoDescription: '', cargoWeightKg: '',
  scheduledDeparture: '', scheduledArrival: '', notes: ''
};

export default function Trips() {
  const { hasRole } = useAuth();
  const toast = useToast();
  const [trips, setTrips] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [statusFilter, setStatusFilter] = useState('');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [validation, setValidation] = useState({ valid: null, errors: [], checking: false });
  const [saving, setSaving] = useState(false);
  const [actionModal, setActionModal] = useState(null);
  const [actionForm, setActionForm] = useState({ endMileage: '', reason: '', notes: '' });
  const validationTimer = useRef(null);

  const fetchTrips = async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 15, ...(statusFilter && { status: statusFilter }) };
      const res = await api.get('/trips', { params });
      setTrips(res.data.data);
      setPagination(res.data.pagination);
    } catch {
      toast.error('Failed to load trips');
    } finally {
      setLoading(false);
    }
  };

  const fetchOptions = async () => {
    const [v, d] = await Promise.all([
      api.get('/vehicles', { params: { status: 'available', limit: 100 } }),
      api.get('/drivers', { params: { status: 'available', limit: 100 } })
    ]);
    setVehicles(v.data.data);
    setDrivers(d.data.data);
  };

  useEffect(() => { fetchTrips(); }, [statusFilter]);

  const openCreate = () => {
    setForm(INITIAL_FORM);
    setValidation({ valid: null, errors: [], checking: false });
    fetchOptions();
    setModal(true);
  };

  // Real-time validation as user selects vehicle/driver
  const runValidation = async (vehicleId, driverId, cargoWeightKg) => {
    if (!vehicleId || !driverId || !cargoWeightKg) return;
    setValidation(p => ({ ...p, checking: true }));
    try {
      const res = await api.post('/trips/validate', { vehicleId, driverId, cargoWeightKg: Number(cargoWeightKg) });
      setValidation({ valid: res.data.valid, errors: res.data.errors || [], checking: false });
    } catch (err) {
      setValidation({ valid: false, errors: [err.response?.data?.message || 'Validation failed'], checking: false });
    }
  };

  const f = (key) => (e) => {
    const value = e.target.value;
    const newForm = { ...form, [key]: value };
    setForm(newForm);
    if (['vehicleId', 'driverId', 'cargoWeightKg'].includes(key)) {
      clearTimeout(validationTimer.current);
      validationTimer.current = setTimeout(() => {
        runValidation(newForm.vehicleId, newForm.driverId, newForm.cargoWeightKg);
      }, 400);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validation.valid && validation.valid !== null) {
      toast.error('Resolve validation errors before dispatching');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        vehicleId: form.vehicleId,
        driverId: form.driverId,
        origin: { address: form['origin.address'] },
        destination: { address: form['destination.address'] },
        cargoDescription: form.cargoDescription,
        cargoWeightKg: Number(form.cargoWeightKg),
        scheduledDeparture: form.scheduledDeparture,
        scheduledArrival: form.scheduledArrival,
        notes: form.notes
      };
      await api.post('/trips', payload);
      toast.success('Trip dispatched');
      setModal(false);
      fetchTrips();
    } catch (err) {
      const errs = err.response?.data?.errors;
      toast.error(errs ? errs.join(' | ') : (err.response?.data?.message || 'Dispatch failed'));
    } finally {
      setSaving(false);
    }
  };

  const handleAction = async () => {
    const { trip, type } = actionModal;
    try {
      if (type === 'start') {
        await api.patch(`/trips/${trip._id}/start`, { startMileage: Number(actionForm.startMileage) });
        toast.success('Trip started');
      } else if (type === 'complete') {
        await api.patch(`/trips/${trip._id}/complete`, { endMileage: Number(actionForm.endMileage), notes: actionForm.notes });
        toast.success('Trip completed');
      } else if (type === 'cancel') {
        await api.patch(`/trips/${trip._id}/cancel`, { reason: actionForm.reason });
        toast.success('Trip cancelled');
      }
      setActionModal(null);
      fetchTrips();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    }
  };

  const selectedVehicle = vehicles.find(v => v._id === form.vehicleId);

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="page-title">Dispatch Console</h1>
          <p className="text-slate-500 text-sm mt-1">{pagination.total} total trips</p>
        </div>
        {hasRole('manager', 'dispatcher') && (
          <button onClick={openCreate} className="btn-primary">⚡ Dispatch Trip</button>
        )}
      </div>

      <div className="flex gap-3 mb-6">
        {['', 'scheduled', 'in_progress', 'completed', 'cancelled'].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${statusFilter === s ? 'bg-brand-500 text-white' : 'btn-secondary'}`}>
            {s ? s.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'All'}
          </button>
        ))}
      </div>

      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : trips.length === 0 ? (
          <EmptyState icon="🗺" title="No trips found" description="Dispatch your first trip to get started."
            action={hasRole('manager', 'dispatcher') ? <button onClick={openCreate} className="btn-primary">Dispatch Trip</button> : null} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-surface-3">
                <tr>
                  {['Trip #', 'Route', 'Vehicle', 'Driver', 'Cargo', 'Scheduled', 'Status', ''].map(h => (
                    <th key={h} className="table-head">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {trips.map(t => (
                  <tr key={t._id} className="table-row">
                    <td className="table-cell font-mono text-brand-400 text-sm">{t.tripNumber}</td>
                    <td className="table-cell max-w-[200px]">
                      <p className="text-xs text-slate-400 truncate">{t.origin?.address}</p>
                      <p className="text-xs text-slate-300 truncate font-medium">→ {t.destination?.address}</p>
                    </td>
                    <td className="table-cell">
                      <span className="font-mono text-xs text-slate-300">{t.vehicle?.plateNumber}</span>
                      <p className="text-xs text-slate-500">{t.vehicle?.make} {t.vehicle?.model}</p>
                    </td>
                    <td className="table-cell text-slate-300 text-sm">{t.driver?.name}</td>
                    <td className="table-cell">
                      <p className="text-xs text-slate-300 truncate max-w-[120px]">{t.cargoDescription}</p>
                      <p className="text-xs text-slate-500">{t.cargoWeightKg}kg</p>
                    </td>
                    <td className="table-cell text-xs text-slate-400">
                      {t.scheduledDeparture ? format(new Date(t.scheduledDeparture), 'MMM d, HH:mm') : '—'}
                    </td>
                    <td className="table-cell"><StatusPill status={t.status} /></td>
                    <td className="table-cell">
                      <div className="flex gap-1 flex-wrap">
                        {t.status === 'scheduled' && hasRole('manager', 'dispatcher') && (
                          <button onClick={() => { setActionModal({ trip: t, type: 'start' }); setActionForm({ startMileage: '', reason: '', notes: '' }); }} className="btn-primary text-xs px-2 py-1">Start</button>
                        )}
                        {t.status === 'in_progress' && hasRole('manager', 'dispatcher') && (
                          <button onClick={() => { setActionModal({ trip: t, type: 'complete' }); setActionForm({ endMileage: '', notes: '' }); }} className="btn-primary text-xs px-2 py-1">Complete</button>
                        )}
                        {['scheduled', 'in_progress'].includes(t.status) && hasRole('manager', 'dispatcher') && (
                          <button onClick={() => { setActionModal({ trip: t, type: 'cancel' }); setActionForm({ reason: '' }); }} className="btn-danger text-xs px-2 py-1">Cancel</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && trips.length > 0 && (
          <div className="flex justify-end px-4 py-3 border-t border-surface-3">
            <Pagination page={pagination.page} pages={pagination.pages} onPageChange={fetchTrips} />
          </div>
        )}
      </div>

      {/* Dispatch Modal */}
      <Modal isOpen={modal} onClose={() => setModal(false)} title="New Dispatch" width="max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Vehicle" required>
              <select className="select" value={form.vehicleId} onChange={f('vehicleId')} required>
                <option value="">Select vehicle...</option>
                {vehicles.map(v => (
                  <option key={v._id} value={v._id}>{v.plateNumber} — {v.make} {v.model} ({v.capacityKg}kg)</option>
                ))}
              </select>
            </Field>
            <Field label="Driver" required>
              <select className="select" value={form.driverId} onChange={f('driverId')} required>
                <option value="">Select driver...</option>
                {drivers.map(d => (
                  <option key={d._id} value={d._id}>{d.name} — {d.licenseClass} · {d.employeeId}</option>
                ))}
              </select>
            </Field>
            <Field label="Cargo Description" required>
              <input className="input" value={form.cargoDescription} onChange={f('cargoDescription')} required placeholder="Describe the cargo..." />
            </Field>
            <Field label="Cargo Weight (kg)" required>
              <input className="input" type="number" value={form.cargoWeightKg} onChange={f('cargoWeightKg')} required min={0}
                placeholder={selectedVehicle ? `Max: ${selectedVehicle.capacityKg}kg` : '0'} />
            </Field>
            <Field label="Origin Address" required>
              <input className="input" value={form['origin.address']} onChange={f('origin.address')} required placeholder="Pickup location..." />
            </Field>
            <Field label="Destination Address" required>
              <input className="input" value={form['destination.address']} onChange={f('destination.address')} required placeholder="Delivery location..." />
            </Field>
            <Field label="Scheduled Departure" required>
              <input className="input" type="datetime-local" value={form.scheduledDeparture} onChange={f('scheduledDeparture')} required />
            </Field>
            <Field label="Scheduled Arrival" required>
              <input className="input" type="datetime-local" value={form.scheduledArrival} onChange={f('scheduledArrival')} required />
            </Field>
            <div className="col-span-2">
              <Field label="Notes">
                <textarea className="input resize-none" rows={2} value={form.notes} onChange={f('notes')} placeholder="Optional notes..." />
              </Field>
            </div>
          </div>

          {/* Validation feedback */}
          {validation.checking && (
            <div className="flex items-center gap-2 px-4 py-3 bg-surface-3 rounded-xl text-sm text-slate-400">
              <Spinner size="sm" /> Validating dispatch...
            </div>
          )}
          {!validation.checking && validation.valid === true && (
            <div className="px-4 py-3 bg-accent-green/10 border border-accent-green/20 rounded-xl text-sm text-accent-green">
              ✓ All checks passed — ready to dispatch
            </div>
          )}
          {!validation.checking && validation.valid === false && validation.errors.length > 0 && (
            <div className="px-4 py-3 bg-accent-red/10 border border-accent-red/20 rounded-xl">
              <p className="text-sm text-accent-red font-medium mb-1">Cannot dispatch:</p>
              {validation.errors.map((e, i) => <p key={i} className="text-xs text-accent-red/80">• {e}</p>)}
            </div>
          )}

          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => setModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving || validation.valid === false} className="btn-primary">
              {saving ? <Spinner size="sm" /> : 'Dispatch Trip'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Action Modal */}
      <Modal isOpen={!!actionModal} onClose={() => setActionModal(null)}
        title={actionModal?.type === 'start' ? 'Start Trip' : actionModal?.type === 'complete' ? 'Complete Trip' : 'Cancel Trip'}>
        <div className="space-y-4">
          {actionModal?.type === 'start' && (
            <Field label="Starting Mileage (km)">
              <input className="input" type="number" value={actionForm.startMileage}
                onChange={e => setActionForm(p => ({ ...p, startMileage: e.target.value }))} placeholder="Current odometer reading..." />
            </Field>
          )}
          {actionModal?.type === 'complete' && (
            <>
              <Field label="Ending Mileage (km)">
                <input className="input" type="number" value={actionForm.endMileage}
                  onChange={e => setActionForm(p => ({ ...p, endMileage: e.target.value }))} placeholder="Final odometer reading..." />
              </Field>
              <Field label="Completion Notes">
                <textarea className="input resize-none" rows={2} value={actionForm.notes}
                  onChange={e => setActionForm(p => ({ ...p, notes: e.target.value }))} placeholder="Optional notes..." />
              </Field>
            </>
          )}
          {actionModal?.type === 'cancel' && (
            <Field label="Cancellation Reason">
              <textarea className="input resize-none" rows={3} value={actionForm.reason}
                onChange={e => setActionForm(p => ({ ...p, reason: e.target.value }))} placeholder="Why is this trip being cancelled?..." />
            </Field>
          )}
          <div className="flex gap-3 justify-end pt-2">
            <button onClick={() => setActionModal(null)} className="btn-secondary">Cancel</button>
            <button onClick={handleAction}
              className={actionModal?.type === 'cancel' ? 'btn-danger' : 'btn-primary'}>
              Confirm
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
