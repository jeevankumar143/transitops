// public/js/auth.js
// Core app bootstrap, navigation, utility functions

const API = '';

// ── Auth helpers ───────────────────────────────────────────────
function getToken()  { return localStorage.getItem('transitops_token'); }
function getUser()   { try { return JSON.parse(localStorage.getItem('transitops_user')); } catch { return null; } }
function normalizeRole(role) {
  if (!role && role !== 0) return null;
  const value = String(role).trim().toLowerCase().replace(/\s+/g, '_');
  const aliases = {
    fleet_manager: 'fleet_manager',
    'fleet-manager': 'fleet_manager',
    'fleet manager': 'fleet_manager',
    admin: 'fleet_manager',
    driver: 'driver',
    safety_officer: 'safety_officer',
    'safety-officer': 'safety_officer',
    'safety officer': 'safety_officer',
    financial_analyst: 'financial_analyst',
    'financial-analyst': 'financial_analyst',
    'financial analyst': 'financial_analyst',
    finance: 'financial_analyst',
    analyst: 'financial_analyst'
  };
  return aliases[value] || null;
}

function logout() {
  localStorage.removeItem('transitops_token');
  localStorage.removeItem('transitops_user');
  window.location.href = '/login.html';
}

function toggleDarkMode() {
  document.body.classList.toggle('dark-mode');
  localStorage.setItem('transitops_theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
}
if (localStorage.getItem('transitops_theme') === 'dark') {
  document.addEventListener('DOMContentLoaded', () => document.body.classList.add('dark-mode'));
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

  const rawText = await res.text().catch(() => '');
  let data = { success: false, message: res.statusText };
  if (rawText) {
    try { data = JSON.parse(rawText); } catch { data = { success: false, message: rawText }; }
  }

  if (!data.success && res.status === 401) {
    toast('Your session expired. Please sign in again.', 'error');
    logout();
    return;
  }
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
  const user = getUser();

  let displayTitle = meta.title;
  let displaySub   = meta.sub;
  let showAction   = !!meta.action;

  // Role customization for header actions & titles
  if (user?.role === 'DRIVER' && page === 'trips') {
    displayTitle = 'My Assigned Trips';
    displaySub   = 'Driver Operations & Distance Logging Portal';
    showAction   = false; // Drivers cannot create new trips
  } else if (user?.role === 'SAFETY_OFFICER' && page === 'drivers') {
    displayTitle = 'Safety & Compliance Roster';
    displaySub   = 'Driver Safety Scores & License Expiry Tracking';
  } else if (user?.role === 'FINANCIAL_ANALYST' && page === 'financials') {
    displayTitle = 'Financial Executive Portal';
    displaySub   = 'Fleet ROI Analytics & Operating Expense Reports';
  }

  document.getElementById('page-title').textContent = displayTitle;
  document.getElementById('page-sub').textContent   = displaySub;

  // Header action button
  const actions = document.getElementById('header-actions');
  if (showAction && meta.action) {
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

// ── Role-Specific Navigation & Portal Customization ─────────────
function applyRolePermissions(user) {
  if (!user || !user.role) return 'dashboard';

  const role = normalizeRole(user.role);
  const navIds = {
    dashboard:   document.getElementById('nav-dashboard'),
    vehicles:    document.getElementById('nav-vehicles'),
    drivers:     document.getElementById('nav-drivers'),
    trips:       document.getElementById('nav-trips'),
    maintenance: document.getElementById('nav-maintenance'),
    fuel:        document.getElementById('nav-fuel'),
    expenses:    document.getElementById('nav-expenses'),
    financials:  document.getElementById('nav-financials')
  };

  const portalBanner = document.getElementById('role-portal-banner');

  if (role === 'FLEET_MANAGER') {
    if (navIds.drivers)    navIds.drivers.style.display = 'none';
    if (navIds.trips)      navIds.trips.style.display = 'none';
    if (navIds.fuel)       navIds.fuel.style.display = 'none';
    if (navIds.expenses)   navIds.expenses.style.display = 'none';
    if (navIds.financials) navIds.financials.style.display = 'none';

    if (portalBanner) {
      portalBanner.innerHTML = `🏛️ <strong>FLEET MANAGER COMMAND CENTER</strong> — Oversees Fleet Assets, Vehicle Registry, Maintenance Log &amp; Operational Efficiency`;
      portalBanner.style.background = '#e8eff8';
      portalBanner.style.color = '#1a3a6b';
      portalBanner.style.borderColor = '#b8cde8';
    }
    return 'dashboard';
  }
  else if (role === 'SAFETY_OFFICER') {
    if (navIds.dashboard)   navIds.dashboard.style.display = 'none';
    if (navIds.trips)       navIds.trips.style.display = 'none';
    if (navIds.fuel)        navIds.fuel.style.display = 'none';
    if (navIds.expenses)    navIds.expenses.style.display = 'none';
    if (navIds.financials)  navIds.financials.style.display = 'none';

    if (portalBanner) {
      portalBanner.innerHTML = `🛡️ <strong>SAFETY &amp; COMPLIANCE PORTAL</strong> — Driver Licensure, Safety Scores &amp; Vehicle Roadworthiness Inspections`;
      portalBanner.style.background = '#e8f5e9';
      portalBanner.style.color = '#1b5e20';
      portalBanner.style.borderColor = '#a5d6a7';
    }
    return 'drivers';
  }
  else if (role === 'FINANCIAL_ANALYST') {
    if (navIds.vehicles)    navIds.vehicles.style.display = 'none';
    if (navIds.drivers)     navIds.drivers.style.display = 'none';
    if (navIds.trips)       navIds.trips.style.display = 'none';
    if (navIds.maintenance) navIds.maintenance.style.display = 'none';

    if (portalBanner) {
      portalBanner.innerHTML = `📈 <strong>FINANCIAL AUDIT PORTAL</strong> — Fleet ROI Analytics, Operating Costs &amp; Expense Accounting`;
      portalBanner.style.background = '#fff8e1';
      portalBanner.style.color = '#6f4f00';
      portalBanner.style.borderColor = '#ffe082';
    }
    return 'financials';
  }
  else if (role === 'DRIVER') {
    if (navIds.dashboard)   navIds.dashboard.style.display = 'none';
    if (navIds.vehicles)    navIds.vehicles.style.display = 'none';
    if (navIds.drivers)     navIds.drivers.style.display = 'none';
    if (navIds.maintenance) navIds.maintenance.style.display = 'none';
    if (navIds.expenses)    navIds.expenses.style.display = 'none';
    if (navIds.financials)  navIds.financials.style.display = 'none';

    if (portalBanner) {
      portalBanner.innerHTML = `🚛 <strong>DRIVER OPERATIONS PORTAL</strong> — Assigned Trips, Actual Distance Logging &amp; Roadside Fuel Refills`;
      portalBanner.style.background = '#e3f2fd';
      portalBanner.style.color = '#0d47a1';
      portalBanner.style.borderColor = '#90caf9';
    }
    return 'trips';
  }
  else {
    if (portalBanner) {
      portalBanner.innerHTML = `🏛️ <strong>FLEET MANAGER COMMAND CENTER</strong> — Full National Fleet Management &amp; Operational Command`;
      portalBanner.style.background = '#f0f5fc';
      portalBanner.style.color = '#1a3a6b';
      portalBanner.style.borderColor = '#d0d9e3';
    }
    return 'dashboard';
  }
}

// ── App init ───────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  const token = getToken();
  if (!token) { window.location.href = '/login.html'; return; }

  const user = getUser();
  if (!user) {
    window.location.href = '/login.html';
    return;
  }

  const normalizedRole = normalizeRole(user.role);
  document.getElementById('user-name').textContent   = user.name || 'User';
  document.getElementById('user-role').textContent   = (normalizedRole || user.role || 'user').replace(/_/g, ' ');
  document.getElementById('user-avatar').textContent = (user.name || 'U').charAt(0).toUpperCase();

  try {
    await loadTopicModals();
  } catch (error) {
    console.error('Failed to load UI modals:', error);
  }

  document.getElementById('app').style.display = 'flex';

  const defaultPage = applyRolePermissions({ ...user, role: normalizedRole || user.role });
  navigate(defaultPage);
});
