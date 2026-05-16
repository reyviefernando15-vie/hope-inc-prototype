import { useState } from 'react';
import { useHopeData } from '../hooks/useHopeData.js';
import { TrendingUp, FileText, Users, Activity, CalendarDays } from 'lucide-react';

const DATE_FILTERS = [
  { id: 'today', label: 'Today' },
  { id: 'week',  label: 'This Week' },
  { id: 'month', label: 'This Month' },
  { id: 'all',   label: 'All Time' },
];

function filterByDate(txns, filter) {
  const now = new Date();
  if (filter === 'today') { const d = now.toISOString().split('T')[0]; return txns.filter(t => (t.salesdate||'').startsWith(d)); }
  if (filter === 'week')  { const ago = new Date(now - 7*86400000);    return txns.filter(t => new Date(t.salesdate) >= ago); }
  if (filter === 'month') { const f = new Date(now.getFullYear(), now.getMonth(), 1); return txns.filter(t => new Date(t.salesdate) >= f); }
  return txns;
}

function KPICard({ label, value, icon: Icon, color }) {
  return (
    <div className="glass-card p-5 flex items-center gap-4 hover:scale-[1.02] transition-transform">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${color}`}>
        <Icon size={22} className="text-white" />
      </div>
      <div>
        <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-0.5">{label}</p>
        <p className="text-2xl font-bold text-white">{value}</p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { transactions, customerMap, employeeMap, paymentsMap, loading } = useHopeData();
  const [dateFilter, setDateFilter] = useState('all');

  const filtered = filterByDate(transactions.filter(t => !t.record_status || t.record_status === 'ACTIVE'), dateFilter);
  const revenue  = filtered.reduce((s, t) => s + Number(paymentsMap[t.transno] || 0), 0);
  const custs    = new Set(filtered.map(t => t.custno)).size;
  const avg      = filtered.length ? revenue / filtered.length : 0;

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-500">Loading dashboard…</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400 text-sm mt-0.5">Real-time overview of Hope, Inc. sales performance</p>
        </div>
        {/* Date filter */}
        <div className="flex gap-2 p-1 bg-slate-900 rounded-xl">
          {DATE_FILTERS.map(f => (
            <button key={f.id} onClick={() => setDateFilter(f.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${dateFilter===f.id ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="Total Revenue"    value={`₱${revenue.toLocaleString('en-PH',{minimumFractionDigits:2})}`} icon={TrendingUp} color="bg-emerald-600" />
        <KPICard label="Transactions"     value={filtered.length} icon={FileText} color="bg-indigo-600" />
        <KPICard label="Customers"        value={custs}           icon={Users}    color="bg-violet-600" />
        <KPICard label="Avg. Transaction" value={`₱${avg.toLocaleString('en-PH',{minimumFractionDigits:2})}`} icon={Activity} color="bg-amber-600" />
      </div>

      {/* Recent transactions */}
      <div className="glass-card overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50">
          <h3 className="font-semibold text-white">Recent Transactions</h3>
          <span className="text-xs text-slate-500">{filtered.length} records</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-900/50">
              <tr>
                {['Sales No.','Date','Customer','Employee','Total'].map(h => <th key={h} className="th">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 10).map(t => (
                <tr key={t.transno} className="hover:bg-slate-800/40 transition-colors">
                  <td className="td font-mono text-indigo-400">#{t.transno}</td>
                  <td className="td text-slate-400">{t.salesdate}</td>
                  <td className="td">{customerMap[t.custno] || t.custno}</td>
                  <td className="td">{employeeMap[t.empno]  || t.empno}</td>
                  <td className="td text-emerald-400 font-semibold">₱{Number(paymentsMap[t.transno]||0).toLocaleString('en-PH',{minimumFractionDigits:2})}</td>
                </tr>
              ))}
              {!filtered.length && <tr><td colSpan={5} className="td text-center text-slate-500 py-8">No records in this period.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
