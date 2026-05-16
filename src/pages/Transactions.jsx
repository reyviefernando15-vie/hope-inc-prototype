import { useState } from 'react';
import { useHopeData } from '../hooks/useHopeData.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { supabase } from '../lib/supabase.js';
import { Plus, Search, Trash2, X } from 'lucide-react';

function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in" onClick={e => e.target===e.currentTarget && onClose()}>
      <div className="glass-card w-full max-w-lg p-6 animate-slide-up">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-white">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors"><X size={20}/></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function Transactions() {
  const { transactions, customers, employees, products, customerMap, employeeMap, paymentsMap, priceMap, refresh, loading } = useHopeData();
  const { rights, user } = useAuth();

  const [search,  setSearch ] = useState('');
  const [empFilt, setEmpFilt] = useState('');
  const [modal,   setModal  ] = useState(false);
  const [saving,  setSaving ] = useState(false);
  const [toast,   setToast  ] = useState(null);
  const [form, setForm] = useState({ custno: '', empno: '', prodcode: '', quantity: 1 });

  function showToast(msg, type = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  const activeTxns = transactions.filter(t => !t.record_status || t.record_status === 'ACTIVE');
  const filtered   = activeTxns.filter(t => {
    const c = (customerMap[t.custno] || '').toLowerCase();
    const e = (employeeMap[t.empno]  || '').toLowerCase();
    const q = search.toLowerCase();
    const ef = empFilt ? t.empno === empFilt : true;
    return (c.includes(q) || e.includes(q) || t.transno.toLowerCase().includes(q)) && ef;
  });

  function openModal() { setForm({ custno: '', empno: '', prodcode: '', quantity: 1 }); setModal(true); }

  async function saveTransaction() {
    const { custno, empno, prodcode, quantity } = form;
    if (!custno || !empno || !prodcode || quantity < 1) { showToast('Please fill all fields.', 'error'); return; }
    setSaving(true);
    try {
      const { data: mx } = await supabase.from('sales').select('transno').order('transno', { ascending: false }).limit(1);
      const last  = mx?.length ? mx[0].transno : 'TR000000';
      const match = last.match(/TR(\d+)/);
      const next  = `TR${String((match ? Number(match[1]) : 0) + 1).padStart(6, '0')}`;

      const { error: e1 } = await supabase.from('sales').insert([{ transno: next, salesdate: new Date().toISOString().split('T')[0], custno, empno, record_status: 'ACTIVE' }]);
      if (e1) { showToast(e1.message, 'error'); return; }
      const { error: e2 } = await supabase.from('salesdetail').insert([{ transno: next, prodcode, quantity: Number(quantity), record_status: 'ACTIVE' }]);
      if (e2) { showToast(e2.message, 'error'); return; }
      setModal(false);
      showToast(`✅ Transaction ${next} saved!`);
      await refresh();
    } finally { setSaving(false); }
  }

  async function softDelete(transno) {
    if (!window.confirm(`Soft-delete transaction #${transno}? (Can be recovered later)`)) return;
    const { error } = await supabase.from('sales').update({ record_status: 'INACTIVE' }).eq('transno', transno);
    if (error) showToast(error.message, 'error');
    else { showToast(`Deleted #${transno}`); await refresh(); }
  }

  const unitPrice = priceMap[form.prodcode] || 0;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl font-semibold text-sm shadow-xl animate-slide-up ${toast.type==='error' ? 'bg-rose-600' : 'bg-emerald-600'} text-white`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Sales Registry</h1>
          <p className="text-slate-400 text-sm">Manage all active sales transactions</p>
        </div>
        {rights.SALES_ADD && (
          <button onClick={openModal} className="btn-primary"><Plus size={16}/>New Transaction</button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"/>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            className="input-field pl-9" placeholder="Search by customer, employee, sales no…" />
        </div>
        <select value={empFilt} onChange={e => setEmpFilt(e.target.value)} className="select-field w-52">
          <option value="">All Employees</option>
          {employees.map(e => <option key={e.empno} value={e.empno}>{e.firstname} {e.lastname}</option>)}
        </select>
        <span className="flex items-center px-3 py-2 bg-slate-800 rounded-xl text-sm text-slate-400">{filtered.length} records</span>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-900/50">
              <tr>{['Sales No.','Date','Customer','Employee','Total',...(rights.SALES_DEL ? [''] : [])].map(h => <th key={h} className="th">{h}</th>)}</tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={6} className="td text-center text-slate-500 py-8">Loading…</td></tr>}
              {!loading && filtered.map(t => (
                <tr key={t.transno} className="hover:bg-slate-800/40 transition-colors">
                  <td className="td font-mono text-indigo-400">#{t.transno}</td>
                  <td className="td text-slate-400">{t.salesdate}</td>
                  <td className="td">{customerMap[t.custno] || t.custno}</td>
                  <td className="td">{employeeMap[t.empno]  || t.empno}</td>
                  <td className="td text-emerald-400 font-semibold">₱{Number(paymentsMap[t.transno]||0).toLocaleString('en-PH',{minimumFractionDigits:2})}</td>
                  {rights.SALES_DEL && (
                    <td className="td">
                      <button onClick={() => softDelete(t.transno)} className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors">
                        <Trash2 size={14}/>
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {!loading && !filtered.length && <tr><td colSpan={6} className="td text-center text-slate-500 py-8">No records found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Transaction Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title="New Transaction">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1.5">Customer</label>
              <select value={form.custno} onChange={e => setForm(f => ({...f, custno: e.target.value}))} className="select-field">
                <option value="">— Select —</option>
                {customers.map(c => <option key={c.custno} value={c.custno}>{c.custname}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1.5">Employee</label>
              <select value={form.empno} onChange={e => setForm(f => ({...f, empno: e.target.value}))} className="select-field">
                <option value="">— Select —</option>
                {employees.map(e => <option key={e.empno} value={e.empno}>{e.firstname} {e.lastname}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1.5">Product</label>
            <select value={form.prodcode} onChange={e => setForm(f => ({...f, prodcode: e.target.value}))} className="select-field">
              <option value="">— Select Product —</option>
              {products.map(p => <option key={p.prodcode} value={p.prodcode}>[{p.prodcode}] {p.description}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1.5">Unit Price <span className="normal-case text-indigo-400">(auto)</span></label>
              <input type="text" readOnly className="input-field bg-slate-950 cursor-not-allowed" value={form.prodcode ? `₱ ${unitPrice.toFixed(2)}` : '—'} />
            </div>
            <div>
              <label className="block text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1.5">Quantity</label>
              <input type="number" min="1" value={form.quantity} onChange={e => setForm(f => ({...f, quantity: e.target.value}))} className="input-field"/>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setModal(false)} className="btn-ghost flex-1 justify-center">Cancel</button>
            <button onClick={saveTransaction} disabled={saving} className="btn-primary flex-1 justify-center disabled:opacity-60">
              {saving ? 'Saving…' : 'Save Transaction'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
