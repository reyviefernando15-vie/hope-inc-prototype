// Hope, Inc. — Sales Management System (CDN build)

const SUPABASE_URL     = 'https://ygoxhjemowubyfzfbumf.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_NUyGPE4L8ZVmaQRCeR_Ufg_k2Dy-G8c';
const supabase          = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const TABLE_USERS        = 'employee';
const TABLE_TRANSACTIONS = 'sales';
const TABLE_CUSTOMERS    = 'customer';
const TABLE_PRODUCTS     = 'product';
const TABLE_PAYMENTS     = 'payment';
const TABLE_SALESDETAIL  = 'salesdetail';
const TABLE_LOGS         = 'logs';

let currentRole       = 'USER';
let selectedLoginRole = 'USER';
let currentDateFilter = 'all';
let allTransactions   = [];
let salesDetails      = [];
let customerMap       = {};
let employeeMap       = {};
let productMap        = {};
let paymentsMap       = {};
let productPriceMap   = {};
let customersList     = [];
let employeesList     = [];
let productsList      = [];

// ── AUTH ──────────────────────────────────────────────────────
function selectLoginRole(role) {
    selectedLoginRole = role;
    ['USER','ADMIN','SUPERADMIN'].forEach(t => {
        const b = document.getElementById(`tab-${t}`);
        if (b) b.classList.remove('active');
    });
    const a = document.getElementById(`tab-${role}`);
    if (a) a.classList.add('active');
}

async function handleLogin() {
    const val = document.getElementById('login-email').value.trim();
    const btn = document.getElementById('btn-login');
    if (btn) { btn.textContent = 'Signing in…'; btn.disabled = true; }

    if (val === 'test' || val === '') {
        await finalizeLogin({ name: 'Demo ' + selectedLoginRole, id: 'T-001', role: selectedLoginRole });
        return;
    }
    const { data, error } = await supabase.from(TABLE_USERS).select('empno,firstname,lastname,record_status').eq('empno', val).limit(1);
    if (error) { showToast('Error: ' + error.message, 'error'); if (btn) { btn.textContent = 'Sign In Securely'; btn.disabled = false; } return; }
    if (!data || !data.length) { showToast("ID not found. Use 'test' to bypass.", 'error'); if (btn) { btn.textContent = 'Sign In Securely'; btn.disabled = false; } return; }
    const u = data[0];
    // Login Guard — block inactive accounts
    if (u.record_status === 'INACTIVE') {
        showToast('⛔ Account is inactive. Contact Admin.', 'error');
        if (btn) { btn.textContent = 'Sign In Securely'; btn.disabled = false; }
        return;
    }
    await finalizeLogin({ name: `${u.firstname||''} ${u.lastname||''}`.trim() || 'User', id: u.empno, role: selectedLoginRole });
}

// ── EMAIL → ROLE MAP ─────────────────────────────────────────
// Add authorized emails here. Everyone else defaults to USER.
const EMAIL_ROLES = {
    'reyvie.fernando15@gmail.com': 'SUPERADMIN',
    'reyvie.fernando@neu.edu.ph':  'SUPERADMIN',
    'jcesperanza@neu.edu.ph':      'ADMIN',
    'bryanaven.escoto@neu.edu.ph': 'ADMIN',
    'jayvanne.pingal@neu.edu.ph':  'ADMIN',
};

function getRoleByEmail(email) {
    return EMAIL_ROLES[(email || '').toLowerCase()] || 'USER';
}

// ── SITE URL — must match Supabase Auth → URL Configuration ───────────
const SITE_URL = 'https://reyviefernando15-vie.github.io/hope-inc-prototype/';

function signInWithGoogle() {
    supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: SITE_URL }
    }).then(({ error }) => {
        if (error) showToast('Google login failed: ' + error.message, 'error');
    });
}

// Helper: extract avatar from all possible Google OAuth metadata fields
function extractAvatar(u) {
    const m = u?.user_metadata || {};
    return m.avatar_url || m.picture || m.photo_url || m.profile_image_url || null;
}

// ── Proactive session restore on page load ──────────────────────
(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
        const u      = session.user;
        const email  = (u.email || '').toLowerCase();
        const name   = u.user_metadata?.full_name || u.user_metadata?.name || email || 'Google User';
        const role   = getRoleByEmail(email);
        const avatar = extractAvatar(u);
        if (document.getElementById('main-app').style.display === 'flex') return;
        showToast(`Welcome back, ${name.split(' ')[0]}!`, 'success');
        await finalizeLogin({ name, id: email, role, avatar });
    }
})();

