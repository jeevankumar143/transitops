// public/js/auth.js
// Core app bootstrap, navigation, utility functions

const API = '';

// ── Auth helpers ───────────────────────────────────────────────
function getToken()  { return localStorage.getItem('transitops_token'); }
function getUser()   { try { return JSON.parse(localStorage.getItem('transitops_user')); } catch { return null; } }

function logout() {
  localStorage.removeItem('transitops_token');
  localStorage.removeItem('transitops_user');
  window.location.href = '/login.html';
}

async function apiFetch(path, opts = {}) {
  const token = getToken();
  const res = await fetch(API + path, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({ success: false, message: res.statusText }));
  if (!data.success && res.status === 401) { logout(); return; }
  return data;
}

// ── Toast notifications ────────────────────────────────────────
function toast(message, type = 'info') {
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  const c = document.getElementById('toast-container');
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.innerHTML = `<span class="toast-icon">${icons[type]||'ℹ️'}</span><span>${message}</span>`;
  c.appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; el.style.transform = 'translateX(24px)'; el.style.transition = 'all 0.3s'; setTimeout(() => el.remove(), 300); }, 3200);
}

// ── Modal helpers ──────────────────────────────────────────────
function openModal(id)  { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

// ── Confirm dialog ─────────────────────────────────────────────
function confirm(title, message, onOk) {
  document.getElementById('confirm-title').textContent   = title;
  document.getElementById('confirm-message').textContent = message;
  const btn = document.getElementById('confirm-ok-btn');
  btn.onclick = () => { closeModal('confirm-modal'); onOk(); };
  openModal('confirm-modal');
}

// ── Badge renderer ─────────────────────────────────────────────
function badge(status) {
  const map = {
    'Available': 'available', 'On Trip': 'on-trip', 'In Shop': 'in-shop',
    'Retired': 'retired', 'Suspended': 'suspended', 'Off Duty': 'off-duty',
    'Draft': 'draft', 'Dispatched': 'dispatched', 'Completed': 'completed',
    'Cancelled': 'cancelled', 'Active': 'active', 'Closed': 'closed',
  };
  const cls = map[status] || 'draft';
  return `<span class="badge badge-${cls}">${status}</span>`;
}

// ── Currency formatter ─────────────────────────────────────────
function fmt(n, decimals = 0) {
  if (n === null || n === undefined) return '—';
  return Number(n).toLocaleString('en-KE', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

// ── Date formatter ─────────────────────────────────────────────
function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ── Navigation ─────────────────────────────────────────────────
const pageMeta = {
  dashboard:   { title: 'Dashboard',   sub: 'Fleet overview & KPIs',            action: null },
  vehicles:    { title: 'Vehicles',     sub: 'Vehicle registry & management',     action: { label: '+ Add Vehicle', fn: 'openVehicleModal()' } },
  drivers:     { title: 'Drivers',      sub: 'Driver profiles & compliance',      action: { label: '+ Add Driver',  fn: 'openDriverModal()' } },
  trips:       { title: 'Trips',        sub: 'Dispatch & trip state management',  action: { label: '+ New Trip',    fn: 'openTripModal()' } },
  maintenance: { title: 'Maintenance',  sub: 'Vehicle maintenance records',        action: { label: '+ Log Maintenance', fn: 'openMaintModal()' } },
  fuel:        { title: 'Fuel Logs',    sub: 'Fuel consumption tracking',          action: { label: '+ Log Fuel',    fn: 'openFuelModal()' } },
  expenses:    { title: 'Expenses',     sub: 'Operational expense tracking',       action: { label: '+ Add Expense', fn: 'openExpenseModal()' } },
  financials:  { title: 'Analytics',   sub: 'Financial reports & vehicle ROI',   action: null },
};

let currentPage = 'dashboard';

function navigate(page) {
  // Update sidebar
  document.querySelectorAll('.nav-link').forEach(el => el.classList.remove('active'));
  const navEl = document.getElementById('nav-' + page);
  if (navEl) navEl.classList.add('active');

  // Update pages
  document.querySelectorAll('.page').forEach(el => el.classList.remove('active'));
  const pageEl = document.getElementById('page-' + page);
  if (pageEl) pageEl.classList.add('active');

  // Update header
  const meta = pageMeta[page] || { title: page, sub: '' };
  document.getElementById('page-title').textContent = meta.title;
  document.getElementById('page-sub').textContent   = meta.sub;

  // Header action button
  const actions = document.getElementById('header-actions');
  if (meta.action) {
    actions.innerHTML = `<button class="btn btn-primary" onclick="${meta.action.fn}">${meta.action.label}</button>`;
  } else {
    actions.innerHTML = '';
  }

  currentPage = page;

  // Load page data
  const loaders = {
    dashboard:   loadDashboard,
    vehicles:    loadVehicles,
    drivers:     loadDrivers,
    trips:       loadTrips,
    maintenance: loadMaintenance,
    fuel:        loadFuel,
    expenses:    loadExpenses,
    financials:  loadFinancials,
  };
  if (loaders[page]) loaders[page]();
}

// ── Load Modular Topic Modals ──────────────────────────────────
async function loadTopicModals() {
  const modalFiles = [
    '/modules/common/confirm-modal.html',
    '/modules/vehicles/vehicle-modal.html',
    '/modules/drivers/driver-modal.html',
    '/modules/trips/trip-modal.html',
    '/modules/maintenance/maint-modal.html',
    '/modules/dashboard/fuel-expense-modals.html',
  ];
  const container = document.getElementById('modals-container');
  if (!container) return;
  try {
    const htmls = await Promise.all(modalFiles.map(url => fetch(url).then(r => r.text())));
    container.innerHTML = htmls.join('\n');
  } catch (err) {
    console.error('Failed to load topic modals:', err);
  }
}

// ── App init ───────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  const token = getToken();
  if (!token) { window.location.href = '/login.html'; return; }

  const user = getUser();
  if (user) {
    document.getElementById('user-name').textContent   = user.name;
    document.getElementById('user-role').textContent   = user.role.replace(/_/g, ' ');
    document.getElementById('user-avatar').textContent = user.name[0].toUpperCase();
  }

  await loadTopicModals();
  document.getElementById('app').style.display = 'flex';
  navigate('dashboard');
});
