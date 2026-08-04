const token = localStorage.getItem('rtc_admin_token');
if (!token) window.location.href = 'admin-login.html';

const admin = JSON.parse(localStorage.getItem('rtc_admin') || '{}');
document.getElementById('adminName').textContent = admin.name || admin.email || 'Admin';

// ---------- Nav ----------
const views = document.querySelectorAll('[data-panel]');
const navButtons = document.querySelectorAll('.side-nav button');
const viewTitle = document.getElementById('viewTitle');

function showView(name) {
  views.forEach(v => v.hidden = v.dataset.panel !== name);
  navButtons.forEach(b => b.classList.toggle('active', b.dataset.view === name));
  const titles = { overview: 'Overview', schools: 'Schools & map', payments: 'All payments', complaints: 'Complaints' };
  viewTitle.textContent = titles[name] || 'Admin';
  if (name === 'schools') loadSchools();
  if (name === 'payments') loadPayments();
  if (name === 'complaints') loadComplaints();
  if (name === 'overview') setTimeout(() => map && map.invalidateSize(), 50);
}
navButtons.forEach(btn => btn.addEventListener('click', () => {
  showView(btn.dataset.view);
  closeMobileSidebar();
}));

// ---------- Mobile sidebar toggle ----------
const sidebar = document.getElementById('sidebar');
const sidebarBackdrop = document.getElementById('sidebarBackdrop');
const menuToggle = document.getElementById('menuToggle');

function openMobileSidebar() {
  sidebar.classList.add('open');
  sidebarBackdrop.classList.add('show');
  menuToggle.classList.add('open');
}
function closeMobileSidebar() {
  sidebar.classList.remove('open');
  sidebarBackdrop.classList.remove('show');
  menuToggle.classList.remove('open');
}
menuToggle.addEventListener('click', () => {
  sidebar.classList.contains('open') ? closeMobileSidebar() : openMobileSidebar();
});
sidebarBackdrop.addEventListener('click', closeMobileSidebar);

document.getElementById('logoutBtn').addEventListener('click', () => {
  localStorage.removeItem('rtc_admin_token');
  localStorage.removeItem('rtc_admin');
  window.location.href = 'admin-login.html';
});

// ---------- Map ----------
let map, markersLayer;
function initMap() {
  map = L.map('schoolsMap').setView([9.082, 8.6753], 6); // centered on Nigeria
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19
  }).addTo(map);
  markersLayer = L.layerGroup().addTo(map);
}

function plotSchools(schools) {
  if (!map) return;
  markersLayer.clearLayers();
  const located = schools.filter(s => s.location && s.location.lat && s.location.lng);
  located.forEach(s => {
    const marker = L.marker([s.location.lat, s.location.lng]).addTo(markersLayer);
    marker.bindPopup(`
      <strong>${escapeHtml(s.schoolName)}</strong><br>
      ${escapeHtml(s.address)}<br>
      Students: ${s.totalStudents} · Revenue: ${formatNaira(s.totalRevenue)}<br>
      <a href="https://www.google.com/maps?q=${s.location.lat},${s.location.lng}" target="_blank" rel="noopener">Open in Google Maps →</a>
    `);
  });
  if (located.length) {
    map.fitBounds(located.map(s => [s.location.lat, s.location.lng]), { padding: [30, 30], maxZoom: 12 });
  }
}

// ---------- Overview ----------
async function loadOverview() {
  try {
    const data = await apiRequest('/admin/overview', { token });
    document.getElementById('statSchools').textContent = data.totalSchools;
    document.getElementById('statStudents').textContent = data.totalStudents;
    document.getElementById('statRevenue').textContent = formatNaira(data.totalRevenue);
    document.getElementById('statComplaints').textContent = data.totalComplaintsOpen;

    const schoolsData = await apiRequest('/admin/schools', { token });
    allSchools = schoolsData.schools;
    plotSchools(allSchools);
  } catch (err) {
    console.error(err);
  }
}

