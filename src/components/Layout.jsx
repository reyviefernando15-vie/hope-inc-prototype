import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { LayoutDashboard, FileText, BarChart3, Trash2, LogOut, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function Layout() {
  const { user, rights, logout } = useAuth();
  const navigate = useNavigate();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  function handleLogout() { logout(); navigate('/login'); }

  const navItems = [
    { to: '/',              label: 'Dashboard',    icon: LayoutDashboard, section: 'OVERVIEW' },
    { to: '/transactions',  label: 'Transactions', icon: FileText,        section: 'RECORDS'  },
    { to: '/analytics',     label: 'Analytics',    icon: BarChart3,       section: 'RECORDS'  },
    ...(rights.VIEW_DELETED ? [{ to: '/deleted', label: 'Deleted Items', icon: Trash2, section: 'RECORDS', danger: true }] : []),
  ];

  const grouped = navItems.reduce((acc, item) => {
    (acc[item.section] = acc[item.section] || []).push(item);
    return acc;
  }, {});

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 flex flex-col bg-slate-900 border-r border-slate-800">
        {/* Brand */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-800">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center font-black text-white text-lg">H</div>
          <div>
            <div className="font-bold text-white text-sm">Hope, Inc.</div>
            <div className="text-slate-500 text-xs">Sales Management</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {Object.entries(grouped).map(([section, items]) => (
            <div key={section}>
              <p className="px-3 mb-1 text-xs font-semibold text-slate-600 uppercase tracking-widest">{section}</p>
              {items.map(({ to, label, icon: Icon, danger }) => (
                <NavLink key={to} to={to} end={to === '/'}
                  className={({ isActive }) =>
                    `nav-link ${isActive ? 'active' : ''} ${danger ? 'text-rose-500 hover:text-rose-400 hover:bg-rose-500/10' : ''}`}>
                  <Icon size={16} />{label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/30 flex items-center justify-center text-indigo-400 font-bold text-sm">
              {(user?.name || 'U').charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-white truncate">{user?.name}</div>
              <div className="text-xs text-slate-500">{user?.id}</div>
            </div>
            <span className="badge bg-indigo-600/20 text-indigo-400 text-[10px]">{user?.role}</span>
          </div>
          <div className="flex items-center justify-between px-3 py-1.5 mb-1">
            <span className="flex items-center gap-1.5 text-xs text-slate-500">
              <Clock size={12} />{time.toLocaleTimeString('en-PH')}
            </span>
          </div>
          <button onClick={handleLogout} className="nav-link w-full text-slate-500 hover:text-rose-400">
            <LogOut size={16} />Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
