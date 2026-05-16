// ============================================================
//  Hope, Inc. — Sales Management System
//  Uses Supabase via CDN (window.supabase.createClient)
// ============================================================

const SUPABASE_URL = 'https://ygoxhjemowubyfzfbumf.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_NUyGPE4L8ZVmaQRCeR_Ufg_k2Dy-G8c';

// Wait for Supabase CDN to be available
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const TABLE_USERS       = 'employee';
const TABLE_TRANSACTIONS = 'sales';
const TABLE_CUSTOMERS   = 'customer';
const TABLE_PRODUCTS    = 'product';
const TABLE_PAYMENTS    = 'payment';
const TABLE_SALESDETAIL = 'salesdetail';
const TABLE_LOGS        = 'logs';

let currentRole        = 'USER';
let selectedLoginRole  = 'USER';
let allTransactions    = [];
let customerMap        = {};
let employeeMap        = {};
let productMap         = {};
let paymentsMap        = {};
let customersList      = [];
let employeesList      = [];
let productsList       = [];

// ============================================================
//  AUTH
// ============================================================
function selectLoginRole(role) {
    selectedLoginRole = role;
    ['USER', 'ADMIN', 'SUPERADMIN'].forEach(t => {
        const btn = document.getElementById(`tab-${t}`);
        if (btn) btn.classList.remove('active');
    });
    const activeBtn = document.getElementById(`tab-${role}`);
    if (activeBtn) activeBtn.classList.add('active');
}

async function handleLogin() {
    const inputVal = document.getElementById('login-email').value.trim();
    const btn = document.getElementById('btn-login');
    if (btn) { btn.textContent = 'Signing in…'; btn.disabled = true; }

    if (inputVal === 'test' || inputVal === '') {
        await finalizeLogin({ name: 'Demo ' + selectedLoginRole, id: 'T-001', role: selectedLoginRole });
        return;
    }

    const { data, error } = await supabase
        .from(TABLE_USERS)
        .select('empno,firstname,lastname')
        .eq('empno', inputVal)
        .limit(1);

    if (error) {
        showToast('Supabase error: ' + error.message, 'error');
        if (btn) { btn.textContent = 'Sign In Securely'; btn.disabled = false; }
        return;
    }
    if (!data || data.length === 0) {
        showToast("ID not recognized. Use 'test' to bypass.", 'error');
        if (btn) { btn.textContent = 'Sign In Securely'; btn.disabled = false; }
        return;
    }

    const user = data[0];
    const name = `${user.firstname || ''} ${user.lastname || ''}`.trim() || 'User';
    await finalizeLogin({ name, id: user.empno, role: selectedLoginRole });
}

function signInWithGoogle() {
    showToast('Google login is disabled for this version.', 'error');
}

async function finalizeLogin(user) {
    currentRole = user.role || 'USER';
    const name  = user.name || 'User';
    const id    = user.id   || 'ID';

    document.getElementById('admin-prof-name').textContent      = name;
    document.getElementById('admin-prof-id').textContent        = id;
    document.getElementById('admin-role-title').textContent     = currentRole;
    document.getElementById('dash-howdy-name').textContent      = name.split(' ')[0];
    document.getElementById('topbar-username').textContent      = name.split(' ')[0];
    document.getElementById('user-avatar-initial').textContent  = (name || 'U').charAt(0).toUpperCase();

    const navDeleted = document.getElementById('nav-deleted');
    if (navDeleted) navDeleted.style.display = (currentRole === 'USER') ? 'none' : 'flex';

    // Try to log — silently skip if table doesn't exist
    try {
        await supabase.from(TABLE_LOGS).insert([{
            name, role: currentRole, action: 'Login',
            timestamp: new Date().toLocaleString(),
            rawDate: new Date().toISOString()
        }]);
    } catch (_) {}

    await enterApp();
}

async function enterApp() {
    document.getElementById('screen-signin').style.display = 'none';
    document.getElementById('main-app').style.display      = 'flex';
    await loadReferenceData();
    populateDropdowns();
    switchPage('dashboard');
    await loadTransactions();
}