// ---------- Schools ----------
let allSchools = [];
function renderSchoolRows(schools, container) {
  if (!schools.length) {
    container.innerHTML = `<div class="empty-state"><h3>No schools yet</h3></div>`;
    return;
  }
  container.innerHTML = `
    <table>
      <thead><tr><th>School</th><th>Contact</th><th>Students</th><th>Revenue</th><th>Location</th><th>Status</th><th>Actions</th></tr></thead>
      <tbody>
        ${schools.map(s => `
          <tr>
            <td>${escapeHtml(s.schoolName)}<br><span style="color:var(--ink-dim);font-size:12px;">${escapeHtml(s.email)}</span></td>
            <td>${escapeHtml(s.contactName)}<br><span style="color:var(--ink-dim);font-size:12px;">${escapeHtml(s.phone)}</span></td>
            <td>${s.totalStudents}</td>
            <td>${formatNaira(s.totalRevenue)}</td>
            <td>${s.location?.lat ? `<a href="https://www.google.com/maps?q=${s.location.lat},${s.location.lng}" target="_blank" rel="noopener">View →</a>` : '—'}</td>
            <td><span class="badge badge-${s.status}">${s.status}</span></td>
            <td class="actions">
              ${s.status !== 'approved' ? `<button class="icon-btn" onclick="setSchoolStatus('${s._id}','approved')">Approve</button>` : ''}
              ${s.status !== 'suspended' ? `<button class="icon-btn danger" onclick="setSchoolStatus('${s._id}','suspended')">Suspend</button>` : `<button class="icon-btn" onclick="setSchoolStatus('${s._id}','approved')">Reinstate</button>`}
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>`;
}

async function loadSchools() {
  const wrap = document.getElementById('schoolsTableWrap');
  wrap.innerHTML = '<div class="empty-state">Loading schools...</div>';
  try {
    const data = await apiRequest('/admin/schools', { token });
    allSchools = data.schools;
    renderSchoolRows(allSchools, wrap);
  } catch (err) {
    wrap.innerHTML = `<div class="empty-state">${err.message}</div>`;
  }
}

async function setSchoolStatus(id, status) {
  try {
    await apiRequest(`/admin/schools/${id}/status`, { method: 'PATCH', token, body: { status } });
    loadSchools();
    loadOverview();
  } catch (err) {
    alert(err.message);
  }
}

// ---------- Payments ----------
async function loadPayments() {
  const wrap = document.getElementById('paymentsTableWrap');
  wrap.innerHTML = '<div class="empty-state">Loading payments...</div>';
  try {
    const data = await apiRequest('/admin/payments', { token });
    if (!data.payments.length) {
      wrap.innerHTML = `<div class="empty-state"><h3>No payments yet</h3></div>`;
      return;
    }
    wrap.innerHTML = `
      <table>
        <thead><tr><th>School</th><th>Reference</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
        <tbody>
          ${data.payments.map(p => `
            <tr>
              <td>${escapeHtml(p.school?.schoolName || 'Unknown')}</td>
              <td class="mono">${p.reference}</td>
              <td>${formatNaira(p.amount)}</td>
              <td><span class="badge badge-${p.status}">${p.status}</span></td>
              <td>${formatDate(p.paidAt || p.createdAt)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>`;
  } catch (err) {
    wrap.innerHTML = `<div class="empty-state">${err.message}</div>`;
  }
}

// ---------- Complaints ----------
let allComplaints = [];
async function loadComplaints() {
  const wrap = document.getElementById('complaintsTableWrap');
  wrap.innerHTML = '<div class="empty-state">Loading complaints...</div>';
  try {
    const data = await apiRequest('/admin/complaints', { token });
    allComplaints = data.complaints;
    if (!allComplaints.length) {
      wrap.innerHTML = `<div class="empty-state"><h3>No complaints filed</h3></div>`;
      return;
    }
    wrap.innerHTML = `
      <table>
        <thead><tr><th>School</th><th>Subject</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
        <tbody>
          ${allComplaints.map(c => `
            <tr>
              <td>${escapeHtml(c.school?.schoolName || 'Unknown')}</td>
              <td>${escapeHtml(c.subject)}</td>
              <td><span class="badge badge-${c.status}">${c.status.replace('_',' ')}</span></td>
              <td>${formatDate(c.createdAt)}</td>
              <td class="actions"><button class="icon-btn" onclick="openReply('${c._id}')">Respond</button></td>
            </tr>
          `).join('')}
        </tbody>
      </table>`;
  } catch (err) {
    wrap.innerHTML = `<div class="empty-state">${err.message}</div>`;
  }
}

const replyModalBackdrop = document.getElementById('replyModalBackdrop');
function openReply(id) {
  const c = allComplaints.find(x => x._id === id);
  if (!c) return;
  document.getElementById('replyComplaintId').value = id;
  document.getElementById('replyStatus').value = c.status;
  document.getElementById('replyMessage').value = c.adminReply || '';
  replyModalBackdrop.classList.add('show');
}
document.getElementById('cancelReply').addEventListener('click', () => replyModalBackdrop.classList.remove('show'));

document.getElementById('replyForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    const id = document.getElementById('replyComplaintId').value;
    await apiRequest(`/admin/complaints/${id}`, {
      method: 'PATCH',
      token,
      body: {
        status: document.getElementById('replyStatus').value,
        adminReply: document.getElementById('replyMessage').value.trim()
      }
    });
    replyModalBackdrop.classList.remove('show');
    loadComplaints();
    loadOverview();
  } catch (err) {
    alert(err.message);
  }
});

// ---------- Utils ----------
function escapeHtml(str) {
  return String(str || '').replace(/[&<>"']/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[m]));
}

// ---------- Init ----------
initMap();
loadOverview();
