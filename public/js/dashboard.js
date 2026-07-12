// public/js/dashboard.js
// Dashboard KPIs, Charts (Chart.js), Fuel, Expenses, Analytics pages

// ── Shared vehicle list for fuel/expense dropdowns ─────────────
let _allVehicles = [];

async function populateVehicleDropdown(selectId) {
  if (_allVehicles.length === 0) {
    const res = await apiFetch('/api/vehicles');
    _allVehicles = res?.data || [];
  }
  const sel = document.getElementById(selectId);
  if (!sel) return;
  const current = sel.value;
  sel.innerHTML = (selectId === 'e-vehicle' ? `<option value="">No specific vehicle</option>` : `<option value="">Select vehicle</option>`) +
    _allVehicles.map(v => `<option value="${v.id}" ${current==v.id?'selected':''}>${v.registration_no} — ${v.name}</option>`).join('');
}

function openFuelModal()    { populateVehicleDropdown('f-vehicle'); document.getElementById('f-date').value = new Date().toISOString().slice(0,10); openModal('fuel-modal'); }
function openExpenseModal() { populateVehicleDropdown('e-vehicle'); document.getElementById('e-date').value = new Date().toISOString().slice(0,10); openModal('expense-modal'); }

async function fuelFormSubmit(e) {
  e.preventDefault();
  const body = {
    vehicle_id:  document.getElementById('f-vehicle').value,
    liters:      document.getElementById('f-liters').value,
    cost:        document.getElementById('f-cost').value,
    log_date:    document.getElementById('f-date').value,
    station:     document.getElementById('f-station').value,
  };
  const data = await apiFetch('/api/fuel', { method: 'POST', body: JSON.stringify(body) });
  if (data?.success) { toast('Fuel log recorded.', 'success'); closeModal('fuel-modal'); loadFuel(); }
  else toast(data?.message || 'Error logging fuel.', 'error');
}

async function expenseFormSubmit(e) {
  e.preventDefault();
  const body = {
    vehicle_id:   document.getElementById('e-vehicle').value || null,
    category:     document.getElementById('e-category').value,
    amount:       document.getElementById('e-amount').value,
    expense_date: document.getElementById('e-date').value,
    description:  document.getElementById('e-desc').value,
  };
  const data = await apiFetch('/api/expenses', { method: 'POST', body: JSON.stringify(body) });
  if (data?.success) { toast('Expense recorded.', 'success'); closeModal('expense-modal'); loadExpenses(); }
  else toast(data?.message || 'Error recording expense.', 'error');
}

// ── Chart instances ─────────────────────────────────────────────
let _statusChart = null, _typeChart = null, _fuelChart = null, _tripChart = null;

function destroyChart(ref) { if (ref) { ref.destroy(); } return null; }

const chartDefaults = {
  plugins: { legend: { labels: { color: '#3d5166', font: { family: 'Source Sans 3, Inter', size: 11 } } } },
  scales: {},
};
const axisStyle = {
  grid:  { color: 'rgba(26,58,107,0.08)', borderDash: [4,2] },
  ticks: { color: '#6b7d91', font: { family: 'Source Sans 3, Inter', size: 11 } },
};

