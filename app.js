// ── helpers ──────────────────────────────────────────────
const todayStr = () => new Date().toISOString().slice(0, 10);
const nowTime  = () => new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

function loadData() {
  return JSON.parse(localStorage.getItem('stark_attendance') || '{}');
}
function saveData(data) {
  localStorage.setItem('stark_attendance', JSON.stringify(data));
}

function showMsg(text, type) {
  const el = document.getElementById('msg');
  el.textContent = text;
  el.className = 'msg ' + type;
  setTimeout(() => { el.textContent = ''; el.className = 'msg'; }, 4000);
}

// ── punch in / out ────────────────────────────────────────
function punch(action) {
  const id   = document.getElementById('empId').value.trim().toUpperCase();
  const name = document.getElementById('empName').value.trim();

  if (!id || !name) { showMsg('Please enter both Employee ID and Name.', 'error'); return; }

  const date = todayStr();
  const data = loadData();

  if (!data[date]) data[date] = {};

  const record = data[date][id] || { id, name, clockIn: null, clockOut: null };

  if (action === 'in') {
    if (record.clockIn) { showMsg(`${name} already clocked in at ${record.clockIn}.`, 'error'); return; }
    record.clockIn = nowTime();
    record.name    = name;
    showMsg(`✅ ${name} clocked IN at ${record.clockIn}`, 'success');
  } else {
    if (!record.clockIn) { showMsg(`${name} hasn't clocked in yet.`, 'error'); return; }
    if (record.clockOut) { showMsg(`${name} already clocked out at ${record.clockOut}.`, 'error'); return; }
    record.clockOut = nowTime();
    showMsg(`👋 ${name} clocked OUT at ${record.clockOut}`, 'success');
  }

  data[date][id] = record;
  saveData(data);
  renderTable();
}

// ── calculate hours ───────────────────────────────────────
function calcHours(inTime, outTime) {
  if (!inTime || !outTime) return '—';
  const parse = t => { const [h, m, s] = t.split(':'); return +h * 3600 + +m * 60 + +s; };
  const diff  = parse(outTime) - parse(inTime);
  if (diff <= 0) return '—';
  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  return `${h}h ${m}m`;
}

// ── render table ──────────────────────────────────────────
function renderTable() {
  const date    = document.getElementById('filterDate').value || todayStr();
  document.getElementById('filterDate').value = date;
  document.getElementById('displayDate').textContent = new Date(date + 'T00:00:00').toDateString();

  const data    = loadData();
  const records = data[date] ? Object.values(data[date]) : [];
  const tbody   = document.getElementById('logBody');
  const noData  = document.getElementById('noData');

  tbody.innerHTML = '';

  if (records.length === 0) {
    noData.classList.remove('hidden');
    return;
  }
  noData.classList.add('hidden');

  records.forEach((r, i) => {
    const hours = calcHours(r.clockIn, r.clockOut);
    let badge;
    if (r.clockIn && r.clockOut) badge = '<span class="badge present">Present</span>';
    else if (r.clockIn)          badge = '<span class="badge in-only">In Only</span>';
    else                         badge = '<span class="badge partial">Partial</span>';

    tbody.innerHTML += `
      <tr>
        <td>${i + 1}</td>
        <td>${r.id}</td>
        <td>${r.name}</td>
        <td>${r.clockIn  || '—'}</td>
        <td>${r.clockOut || '—'}</td>
        <td>${hours}</td>
        <td>${badge}</td>
      </tr>`;
  });
}

// ── clear day ─────────────────────────────────────────────
function clearDay() {
  const date = document.getElementById('filterDate').value || todayStr();
  if (!confirm(`Delete ALL records for ${date}?`)) return;
  const data = loadData();
  delete data[date];
  saveData(data);
  renderTable();
}

// ── export CSV ────────────────────────────────────────────
function exportCSV() {
  const date    = document.getElementById('filterDate').value || todayStr();
  const data    = loadData();
  const records = data[date] ? Object.values(data[date]) : [];

  if (records.length === 0) { alert('No data to export for this date.'); return; }

  let csv = 'Employee ID,Name,Clock In,Clock Out,Hours\n';
  records.forEach(r => {
    csv += `${r.id},${r.name},${r.clockIn || ''},${r.clockOut || ''},${calcHours(r.clockIn, r.clockOut)}\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv' });
  const a    = document.createElement('a');
  a.href     = URL.createObjectURL(blob);
  a.download = `attendance_${date}.csv`;
  a.click();
}

// ── init ──────────────────────────────────────────────────
document.getElementById('filterDate').value = todayStr();
renderTable();
