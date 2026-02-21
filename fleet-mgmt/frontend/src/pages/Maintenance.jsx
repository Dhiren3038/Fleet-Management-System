import { useState, useEffect } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { StatusPill, Spinner, EmptyState, Modal, Pagination, Field } from '../components/common';
import { format } from 'date-fns';

const INITIAL_FORM = {
  vehicleId: '', type: 'preventive', description: '',
  mileageAtService: '', nextServiceMileage: '', scheduledDate: '',
  vendor: '', cost: 0, technicianName: '', invoiceNumber: '', notes: ''
};

export default function Maintenance() {
  const { hasRole } = useAuth();
  const toast = useToast();
  const [logs, setLogs] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [statusFilter, setStatusFilter] = useState('');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [saving, setSaving] = useState(false);
  const [completeModal, setCompleteModal] = useState(null);
  const [completeForm, setCompleteForm] = useState({ cost: 0, technicianName: '', invoiceNumber: '', notes: '', nextServiceMileage: '' });

  const fetchLogs = async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 15, ...(statusFilter && { status: statusFilter }) };
      const res = await api.get('/maintenance', { params });
      setLogs(res.data.data);
      setPagination(res.data.pagination);
    } catch { toast.error('Failed to load logs'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchLogs(); }, [statusFilter]);

  const openCreate = async () => {
    const res = await api.get('/vehicles', { params: { limit: 100 } });
    setVehicles(res.data.data);
    setForm(INITIAL_FORM);
    setModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/maintenance', form);
      toast.success('Maintenance scheduled');
      setModal(false);
      fetchLogs();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleStart = async (id) => {
    try {
      await api.patch(`/maintenance/${id}/start`);
      toast.success('Maintenance started');
      fetchLogs();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleComplete = async () => {
    try {
      await api.patch(`/maintenance/${completeModal._id}/complete`, completeForm);
      toast.success('Maintenance completed');
      setCompleteModal(null);
      fetchLogs();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const f = (key) => (e) => setForm(p => ({ ...p, [key]: e.target.value }));

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="page-title">Maintenance Logs</h1>
          <p className="text-slate-500 text-sm mt-1">Track service history and scheduled maintenance</p>
        </div>
        {hasRole('manager', 'dispatcher', 'safety_officer') && (
          <button onClick={openCreate} className="btn-primary">+ Schedule Maintenance</button>
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
        ) : logs.length === 0 ? (
          <EmptyState icon="🔧" title="No maintenance logs" description="Schedule maintenance to track service history." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-surface-3">
                <tr>
                  {['Vehicle', 'Type', 'Description', 'Date', 'Mileage', 'Cost', 'Status', ''].map(h => (
                    <th key={h} className="table-head">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map(l => (
                  <tr key={l._id} className="table-row">
                    <td className="table-cell">
                      <p className="font-mono text-brand-400 text-sm">{l.vehicle?.plateNumber}</p>
                      <p className="text-xs text-slate-500">{l.vehicle?.make} {l.vehicle?.model}</p>
                    </td>
                    <td className="table-cell capitalize text-slate-300 text-sm">{l.type?.replace('_', ' ')}</td>
                    <td className="table-cell max-w-[180px]">
                      <p className="text-sm text-slate-300 truncate">{l.description}</p>
                      {l.vendor && <p className="text-xs text-slate-500">{l.vendor}</p>}
                    </td>
                    <td className="table-cell text-xs text-slate-400">
                      {l.scheduledDate ? format(new Date(l.scheduledDate), 'MMM d, yyyy') : '—'}
                    </td>
                    <td className="table-cell text-slate-300 text-sm">{l.mileageAtService?.toLocaleString()}km</td>
                    <td className="table-cell text-slate-300 text-sm">${l.cost?.toLocaleString()}</td>
                    <td className="table-cell"><StatusPill status={l.status} /></td>
                    <td className="table-cell">
                      {l.status === 'scheduled' && hasRole('manager', 'safety_officer') && (
                        <button onClick={() => handleStart(l._id)} className="btn-primary text-xs px-2 py-1">Start</button>
                      )}
                      {l.status === 'in_progress' && hasRole('manager', 'safety_officer') && (
                        <button onClick={() => { setCompleteModal(l); setCompleteForm({ cost: l.cost || 0, technicianName: l.technicianName || '', invoiceNumber: '', notes: '', nextServiceMileage: '' }); }}
                          className="btn-primary text-xs px-2 py-1">Complete</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && logs.length > 0 && (
          <div className="flex justify-end px-4 py-3 border-t border-surface-3">
            <Pagination page={pagination.page} pages={pagination.pages} onPageChange={fetchLogs} />
          </div>
        )}
      </div>

      {/* Schedule Modal */}
      <Modal isOpen={modal} onClose={() => setModal(false)} title="Schedule Maintenance" width="max-w-xl">
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Field label="Vehicle" required>
              <select className="select" value={form.vehicleId} onChange={f('vehicleId')} required>
                <option value="">Select vehicle...</option>
                {vehicles.map(v => <option key={v._id} value={v._id}>{v.plateNumber} — {v.make} {v.model}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Service Type" required>
            <select className="select" value={form.type} onChange={f('type')}>
              {['preventive', 'corrective', 'inspection', 'tyre', 'oil_change', 'brake', 'other'].map(t => (
                <option key={t} value={t}>{t.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
              ))}
            </select>
          </Field>
          <Field label="Scheduled Date" required>
            <input className="input" type="date" value={form.scheduledDate} onChange={f('scheduledDate')} required />
          </Field>
          <div className="col-span-2">
            <Field label="Description" required>
              <textarea className="input resize-none" rows={2} value={form.description} onChange={f('description')} required placeholder="Describe the service..." />
            </Field>
          </div>
          <Field label="Mileage at Service" required>
            <input className="input" type="number" value={form.mileageAtService} onChange={f('mileageAtService')} required min={0} />
          </Field>
          <Field label="Next Service Mileage">
            <input className="input" type="number" value={form.nextServiceMileage} onChange={f('nextServiceMileage')} min={0} />
          </Field>
          <Field label="Vendor / Workshop">
            <input className="input" value={form.vendor} onChange={f('vendor')} placeholder="Service provider..." />
          </Field>
          <Field label="Estimated Cost ($)">
            <input className="input" type="number" value={form.cost} onChange={f('cost')} min={0} />
          </Field>
          <div className="col-span-2 flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => setModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? <Spinner size="sm" /> : 'Schedule'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Complete Modal */}
      <Modal isOpen={!!completeModal} onClose={() => setCompleteModal(null)} title="Complete Maintenance">
        <div className="space-y-4">
          <Field label="Final Cost ($)">
            <input className="input" type="number" value={completeForm.cost}
              onChange={e => setCompleteForm(p => ({ ...p, cost: e.target.value }))} min={0} />
          </Field>
          <Field label="Technician Name">
            <input className="input" value={completeForm.technicianName}
              onChange={e => setCompleteForm(p => ({ ...p, technicianName: e.target.value }))} />
          </Field>
          <Field label="Invoice Number">
            <input className="input" value={completeForm.invoiceNumber}
              onChange={e => setCompleteForm(p => ({ ...p, invoiceNumber: e.target.value }))} />
          </Field>
          <Field label="Next Service Mileage">
            <input className="input" type="number" value={completeForm.nextServiceMileage}
              onChange={e => setCompleteForm(p => ({ ...p, nextServiceMileage: e.target.value }))} />
          </Field>
          <Field label="Completion Notes">
            <textarea className="input resize-none" rows={2} value={completeForm.notes}
              onChange={e => setCompleteForm(p => ({ ...p, notes: e.target.value }))} />
          </Field>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setCompleteModal(null)} className="btn-secondary">Cancel</button>
            <button onClick={handleComplete} className="btn-primary">Mark Complete</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
