import { useHopeData } from '../hooks/useHopeData.js';
import { supabase } from '../lib/supabase.js';
import { useState } from 'react';
import { RotateCcw } from 'lucide-react';

export default function DeletedItems() {
  const { transactions, salesDetails, customerMap, employeeMap, productMap, paymentsMap, refresh } = useHopeData();
  const [tab,   setTab  ] = useState('transactions');
  const [toast, setToast] = useState(null);

  function showToast(msg, type = 'success') { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); }

  const deletedTxns    = transactions.filter(t => t.record_status === 'INACTIVE');
  const deletedDetails = salesDetails.filter(d => d.record_status === 'INACTIVE');

  async function recoverTxn(transno) {
    const { error } = await supabase.from('sales').update({ record_status: 'ACTIVE' }).eq('transno', transno);
    if (error) showToast(error.message, 'error');
    else { showToast(`✅ Recovered #${transno}`); await refresh(); }
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl font-semibold text-sm shadow-xl animate-slide-up ${toast.type==='error'?'bg-rose-600':'bg-emerald-600'} text-white`}>
          {toast.msg}
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold text-rose-400">Deleted Records</h1>
        <p className="text-slate-400 text-sm">Archived vault — soft-deleted entries. Recover to restore.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-slate-900 rounded-xl w-fit">
        {[['transactions','Transactions'],['line-items','Line Items']].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab===id?'bg-rose-600 text-white':'text-slate-400 hover:text-white'}`}>
            {label}
          </button>
        ))}
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          {tab === 'transactions' ? (
            <table className="w-full">
              <thead className="bg-slate-900/50">
                <tr>{['Sales No.','Date','Customer','Employee','Total','Recover'].map(h => <th key={h} className="th">{h}</th>)}</tr>
              </thead>
              <tbody>
                {deletedTxns.map(t => (
                  <tr key={t.transno} className="hover:bg-rose-900/10 transition-colors">
                    <td className="td font-mono text-rose-400 line-through opacity-60">#{t.transno}</td>
                    <td className="td text-slate-500">{t.salesdate}</td>
                    <td className="td text-slate-400">{customerMap[t.custno]||t.custno}</td>
                    <td className="td text-slate-400">{employeeMap[t.empno]||t.empno}</td>
                    <td className="td text-slate-400">₱{Number(paymentsMap[t.transno]||0).toLocaleString('en-PH',{minimumFractionDigits:2})}</td>
                    <td className="td">
                      <button onClick={() => recoverTxn(t.transno)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-xs font-semibold transition-colors">
                        <RotateCcw size={12}/>Recover
                      </button>
                    </td>
                  </tr>
                ))}
                {!deletedTxns.length && <tr><td colSpan={6} className="td text-center text-slate-500 py-8">No deleted transactions.</td></tr>}
              </tbody>
            </table>
          ) : (
            <table className="w-full">
              <thead className="bg-slate-900/50">
                <tr>{['Trans No.','Product','Quantity'].map(h => <th key={h} className="th">{h}</th>)}</tr>
              </thead>
              <tbody>
                {deletedDetails.map((d,i) => (
                  <tr key={i} className="hover:bg-rose-900/10 transition-colors">
                    <td className="td font-mono text-rose-400 line-through opacity-60">#{d.transno}</td>
                    <td className="td text-slate-400">{productMap[d.prodcode]||d.prodcode}</td>
                    <td className="td text-slate-400">{d.quantity}</td>
                  </tr>
                ))}
                {!deletedDetails.length && <tr><td colSpan={3} className="td text-center text-slate-500 py-8">No deleted line items.</td></tr>}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
