import { useHopeData } from '../hooks/useHopeData.js';
import { BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';

const COLORS = ['#6366f1','#8b5cf6','#ec4899','#14b8a6','#f59e0b','#10b981','#ef4444','#3b82f6','#f97316','#a855f7'];

function ChartCard({ title, badge, children }) {
  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-800">{title}</h3>
        <span className="badge bg-indigo-50 text-indigo-600 border border-indigo-100">{badge}</span>
      </div>
      {children}
    </div>
  );
}

const TT = { contentStyle:{ backgroundColor:'#fff', border:'1px solid #e2e8f0', borderRadius:'12px', color:'#1e293b', boxShadow:'0 4px 20px rgba(0,0,0,.08)' } };

export default function Analytics() {
  const { transactions, salesDetails, customerMap, employeeMap, productMap, paymentsMap, loading } = useHopeData();

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-slate-400">
      <div className="text-center"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"/><p className="text-sm">Loading analytics…</p></div>
    </div>
  );

  const activeTxns = transactions.filter(t => !t.record_status || t.record_status==='ACTIVE');

  const empData = {};
  activeTxns.forEach(t => { const k=employeeMap[t.empno]||t.empno; empData[k]=(empData[k]||0)+Number(paymentsMap[t.transno]||0); });
  const empChart = Object.entries(empData).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([name,value])=>({ name:name.split(' ').slice(-1)[0], value:Math.round(value) }));

  const custData = {};
  activeTxns.forEach(t => { const k=customerMap[t.custno]||t.custno; custData[k]=(custData[k]||0)+Number(paymentsMap[t.transno]||0); });
  const custChart = Object.entries(custData).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([name,value])=>({ name, value:Math.round(value) }));

  const monthData = {};
  activeTxns.forEach(t => { const m=(t.salesdate||'').slice(0,7); if(!m) return; monthData[m]=(monthData[m]||0)+Number(paymentsMap[t.transno]||0); });
  const monthChart = Object.entries(monthData).sort().map(([month,revenue])=>({ month, revenue:Math.round(revenue) }));

  const prodVol = {};
  salesDetails.filter(d=>!d.record_status||d.record_status==='ACTIVE').forEach(d=>{ prodVol[d.prodcode]=(prodVol[d.prodcode]||0)+Number(d.quantity||0); });
  const topProds = Object.entries(prodVol).sort((a,b)=>b[1]-a[1]).slice(0,10);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Analytics</h1>
        <p className="text-slate-500 text-sm">Business performance and sales insights</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ChartCard title="Sales by Employee" badge="Bar Chart">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={empChart}><CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
              <XAxis dataKey="name" tick={{fill:'#64748b',fontSize:11}}/><YAxis tick={{fill:'#64748b',fontSize:11}}/>
              <Tooltip {...TT} formatter={v=>`₱${v.toLocaleString()}`}/>
              <Bar dataKey="value" radius={[6,6,0,0]}>{empChart.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Customer Revenue Share" badge="Pie Chart">
          <ResponsiveContainer width="100%" height={250}>
            <PieChart><Pie data={custChart} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90}
              label={({name,percent})=>`${name.split(',')[0]} ${(percent*100).toFixed(0)}%`} labelLine={false}>
              {custChart.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
            </Pie>
            <Tooltip {...TT} formatter={v=>`₱${v.toLocaleString()}`}/></PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <ChartCard title="Monthly Sales Trend" badge="Line Chart">
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={monthChart}><CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
            <XAxis dataKey="month" tick={{fill:'#64748b',fontSize:11}}/><YAxis tick={{fill:'#64748b',fontSize:11}}/>
            <Tooltip {...TT} formatter={v=>`₱${v.toLocaleString()}`}/>
            <Line type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={3} dot={{fill:'#6366f1',r:4}} activeDot={{r:6}}/>
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="🏆 Best Sellers — Top 10 Products" badge="By Qty Sold">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr><th className="th w-10">#</th><th className="th">Product</th><th className="th text-right">Total Qty Sold</th></tr></thead>
            <tbody>
              {topProds.map(([code,qty],i)=>(
                <tr key={code} className="hover:bg-indigo-50/50 transition-colors">
                  <td className="td">
                    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold text-white ${i===0?'bg-amber-400':i===1?'bg-slate-400':i===2?'bg-amber-700':'bg-indigo-100 !text-indigo-600'}`}>{i+1}</span>
                  </td>
                  <td className="td font-medium text-slate-800">{productMap[code]||code}</td>
                  <td className="td text-right font-bold text-indigo-600">{qty.toLocaleString()} units</td>
                </tr>
              ))}
              {!topProds.length && <tr><td colSpan={3} className="td text-center text-slate-400 py-6">No data yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </ChartCard>
    </div>
  );
}
