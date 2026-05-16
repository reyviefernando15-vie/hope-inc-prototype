import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

// Role-based rights matrix
const RIGHTS = {
  USER:       { SALES_ADD: true,  SALES_EDIT: false, SALES_DEL: false, VIEW_DELETED: false, USER_MGMT: false },
  ADMIN:      { SALES_ADD: true,  SALES_EDIT: true,  SALES_DEL: false, VIEW_DELETED: true,  USER_MGMT: true  },
  SUPERADMIN: { SALES_ADD: true,  SALES_EDIT: true,  SALES_DEL: true,  VIEW_DELETED: true,  USER_MGMT: true  },
};

export function AuthProvider({ children }) {
  const [user,    setUser   ] = useState(null);   // { name, id, role }
  const [loading, setLoading] = useState(false);

  const rights = user ? (RIGHTS[user.role] || RIGHTS.USER) : {};

  async function loginWithId(empId, role) {
    setLoading(true);
    try {
      if (empId === 'test' || empId === '') {
        setUser({ name: `Demo ${role}`, id: 'T-001', role });
        return { error: null };
      }
      const { data, error } = await supabase
        .from('employee')
        .select('empno, firstname, lastname')
        .eq('empno', empId)
        .limit(1);
      if (error) return { error: error.message };
      if (!data || !data.length) return { error: "Employee ID not found. Use 'test' to bypass." };
      const emp  = data[0];
      const name = `${emp.firstname || ''} ${emp.lastname || ''}`.trim() || 'User';
      setUser({ name, id: emp.empno, role });
      return { error: null };
    } finally {
      setLoading(false);
    }
  }

  function logout() { setUser(null); }

  return (
    <AuthContext.Provider value={{ user, loading, rights, loginWithId, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