// ── Listen for OAuth redirect sign-ins ────────────────────────
supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' && session?.user) {
        const u      = session.user;
        const email  = (u.email || '').toLowerCase();
        const name   = u.user_metadata?.full_name || u.user_metadata?.name || email || 'Google User';
        const role   = getRoleByEmail(email);
        const avatar = extractAvatar(u);
        if (document.getElementById('main-app').style.display === 'flex') return;
        showToast(`Welcome, ${name.split(' ')[0]}! Signed in as ${role}`, 'success');
        await finalizeLogin({ name, id: email, role, avatar });
    }
});

const RIGHTS = {
    USER:       { SALES_ADD:true,  SALES_EDIT:false, SALES_DEL:false, VIEW_DELETED:false, USER_MGMT:false },
    ADMIN:      { SALES_ADD:true,  SALES_EDIT:true,  SALES_DEL:true,  VIEW_DELETED:true,  USER_MGMT:true  },
    SUPERADMIN: { SALES_ADD:true,  SALES_EDIT:true,  SALES_DEL:true,  VIEW_DELETED:true,  USER_MGMT:true  },
};
let rights = RIGHTS.USER;

async function finalizeLogin(user) {
    currentRole = user.role || 'USER';
    rights = RIGHTS[currentRole] || RIGHTS.USER;
    const name   = user.name   || 'User';
    const id     = user.id     || 'ID';
    const avatar = user.avatar || null;
    document.getElementById('admin-prof-name').textContent  = name;
    document.getElementById('admin-prof-id').textContent    = id;
    document.getElementById('admin-role-title').textContent = currentRole;
    document.getElementById('dash-howdy-name').textContent  = name.split(' ')[0];
    document.getElementById('topbar-username').textContent  = name.split(' ')[0];

    // ── Profile photo (Google) or fallback initial ──
    const avatarEl = document.getElementById('user-avatar-initial');
    if (avatarEl) {
        if (avatar) {
            avatarEl.textContent = '';
            avatarEl.innerHTML = `<img src="${avatar}" alt="${name}" style="width:100%;height:100%;object-fit:cover;border-radius:8px;display:block;">`;
        } else {
            avatarEl.innerHTML = '';
            avatarEl.textContent = (name || 'U').charAt(0).toUpperCase();
        }
    }

    // Role-based nav visibility
    ['nav-deleted','nav-usermgmt'].forEach(id => { const el=document.getElementById(id); if(el) el.style.display=rights.VIEW_DELETED?'flex':'none'; });
    // Role-based button visibility
    const btnNew = document.getElementById('btn-new-txn'); if(btnNew) btnNew.style.display = rights.SALES_ADD ? '' : 'none';
    try { await supabase.from(TABLE_LOGS).insert([{ name, role: currentRole, action:'Login', timestamp: new Date().toLocaleString(), rawDate: new Date().toISOString() }]); } catch(_) {}
    await enterApp();
}

async function enterApp() {
    document.getElementById('screen-signin').style.display = 'none';
    document.getElementById('main-app').style.display      = 'flex';
    await loadReferenceData();
    populateDropdowns();
    switchPage('dashboard');
    await loadTransactions();
    setupRealtime();
}

// ── REAL-TIME ─────────────────────────────────────────────────
function setupRealtime() {
    supabase.channel('hope-rt')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'sales' }, async () => {
            await loadReferenceData();
            await loadTransactions();
            showToast('📡 Real-time update received!', 'success');
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'payment' }, async () => {
            await loadReferenceData();
            await loadTransactions();
        })
        .subscribe();
}

// ── DATE FILTER (GLOBAL) ───────────────────────────────────────
let customRangeFrom = null;
let customRangeTo   = null;

function setDateFilter(filter) {
    currentDateFilter = filter;
    customRangeFrom   = null;
    customRangeTo     = null;
    // Hide custom range picker
    const rp = document.getElementById('custom-range-picker');
    if (rp) rp.classList.remove('active');
    // Update button states
    document.querySelectorAll('.date-filter-btn').forEach(b => b.classList.remove('active'));
    const btn = document.getElementById(`df-${filter}`);
    if (btn) btn.classList.add('active');
    // Apply to both dashboard and transactions
    const filtered = filterByDate(allTransactions.filter(t => !t.record_status || t.record_status === 'ACTIVE'));
    renderDashboard(filtered);
    renderSalesListFiltered(filtered);
}