// ============================================================
//  NAVIGATION
// ============================================================
function switchPage(pageId) {
    if (pageId === 'deleted-items' && currentRole === 'USER') {
        showToast('Access denied. Insufficient role permissions.', 'error');
        return;
    }
    document.querySelectorAll('.page-section').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

    const page = document.getElementById(pageId);
    if (page) page.classList.add('active');

    const nav = document.getElementById(`nav-${pageId === 'deleted-items' ? 'deleted' : pageId.split('-')[0]}`);
    if (nav) nav.classList.add('active');

    const titles      = { dashboard: 'Dashboard', transactions: 'Sales Registry', reports: 'Analytics', 'deleted-items': 'Deleted Records' };
    const breadcrumbs = { dashboard: 'Home / Dashboard', transactions: 'Records / Transactions', reports: 'Records / Analytics', 'deleted-items': 'Records / Deleted' };
    document.getElementById('topbar-title').textContent      = titles[pageId]      || '';
    document.getElementById('topbar-breadcrumb').textContent = breadcrumbs[pageId] || '';

    if (pageId === 'reports') renderCharts();
}

// ============================================================
//  DATA LOADING
// ============================================================
async function loadReferenceData() {
    const [custRes, empRes, prodRes, paymentRes, detailRes] = await Promise.all([
        supabase.from(TABLE_CUSTOMERS).select('*'),
        supabase.from(TABLE_USERS).select('*'),
        supabase.from(TABLE_PRODUCTS).select('*'),
        supabase.from(TABLE_PAYMENTS).select('*'),
        supabase.from(TABLE_SALESDETAIL).select('*')
    ]);

    if (custRes.error || empRes.error || prodRes.error) {
        showToast('⚠️ Unable to load Supabase data. Check table names or RLS policies.', 'error');
    }

    customersList = custRes.data  || [];
    employeesList = empRes.data   || [];
    productsList  = prodRes.data  || [];

    customerMap = Object.fromEntries(customersList.map(c => [c.custno, c.custname]));
    employeeMap = Object.fromEntries(employeesList.map(e => [e.empno, `${e.firstname || ''} ${e.lastname || ''}`.trim()]));
    productMap  = Object.fromEntries(productsList.map(p  => [p.prodcode, p.description]));

    paymentsMap = {};
    (paymentRes.data || []).forEach(p => {
        paymentsMap[p.transno] = (paymentsMap[p.transno] || 0) + Number(p.amount || 0);
    });
}

async function loadTransactions() {
    const { data, error } = await supabase
        .from(TABLE_TRANSACTIONS)
        .select('*')
        .order('salesdate', { ascending: true });

    if (error) {
        showToast('Unable to load sales: ' + error.message, 'error');
        allTransactions = [];
    } else {
        allTransactions = data || [];
    }
    renderTransactions(allTransactions);
}

// ============================================================
//  RENDER
// ============================================================
function renderTransactions(txns) {
    const bodyActive  = document.getElementById('sales-list-body');
    const bodyDeleted = document.getElementById('deleted-sales-body');
    const bodyRecent  = document.getElementById('dash-recent-body');

    if (bodyActive)  bodyActive.innerHTML  = '';
    if (bodyDeleted) bodyDeleted.innerHTML = '';
    if (bodyRecent)  bodyRecent.innerHTML  = '';

    let totalRevenue = 0, activeCount = 0;
    const customers  = new Set();
    const recentRows = [];

    txns.forEach(t => {
        const transNo      = t.transno || 'UNKNOWN';
        const date         = t.salesdate || t.date || '—';
        const customerName = customerMap[t.custno] || t.custno || 'Unknown';
        const employeeName = employeeMap[t.empno]  || t.empno  || 'Unknown';
        const total        = Number(paymentsMap[transNo] || 0);

        totalRevenue += total;
        activeCount++;
        customers.add(customerName);
        recentRows.push({ ...t, customerName, employeeName, total, date });

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="sales-no-cell">#${transNo}</td>
            <td>${date}</td>
            <td class="col-stamp"></td>
            <td>${customerName}</td>
            <td>${employeeName}</td>
            <td class="amount-cell text-right">₱${total.toFixed(2)}</td>
            <td class="text-center"><span style="font-size:.75rem;color:var(--muted);">—</span></td>
        `;
        if (bodyActive) bodyActive.appendChild(tr);
    });

    if (bodyActive  && bodyActive.innerHTML  === '') bodyActive.innerHTML  = '<tr><td colspan="7" class="empty-row">No sales records found.</td></tr>';
    if (bodyDeleted && bodyDeleted.innerHTML === '') bodyDeleted.innerHTML = '<tr><td colspan="5" class="empty-row">No deleted records.</td></tr>';

    const avg = activeCount > 0 ? totalRevenue / activeCount : 0;
    document.getElementById('dash-today-sales').textContent    = totalRevenue.toFixed(2);
    document.getElementById('dash-today-total').textContent    = activeCount;
    document.getElementById('dash-today-customers').textContent = customers.size;
    document.getElementById('dash-avg-value').textContent      = avg.toFixed(2);
    document.getElementById('txn-count-badge').textContent     = `${activeCount} record${activeCount !== 1 ? 's' : ''}`;

    if (bodyRecent) {
        const recent = recentRows.slice(-5).reverse();
        if (recent.length === 0) {
            bodyRecent.innerHTML = '<tr><td colspan="6" class="empty-row">No records yet.</td></tr>';
        } else {
            recent.forEach(t => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td class="sales-no-cell">#${t.transno}</td>
                    <td>${t.date}</td>
                    <td class="col-stamp"></td>
                    <td>${t.customerName}</td>
                    <td>${t.employeeName}</td>
                    <td class="amount-cell text-right">₱${t.total.toFixed(2)}</td>
                `;
                bodyRecent.appendChild(tr);
            });
        }
    }
}

