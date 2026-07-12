// public/js/maintenance.js

async function openMaintModal(record = null) {
  document.getElementById('maint-modal-title').textContent = record ? 'Edit Maintenance' : 'Log Maintenance';
  document.getElementById('m-id').value   = record?.id || '';
  document.getElementById('m-type').value = record?.type || '';
  document.getElementById('m-cost').value = record?.cost || '';
  document.getElementById('m-tech').value = record?.technician || '';
  document.getElementById('m-desc').value = record?.description || '';

  // Populate vehicle select
  const vRes = await apiFetch('/api/vehicles');
  const sel  = document.getElementById('m-vehicle');
  sel.innerHTML = `<option value="">Select vehicle</option>` +
    (vRes?.data || []).filter(v => v.status !== 'On Trip').map(v =>
      `<option value="${v.id}" ${record?.vehicle_id===v.id?'selected':''}>${v.registration_no} — ${v.name} [${v.status}]</option>`
    ).join('');

  openModal('maint-modal');
}

async function maintFormSubmit(e) {
  e.preventDefault();
  const id   = document.getElementById('m-id').value;
  const body = {
    vehicle_id:  document.getElementById('m-vehicle').value,
    type:        document.getElementById('m-type').value,
    description: document.getElementById('m-desc').value,
    cost:        document.getElementById('m-cost').value,
    technician:  document.getElementById('m-tech').value,
  };

  const data = await apiFetch(id ? `/api/maintenance/${id}` : '/api/maintenance', {
    method: id ? 'PUT' : 'POST', body: JSON.stringify(body),
  });

  if (data?.success) {
    toast(id ? 'Record updated.' : 'Maintenance logged. Vehicle set to In Shop.', 'success');
    closeModal('maint-modal');
    loadMaintenance();
  } else {
    toast(data?.message || 'Error saving record.', 'error');
  }
}

async function closeMaintRecord(id) {
  confirm('Close Maintenance', 'Mark this maintenance record as closed? Vehicle will be restored to Available.', async () => {
    const data = await apiFetch(`/api/maintenance/${id}/close`, {
      method: 'POST', body: JSON.stringify({ end_date: new Date().toISOString() }),
    });
    if (data?.success) { toast('Maintenance closed. Vehicle is now Available.', 'success'); loadMaintenance(); }
    else toast(data?.message || 'Error closing record.', 'error');
  });
}

async function loadMaintenance() {
  const el = document.getElementById('page-maintenance');
  el.innerHTML = `<div style="text-align:center;padding:48px"><div class="spinner"></div></div>`;

  const res = await apiFetch('/api/maintenance');
  if (!res?.success) { el.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><p>Failed to load records.</p></div>`; return; }

  const records = res.data;
  const active  = records.filter(r => r.status === 'Active');
  const closed  = records.filter(r => r.status === 'Closed');
  const totalCost = records.reduce((s, r) => s + (r.cost || 0), 0);

  el.innerHTML = `
    <div class="kpi-grid" style="grid-template-columns:repeat(auto-fill,minmax(160px,1fr))">
      <div class="kpi-card orange"><div class="kpi-icon">🔧</div><div class="kpi-value">${active.length}</div><div class="kpi-label">Active</div></div>
      <div class="kpi-card green"> <div class="kpi-icon">✅</div><div class="kpi-value">${closed.length}</div><div class="kpi-label">Closed</div></div>
      <div class="kpi-card red">   <div class="kpi-icon">💰</div><div class="kpi-value">KES ${fmt(totalCost)}</div><div class="kpi-label">Total Cost</div></div>
    </div>
    <div class="card">
      <div class="section-header">
        <div><div class="section-title">Maintenance Records</div><div class="section-sub">${records.length} records</div></div>
        <select class="filter-select" id="m-filter" onchange="filterMaintTable()">
          <option value="">All</option><option>Active</option><option>Closed</option>
        </select>
      </div>
      ${records.length === 0 ? `<div class="empty-state"><div class="empty-icon">🔧</div><p>No maintenance records.</p></div>` : `
      <div class="table-wrap">
        <table id="maint-table">
          <thead><tr>
            <th>Vehicle</th><th>Type</th><th>Description</th><th>Technician</th>
            <th>Cost</th><th>Start Date</th><th>End Date</th><th>Status</th><th>Actions</th>
          </tr></thead>
          <tbody>
            ${records.map(r => `
              <tr data-status="${r.status}">
                <td><strong>${r.registration_no}</strong><br><span style="font-size:11px;color:var(--text-muted)">${r.vehicle_name}</span></td>
                <td>${r.type}</td>
                <td style="max-width:200px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="${r.description}">${r.description}</td>
                <td>${r.technician || '—'}</td>
                <td>KES ${fmt(r.cost)}</td>
                <td>${fmtDate(r.start_date)}</td>
                <td>${r.end_date ? fmtDate(r.end_date) : '—'}</td>
                <td>${badge(r.status)}</td>
                <td>
                  ${r.status === 'Active' ? `
                    <button class="btn btn-success btn-sm" onclick="closeMaintRecord(${r.id})">✓ Close</button>
                    <button class="btn btn-ghost btn-sm" onclick='openMaintModal(${JSON.stringify(r)})'>✏️</button>
                  ` : `<span style="color:var(--text-muted);font-size:12px">Closed</span>`}
                </td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>`}
    </div>
  `;
}

function filterMaintTable() {
  const st = document.getElementById('m-filter')?.value || '';
  document.querySelectorAll('#maint-table tbody tr').forEach(tr => {
    tr.style.display = !st || tr.dataset.status === st ? '' : 'none';
  });
}