function toggleCustomRange() {
    const rp = document.getElementById('custom-range-picker');
    if (!rp) return;
    const isOpen = rp.classList.toggle('active');
    document.querySelectorAll('.date-filter-btn').forEach(b => b.classList.remove('active'));
    const btn = document.getElementById('df-custom');
    if (btn) btn.classList.toggle('active', isOpen);
    if (!isOpen) { setDateFilter('all'); }
}

function applyCustomRange() {
    const from = document.getElementById('range-from')?.value;
    const to   = document.getElementById('range-to')?.value;
    if (!from && !to) return;
    customRangeFrom   = from || null;
    customRangeTo     = to   || null;
    currentDateFilter = 'custom';
    const filtered = filterByDate(allTransactions.filter(t => !t.record_status || t.record_status === 'ACTIVE'));
    renderDashboard(filtered);
    renderSalesListFiltered(filtered);
    showToast(`📅 Showing ${filtered.length} records in range`, 'success');
}

function filterByDate(txns) {
    const now = new Date();
    if (currentDateFilter === 'today') {
        const today = now.toISOString().split('T')[0];
        return txns.filter(t => (t.salesdate || '').startsWith(today));
    }
    if (currentDateFilter === 'week') {
        const ago = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return txns.filter(t => new Date(t.salesdate) >= ago);
    }
    if (currentDateFilter === 'month') {
        const first = new Date(now.getFullYear(), now.getMonth(), 1);
        return txns.filter(t => new Date(t.salesdate) >= first);
    }
    if (currentDateFilter === 'custom') {
        return txns.filter(t => {
            const d = t.salesdate || '';
            if (customRangeFrom && d < customRangeFrom) return false;
            if (customRangeTo   && d > customRangeTo)   return false;
            return true;
        });
    }
    return txns;
}

