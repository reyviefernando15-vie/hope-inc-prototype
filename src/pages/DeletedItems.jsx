import { useHopeData } from '../hooks/useHopeData.js';
import { supabase } from '../lib/supabase.js';
import { useState } from 'react';
import { RotateCcw } from 'lucide-react';

export default function DeletedItems() {
  const { transactions, salesDetails, customerMap, employeeMap, productMap, paymentsMap, refresh } = useHopeData();
  const [tab, setTab] = useState('transactions');
  const [toast, setToast] = useState(null);

  function showToast(msg, type='success') { setToast({msg,type}); setTimeout(()=>setToast(null),3000); }

  const deletedTxns    = transactions.filter(t => t.record_status==='INACTIVE');
  const deletedDetails = salesDetails.filter(d => d.record_status==='INACTIVE');

  async function recoverTxn(transno) {
    const { error } = await supabase.from('sales').update({record_status:'ACTIVE'}).eq('transno',transno);
    if (error) showToast(error.message,'error');
    else { showToast(`✅ Recovered #${transno}`); await refresh(); }
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl font-semibold text-sm shadow-xl animate-slide-up text-white ${toast.type==='error'?'bg-rose-500':'bg-emerald-500'}`}>
          {toast.msg}
        </div>
      )}
      <div>
        <h1 className="text-2xl font-bold text-rose-600">Deleted Records</h1>
        <p className="text-slate-500 text-sm">Archived vault — soft-deleted entries. Recover to restore.</p>
      </div>
      <div className="flex gap-2 p-1 bg-white border border-slate-200 rounded-xl w-fit shadow-sm">
        {[['transactions','Transactions'],['line-items','Line Items']].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab===id?'bg-rose-500 text-white':'text-slate-500 hover:text-slate-800'}`}>
            {label}
          </button>
        ))}
      </div>
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          {tab==='transactions' ? (
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>{['Sales No.','Date','Customer','Employee','Total','Recover'].map(h=><th key={h} className="th">{h}</th>)}</tr>
              </thead>
              <tbody>
                {deletedTxns.map(t => (
                  <tr key={t.transno} className="hover:bg-rose-50/50 transition-colors">
                    <td className="td font-mono text-rose-400 line-through opacity-70">#{t.transno}</td>
                    <td className="td text-slate-400">{t.salesdate}</td>
                    <td className="td text-slate-500">{customerMap[t.custno]||t.custno}</td>
                    <td className="td text-slate-500">{employeeMap[t.empno]||t.empno}</td>
                    <td className="td text-slate-500">₱{Number(paymentsMap[t.transno]||0).toLocaleString('en-PH',{minimumFractionDigits:2})}</td>
                    <td className="td">
                      <button onClick={()=>recoverTxn(t.transno)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 text-xs font-semibold transition-colors border border-emerald-100">
                        <RotateCcw size={12}/>Recover
                      </button>
                    </td>
                  </tr>
                ))}
                {!deletedTxns.length && <tr><td colSpan={6} className="td text-center text-slate-400 py-10">No deleted transactions.</td></tr>}
              </tbody>
            </table>
          ) : (
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>{['Trans No.','Product','Quantity'].map(h=><th key={h} className="th">{h}</th>)}</tr>
              </thead>
              <tbody>
                {deletedDetails.map((d,i) => (
                  <tr key={i} className="hover:bg-rose-50/50 transition-colors">
                    <td className="td font-mono text-rose-400 line-through opacity-70">#{d.transno}</td>
                    <td className="td text-slate-500">{productMap[d.prodcode]||d.prodcode}</td>
                    <td className="td text-slate-500">{d.quantity}</td>
                  </tr>
                ))}
                {!deletedDetails.length && <tr><td colSpan={3} className="td text-center text-slate-400 py-10">No deleted line items.</td></tr>}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
