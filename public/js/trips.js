// public/js/trips.js

async function openTripModal() {
  // Load available vehicles and drivers
  const [vRes, dRes] = await Promise.all([
    apiFetch('/api/vehicles/available'),
    apiFetch('/api/drivers/available'),
  ]);

  const vSel = document.getElementById('t-vehicle');
  const dSel = document.getElementById('t-driver');

  vSel.innerHTML = `<option value="">Select vehicle</option>` +
    (vRes?.data || []).map(v => `<option value="${v.id}" data-capacity="${v.max_load_capacity}">${v.registration_no} — ${v.name} (${fmt(v.max_load_capacity)} kg)</option>`).join('');
  dSel.innerHTML = `<option value="">Select driver</option>` +
    (dRes?.data || []).map(d => `<option value="${d.id}">${d.name} [${d.license_category}] — Score: ${d.safety_score}</option>`).join('');

  // Reset form
  ['t-source','t-dest','t-cargo','t-distance','t-revenue','t-notes'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });

  openModal('trip-modal');
}

async function tripFormSubmit(e) {
  e.preventDefault();
  const body = {
    vehicle_id:       document.getElementById('t-vehicle').value,
    driver_id:        document.getElementById('t-driver').value,
    source:           document.getElementById('t-source').value,
    destination:      document.getElementById('t-dest').value,
    cargo_weight:     document.getElementById('t-cargo').value,
    planned_distance: document.getElementById('t-distance').value,
    revenue:          document.getElementById('t-revenue').value,
    notes:            document.getElementById('t-notes').value,
  };

  const data = await apiFetch('/api/trips', { method: 'POST', body: JSON.stringify(body) });
  if (data?.success) {
    toast('Trip created in Draft state.', 'success');
    closeModal('trip-modal');
    loadTrips();
  } else {
    toast(data?.message || 'Error creating trip.', 'error');
  }
}

async function dispatchTrip(id) {
  confirm('Dispatch Trip', 'Dispatch this trip? Vehicle and driver will be set to "On Trip".', async () => {
    const data = await apiFetch(`/api/trips/${id}/dispatch`, { method: 'POST' });
    if (data?.success) { toast('Trip dispatched! 🚀', 'success'); loadTrips(); }
    else toast(data?.message || 'Dispatch failed.', 'error');
  });
}

function openCompleteModal(id) {
  document.getElementById('complete-trip-id').value = id;
  document.getElementById('complete-distance').value = '';
  openModal('complete-modal');
}

async function submitComplete() {
  const id   = document.getElementById('complete-trip-id').value;
  const dist = document.getElementById('complete-distance').value;
  const data = await apiFetch(`/api/trips/${id}/complete`, {
    method: 'POST', body: JSON.stringify({ actual_distance: dist }),
  });
  if (data?.success) {
    toast('Trip completed! Vehicle & driver restored to Available.', 'success');
    closeModal('complete-modal');
    loadTrips();
  } else {
    toast(data?.message || 'Error completing trip.', 'error');
  }
}

async function cancelTrip(id) {
  confirm('Cancel Trip', 'Cancel this trip? This action cannot be undone.', async () => {
    const data = await apiFetch(`/api/trips/${id}/cancel`, { method: 'POST' });
    if (data?.success) { toast('Trip cancelled.', 'info'); loadTrips(); }
    else toast(data?.message || 'Cancel failed.', 'error');
  });
}

async function loadTrips() {
  const el = document.getElementById('page-trips');
  el.innerHTML = `<div style="text-align:center;padding:48px"><div class="spinner"></div></div>`;

  const res = await apiFetch('/api/trips');
  if (!res?.success) { el.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><p>Failed to load trips.</p></div>`; return; }

  const trips = res.data;

  el.innerHTML = `
    <div class="kpi-grid" style="grid-template-columns:repeat(auto-fill,minmax(140px,1fr))">
      <div class="kpi-card blue">  <div class="kpi-icon">📋</div><div class="kpi-value">${trips.length}</div><div class="kpi-label">Total Trips</div></div>
      <div class="kpi-card cyan">  <div class="kpi-icon">📝</div><div class="kpi-value">${trips.filter(t=>t.status==='Draft').length}</div><div class="kpi-label">Draft</div></div>
      <div class="kpi-card blue">  <div class="kpi-icon">🚀</div><div class="kpi-value">${trips.filter(t=>t.status==='Dispatched').length}</div><div class="kpi-label">Dispatched</div></div>
      <div class="kpi-card green"> <div class="kpi-icon">✅</div><div class="kpi-value">${trips.filter(t=>t.status==='Completed').length}</div><div class="kpi-label">Completed</div></div>
      <div class="kpi-card red">   <div class="kpi-icon">❌</div><div class="kpi-value">${trips.filter(t=>t.status==='Cancelled').length}</div><div class="kpi-label">Cancelled</div></div>
    </div>
    <div class="card">
      <div class="section-header">
        <div><div class="section-title">Trip Register</div><div class="section-sub">${trips.length} trips</div></div>
        <div style="display:flex;gap:8px">
          <select class="filter-select" id="t-filter" onchange="filterTripTable()">
            <option value="">All Status</option>
            <option>Draft</option><option>Dispatched</option><option>Completed</option><option>Cancelled</option>
          </select>
        </div>
      </div>
      ${trips.length === 0 ? `<div class="empty-state"><div class="empty-icon">🗺️</div><p>No trips yet. Create your first trip.</p></div>` : `
      <div class="table-wrap">
        <table id="trips-table">
          <thead><tr>
            <th>#</th><th>Route</th><th>Vehicle</th><th>Driver</th>
            <th>Cargo</th><th>Distance</th><th>Revenue</th><th>Status</th><th>Actions</th>
          </tr></thead>
          <tbody>
            ${trips.map(t => `
              <tr data-status="${t.status}">
                <td><strong>#${t.id}</strong></td>
                <td>${t.source} → ${t.destination}</td>
                <td>${t.registration_no}<br><span style="font-size:11px;color:var(--text-muted)">${t.vehicle_name}</span></td>
                <td>${t.driver_name}</td>
                <td>${fmt(t.cargo_weight)} kg</td>
                <td>${t.actual_distance ? fmt(t.actual_distance) : fmt(t.planned_distance)} km</td>
                <td>KES ${fmt(t.revenue)}</td>
                <td>${badge(t.status)}</td>
                <td>
                  ${t.status === 'Draft' ? `
                    <button class="btn btn-primary btn-sm" onclick="dispatchTrip(${t.id})">🚀 Dispatch</button>
                    <button class="btn btn-ghost btn-sm" style="color:var(--accent-red)" onclick="cancelTrip(${t.id})">✕</button>
                  ` : t.status === 'Dispatched' ? `
                    <button class="btn btn-success btn-sm" onclick="openCompleteModal(${t.id})">✓ Complete</button>
                    <button class="btn btn-ghost btn-sm" style="color:var(--accent-red)" onclick="cancelTrip(${t.id})">✕ Cancel</button>
                  ` : `<span style="color:var(--text-muted);font-size:12px">—</span>`}
                </td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>`}
    </div>
  `;
}

function filterTripTable() {
  const st = document.getElementById('t-filter')?.value || '';
  document.querySelectorAll('#trips-table tbody tr').forEach(tr => {
    tr.style.display = !st || tr.dataset.status === st ? '' : 'none';
  });
}