// ── MOBILE SIDEBAR TOGGLE ────────────────────────────────────
function toggleSidebar() {
    const sidebar  = document.getElementById('sidebar');
    const overlay  = document.getElementById('sidebar-overlay');
    if (!sidebar || !overlay) return;
    const isOpen = sidebar.classList.toggle('open');
    overlay.classList.toggle('active', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
}

function closeSidebarOnMobile() {
    if (window.innerWidth <= 768) {
        const sidebar  = document.getElementById('sidebar');
        const overlay  = document.getElementById('sidebar-overlay');
        if (sidebar)  sidebar.classList.remove('open');
        if (overlay)  overlay.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// ── NAVIGATION ────────────────────────────────────────────────
function switchPage(pageId) {
    if ((pageId==='deleted-items'||pageId==='user-management') && !rights.VIEW_DELETED) { showToast('Access denied.','error'); return; }
    document.querySelectorAll('.page-section').forEach(p=>p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
    const page = document.getElementById(pageId);
    if (page) page.classList.add('active');
    const navMap = { 'deleted-items':'nav-deleted','user-management':'nav-usermgmt','customers':'nav-customers','employees':'nav-employees','products':'nav-products' };
    const navId = navMap[pageId] || `nav-${pageId.split('-')[0]}`;
    const nav = document.getElementById(navId); if (nav) nav.classList.add('active');
    const titles = { dashboard:'Dashboard', transactions:'Sales Registry', reports:'Analytics', 'deleted-items':'Deleted Records', 'user-management':'User Management', customers:'Customers', employees:'Employees', products:'Products' };
    const crumbs = { dashboard:'Home / Dashboard', transactions:'Records / Transactions', reports:'Records / Analytics', 'deleted-items':'Records / Deleted', 'user-management':'Admin / Users', customers:'Lookup / Customers', employees:'Lookup / Employees', products:'Lookup / Products' };
    document.getElementById('topbar-title').textContent      = titles[pageId]||pageId;
    document.getElementById('topbar-breadcrumb').textContent = crumbs[pageId]||'';
    if (pageId==='reports')          { renderCharts(); renderTopProducts(); }
    if (pageId==='customers')        renderLookup('customers');
    if (pageId==='employees')        renderLookup('employees');
    if (pageId==='products')         renderLookup('products');
    if (pageId==='user-management')  renderUserManagement();
    if (pageId==='deleted-items')    renderDeletedItems();
    closeSidebarOnMobile(); // auto-close on mobile after nav
}

// ── DATA LOADING ──────────────────────────────────────────────
async function loadReferenceData() {
    const [cR, eR, pR, payR, detR, prR] = await Promise.all([
        supabase.from(TABLE_CUSTOMERS).select('*'),
        supabase.from(TABLE_USERS).select('*'),
        supabase.from(TABLE_PRODUCTS).select('*'),
        supabase.from(TABLE_PAYMENTS).select('*'),
        supabase.from(TABLE_SALESDETAIL).select('*'),
        supabase.from('pricehist').select('prodcode,unitprice,effdate').order('effdate', { ascending: true })
    ]);
    if (cR.error || eR.error || pR.error) showToast('⚠️ Cannot load data. Check Supabase RLS.', 'error');

    customersList = cR.data || [];
    employeesList = eR.data || [];
    productsList  = pR.data || [];
    salesDetails  = detR.data || [];

    customerMap = Object.fromEntries(customersList.map(c => [c.custno, c.custname]));
    employeeMap = Object.fromEntries(employeesList.map(e => [e.empno, `${e.firstname||''} ${e.lastname||''}`.trim()]));
    productMap  = Object.fromEntries(productsList.map(p => [p.prodcode, p.description]));

    productPriceMap = {};
    (prR.data || []).forEach(ph => { productPriceMap[ph.prodcode] = Number(ph.unitprice || 0); });

    paymentsMap = {};
    (payR.data || []).forEach(p => { paymentsMap[p.transno] = (paymentsMap[p.transno] || 0) + Number(p.amount || 0); });
}

async function loadTransactions() {
    let q = supabase.from(TABLE_TRANSACTIONS).select('*').order('salesdate', { ascending: true });
    if (currentRole === 'USER') q = q.eq('record_status', 'ACTIVE');
    const { data, error } = await q;
    if (error) { showToast('Load error: ' + error.message, 'error'); allTransactions = []; }
    else allTransactions = data || [];
    // Apply current date filter to both dashboard and transactions
    const active   = allTransactions.filter(t => !t.record_status || t.record_status === 'ACTIVE');
    const filtered = filterByDate(active);
    renderDashboard(filtered);
    renderSalesListFiltered(filtered);
}

// ── DASHBOARD RENDER ──────────────────────────────────────────
function renderDashboard(txns) {
    const body = document.getElementById('dash-recent-body');
    if (body) body.innerHTML = '';
    let rev = 0;
    const custs = new Set(), rows = [];
    txns.forEach(t => {
        const total = Number(paymentsMap[t.transno] || 0);
        rev += total;
        custs.add(customerMap[t.custno] || t.custno || 'Unknown');
        rows.push({ ...t, customerName: customerMap[t.custno] || t.custno || 'Unknown', employeeName: employeeMap[t.empno] || t.empno || 'Unknown', total });
    });
    const avg = txns.length > 0 ? rev / txns.length : 0;
    document.getElementById('dash-today-sales').textContent     = rev.toFixed(2);
    document.getElementById('dash-today-total').textContent     = txns.length;
    document.getElementById('dash-today-customers').textContent = custs.size;
    document.getElementById('dash-avg-value').textContent       = avg.toFixed(2);
    if (body) {
        const recent = rows.slice(-5).reverse();
        if (!recent.length) { body.innerHTML = '<tr><td colspan="6" class="empty-row">No records in this period.</td></tr>'; return; }
        recent.forEach(t => {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td class="sales-no-cell">#${t.transno}</td><td>${t.salesdate||'—'}</td><td class="col-stamp"></td><td>${t.customerName}</td><td>${t.employeeName}</td><td class="amount-cell text-right">₱${t.total.toFixed(2)}</td>`;
            body.appendChild(tr);
        });
    }
}

// ── SALES LIST RENDER ─────────────────────────────────────────
function renderSalesList() {
    const active = allTransactions.filter(t => !t.record_status || t.record_status === 'ACTIVE');
    const filtered = filterByDate(active);
    renderSalesListFiltered(filtered);
}

function renderSalesListFiltered(txns) {
    const bA = document.getElementById('sales-list-body');
    if (bA) bA.innerHTML = '';
    txns.forEach(t => {
        const total = Number(paymentsMap[t.transno] || 0);
        const delBtn = rights.SALES_DEL
            ? `<button onclick="softDelete('${t.transno}')" class="btn-icon-danger" title="Soft Delete">🗑</button>`
            : `<span style="font-size:.75rem;color:var(--muted);">—</span>`;
        const stamp = currentRole!=='USER' ? (t.stamp||'') : '';
        const tr = document.createElement('tr');
        tr.innerHTML = `<td class="sales-no-cell">#${t.transno}</td><td>${t.salesdate||'—'}</td><td class="col-stamp" style="font-size:.7rem;color:var(--muted)">${stamp}</td><td>${customerMap[t.custno]||t.custno||'Unknown'}</td><td>${employeeMap[t.empno]||t.empno||'Unknown'}</td><td class="amount-cell text-right">₱${total.toFixed(2)}</td><td class="text-center">${delBtn}</td>`;
        bA.appendChild(tr);
    });
    if (bA && !bA.innerHTML) bA.innerHTML = '<tr><td colspan="7" class="empty-row">No records found for this period.</td></tr>';
    document.getElementById('txn-count-badge').textContent = `${txns.length} record${txns.length!==1?'s':''}`;
}

function renderDeletedItems() {
    const bD = document.getElementById('deleted-sales-body');
    const bL = document.getElementById('deleted-lines-body');
    if (bD) bD.innerHTML = '';
    if (bL) bL.innerHTML = '';
    const deleted = allTransactions.filter(t=>t.record_status==='INACTIVE');
    deleted.forEach(t => {
        const total = Number(paymentsMap[t.transno]||0);
        const tr = document.createElement('tr');
        tr.innerHTML = `<td class="sales-no-cell" style="text-decoration:line-through;opacity:.6">#${t.transno}</td><td>${t.salesdate||'—'}</td><td>${customerMap[t.custno]||t.custno}</td><td>${employeeMap[t.empno]||t.empno}</td><td class="text-right">₱${total.toFixed(2)}</td><td><button onclick="recoverTransaction('${t.transno}')" class="btn-recover">↩ Recover</button></td>`;
        if (bD) bD.appendChild(tr);
    });
    const deletedDet = salesDetails.filter(d=>d.record_status==='INACTIVE');
    deletedDet.forEach(d => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td class="sales-no-cell" style="text-decoration:line-through;opacity:.6">#${d.transno}</td><td>${productMap[d.prodcode]||d.prodcode}</td><td>${d.quantity}</td>`;
        if (bL) bL.appendChild(tr);
    });
    if (bD && !bD.innerHTML) bD.innerHTML = '<tr><td colspan="6" class="empty-row">No deleted transactions.</td></tr>';
    if (bL && !bL.innerHTML) bL.innerHTML = '<tr><td colspan="3" class="empty-row">No deleted line items.</td></tr>';
}

async function softDelete(transno) {
    if (!rights.SALES_DEL) return showToast('Access denied.','error');
    if (!confirm(`Soft-delete #${transno}? It will move to Deleted Records (recoverable).`)) return;
    const { error } = await supabase.from(TABLE_TRANSACTIONS).update({record_status:'INACTIVE'}).eq('transno',transno);
    if (error) {
        if (error.message && error.message.includes('record_status')) {
            showToast('⚠️ Run the SQL migration first! (ALTER TABLE sales ADD COLUMN record_status)', 'error');
        } else {
            showToast('Delete failed: ' + error.message, 'error');
        }
        return;
    }
    showToast(`🗑️ #${transno} moved to Deleted Records (recoverable)`,'success');
    await loadReferenceData();
    await loadTransactions();
}

async function recoverTransaction(transno) {
    const { error } = await supabase.from(TABLE_TRANSACTIONS).update({record_status:'ACTIVE'}).eq('transno',transno);
    if (error) showToast(error.message,'error');
    else { showToast(`✅ Recovered #${transno}`,'success'); await loadReferenceData(); await loadTransactions(); renderDeletedItems(); }
}

function filterTransactions() {
    const q = (document.getElementById('txn-search').value||'').toLowerCase();
    const e = (document.getElementById('filter-employee').value||'').toLowerCase();
    const rows = document.querySelectorAll('#sales-list-body tr');
    let v = 0;
    rows.forEach(r => {
        const t = r.textContent.toLowerCase();
        const m = t.includes(q) && (!e||t.includes(e));
        r.style.display = m?'':'none'; if(m) v++;
    });
    document.getElementById('txn-count-badge').textContent = `${v} record${v!==1?'s':''}`;
}

// ── DROPDOWNS ─────────────────────────────────────────────────
function populateDropdowns() {
    const cS = document.getElementById('select-customer');
    const eS = document.getElementById('select-employee');
    const pS = document.getElementById('select-product');
    const eF = document.getElementById('filter-employee');
    if (cS) { cS.innerHTML = '<option value="">— Select Customer —</option>'; customersList.forEach(c => cS.add(new Option(c.custname, c.custno))); }
    if (eS) { eS.innerHTML = '<option value="">— Select Employee —</option>'; employeesList.forEach(e => eS.add(new Option(`${e.firstname||''} ${e.lastname||''}`.trim(), e.empno))); }
    if (pS) { pS.innerHTML = '<option value="">— Select Product —</option>'; productsList.forEach(p => pS.add(new Option(`[${p.prodcode}] ${p.description}`, p.prodcode))); }
    if (eF) { eF.innerHTML = '<option value="">All Employees</option>'; employeesList.forEach(e => eF.add(new Option(`${e.firstname||''} ${e.lastname||''}`.trim(), e.empno))); }
}

// ── MODAL ─────────────────────────────────────────────────────
function openCreateModal() {
    const m = document.getElementById('modal-create');
    if (m) m.classList.add('open');
    ['select-product','select-customer','select-employee'].forEach(id => { const el = document.getElementById(id); if (el) el.selectedIndex = 0; });
    const ip = document.getElementById('input-price'); if (ip) ip.value = '';
    const iq = document.getElementById('input-quantity'); if (iq) iq.value = '1';
}
function closeCreateModal() { const m = document.getElementById('modal-create'); if (m) m.classList.remove('open'); }

function autoFillPrice() {
    const id = document.getElementById('select-product').value;
    const el = document.getElementById('input-price');
    if (el) { const p = productPriceMap[id]; el.value = id ? (p ? '₱ ' + p.toFixed(2) : '₱ 0.00') : ''; }
}

async function saveTransaction() {
    const cust = document.getElementById('select-customer').value;
    const emp  = document.getElementById('select-employee').value;
    const prod = document.getElementById('select-product').value;
    const qty  = Number(document.getElementById('input-quantity').value || 1);
    if (!cust) return showToast('Please select a customer.', 'error');
    if (!emp)  return showToast('Please select an employee.', 'error');
    if (!prod) return showToast('Please select a product.', 'error');
    if (qty < 1) return showToast('Quantity must be at least 1.', 'error');

    const { data: mx } = await supabase.from(TABLE_TRANSACTIONS).select('transno').order('transno', { ascending: false }).limit(1);
    const last  = (mx && mx.length) ? mx[0].transno : 'TR000000';
    const match = last.match(/TR(\d+)/);
    const next  = `TR${String((match ? Number(match[1]) : 0) + 1).padStart(6, '0')}`;

    const { error: e1 } = await supabase.from(TABLE_TRANSACTIONS).insert([{ transno: next, salesdate: new Date().toISOString().split('T')[0], custno: cust, empno: emp }]);
    if (e1) return showToast('Save failed: ' + e1.message, 'error');

    const unitPrice = Number(productPriceMap[prod] || 0);
    const total     = unitPrice * qty;

    const { error: e2 } = await supabase.from(TABLE_SALESDETAIL).insert([{ transno: next, prodcode: prod, quantity: qty }]);
    if (e2) return showToast('Detail save failed: ' + e2.message, 'error');

    // Insert payment record so total shows correctly in the list
    if (total > 0) {
        const { error: e3 } = await supabase.from(TABLE_PAYMENTS).insert([{ transno: next, amount: total }]);
        if (e3) console.warn('Payment record warning:', e3.message);
    }

    closeCreateModal();
    showToast(`✅ Transaction ${next} saved! Total: ₱${total.toFixed(2)}`, 'success');
    await loadReferenceData();
    await loadTransactions();
}

// ── CHARTS ────────────────────────────────────────────────────
let charts = {};
function renderCharts() {
    const empSales = {}, custSales = {};
    allTransactions.forEach(t => {
        const amt  = Number(paymentsMap[t.transno] || 0);
        const eName = employeeMap[t.empno]  || t.empno  || 'Unknown';
        const cName = customerMap[t.custno] || t.custno || 'Unknown';
        empSales[eName]  = (empSales[eName]  || 0) + amt;
        custSales[cName] = (custSales[cName] || 0) + amt;
    });
    const opts = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { padding: 16, font: { size: 12, family: 'Inter' } } } } };
    const COLORS = ['#6366f1','#8b5cf6','#ec4899','#14b8a6','#f59e0b','#10b981','#ef4444','#3b82f6'];

    const cE = document.getElementById('chartEmployee');
    if (cE) { if (charts.emp) charts.emp.destroy(); charts.emp = new Chart(cE.getContext('2d'), { type:'bar', data:{ labels:Object.keys(empSales), datasets:[{ label:'Revenue (₱)', data:Object.values(empSales), backgroundColor:COLORS, borderRadius:6, borderSkipped:false }] }, options:{...opts, plugins:{...opts.plugins, legend:{display:false}}, scales:{y:{beginAtZero:true,grid:{color:'#f1f5f9'},ticks:{font:{family:'Inter'}}},x:{grid:{display:false},ticks:{font:{family:'Inter'}}}}} }); }

    const cC = document.getElementById('chartCustomer');
    if (cC) { if (charts.cust) charts.cust.destroy(); charts.cust = new Chart(cC.getContext('2d'), { type:'pie', data:{ labels:Object.keys(custSales), datasets:[{ data:Object.values(custSales), backgroundColor:COLORS, borderWidth:2, borderColor:'#fff' }] }, options:opts }); }

    // Products chart: total qty sold per product from salesDetails
    const prodVol = {};
    salesDetails.forEach(d => { prodVol[d.prodcode] = (prodVol[d.prodcode] || 0) + Number(d.quantity || 0); });
    const topProds = Object.entries(prodVol).sort((a,b) => b[1]-a[1]).slice(0,10);
    const cP = document.getElementById('chartProducts');
    if (cP) { if (charts.prod) charts.prod.destroy(); charts.prod = new Chart(cP.getContext('2d'), { type:'doughnut', data:{ labels:topProds.map(([k]) => productMap[k]||k), datasets:[{ data:topProds.map(([,v]) => v), backgroundColor:COLORS, borderWidth:2, borderColor:'#fff' }] }, options:opts }); }
}

