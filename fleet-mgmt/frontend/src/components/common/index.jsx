// Common reusable UI components

// Status pill with color coding
export const StatusPill = ({ status }) => {
  const config = {
    available: { color: 'bg-accent-green/10 text-accent-green border border-accent-green/20', label: 'Available', dot: 'bg-accent-green' },
    on_trip: { color: 'bg-brand-500/10 text-brand-400 border border-brand-500/20', label: 'On Trip', dot: 'bg-brand-400' },
    in_service: { color: 'bg-accent-amber/10 text-accent-amber border border-accent-amber/20', label: 'In Service', dot: 'bg-accent-amber' },
    off_duty: { color: 'bg-slate-500/10 text-slate-400 border border-slate-500/20', label: 'Off Duty', dot: 'bg-slate-400' },
    suspended: { color: 'bg-accent-red/10 text-accent-red border border-accent-red/20', label: 'Suspended', dot: 'bg-accent-red' },
    retired: { color: 'bg-surface-4 text-slate-500 border border-surface-4', label: 'Retired', dot: 'bg-slate-600' },
    scheduled: { color: 'bg-accent-purple/10 text-accent-purple border border-accent-purple/20', label: 'Scheduled', dot: 'bg-accent-purple' },
    in_progress: { color: 'bg-brand-500/10 text-brand-400 border border-brand-500/20', label: 'In Progress', dot: 'bg-brand-400' },
    completed: { color: 'bg-accent-green/10 text-accent-green border border-accent-green/20', label: 'Completed', dot: 'bg-accent-green' },
    cancelled: { color: 'bg-accent-red/10 text-accent-red border border-accent-red/20', label: 'Cancelled', dot: 'bg-accent-red' },
    pending: { color: 'bg-accent-amber/10 text-accent-amber border border-accent-amber/20', label: 'Pending', dot: 'bg-accent-amber' },
    approved: { color: 'bg-accent-green/10 text-accent-green border border-accent-green/20', label: 'Approved', dot: 'bg-accent-green' },
    rejected: { color: 'bg-accent-red/10 text-accent-red border border-accent-red/20', label: 'Rejected', dot: 'bg-accent-red' }
  };

  const c = config[status] || { color: 'bg-surface-3 text-slate-400 border border-surface-4', label: status, dot: 'bg-slate-500' };

  return (
    <span className={`status-pill ${c.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
};

// Spinner
export const Spinner = ({ size = 'md', className = '' }) => {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' };
  return (
    <div className={`${sizes[size]} ${className} border-2 border-surface-4 border-t-brand-500 rounded-full animate-spin`} />
  );
};

// Loading skeleton
export const Skeleton = ({ className = '' }) => (
  <div className={`bg-surface-3 rounded-xl animate-pulse ${className}`} />
);

// Empty state
export const EmptyState = ({ icon = '📭', title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
    <div className="text-5xl mb-4">{icon}</div>
    <h3 className="font-display font-bold text-lg text-slate-300 mb-2">{title}</h3>
    <p className="text-sm text-slate-500 max-w-sm mb-6">{description}</p>
    {action}
  </div>
);

// Confirmation modal
export const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel, confirmText = 'Confirm', variant = 'danger' }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-surface-2 rounded-2xl border border-surface-4 p-6 w-full max-w-md shadow-elevated animate-fade-in">
        <h3 className="font-display font-bold text-lg text-slate-200 mb-2">{title}</h3>
        <p className="text-sm text-slate-400 mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="btn-secondary">Cancel</button>
          <button
            onClick={onConfirm}
            className={variant === 'danger' ? 'btn-danger' : 'btn-primary'}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

// Modal wrapper
export const Modal = ({ isOpen, onClose, title, children, width = 'max-w-lg' }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-surface-2 rounded-2xl border border-surface-4 w-full ${width} shadow-elevated animate-slide-up max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-3">
          <h2 className="font-display font-bold text-lg text-slate-200">{title}</h2>
          <button onClick={onClose} className="btn-ghost w-8 h-8 flex items-center justify-center p-0 text-lg">×</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

// KPI Card
export const KpiCard = ({ label, value, sub, icon, color = 'brand' }) => {
  const colors = {
    brand: 'text-brand-400 bg-brand-500/10',
    green: 'text-accent-green bg-accent-green/10',
    amber: 'text-accent-amber bg-accent-amber/10',
    red: 'text-accent-red bg-accent-red/10',
    purple: 'text-accent-purple bg-accent-purple/10'
  };
  return (
    <div className="card flex items-start gap-4 hover:border-surface-4 transition-all duration-200">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${colors[color]}`}>{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">{label}</p>
        <p className="font-display font-bold text-2xl text-slate-100 leading-none">{value}</p>
        {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
      </div>
    </div>
  );
};

// Pagination
export const Pagination = ({ page, pages, onPageChange }) => {
  if (pages <= 1) return null;
  return (
    <div className="flex items-center gap-2">
      <button onClick={() => onPageChange(page - 1)} disabled={page <= 1} className="btn-ghost px-3 py-1 text-xs disabled:opacity-30">← Prev</button>
      <span className="text-xs text-slate-500">Page {page} of {pages}</span>
      <button onClick={() => onPageChange(page + 1)} disabled={page >= pages} className="btn-ghost px-3 py-1 text-xs disabled:opacity-30">Next →</button>
    </div>
  );
};

// Form field wrapper
export const Field = ({ label, error, children, required }) => (
  <div>
    <label className="label">
      {label}{required && <span className="text-accent-red ml-0.5">*</span>}
    </label>
    {children}
    {error && <p className="text-xs text-accent-red mt-1">{error}</p>}
  </div>
);
