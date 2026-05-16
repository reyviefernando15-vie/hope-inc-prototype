import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { ShieldCheck, UserCircle, Briefcase } from 'lucide-react';

const ROLES = [
  { id: 'USER',       label: 'Sales Agent', icon: UserCircle  },
  { id: 'ADMIN',      label: 'Manager',     icon: Briefcase   },
  { id: 'SUPERADMIN', label: 'Owner',        icon: ShieldCheck },
];

export default function LoginPage() {
  const { loginWithId, loading } = useAuth();
  const [role,  setRole ] = useState('USER');
  const [empId, setEmpId] = useState('');
  const [error, setError ] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const { error: err } = await loginWithId(empId, role);
    if (err) setError(err);
  }

  return (
    <div className="min-h-screen flex bg-slate-950">
      {/* Brand panel */}
      <div className="hidden lg:flex flex-col items-center justify-center w-96 bg-gradient-to-b from-indigo-900 via-slate-900 to-slate-950 p-10 shrink-0">
        <div className="w-20 h-20 rounded-2xl bg-indigo-600 flex items-center justify-center text-4xl font-black text-white shadow-2xl shadow-indigo-900 mb-6">H</div>
        <h1 className="text-3xl font-bold text-white mb-2">Hope, Inc.</h1>
        <p className="text-indigo-300 text-sm">Sales Management System</p>
        <div className="mt-10 flex gap-2">
          {[0,1,2].map(i => <span key={i} className={`w-2 h-2 rounded-full ${i===0?'bg-indigo-400':'bg-slate-700'}`}/>)}
        </div>
      </div>

      {/* Form panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md animate-fade-in">
          <div className="glass-card p-8">
            <h2 className="text-2xl font-bold text-white mb-1">Identity Gateway</h2>
            <p className="text-slate-400 text-sm mb-8">Select your role and authenticate to continue</p>

            {/* Role tabs */}
            <div className="flex gap-2 mb-6 p-1 bg-slate-900 rounded-xl">
              {ROLES.map(({ id, label, icon: Icon }) => (
                <button key={id} onClick={() => setRole(id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${role === id ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}>
                  <Icon size={14} />{label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Employee ID</label>
                <input type="text" value={empId} onChange={e => setEmpId(e.target.value)}
                  className="input-field" placeholder="Enter Employee ID (or 'test')" autoFocus />
              </div>

              {error && (
                <div className="flex items-center gap-2 px-4 py-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-sm">
                  <span>⚠</span> {error}
                </div>
              )}

              <button type="submit" disabled={loading}
                className="btn-primary w-full justify-center py-3 text-base disabled:opacity-60 disabled:cursor-not-allowed">
                {loading ? 'Signing in…' : 'Sign In Securely →'}
              </button>
            </form>

            <p className="text-center text-slate-600 text-xs mt-6">Protected by Supabase 🔒</p>
          </div>
        </div>
      </div>
    </div>
  );
}