// ── TOP PRODUCTS TABLE ────────────────────────────────────────
function renderTopProducts() {
    const tbody = document.getElementById('top-products-body');
    if (!tbody) return;
    const prodVol = {};
    salesDetails.forEach(d => { prodVol[d.prodcode] = (prodVol[d.prodcode] || 0) + Number(d.quantity || 0); });
    const sorted = Object.entries(prodVol).sort((a,b) => b[1]-a[1]).slice(0,10);
    if (!sorted.length) { tbody.innerHTML = '<tr><td colspan="3" class="empty-row">No data yet.</td></tr>'; return; }
    tbody.innerHTML = '';
    sorted.forEach(([code, qty], i) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td><span class="rank-badge">${i+1}</span></td><td>${productMap[code]||code}</td><td class="text-right"><strong>${qty.toLocaleString()}</strong> units</td>`;
        tbody.appendChild(tr);
    });
}

// ── DELETED TABS ──────────────────────────────────────────────
function switchDeletedTab(tab) {
    document.querySelectorAll('.tab-pill').forEach(b=>b.classList.remove('active'));
    document.querySelectorAll('.tab-pane').forEach(p=>p.classList.remove('active'));
    const isT = tab==='transactions';
    document.getElementById(isT?'tabpill-txn':'tabpill-line').classList.add('active');
    document.getElementById(isT?'tab-transactions':'tab-line-items').classList.add('active');
}

// ── LOOKUP PAGES (Read-Only) ──────────────────────────────────
function renderLookup(type) {
    const configs = {
        customers: { tbodyId:'lookup-cust-body', cols:['custno','custname','address','city'] },
        employees: { tbodyId:'lookup-emp-body',  cols:['empno','lastname','firstname','gender','birthdate','hiredate'] },
        products:  { tbodyId:'lookup-prod-body', cols:['prodcode','description','unit'] },
    };
    const cfg = configs[type]; if (!cfg) return;
    const tbody = document.getElementById(cfg.tbodyId); if (!tbody) return;
    const list = type==='customers'?customersList:type==='employees'?employeesList:productsList;
    tbody.innerHTML = '';
    list.forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = cfg.cols.map(c=>`<td class="td">${row[c]||'—'}</td>`).join('');
        tbody.appendChild(tr);
    });
    if (!tbody.innerHTML) tbody.innerHTML = '<tr><td colspan="6" class="empty-row">No data.</td></tr>';
}

// ── USER MANAGEMENT ──────────────────────────────────────────
async function renderUserManagement() {
    if (!rights.USER_MGMT) return;
    const tbody = document.getElementById('usermgmt-body'); if (!tbody) return;
    const { data, error } = await supabase.from(TABLE_USERS).select('empno,firstname,lastname,hiredate,record_status').order('lastname');
    if (error) { showToast(error.message,'error'); return; }
    tbody.innerHTML = '';
    (data||[]).forEach(emp => {
        const isActive  = !emp.record_status || emp.record_status==='ACTIVE';
        const isSA      = false; // extend later if you add a role column
        const canToggle = rights.USER_MGMT && !isSA;
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="td font-mono">${emp.empno}</td>
            <td class="td">${emp.lastname}, ${emp.firstname}</td>
            <td class="td">${emp.hiredate||'—'}</td>
            <td class="td"><span class="status-badge ${isActive?'status-active':'status-inactive'}">${isActive?'ACTIVE':'INACTIVE'}</span></td>
            <td class="td text-center">${canToggle
                ? `<button onclick="toggleUserStatus('${emp.empno}','${emp.record_status||'ACTIVE'}')" class="btn-toggle ${isActive?'btn-deactivate':'btn-activate'}">${isActive?'Deactivate':'Activate'}</button>`
                : '<span class="muted">—</span>'}</td>`;
        tbody.appendChild(tr);
    });
}

