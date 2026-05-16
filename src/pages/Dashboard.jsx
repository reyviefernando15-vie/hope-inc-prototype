import { useState } from 'react';
import { useHopeData } from '../hooks/useHopeData.js';
import { TrendingUp, FileText, Users, Activity } from 'lucide-react';

const DATE_FILTERS = [
  { id: 'today', label: 'Today'      },
  { id: 'week',  label: 'This Week'  },
  { id: 'month', label: 'This Month' },
  { id: 'all',   label: 'All Time'   },
];

function filterByDate(txns, filter) {
  const now = new Date();
  if (filter === 'today') { const d = now.toISOString().split('T')[0]; return txns.filter(t => (t.salesdate||'').startsWith(d)); }
  if (filter === 'week')  { const ago = new Date(now - 7*86400000); return txns.filter(t => new Date(t.salesdate) >= ago); }
  if (filter === 'month') { const f = new Date(now.getFullYear(), now.getMonth(), 1); return txns.filter(t => new Date(t.salesdate) >= f); }
  return txns;
}

function KPICard({ label, value, icon: Icon, color, textColor }) {
  return (
    <div className="glass-card p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${color}`}>
        <Icon size={22} className="text-white" />
      </div>
      <div>
        <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-0.5">{label}</p>
        <p className={`text-2xl font-bold ${textColor || 'text-slate-800'}`}>{value}</p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { transactions, customerMap, employeeMap, paymentsMap, loading } = useHopeData();
  const [dateFilter, setDateFilter] = useState('all');

  const filtered = filterByDate(
    transactions.filter(t => !t.record_status || t.record_status === 'ACTIVE'),
    dateFilter
  );
  const revenue = filtered.reduce((s, t) => s + Number(paymentsMap[t.transno] || 0), 0);
  const custs   = new Set(filtered.map(t => t.custno)).size;
  const avg     = filtered.length ? revenue / filtered.length : 0;

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-slate-400">
      <div className="text-center"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"/><p className="text-sm">Loading dashboard…</p></div>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-0.5">Real-time overview of Hope, Inc. sales performance</p>
        </div>
        {/* Date filter */}
        <div className="flex gap-1 p-1 bg-white border border-slate-200 rounded-xl shadow-sm">
          {DATE_FILTERS.map(f => (
            <button key={f.id} onClick={() => setDateFilter(f.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${dateFilter===f.id ? 'bg-indigo-600 text-white shadow' : 'text-slate-500 hover:text-slate-800'}`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="Total Revenue"    value={`₱${revenue.toLocaleString('en-PH',{minimumFractionDigits:2})}`} icon={TrendingUp} color="bg-emerald-500" textColor="text-emerald-700" />
        <KPICard label="Transactions"     value={filtered.length} icon={FileText} color="bg-indigo-500" />
        <KPICard label="Customers"        value={custs}           icon={Users}    color="bg-violet-500" />
        <KPICard label="Avg. Transaction" value={`₱${avg.toLocaleString('en-PH',{minimumFractionDigits:2})}`} icon={Activity} color="bg-amber-500" />
      </div>

      {/* Recent transactions */}
      <div className="glass-card overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50 rounded-t-2xl">
          <h3 className="font-semibold text-slate-800">Recent Transactions</h3>
          <span className="text-xs text-slate-400 bg-slate-100 px-3 py-1 rounded-full">{filtered.length} records</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>{['Sales No.','Date','Customer','Employee','Total'].map(h => <th key={h} className="th">{h}</th>)}</tr>
            </thead>
            <tbody>
              {filtered.slice(0,10).map(t => (
                <tr key={t.transno} className="hover:bg-indigo-50/50 transition-colors">
                  <td className="td font-mono text-indigo-600 font-semibold">#{t.transno}</td>
                  <td className="td text-slate-500">{t.salesdate}</td>
                  <td className="td font-medium">{customerMap[t.custno]||t.custno}</td>
                  <td className="td text-slate-600">{employeeMap[t.empno]||t.empno}</td>
                  <td className="td text-emerald-600 font-bold">₱{Number(paymentsMap[t.transno]||0).toLocaleString('en-PH',{minimumFractionDigits:2})}</td>
                </tr>
              ))}
              {!filtered.length && <tr><td colSpan={5} className="td text-center text-slate-400 py-10">No records in this period.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
