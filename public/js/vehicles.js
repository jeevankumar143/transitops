// public/js/vehicles.js

function openVehicleModal(vehicle = null) {
  document.getElementById('vehicle-modal-title').textContent = vehicle ? 'Edit Vehicle' : 'Add Vehicle';
  document.getElementById('v-id').value       = vehicle?.id || '';
  document.getElementById('v-reg').value      = vehicle?.registration_no || '';
  document.getElementById('v-name').value     = vehicle?.name || '';
  document.getElementById('v-model').value    = vehicle?.model || '';
  document.getElementById('v-type').value     = vehicle?.type || '';
  document.getElementById('v-capacity').value = vehicle?.max_load_capacity || '';
  document.getElementById('v-odometer').value = vehicle?.odometer || '';
  document.getElementById('v-cost').value     = vehicle?.acquisition_cost || '';
  document.getElementById('v-status').value   = vehicle?.status || 'Available';
  document.getElementById('v-region').value   = vehicle?.region || '';
  openModal('vehicle-modal');
}

async function vehicleFormSubmit(e) {
  e.preventDefault();
  const id  = document.getElementById('v-id').value;
  const btn = document.getElementById('vehicle-submit-btn');
  btn.disabled = true; btn.textContent = 'Saving…';

  const body = {
    registration_no:   document.getElementById('v-reg').value,
    name:              document.getElementById('v-name').value,
    model:             document.getElementById('v-model').value,
    type:              document.getElementById('v-type').value,
    max_load_capacity: document.getElementById('v-capacity').value,
    odometer:          document.getElementById('v-odometer').value,
    acquisition_cost:  document.getElementById('v-cost').value,
    status:            document.getElementById('v-status').value,
    region:            document.getElementById('v-region').value,
  };

  const data = await apiFetch(id ? `/api/vehicles/${id}` : '/api/vehicles', {
    method: id ? 'PUT' : 'POST',
    body: JSON.stringify(body),
  });

  btn.disabled = false; btn.textContent = 'Save Vehicle';

  if (data?.success) {
    toast(id ? 'Vehicle updated.' : 'Vehicle created.', 'success');
    closeModal('vehicle-modal');
    loadVehicles();
  } else {
    toast(data?.message || 'Error saving vehicle.', 'error');
  }
}

async function deleteVehicle(id, name) {
  confirm('Delete Vehicle', `Remove "${name}" from the registry? This cannot be undone.`, async () => {
    const data = await apiFetch(`/api/vehicles/${id}`, { method: 'DELETE' });
    if (data?.success) {
      toast('Vehicle deleted.', 'success');
      loadVehicles();
    } else {
      toast(data?.message || 'Cannot delete vehicle.', 'error');
    }
  });
}

async function loadVehicles() {
  const el = document.getElementById('page-vehicles');
  el.innerHTML = `<div style="text-align:center;padding:48px"><div class="spinner"></div></div>`;

  const [vRes] = await Promise.all([apiFetch('/api/vehicles')]);
  if (!vRes?.success) { el.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><p>Failed to load vehicles.</p></div>`; return; }

  const vehicles = vRes.data;
  const total    = vehicles.length;
  const byStatus = s => vehicles.filter(v => v.status === s).length;

  el.innerHTML = `
    <div class="kpi-grid" style="grid-template-columns:repeat(auto-fill,minmax(140px,1fr))">
      <div class="kpi-card blue">  <div class="kpi-icon">🚛</div><div class="kpi-value">${total}</div><div class="kpi-label">Total</div></div>
      <div class="kpi-card green"> <div class="kpi-icon">✅</div><div class="kpi-value">${byStatus('Available')}</div><div class="kpi-label">Available</div></div>
      <div class="kpi-card blue">  <div class="kpi-icon">🗺️</div><div class="kpi-value">${byStatus('On Trip')}</div><div class="kpi-label">On Trip</div></div>
      <div class="kpi-card orange"><div class="kpi-icon">🔧</div><div class="kpi-value">${byStatus('In Shop')}</div><div class="kpi-label">In Shop</div></div>
      <div class="kpi-card red">   <div class="kpi-icon">🚫</div><div class="kpi-value">${byStatus('Retired')}</div><div class="kpi-label">Retired</div></div>
    </div>
    <div class="card">
      <div class="section-header">
        <div>
          <div class="section-title">Vehicle Registry</div>
          <div class="section-sub">${total} vehicles</div>
        </div>
        <div style="display:flex;gap:8px;align-items:center">
          <input class="search-input" placeholder="Search…" id="v-search" oninput="filterVehicleTable()" />
          <select class="filter-select" id="v-filter-status" onchange="filterVehicleTable()">
            <option value="">All Status</option>
            <option>Available</option><option>On Trip</option><option>In Shop</option><option>Retired</option>
          </select>
          <select class="filter-select" id="v-filter-type" onchange="filterVehicleTable()">
            <option value="">All Types</option>
            <option>Truck</option><option>Van</option><option>Bus</option><option>Pickup</option><option>Tanker</option><option>Other</option>
          </select>
        </div>
      </div>
      ${vehicles.length === 0 ? `<div class="empty-state"><div class="empty-icon">🚛</div><p>No vehicles yet. Add your first vehicle.</p></div>` : `
      <div class="table-wrap">
        <table id="vehicles-table">
          <thead><tr>
            <th>Registration</th><th>Name / Model</th><th>Type</th>
            <th>Capacity</th><th>Odometer</th><th>Acq. Cost</th>
            <th>Region</th><th>Status</th><th>Actions</th>
          </tr></thead>
          <tbody>
            ${vehicles.map(v => `
              <tr data-status="${v.status}" data-type="${v.type}" data-search="${(v.registration_no + v.name + v.model + (v.region||'')).toLowerCase()}">
                <td><strong>${v.registration_no}</strong></td>
                <td>${v.name}<br><span style="font-size:11px;color:var(--text-muted)">${v.model}</span></td>
                <td>${v.type}</td>
                <td>${fmt(v.max_load_capacity)} kg</td>
                <td>${fmt(v.odometer)} km</td>
                <td>KES ${fmt(v.acquisition_cost)}</td>
                <td>${v.region || '—'}</td>
                <td>${badge(v.status)}</td>
                <td>
                  <button class="btn btn-ghost btn-sm" onclick='openVehicleModal(${JSON.stringify(v)})'>✏️ Edit</button>
                  <button class="btn btn-ghost btn-sm" style="color:var(--accent-red)" onclick="deleteVehicle(${v.id},'${v.name.replace(/'/g,"\\'")}')">🗑️</button>
                </td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>`}
    </div>
  `;
}

function filterVehicleTable() {
  const q  = document.getElementById('v-search')?.value.toLowerCase() || '';
  const st = document.getElementById('v-filter-status')?.value || '';
  const tp = document.getElementById('v-filter-type')?.value || '';
  document.querySelectorAll('#vehicles-table tbody tr').forEach(tr => {
    const show = (!q || tr.dataset.search.includes(q))
              && (!st || tr.dataset.status === st)
              && (!tp || tr.dataset.type === tp);
    tr.style.display = show ? '' : 'none';
  });
}