function filterTransactions() {
    const query     = (document.getElementById('txn-search').value || '').toLowerCase();
    const empFilter = (document.getElementById('filter-employee').value || '').toLowerCase();
    const rows      = document.querySelectorAll('#sales-list-body tr');
    let visible     = 0;
    rows.forEach(row => {
        const text  = row.textContent.toLowerCase();
        const match = text.includes(query) && (!empFilter || text.includes(empFilter));
        row.style.display = match ? '' : 'none';
        if (match) visible++;
    });
    document.getElementById('txn-count-badge').textContent = `${visible} record${visible !== 1 ? 's' : ''}`;
}

// ============================================================
//  DROPDOWNS
// ============================================================
function populateDropdowns() {
    const custSel = document.getElementById('select-customer');
    const empSel  = document.getElementById('select-employee');
    const prodSel = document.getElementById('select-product');

    if (custSel) {
        custSel.innerHTML = '<option value="">— Select Customer —</option>';
        customersList.forEach(c => custSel.add(new Option(c.custname, c.custno)));
    }
    if (empSel) {
        empSel.innerHTML = '<option value="">— Select Employee —</option>';
        employeesList.forEach(e => empSel.add(new Option(`${e.firstname || ''} ${e.lastname || ''}`.trim(), e.empno)));
    }
    if (prodSel) {
        prodSel.innerHTML = '<option value="">— Select Product —</option>';
        productsList.forEach(p => prodSel.add(new Option(`[${p.prodcode}] ${p.description}`, p.prodcode)));
    }
}

// ============================================================
//  MODAL
// ============================================================
function openCreateModal() {
    const modal = document.getElementById('modal-create');
    if (modal) modal.classList.add('open');
    document.getElementById('select-product').value         = '';
    document.getElementById('input-price').value            = '';
    document.getElementById('select-customer').selectedIndex = 0;
    document.getElementById('select-employee').selectedIndex = 0;
}

function closeCreateModal() {
    const modal = document.getElementById('modal-create');
    if (modal) modal.classList.remove('open');
}

function autoFillPrice() {
    const prodId     = document.getElementById('select-product').value;
    const priceInput = document.getElementById('input-price');
    const product    = productsList.find(p => p.prodcode === prodId);
    if (priceInput) {
        priceInput.value = prodId
            ? (product && product.unitprice ? '₱ ' + Number(product.unitprice).toFixed(2) : '₱ 0.00')
            : '';
    }
}

async function saveTransaction() {
    const cust = document.getElementById('select-customer').value;
    const emp  = document.getElementById('select-employee').value;
    const prod = document.getElementById('select-product').value;

    if (!cust) return showToast('Please select a customer.', 'error');
    if (!emp)  return showToast('Please select an employee.', 'error');
    if (!prod) return showToast('Please select a product.', 'error');

    const now = new Date();
    const { data: maxRows, error: maxError } = await supabase
        .from(TABLE_TRANSACTIONS)
        .select('transno')
        .order('transno', { ascending: false })
        .limit(1);

    if (maxError) return showToast('Unable to save: ' + maxError.message, 'error');

    let lastId   = 'TR000000';
    if (maxRows && maxRows.length > 0) lastId = maxRows[0].transno;
    const match     = lastId.match(/TR(\d+)/);
    const nextNum   = match ? Number(match[1]) + 1 : 1;
    const newTransNo = `TR${String(nextNum).padStart(6, '0')}`;

    const salesInsert = await supabase.from(TABLE_TRANSACTIONS).insert([{
        transno: newTransNo,
        salesdate: now.toISOString().split('T')[0],
        custno: cust,
        empno: emp
    }]);
    if (salesInsert.error) return showToast('Save failed: ' + salesInsert.error.message, 'error');

    const detailInsert = await supabase.from(TABLE_SALESDETAIL).insert([{
        transno: newTransNo,
        prodcode: prod,
        quantity: 1
    }]);
    if (detailInsert.error) return showToast('Save failed: ' + detailInsert.error.message, 'error');

    closeCreateModal();
    showToast('✅ Transaction saved successfully!', 'success');
    await loadReferenceData();
    await loadTransactions();
}