async function toggleUserStatus(empno, currentStatus) {
    const newStatus = currentStatus==='INACTIVE' ? 'ACTIVE' : 'INACTIVE';
    if (!confirm(`${newStatus==='INACTIVE'?'Deactivate':'Activate'} employee ${empno}?`)) return;
    const { error } = await supabase.from(TABLE_USERS).update({record_status:newStatus}).eq('empno',empno);
    if (error) showToast(error.message,'error');
    else { showToast(`Employee ${empno} is now ${newStatus}`,'success'); renderUserManagement(); }
}

// ── CLOCK ─────────────────────────────────────────────────────
function updateClock() {
    const now = new Date();
    const el = document.getElementById('nav-clock');
    const de = document.getElementById('topbar-date');
    if (el) el.textContent = now.toLocaleTimeString('en-PH');
    if (de) de.textContent = now.toLocaleDateString('en-PH', { weekday:'short', year:'numeric', month:'short', day:'numeric' });
}
updateClock();
setInterval(updateClock, 1000);

// ── TOAST ─────────────────────────────────────────────────────
let toastTimer;
function showToast(msg, type = '') {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.className   = 'toast show' + (type ? ` toast-${type}` : '');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 3200);
}

// ── WINDOW GLOBALS (for onclick in HTML) ─────────────────────
document.addEventListener('DOMContentLoaded', () => {
    const bd = document.getElementById('modal-create');
    if (bd) bd.addEventListener('click', e => { if (e.target === bd) closeCreateModal(); });
    // Enter key support for email login form
    const emailAddrEl = document.getElementById('login-email-addr');
    if (emailAddrEl) emailAddrEl.addEventListener('keydown', e => { if (e.key === 'Enter') signInWithEmail(); });
    // Pre-fill modal date
    const md = document.getElementById('modal-date-display');
    if (md) md.value = new Date().toLocaleDateString('en-PH');
});

window.selectLoginRole    = selectLoginRole;
window.handleLogin        = handleLogin;
window.signInWithGoogle   = signInWithGoogle;
window.switchPage         = switchPage;
window.toggleSidebar      = toggleSidebar;
window.setDateFilter      = setDateFilter;
window.toggleCustomRange  = toggleCustomRange;
window.applyCustomRange   = applyCustomRange;
window.openCreateModal    = openCreateModal;
window.closeCreateModal   = closeCreateModal;
window.autoFillPrice      = autoFillPrice;
window.saveTransaction    = saveTransaction;
window.filterTransactions = filterTransactions;
window.switchDeletedTab   = switchDeletedTab;
window.softDelete         = softDelete;
window.recoverTransaction = recoverTransaction;
window.toggleUserStatus   = toggleUserStatus;