// ── DASHBOARD ──────────────────────────────────────────────────
async function loadDashboard() {
  const el = document.getElementById('page-dashboard');
  el.innerHTML = `<div style="text-align:center;padding:64px"><div class="spinner"></div></div>`;

  const res = await apiFetch('/api/dashboard/kpis');
  if (!res?.success) { el.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><p>Failed to load dashboard.</p></div>`; return; }

  const d = res.data;

  el.innerHTML = `
    <div class="kpi-grid">
      <div class="kpi-card blue">
        <div class="kpi-icon">🚛</div>
        <div class="kpi-value">${d.vehicles.total}</div>
        <div class="kpi-label">Total Vehicles</div>
        <div class="kpi-sub">${d.vehicles.retired} retired</div>
      </div>
      <div class="kpi-card green">
        <div class="kpi-icon">✅</div>
        <div class="kpi-value">${d.vehicles.available}</div>
        <div class="kpi-label">Available Vehicles</div>
      </div>
      <div class="kpi-card blue">
        <div class="kpi-icon">🗺️</div>
        <div class="kpi-value">${d.vehicles.active}</div>
        <div class="kpi-label">Active Vehicles</div>
        <div class="kpi-sub">On Trip</div>
      </div>
      <div class="kpi-card orange">
        <div class="kpi-icon">🔧</div>
        <div class="kpi-value">${d.vehicles.inMaintenance}</div>
        <div class="kpi-label">In Maintenance</div>
        <div class="kpi-sub">In Shop</div>
      </div>
      <div class="kpi-card purple">
        <div class="kpi-icon">🚀</div>
        <div class="kpi-value">${d.trips.active}</div>
        <div class="kpi-label">Active Trips</div>
        <div class="kpi-sub">Dispatched</div>
      </div>
      <div class="kpi-card cyan">
        <div class="kpi-icon">📝</div>
        <div class="kpi-value">${d.trips.pending}</div>
        <div class="kpi-label">Pending Trips</div>
        <div class="kpi-sub">Draft</div>
      </div>
      <div class="kpi-card blue">
        <div class="kpi-icon">👤</div>
        <div class="kpi-value">${d.drivers.onDuty}</div>
        <div class="kpi-label">Drivers On Duty</div>
      </div>
      <div class="kpi-card ${d.fleetUtilization >= 60 ? 'green' : d.fleetUtilization >= 30 ? 'orange' : 'red'}">
        <div class="kpi-icon">📊</div>
        <div class="kpi-value">${d.fleetUtilization}%</div>
        <div class="kpi-label">Fleet Utilization</div>
        <div class="kpi-sub">Active / Total</div>
      </div>
    </div>

    <div class="grid-2" style="margin-bottom:20px">
      <div class="card">
        <div class="section-header"><div class="section-title">Vehicle Status</div></div>
        <div class="chart-container"><canvas id="status-chart"></canvas></div>
      </div>
      <div class="card">
        <div class="section-header"><div class="section-title">Fleet by Type</div></div>
        <div class="chart-container"><canvas id="type-chart"></canvas></div>
      </div>
    </div>

    <div class="grid-2">
      <div class="card">
        <div class="section-header"><div class="section-title">Trip Summary</div></div>
        <div class="chart-container"><canvas id="trip-chart"></canvas></div>
      </div>
      <div class="card">
        <div class="section-header"><div class="section-title">Fleet Summary</div></div>
        <div style="padding:8px 0">
          <div class="fin-row"><span class="fin-label">Total Vehicles</span><span class="fin-value">${d.vehicles.total}</span></div>
          <div class="fin-row"><span class="fin-label">Available</span><span class="fin-value positive">${d.vehicles.available}</span></div>
          <div class="fin-row"><span class="fin-label">On Trip</span><span class="fin-value">${d.vehicles.active}</span></div>
          <div class="fin-row"><span class="fin-label">In Maintenance</span><span class="fin-value" style="color:var(--accent-orange)">${d.vehicles.inMaintenance}</span></div>
          <div class="fin-row"><span class="fin-label">Retired</span><span class="fin-value" style="color:var(--text-muted)">${d.vehicles.retired}</span></div>
          <div class="fin-row"><span class="fin-label">Total Drivers</span><span class="fin-value">${d.drivers.total}</span></div>
          <div class="fin-row"><span class="fin-label">Drivers On Duty</span><span class="fin-value">${d.drivers.onDuty}</span></div>
          <div class="fin-row"><span class="fin-label">Trips Completed</span><span class="fin-value positive">${d.trips.completed}</span></div>
          <div class="fin-row"><span class="fin-label">Trips Cancelled</span><span class="fin-value negative">${d.trips.cancelled}</span></div>
        </div>
      </div>
    </div>
  `;

  // Government palette chart colors
  const govStatusColors = { 'Available': '#2d7d2d', 'On Trip': '#2a5298', 'In Shop': '#c8972a', 'Retired': '#9e9e9e' };
  const statusLabels = Object.keys(d.statusBreakdown);
  const statusVals   = Object.values(d.statusBreakdown);
  const statusColors = statusLabels.map(l => govStatusColors[l] || '#6b7d91');

  _statusChart = destroyChart(_statusChart);
  _statusChart = new Chart(document.getElementById('status-chart'), {
    type: 'doughnut',
    data: { labels: statusLabels, datasets: [{ data: statusVals, backgroundColor: statusColors, borderWidth: 2, borderColor: '#fff', hoverOffset: 5 }] },
    options: { ...chartDefaults, cutout: '62%', plugins: { ...chartDefaults.plugins, tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${ctx.raw}` } } } },
  });

  const typeColors = ['#1a3a6b','#2a5298','#2d7d2d','#c8972a','#a31d1d','#5b4fcf'];
  const typeLabels = Object.keys(d.typeBreakdown);
  const typeVals   = Object.values(d.typeBreakdown);

  _typeChart = destroyChart(_typeChart);
  _typeChart = new Chart(document.getElementById('type-chart'), {
    type: 'bar',
    data: { labels: typeLabels, datasets: [{ label: 'Vehicles', data: typeVals, backgroundColor: typeColors, borderRadius: 3, borderSkipped: false }] },
    options: { ...chartDefaults, scales: { x: axisStyle, y: { ...axisStyle, beginAtZero: true, ticks: { ...axisStyle.ticks, stepSize: 1 } } }, plugins: { ...chartDefaults.plugins, legend: { display: false } } },
  });

  const tripLabels = ['Draft','Dispatched','Completed','Cancelled'];
  const tripVals   = [d.trips.pending, d.trips.active, d.trips.completed, d.trips.cancelled];
  const tripColors = ['#0d7ab4','#2a5298','#2d7d2d','#a31d1d'];

  _tripChart = destroyChart(_tripChart);
  _tripChart = new Chart(document.getElementById('trip-chart'), {
    type: 'bar',
    data: { labels: tripLabels, datasets: [{ label: 'Trips', data: tripVals, backgroundColor: tripColors, borderRadius: 3, borderSkipped: false }] },
    options: { ...chartDefaults, scales: { x: axisStyle, y: { ...axisStyle, beginAtZero: true, ticks: { ...axisStyle.ticks, stepSize: 1 } } }, plugins: { ...chartDefaults.plugins, legend: { display: false } } },
  });
}