// ============================================================
//  CHARTS
// ============================================================
let charts = {};
function renderCharts() {
    const txns     = allTransactions || [];
    const empSales  = {};
    const custSales = {};

    txns.forEach(t => {
        const amount       = Number(paymentsMap[t.transno] || 0);
        const employeeName = employeeMap[t.empno]  || t.empno  || 'Unknown';
        const customerName = customerMap[t.custno] || t.custno || 'Unknown';
        empSales[employeeName]  = (empSales[employeeName]  || 0) + amount;
        custSales[customerName] = (custSales[customerName] || 0) + amount;
    });

    const opts = {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { padding: 16, font: { size: 12, family: 'Inter' } } } }
    };

    const ctxEmp = document.getElementById('chartEmployee');
    if (ctxEmp) {
        if (charts.emp) charts.emp.destroy();
        charts.emp = new Chart(ctxEmp.getContext('2d'), {
            type: 'bar',
            data: { labels: Object.keys(empSales), datasets: [{ label: 'Revenue (₱)', data: Object.values(empSales), backgroundColor: ['#6366f1', '#8b5cf6', '#a78bfa', '#ec4899', '#14b8a6'], borderRadius: 6, borderSkipped: false }] },
            options: { ...opts, plugins: { ...opts.plugins, legend: { display: false } }, scales: { y: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { font: { family: 'Inter' } } }, x: { grid: { display: false }, ticks: { font: { family: 'Inter' } } } } }
        });
    }

    const ctxCust = document.getElementById('chartCustomer');
    if (ctxCust) {
        if (charts.cust) charts.cust.destroy();
        charts.cust = new Chart(ctxCust.getContext('2d'), {
            type: 'pie',
            data: { labels: Object.keys(custSales), datasets: [{ data: Object.values(custSales), backgroundColor: ['#10b981', '#6366f1', '#f59e0b', '#ef4444', '#8b5cf6'], borderWidth: 2, borderColor: '#fff' }] },
            options: opts
        });
    }

    const ctxProd = document.getElementById('chartProducts');
    if (ctxProd) {
        if (charts.prod) charts.prod.destroy();
        charts.prod = new Chart(ctxProd.getContext('2d'), {
            type: 'doughnut',
            data: { labels: productsList.map(p => p.description || p.prodcode || 'Item'), datasets: [{ data: productsList.map(() => 1), backgroundColor: ['#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b', '#6366f1'], borderWidth: 2, borderColor: '#fff' }] },
            options: opts
        });
    }
}

// ============================================================
//  DELETED TAB
// ============================================================
function switchDeletedTab(tab) {
    document.querySelectorAll('.tab-pill').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
    if (tab === 'transactions') {
        document.getElementById('tabpill-txn').classList.add('active');
        document.getElementById('tab-transactions').classList.add('active');
    } else {
        document.getElementById('tabpill-line').classList.add('active');
        document.getElementById('tab-line-items').classList.add('active');
    }
}

// ============================================================
//  CLOCK
// ============================================================
function updateClock() {
    const now = new Date();
    const el  = document.getElementById('nav-clock');
    const de  = document.getElementById('topbar-date');
    if (el) el.textContent = now.toLocaleTimeString('en-PH');
    if (de) de.textContent = now.toLocaleDateString('en-PH', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
}
updateClock();
setInterval(updateClock, 1000);

// ============================================================
//  TOAST
// ============================================================
let toastTimer;
function showToast(msg, type = '') {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.className   = 'toast show' + (type ? ` toast-${type}` : '');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 3200);
}

// ============================================================
//  MODAL BACKDROP CLICK
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    const backdrop = document.getElementById('modal-create');
    if (backdrop) backdrop.addEventListener('click', e => { if (e.target === backdrop) closeCreateModal(); });
});

// ============================================================
//  EXPOSE TO GLOBAL SCOPE (needed for onclick="" in HTML)
// ============================================================
window.selectLoginRole  = selectLoginRole;
window.handleLogin      = handleLogin;
window.signInWithGoogle = signInWithGoogle;
window.switchPage       = switchPage;
window.openCreateModal  = openCreateModal;
window.closeCreateModal = closeCreateModal;
window.autoFillPrice    = autoFillPrice;
window.saveTransaction  = saveTransaction;
window.filterTransactions = filterTransactions;
window.switchDeletedTab = switchDeletedTab;

