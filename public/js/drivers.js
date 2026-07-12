// public/js/drivers.js

function openDriverModal(driver = null) {
  document.getElementById('driver-modal-title').textContent = driver ? 'Edit Driver' : 'Add Driver';
  document.getElementById('d-id').value       = driver?.id || '';
  document.getElementById('d-name').value     = driver?.name || '';
  document.getElementById('d-license').value  = driver?.license_no || '';
  document.getElementById('d-category').value = driver?.license_category || '';
  document.getElementById('d-expiry').value   = driver?.license_expiry?.slice(0, 10) || '';
  document.getElementById('d-contact').value  = driver?.contact_no || '';
  document.getElementById('d-score').value    = driver?.safety_score ?? '';
  document.getElementById('d-status').value   = driver?.status || 'Available';
  openModal('driver-modal');
}

async function driverFormSubmit(e) {
  e.preventDefault();
  const id  = document.getElementById('d-id').value;
  const btn = document.getElementById('driver-submit-btn');
  btn.disabled = true; btn.textContent = 'Saving…';

  const body = {
    name:             document.getElementById('d-name').value,
    license_no:       document.getElementById('d-license').value,
    license_category: document.getElementById('d-category').value,
    license_expiry:   document.getElementById('d-expiry').value,
    contact_no:       document.getElementById('d-contact').value,
    safety_score:     document.getElementById('d-score').value,
    status:           document.getElementById('d-status').value,
  };

  const data = await apiFetch(id ? `/api/drivers/${id}` : '/api/drivers', {
    method: id ? 'PUT' : 'POST',
    body: JSON.stringify(body),
  });

  btn.disabled = false; btn.textContent = 'Save Driver';

  if (data?.success) {
    toast(id ? 'Driver updated.' : 'Driver created.', 'success');
    closeModal('driver-modal');
    loadDrivers();
  } else {
    toast(data?.message || 'Error saving driver.', 'error');
  }
}

async function deleteDriver(id, name) {
  confirm('Delete Driver', `Remove "${name}" from the system?`, async () => {
    const data = await apiFetch(`/api/drivers/${id}`, { method: 'DELETE' });
    if (data?.success) { toast('Driver deleted.', 'success'); loadDrivers(); }
    else toast(data?.message || 'Cannot delete driver.', 'error');
  });
}

async function loadDrivers() {
  const el = document.getElementById('page-drivers');
  el.innerHTML = `<div style="text-align:center;padding:48px"><div class="spinner"></div></div>`;

  const dRes = await apiFetch('/api/drivers');
  if (!dRes?.success) { el.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><p>Failed to load drivers.</p></div>`; return; }

  const drivers  = dRes.data;
  const today    = new Date().toISOString().slice(0, 10);
  const expired  = drivers.filter(d => d.license_expiry < today).length;
  const suspended = drivers.filter(d => d.status === 'Suspended').length;

  el.innerHTML = `
    ${expired > 0 ? `<div class="alert alert-warning">⚠️ <strong>${expired}</strong> driver(s) have expired licenses and cannot be dispatched.</div>` : ''}
    ${suspended > 0 ? `<div class="alert alert-danger">🚫 <strong>${suspended}</strong> driver(s) are suspended.</div>` : ''}
    <div class="kpi-grid" style="grid-template-columns:repeat(auto-fill,minmax(140px,1fr))">
      <div class="kpi-card blue">  <div class="kpi-icon">👤</div><div class="kpi-value">${drivers.length}</div><div class="kpi-label">Total</div></div>
      <div class="kpi-card green"> <div class="kpi-icon">✅</div><div class="kpi-value">${drivers.filter(d=>d.status==='Available').length}</div><div class="kpi-label">Available</div></div>
      <div class="kpi-card blue">  <div class="kpi-icon">🗺️</div><div class="kpi-value">${drivers.filter(d=>d.status==='On Trip').length}</div><div class="kpi-label">On Trip</div></div>
      <div class="kpi-card purple"><div class="kpi-icon">💤</div><div class="kpi-value">${drivers.filter(d=>d.status==='Off Duty').length}</div><div class="kpi-label">Off Duty</div></div>
      <div class="kpi-card red">   <div class="kpi-icon">🚫</div><div class="kpi-value">${suspended}</div><div class="kpi-label">Suspended</div></div>
      <div class="kpi-card orange"><div class="kpi-icon">⚠️</div><div class="kpi-value">${expired}</div><div class="kpi-label">Expired Lic.</div></div>
    </div>
    <div class="card">
      <div class="section-header">
        <div><div class="section-title">Driver Roster</div><div class="section-sub">${drivers.length} drivers</div></div>
        <div style="display:flex;gap:8px">
          <input class="search-input" placeholder="Search…" id="d-search" oninput="filterDriverTable()" />
          <select class="filter-select" id="d-filter-status" onchange="filterDriverTable()">
            <option value="">All Status</option>
            <option>Available</option><option>On Trip</option><option>Off Duty</option><option>Suspended</option>
          </select>
        </div>
      </div>
      ${drivers.length === 0 ? `<div class="empty-state"><div class="empty-icon">👤</div><p>No drivers yet.</p></div>` : `
      <div class="table-wrap">
        <table id="drivers-table">
          <thead><tr>
            <th>Name</th><th>License No</th><th>Category</th><th>Expiry</th>
            <th>Contact</th><th>Safety Score</th><th>Status</th><th>Actions</th>
          </tr></thead>
          <tbody>
            ${drivers.map(d => {
              const exp = d.license_expiry < today;
              return `
              <tr data-status="${d.status}" data-search="${(d.name+d.license_no+(d.contact_no||'')).toLowerCase()}">
                <td><strong>${d.name}</strong></td>
                <td>${d.license_no}${exp ? ` <span class="badge badge-expired">EXPIRED</span>` : ''}</td>
                <td>${d.license_category}</td>
                <td style="${exp ? 'color:var(--accent-red)' : ''}">${fmtDate(d.license_expiry)}</td>
                <td>${d.contact_no}</td>
                <td>
                  <div style="display:flex;align-items:center;gap:6px">
                    <div style="height:4px;width:60px;background:var(--bg-panel);border-radius:2px;overflow:hidden">
                      <div style="height:100%;width:${d.safety_score}%;background:${d.safety_score>=80?'var(--accent-green)':d.safety_score>=60?'var(--accent-orange)':'var(--accent-red)'}"></div>
                    </div>
                    <span style="font-size:12px;color:var(--text-secondary)">${d.safety_score}</span>
                  </div>
                </td>
                <td>${badge(d.status)}</td>
                <td>
                  <button class="btn btn-ghost btn-sm" onclick='openDriverModal(${JSON.stringify(d)})'>✏️ Edit</button>
                  <button class="btn btn-ghost btn-sm" style="color:var(--accent-red)" onclick="deleteDriver(${d.id},'${d.name.replace(/'/g,"\\'")}')">🗑️</button>
                </td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>`}
    </div>
  `;
}

function filterDriverTable() {
  const q  = document.getElementById('d-search')?.value.toLowerCase() || '';
  const st = document.getElementById('d-filter-status')?.value || '';
  document.querySelectorAll('#drivers-table tbody tr').forEach(tr => {
    const show = (!q || tr.dataset.search.includes(q)) && (!st || tr.dataset.status === st);
    tr.style.display = show ? '' : 'none';
  });
}