// ── FUEL PAGE ──────────────────────────────────────────────────
async function loadFuel() {
  const el = document.getElementById('page-fuel');
  el.innerHTML = `<div style="text-align:center;padding:48px"><div class="spinner"></div></div>`;
  const res = await apiFetch('/api/fuel');
  if (!res?.success) { el.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><p>Failed to load fuel logs.</p></div>`; return; }

  const logs = res.data;
  const totalLiters = logs.reduce((s,l)=>s+l.liters,0);
  const totalCost   = logs.reduce((s,l)=>s+l.cost,0);

  el.innerHTML = `
    <div class="kpi-grid" style="grid-template-columns:repeat(auto-fill,minmax(180px,1fr))">
      <div class="kpi-card blue"><div class="kpi-icon">⛽</div><div class="kpi-value">${logs.length}</div><div class="kpi-label">Total Logs</div></div>
      <div class="kpi-card cyan"><div class="kpi-icon">💧</div><div class="kpi-value">${fmt(totalLiters,1)}</div><div class="kpi-label">Total Liters</div></div>
      <div class="kpi-card red"> <div class="kpi-icon">💰</div><div class="kpi-value">KES ${fmt(totalCost)}</div><div class="kpi-label">Total Cost</div></div>
    </div>
    <div class="card">
      <div class="section-header">
        <div><div class="section-title">Fuel Log</div><div class="section-sub">${logs.length} entries</div></div>
      </div>
      ${logs.length === 0 ? `<div class="empty-state"><div class="empty-icon">⛽</div><p>No fuel logs yet.</p></div>` : `
      <div class="table-wrap">
        <table>
          <thead><tr><th>Vehicle</th><th>Date</th><th>Liters</th><th>Cost</th><th>Cost/L</th><th>Station</th><th>Action</th></tr></thead>
          <tbody>
            ${logs.map(l => `
              <tr>
                <td><strong>${l.registration_no}</strong><br><span style="font-size:11px;color:var(--text-muted)">${l.vehicle_name}</span></td>
                <td>${fmtDate(l.log_date)}</td>
                <td>${fmt(l.liters,1)} L</td>
                <td>KES ${fmt(l.cost)}</td>
                <td>KES ${fmt(l.cost/l.liters,2)}</td>
                <td>${l.station || '—'}</td>
                <td><button class="btn btn-ghost btn-sm" style="color:var(--accent-red)" onclick="deleteFuel(${l.id})">🗑️</button></td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>`}
    </div>
  `;
}

async function deleteFuel(id) {
  confirm('Delete Fuel Log', 'Remove this fuel log?', async () => {
    const data = await apiFetch(`/api/fuel/${id}`, { method: 'DELETE' });
    if (data?.success) { toast('Fuel log deleted.', 'success'); loadFuel(); }
    else toast(data?.message || 'Error.', 'error');
  });
}

// ── EXPENSES PAGE ──────────────────────────────────────────────
async function loadExpenses() {
  const el = document.getElementById('page-expenses');
  el.innerHTML = `<div style="text-align:center;padding:48px"><div class="spinner"></div></div>`;
  const res = await apiFetch('/api/expenses');
  if (!res?.success) { el.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><p>Failed to load.</p></div>`; return; }

  const expenses = res.data;
  const total    = expenses.reduce((s,e)=>s+e.amount,0);
  const byCat    = expenses.reduce((acc,e)=>{ acc[e.category]=(acc[e.category]||0)+e.amount; return acc; },{});

  el.innerHTML = `
    <div class="kpi-grid" style="grid-template-columns:repeat(auto-fill,minmax(180px,1fr))">
      <div class="kpi-card blue"><div class="kpi-icon">💳</div><div class="kpi-value">${expenses.length}</div><div class="kpi-label">Total Expenses</div></div>
      <div class="kpi-card red"> <div class="kpi-icon">💰</div><div class="kpi-value">KES ${fmt(total)}</div><div class="kpi-label">Total Amount</div></div>
    </div>
    <div class="card">
      <div class="section-header">
        <div><div class="section-title">Expense Register</div><div class="section-sub">${expenses.length} entries</div></div>
      </div>
      ${expenses.length === 0 ? `<div class="empty-state"><div class="empty-icon">💳</div><p>No expenses yet.</p></div>` : `
      <div class="table-wrap">
        <table>
          <thead><tr><th>Category</th><th>Vehicle</th><th>Amount</th><th>Date</th><th>Description</th><th>Recorded By</th><th>Action</th></tr></thead>
          <tbody>
            ${expenses.map(e => `
              <tr>
                <td>${badge(e.category === 'Toll' ? 'Draft' : e.category === 'Maintenance' ? 'Active' : e.category === 'Insurance' ? 'Closed' : 'Draft')}
                    <span style="margin-left:4px">${e.category}</span></td>
                <td>${e.registration_no || '—'}</td>
                <td>KES ${fmt(e.amount)}</td>
                <td>${fmtDate(e.expense_date)}</td>
                <td style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${e.description||''}">${e.description || '—'}</td>
                <td>${e.recorded_by_name || '—'}</td>
                <td><button class="btn btn-ghost btn-sm" style="color:var(--accent-red)" onclick="deleteExpense(${e.id})">🗑️</button></td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>`}
    </div>
  `;
}

async function deleteExpense(id) {
  confirm('Delete Expense', 'Remove this expense?', async () => {
    const data = await apiFetch(`/api/expenses/${id}`, { method: 'DELETE' });
    if (data?.success) { toast('Expense deleted.', 'success'); loadExpenses(); }
    else toast(data?.message || 'Error.', 'error');
  });
}

// ── FINANCIALS / ANALYTICS PAGE ────────────────────────────────
let _roiChart = null;

async function loadFinancials() {
  const el = document.getElementById('page-financials');
  el.innerHTML = `<div style="text-align:center;padding:64px"><div class="spinner"></div></div>`;
  const res = await apiFetch('/api/dashboard/financials');
  if (!res?.success) { el.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><p>Failed to load.</p></div>`; return; }

  const vehicles = res.data;
  const totalRevenue = vehicles.reduce((s,v)=>s+(v.total_revenue||0),0);
  const totalOpCost  = vehicles.reduce((s,v)=>s+(v.total_op_cost||0),0);
  const totalFuel    = vehicles.reduce((s,v)=>s+(v.total_fuel_cost||0),0);
  const totalMaint   = vehicles.reduce((s,v)=>s+(v.total_maintenance_cost||0),0);
  const netProfit    = totalRevenue - totalOpCost;

  el.innerHTML = `
    <div class="kpi-grid">
      <div class="kpi-card green"> <div class="kpi-icon">💵</div><div class="kpi-value">KES ${fmt(totalRevenue)}</div><div class="kpi-label">Total Revenue</div></div>
      <div class="kpi-card red">   <div class="kpi-icon">💸</div><div class="kpi-value">KES ${fmt(totalOpCost)}</div><div class="kpi-label">Total OpCost</div></div>
      <div class="kpi-card blue">  <div class="kpi-icon">⛽</div><div class="kpi-value">KES ${fmt(totalFuel)}</div><div class="kpi-label">Fuel Cost</div></div>
      <div class="kpi-card orange"><div class="kpi-icon">🔧</div><div class="kpi-value">KES ${fmt(totalMaint)}</div><div class="kpi-label">Maint. Cost</div></div>
      <div class="kpi-card ${netProfit>=0?'green':'red'}">
        <div class="kpi-icon">${netProfit>=0?'📈':'📉'}</div>
        <div class="kpi-value">KES ${fmt(Math.abs(netProfit))}</div>
        <div class="kpi-label">Net ${netProfit>=0?'Profit':'Loss'}</div>
      </div>
    </div>

    <div class="grid-2" style="margin-bottom:20px">
      <div class="card">
        <div class="section-header">
          <div class="section-title">Vehicle ROI (%)</div>
          <a href="/api/dashboard/export/financials" class="btn btn-secondary btn-sm" target="_blank">⬇️ CSV</a>
        </div>
        <div class="chart-container"><canvas id="roi-chart"></canvas></div>
      </div>
      <div class="card">
        <div class="section-header"><div class="section-title">Export Data</div></div>
        <div style="display:flex;flex-direction:column;gap:10px;padding:8px 0">
          <a href="/api/dashboard/export/trips"      class="btn btn-secondary" target="_blank">⬇️ Export Trips CSV</a>
          <a href="/api/dashboard/export/vehicles"   class="btn btn-secondary" target="_blank">⬇️ Export Vehicles CSV</a>
          <a href="/api/dashboard/export/financials" class="btn btn-secondary" target="_blank">⬇️ Export Financials CSV</a>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="section-header">
        <div class="section-title">Vehicle Financial Breakdown</div>
        <div class="section-sub">Revenue, OpCost, Fuel Efficiency & ROI per vehicle</div>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr>
            <th>Vehicle</th><th>Status</th><th>Acq. Cost</th>
            <th>Revenue</th><th>Fuel Cost</th><th>Maint. Cost</th>
            <th>Total OpCost</th><th>Fuel Eff. (km/L)</th><th>ROI %</th>
          </tr></thead>
          <tbody>
            ${vehicles.map(v => {
              const roi = v.roi_percent;
              const roiColor = roi === null ? 'var(--text-muted)' : roi >= 10 ? 'var(--accent-green)' : roi >= 0 ? 'var(--accent-orange)' : 'var(--accent-red)';
              return `<tr>
                <td><strong>${v.registration_no}</strong><br><span style="font-size:11px;color:var(--text-muted)">${v.name}</span></td>
                <td>${badge(v.status)}</td>
                <td>KES ${fmt(v.acquisition_cost)}</td>
                <td class="positive">KES ${fmt(v.total_revenue)}</td>
                <td>KES ${fmt(v.total_fuel_cost)}</td>
                <td>KES ${fmt(v.total_maintenance_cost)}</td>
                <td style="color:var(--accent-red)">KES ${fmt(v.total_op_cost)}</td>
                <td>${v.fuel_efficiency_km_per_l !== null ? `${v.fuel_efficiency_km_per_l} km/L` : '—'}</td>
                <td style="color:${roiColor};font-weight:700">${roi !== null ? roi + '%' : '—'}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

  // ROI chart — government palette
  const roiVehicles = vehicles.filter(v => v.roi_percent !== null);
  _roiChart = destroyChart(_roiChart);
  if (roiVehicles.length > 0) {
    _roiChart = new Chart(document.getElementById('roi-chart'), {
      type: 'bar',
      data: {
        labels: roiVehicles.map(v => v.registration_no),
        datasets: [{
          label: 'ROI %',
          data: roiVehicles.map(v => v.roi_percent),
          backgroundColor: roiVehicles.map(v => v.roi_percent >= 10 ? '#2d7d2d' : v.roi_percent >= 0 ? '#c8972a' : '#a31d1d'),
          borderRadius: 3, borderSkipped: false,
          borderWidth: 1,
          borderColor: roiVehicles.map(v => v.roi_percent >= 10 ? '#1a5f1a' : v.roi_percent >= 0 ? '#a67820' : '#7b1414'),
        }],
      },
      options: {
        ...chartDefaults,
        scales: { x: axisStyle, y: { ...axisStyle, beginAtZero: true } },
        plugins: { ...chartDefaults.plugins, legend: { display: false } },
      },
    });
  }
}
