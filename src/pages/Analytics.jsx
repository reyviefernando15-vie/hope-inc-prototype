import { useHopeData } from '../hooks/useHopeData.js';
import { BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';

const COLORS = ['#6366f1','#8b5cf6','#ec4899','#14b8a6','#f59e0b','#10b981','#ef4444','#3b82f6','#f97316','#a855f7'];

function ChartCard({ title, badge, children }) {
  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-white">{title}</h3>
        <span className="badge bg-indigo-600/20 text-indigo-400">{badge}</span>
      </div>
      {children}
    </div>
  );
}

export default function Analytics() {
  const { transactions, salesDetails, customerMap, employeeMap, productMap, paymentsMap, loading } = useHopeData();

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-500">Loading analytics…</div>;

  const activeTxns = transactions.filter(t => !t.record_status || t.record_status === 'ACTIVE');

  // Sales by employee
  const empData = {};
  activeTxns.forEach(t => {
    const k = employeeMap[t.empno] || t.empno;
    empData[k] = (empData[k] || 0) + Number(paymentsMap[t.transno] || 0);
  });
  const empChart = Object.entries(empData).sort((a,b) => b[1]-a[1]).slice(0,8).map(([name, value]) => ({ name: name.split(' ').slice(-1)[0], value: Math.round(value) }));

  // Sales by customer (pie)
  const custData = {};
  activeTxns.forEach(t => {
    const k = customerMap[t.custno] || t.custno;
    custData[k] = (custData[k] || 0) + Number(paymentsMap[t.transno] || 0);
  });
  const custChart = Object.entries(custData).sort((a,b) => b[1]-a[1]).slice(0,8).map(([name, value]) => ({ name, value: Math.round(value) }));

  // Monthly trend
  const monthData = {};
  activeTxns.forEach(t => {
    const m = (t.salesdate || '').slice(0,7);
    if (!m) return;
    monthData[m] = (monthData[m] || 0) + Number(paymentsMap[t.transno] || 0);
  });
  const monthChart = Object.entries(monthData).sort().map(([month, revenue]) => ({ month, revenue: Math.round(revenue) }));

  // Top products
  const prodVol = {};
  salesDetails.filter(d => !d.record_status || d.record_status === 'ACTIVE').forEach(d => {
    prodVol[d.prodcode] = (prodVol[d.prodcode] || 0) + Number(d.quantity || 0);
  });
  const topProds = Object.entries(prodVol).sort((a,b) => b[1]-a[1]).slice(0,10);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Analytics</h1>
        <p className="text-slate-400 text-sm">Real-time business performance and sales insights</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ChartCard title="Sales by Employee" badge="Bar Chart">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={empChart}><CartesianGrid strokeDasharray="3 3" stroke="#334155"/>
              <XAxis dataKey="name" tick={{ fill:'#94a3b8', fontSize:11 }} /><YAxis tick={{ fill:'#94a3b8', fontSize:11 }}/>
              <Tooltip contentStyle={{ backgroundColor:'#1e293b', border:'1px solid #334155', borderRadius:'12px', color:'#f1f5f9' }} formatter={v => `₱${v.toLocaleString()}`}/>
              <Bar dataKey="value" radius={[6,6,0,0]}>{empChart.map((_,i) => <Cell key={i} fill={COLORS[i%COLORS.length]}/>)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Customer Revenue Share" badge="Pie Chart">
          <ResponsiveContainer width="100%" height={250}>
            <PieChart><Pie data={custChart} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({name,percent}) => `${name.split(',')[0]} ${(percent*100).toFixed(0)}%`} labelLine={false}>
              {custChart.map((_,i) => <Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
            </Pie>
            <Tooltip contentStyle={{ backgroundColor:'#1e293b', border:'1px solid #334155', borderRadius:'12px' }} formatter={v => `₱${v.toLocaleString()}`}/></PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <ChartCard title="Monthly Sales Trend" badge="Line Chart">
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={monthChart}><CartesianGrid strokeDasharray="3 3" stroke="#334155"/>
            <XAxis dataKey="month" tick={{ fill:'#94a3b8', fontSize:11 }}/><YAxis tick={{ fill:'#94a3b8', fontSize:11 }}/>
            <Tooltip contentStyle={{ backgroundColor:'#1e293b', border:'1px solid #334155', borderRadius:'12px' }} formatter={v => `₱${v.toLocaleString()}`}/>
            <Line type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={3} dot={{ fill:'#6366f1', r:4 }} activeDot={{ r:6 }}/>
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="🏆 Best Sellers — Top 10 Products" badge="By Qty Sold">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr><th className="th w-10">#</th><th className="th">Product</th><th className="th text-right">Total Qty Sold</th></tr></thead>
            <tbody>
              {topProds.map(([code, qty], i) => (
                <tr key={code} className="hover:bg-slate-800/40 transition-colors">
                  <td className="td">
                    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${i===0?'bg-amber-500':i===1?'bg-slate-500':i===2?'bg-amber-800':'bg-indigo-600/30 text-indigo-400'} text-white`}>{i+1}</span>
                  </td>
                  <td className="td">{productMap[code]||code}</td>
                  <td className="td text-right font-semibold text-indigo-400">{qty.toLocaleString()} units</td>
                </tr>
              ))}
              {!topProds.length && <tr><td colSpan={3} className="td text-center text-slate-500 py-6">No data yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </ChartCard>
    </div>
  );
}
