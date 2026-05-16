import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export function useHopeData() {
  const [loading,       setLoading      ] = useState(true);
  const [transactions,  setTransactions ] = useState([]);
  const [customers,     setCustomers    ] = useState([]);
  const [employees,     setEmployees    ] = useState([]);
  const [products,      setProducts     ] = useState([]);
  const [salesDetails,  setSalesDetails ] = useState([]);
  const [paymentsMap,   setPaymentsMap  ] = useState({});
  const [priceMap,      setPriceMap     ] = useState({});
  const [customerMap,   setCustomerMap  ] = useState({});
  const [employeeMap,   setEmployeeMap  ] = useState({});
  const [productMap,    setProductMap   ] = useState({});

  const refresh = useCallback(async () => {
    setLoading(true);
    const [cR, eR, pR, sR, payR, detR, prR] = await Promise.all([
      supabase.from('customer').select('*'),
      supabase.from('employee').select('*'),
      supabase.from('product').select('*'),
      supabase.from('sales').select('*').order('salesdate', { ascending: false }),
      supabase.from('payment').select('*'),
      supabase.from('salesdetail').select('*'),
      supabase.from('pricehist').select('prodcode,unitprice,effdate').order('effdate', { ascending: true }),
    ]);

    const custs = cR.data || [];
    const emps  = eR.data || [];
    const prods = pR.data || [];
    const txns  = sR.data || [];
    const dets  = detR.data || [];

    setCustomers(custs);
    setEmployees(emps);
    setProducts(prods);
    setTransactions(txns);
    setSalesDetails(dets);

    setCustomerMap(Object.fromEntries(custs.map(c => [c.custno, c.custname])));
    setEmployeeMap(Object.fromEntries(emps.map(e  => [e.empno,  `${e.firstname||''} ${e.lastname||''}`.trim()])));
    setProductMap(Object.fromEntries(prods.map(p  => [p.prodcode, p.description])));

    const pm = {};
    (prR.data || []).forEach(ph => { pm[ph.prodcode] = Number(ph.unitprice || 0); });
    setPriceMap(pm);

    const payM = {};
    (payR.data || []).forEach(p => { payM[p.transno] = (payM[p.transno] || 0) + Number(p.amount || 0); });
    setPaymentsMap(payM);

    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    const chan = supabase.channel('hope-data')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sales' },   refresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payment' }, refresh)
      .subscribe();
    return () => supabase.removeChannel(chan);
  }, [refresh]);

  return { loading, transactions, customers, employees, products, salesDetails, paymentsMap, priceMap, customerMap, employeeMap, productMap, refresh };
}
