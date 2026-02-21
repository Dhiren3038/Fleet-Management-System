import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { to: '/', label: 'Dashboard', icon: '⬡', exact: true },
  { to: '/vehicles', label: 'Vehicles', icon: '🚛' },
  { to: '/drivers', label: 'Drivers', icon: '👤' },
  { to: '/trips', label: 'Dispatch', icon: '🗺' },
  { to: '/maintenance', label: 'Maintenance', icon: '🔧' },
  { to: '/fuel-expenses', label: 'Fuel & Expenses', icon: '⛽' },
  { to: '/reports', label: 'Reports', icon: '📊' }
];

const roleColors = {
  manager: 'text-brand-400 bg-brand-500/10',
  dispatcher: 'text-accent-green bg-accent-green/10',
  safety_officer: 'text-accent-amber bg-accent-amber/10',
  finance_analyst: 'text-accent-purple bg-accent-purple/10'
};

const roleLabels = {
  manager: 'Manager',
  dispatcher: 'Dispatcher',
  safety_officer: 'Safety Officer',
  finance_analyst: 'Finance Analyst'
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="w-60 flex-shrink-0 flex flex-col h-screen bg-surface-1 border-r border-surface-3 fixed left-0 top-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-surface-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
            <span className="text-white text-sm font-display font-bold">F</span>
          </div>
          <div>
            <span className="font-display font-bold text-slate-100 text-lg tracking-tight">FMS</span>
            <span className="text-[10px] text-slate-500 ml-1.5 font-mono">v1.0</span>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <div className="space-y-0.5">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-brand-500/10 text-brand-400 border border-brand-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-surface-3'
                }`
              }
            >
              <span className="text-base w-5 text-center">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* User section */}
      <div className="px-4 py-4 border-t border-surface-3">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-lg bg-surface-3 border border-surface-4 flex items-center justify-center text-sm font-bold text-slate-300">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-200 truncate">{user?.name}</p>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium ${roleColors[user?.role] || 'text-slate-400 bg-surface-3'}`}>
              {roleLabels[user?.role] || user?.role}
            </span>
          </div>
        </div>
        <button onClick={handleLogout} className="w-full btn-ghost text-xs text-slate-500 hover:text-accent-red justify-start">
          Sign Out
        </button>
      </div>
    </aside>
  );
}
