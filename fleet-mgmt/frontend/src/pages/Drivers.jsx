import { useState, useEffect } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { StatusPill, Spinner, EmptyState, Modal, ConfirmModal, Pagination, Field } from '../components/common';
import { format, differenceInYears } from 'date-fns';

const INITIAL_FORM = {
  employeeId: '', name: '', email: '', phone: '', licenseNumber: '',
  licenseClass: 'B', licenseExpiry: '', dateOfBirth: '', hireDate: '',
  address: '', emergencyContact: { name: '', phone: '', relationship: '' }, notes: ''
};

export default function Drivers() {
  const { hasRole } = useAuth();
  const toast = useToast();
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [statusFilter, setStatusFilter] = useState('');
  const [modal, setModal] = useState({ open: false, driver: null });
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [saving, setSaving] = useState(false);

  const fetchDrivers = async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 15, ...(statusFilter && { status: statusFilter }) };
      const res = await api.get('/drivers', { params });
      setDrivers(res.data.data);
      setPagination(res.data.pagination);
    } catch {
      toast.error('Failed to load drivers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDrivers(); }, [statusFilter]);

  const openCreate = () => { setForm(INITIAL_FORM); setModal({ open: true, driver: null }); };
  const openEdit = (d) => {
    setForm({
      employeeId: d.employeeId, name: d.name, email: d.email, phone: d.phone,
      licenseNumber: d.licenseNumber, licenseClass: d.licenseClass,
      licenseExpiry: d.licenseExpiry?.slice(0, 10) || '',
      dateOfBirth: d.dateOfBirth?.slice(0, 10) || '',
      hireDate: d.hireDate?.slice(0, 10) || '',
      address: d.address || '',
      emergencyContact: d.emergencyContact || { name: '', phone: '', relationship: '' },
      notes: d.notes || ''
    });
    setModal({ open: true, driver: d });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (modal.driver) {
        await api.put(`/drivers/${modal.driver._id}`, form);
        toast.success('Driver updated');
      } else {
        await api.post('/drivers', form);
        toast.success('Driver added');
      }
      setModal({ open: false, driver: null });
      fetchDrivers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/drivers/${confirmDelete._id}`);
      toast.success('Driver deleted');
      setConfirmDelete(null);
      fetchDrivers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  const f = (key) => (e) => setForm(p => ({ ...p, [key]: e.target.value }));
  const fEc = (key) => (e) => setForm(p => ({ ...p, emergencyContact: { ...p.emergencyContact, [key]: e.target.value } }));

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="page-title">Driver Roster</h1>
          <p className="text-slate-500 text-sm mt-1">{pagination.total} total drivers</p>
        </div>
        {hasRole('manager', 'dispatcher') && (
          <button onClick={openCreate} className="btn-primary">+ Add Driver</button>
        )}
      </div>

      <div className="flex gap-3 mb-6">
        <select className="select w-40" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          <option value="available">Available</option>
          <option value="on_trip">On Trip</option>
          <option value="off_duty">Off Duty</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : drivers.length === 0 ? (
          <EmptyState icon="👤" title="No drivers found" description="Add your first driver to the roster."
            action={hasRole('manager', 'dispatcher') ? <button onClick={openCreate} className="btn-primary">Add Driver</button> : null} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-surface-3">
                <tr>
                  {['Employee', 'Contact', 'License', 'Expiry', 'Status', 'Trips', ''].map(h => (
                    <th key={h} className="table-head">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {drivers.map(d => (
                  <tr key={d._id} className="table-row">
                    <td className="table-cell">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-surface-3 flex items-center justify-center text-sm font-bold text-slate-300 border border-surface-4">
                          {d.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-slate-200">{d.name}</p>
                          <p className="text-xs text-slate-500 font-mono">{d.employeeId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="table-cell">
                      <p className="text-slate-300 text-sm">{d.phone}</p>
                      <p className="text-xs text-slate-500">{d.email}</p>
                    </td>
                    <td className="table-cell">
                      <span className="font-mono text-xs text-slate-300">{d.licenseNumber}</span>
                      <p className="text-xs text-slate-500">Class {d.licenseClass}</p>
                    </td>
                    <td className="table-cell">
                      <span className={d.isLicenseValid ? 'text-accent-green text-xs' : 'text-accent-red text-xs font-medium'}>
                        {d.licenseExpiry ? format(new Date(d.licenseExpiry), 'MMM d, yyyy') : '—'}
                      </span>
                    </td>
                    <td className="table-cell"><StatusPill status={d.status} /></td>
                    <td className="table-cell text-slate-300">{d.totalTrips || 0}</td>
                    <td className="table-cell">
                      <div className="flex gap-1">
                        {hasRole('manager', 'dispatcher') && (
                          <button onClick={() => openEdit(d)} className="btn-ghost text-xs px-2 py-1">Edit</button>
                        )}
                        {hasRole('manager') && d.status !== 'on_trip' && (
                          <button onClick={() => setConfirmDelete(d)} className="btn-ghost text-xs px-2 py-1 text-accent-red/70 hover:text-accent-red">Del</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && drivers.length > 0 && (
          <div className="flex justify-end px-4 py-3 border-t border-surface-3">
            <Pagination page={pagination.page} pages={pagination.pages} onPageChange={fetchDrivers} />
          </div>
        )}
      </div>

      <Modal isOpen={modal.open} onClose={() => setModal({ open: false, driver: null })}
        title={modal.driver ? 'Edit Driver' : 'Add Driver'} width="max-w-2xl">
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
          <Field label="Employee ID" required><input className="input font-mono" value={form.employeeId} onChange={f('employeeId')} required placeholder="EMP-001" /></Field>
          <Field label="Full Name" required><input className="input" value={form.name} onChange={f('name')} required /></Field>
          <Field label="Email" required><input className="input" type="email" value={form.email} onChange={f('email')} required /></Field>
          <Field label="Phone" required><input className="input" value={form.phone} onChange={f('phone')} required /></Field>
          <Field label="License Number" required><input className="input font-mono" value={form.licenseNumber} onChange={f('licenseNumber')} required /></Field>
          <Field label="License Class" required>
            <select className="select" value={form.licenseClass} onChange={f('licenseClass')}>
              {['A', 'B', 'C', 'D', 'E'].map(c => <option key={c} value={c}>Class {c}</option>)}
            </select>
          </Field>
          <Field label="License Expiry" required><input className="input" type="date" value={form.licenseExpiry} onChange={f('licenseExpiry')} required /></Field>
          <Field label="Date of Birth" required><input className="input" type="date" value={form.dateOfBirth} onChange={f('dateOfBirth')} required /></Field>
          <Field label="Hire Date" required><input className="input" type="date" value={form.hireDate} onChange={f('hireDate')} required /></Field>
          <div className="col-span-2">
            <Field label="Address"><input className="input" value={form.address} onChange={f('address')} /></Field>
          </div>
          <div className="col-span-2 border-t border-surface-3 pt-4">
            <p className="label mb-3">Emergency Contact</p>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Name"><input className="input" value={form.emergencyContact.name} onChange={fEc('name')} /></Field>
              <Field label="Phone"><input className="input" value={form.emergencyContact.phone} onChange={fEc('phone')} /></Field>
              <Field label="Relationship"><input className="input" value={form.emergencyContact.relationship} onChange={fEc('relationship')} /></Field>
            </div>
          </div>
          <div className="col-span-2 flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => setModal({ open: false, driver: null })} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? <Spinner size="sm" /> : (modal.driver ? 'Update' : 'Add Driver')}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal isOpen={!!confirmDelete} title="Delete Driver"
        message={`Remove ${confirmDelete?.name} from the roster?`}
        onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} confirmText="Delete" />
    </div>
  );
}
