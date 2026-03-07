const BRANCHES = ['grammar', 'reading', 'vocab'];
let supabaseClient = null;
let pendingImport = null;
let allQuestions = [];

function qs(id) {
  return document.getElementById(id);
}

function isValidBranch(branch) {
  return BRANCHES.includes(branch);
}

function generateId(branch) {
  const random = Math.random().toString(36).slice(2, 8);
  return `${branch}_${Date.now()}_${random}`;
}

function normalizeOptions(options) {
  if (!Array.isArray(options)) return [];
  return options.map((o) => String(o || '').trim()).filter(Boolean);
}

function validateQuestionRecord(raw, mode = 'auto', forcedBranch = null) {
  const branch = mode === 'force' ? forcedBranch : raw.branch;
  if (!isValidBranch(branch)) return { valid: false, error: 'Invalid branch' };

  const question = String(raw.question || '').trim();
  const options = normalizeOptions(raw.options);
  const correctAnswer = String(raw.correctAnswer || '').trim();
  const type = String(raw.type || 'multiple_choice').trim();

  if (!question) return { valid: false, error: 'question is required' };
  if (options.length < 2) return { valid: false, error: 'options must contain at least 2 items' };
  if (!correctAnswer || !options.includes(correctAnswer)) return { valid: false, error: 'correctAnswer must match one option' };

  const record = {
    id: String(raw.id || '').trim() || generateId(branch),
    branch,
    type,
    question,
    options,
    correctAnswer,
    explanationWhy: String(raw.explanationWhy || '').trim(),
    explanationPattern: String(raw.explanationPattern || '').trim(),
    difficulty: String(raw.difficulty || '').trim(),
    topic: String(raw.topic || '').trim(),
    tags: Array.isArray(raw.tags) ? raw.tags.map((t) => String(t)) : [],
    source: String(raw.source || 'admin-import').trim(),
    createdAt: String(raw.createdAt || new Date().toISOString())
  };

  return { valid: true, record };
}

function splitRecordsByBranch(records) {
  return records.reduce((acc, r) => {
    if (!acc[r.branch]) acc[r.branch] = [];
    acc[r.branch].push(r);
    return acc;
  }, { grammar: [], reading: [], vocab: [] });
}

function isDuplicateCandidate(record, existingList) {
  const keyQ = record.question.trim().toLowerCase();
  return existingList.some(
    (q) => String(q.branch || '') === record.branch
      && String(q.question || '').trim().toLowerCase() === keyQ
  );
}

function escapeHtml(v) {
  return String(v)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

async function apiGet(url) {
  const res = await fetch(url);
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'API error');
  return json;
}

async function apiPost(url, payload) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'API error');
  return json;
}

async function apiDelete(url) {
  const res = await fetch(url, { method: 'DELETE' });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'API error');
  return json;
}

async function loadQuestions(filterBranch = 'all') {
  const data = await apiGet('/api/questions');
  allQuestions = Array.isArray(data.questions) ? data.questions : [];
  renderCounts();
  renderQuestionTable(filterBranch);
}

function renderCounts() {
  const counts = { grammar: 0, reading: 0, vocab: 0 };
  for (const q of allQuestions) {
    if (isValidBranch(q.branch)) counts[q.branch] += 1;
  }
  qs('branch-counts').textContent = `grammar: ${counts.grammar} | reading: ${counts.reading} | vocab: ${counts.vocab}`;
}

function renderQuestionTable(filterBranch = 'all') {
  const tbody = qs('questions-table').querySelector('tbody');
  const filtered = allQuestions
    .filter((q) => (filterBranch === 'all' ? true : q.branch === filterBranch))
    .sort((a, b) => String(a.id).localeCompare(String(b.id)));

  tbody.innerHTML = filtered.length
    ? filtered.map((q) => `
      <tr>
        <td>${escapeHtml(q.id)}</td>
        <td>${escapeHtml(q.branch)}</td>
        <td>${escapeHtml(q.question)}</td>
        <td>${escapeHtml(q.correctAnswer)}</td>
        <td>
          <div class="row-actions">
            <button class="delete" data-branch="${escapeHtml(q.branch)}" data-id="${escapeHtml(q.id)}">Usuń</button>
          </div>
        </td>
      </tr>
    `).join('')
    : '<tr><td colspan="5">Brak pytań.</td></tr>';
}

function resetManualForm() {
  qs('manual-form').reset();
  qs('manual-type').value = 'multiple_choice';
  qs('manual-source').value = 'admin';
}

async function handleManualSubmit(event) {
  event.preventDefault();
  const msg = qs('manual-msg');
  msg.textContent = '';

  const branch = qs('manual-branch').value;
  const options = [qs('opt-1').value, qs('opt-2').value, qs('opt-3').value, qs('opt-4').value]
    .map((v) => v.trim())
    .filter(Boolean);

  const raw = {
    branch,
    type: qs('manual-type').value,
    question: qs('manual-question').value,
    options,
    correctAnswer: qs('manual-correct').value,
    explanationWhy: qs('manual-why').value,
    explanationPattern: qs('manual-pattern').value,
    difficulty: qs('manual-difficulty').value,
    topic: qs('manual-topic').value,
    source: qs('manual-source').value || 'admin'
  };

  const validated = validateQuestionRecord(raw, 'force', branch);
  if (!validated.valid) {
    msg.textContent = `Błąd: ${validated.error}`;
    msg.style.color = '#fca5a5';
    return;
  }

  try {
    await apiPost('/api/questions', validated.record);
    msg.textContent = 'Sukces: pytanie dodane.';
    msg.style.color = '#6ee7b7';
    resetManualForm();
    await loadQuestions(qs('list-branch-filter').value);
  } catch (err) {
    msg.textContent = `Błąd zapisu: ${err.message}`;
    msg.style.color = '#fca5a5';
  }
}

function parseImportJson() {
  const raw = qs('import-json').value.trim();
  if (!raw) throw new Error('Wklej JSON.');
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) throw new Error('Root JSON musi być tablicą.');
  return parsed;
}

function buildPreviewAndPending(records, mode, targetBranch) {
  const validRecords = [];
  const rejected = [];
  let duplicates = 0;

  for (let i = 0; i < records.length; i++) {
    const v = validateQuestionRecord(records[i], mode, targetBranch);
    if (!v.valid) {
      rejected.push({ index: i, error: v.error });
      continue;
    }

    if (isDuplicateCandidate(v.record, allQuestions) || isDuplicateCandidate(v.record, validRecords)) {
      duplicates += 1;
      continue;
    }

    validRecords.push({ ...v.record, source: 'admin-import', createdAt: new Date().toISOString() });
  }

  const grouped = splitRecordsByBranch(validRecords);
  return {
    records: validRecords,
    grouped,
    rejected,
    duplicates,
    summary: {
      grammar: grouped.grammar.length,
      reading: grouped.reading.length,
      vocab: grouped.vocab.length
    }
  };
}

function renderImportPreview(pending) {
  qs('import-preview').textContent = [
    'Preview:',
    `grammar: ${pending.summary.grammar}`,
    `reading: ${pending.summary.reading}`,
    `vocab: ${pending.summary.vocab}`,
    `duplicates skipped: ${pending.duplicates}`,
    `rejected: ${pending.rejected.length}`,
    pending.rejected.length ? `errors: ${JSON.stringify(pending.rejected, null, 2)}` : ''
  ].join('\n');
}

function renderImportReport(report) {
  qs('import-report').textContent = [
    'Raport importu:',
    `zaimportowano grammar: ${report.imported.grammar || 0}`,
    `zaimportowano reading: ${report.imported.reading || 0}`,
    `zaimportowano vocab: ${report.imported.vocab || 0}`,
    `duplikaty pominięte: ${report.duplicates || 0}`,
    `odrzucone: ${(report.rejected || []).length}`,
    (report.rejected || []).length ? JSON.stringify(report.rejected, null, 2) : ''
  ].join('\n');
}

function setupImportModeToggle() {
  const mode = qs('import-mode');
  const target = qs('import-target');
  mode.addEventListener('change', () => {
    target.disabled = mode.value !== 'force';
  });
}

async function handleValidateJson() {
  qs('import-report').textContent = '';
  qs('import-json-btn').disabled = true;

  try {
    const records = parseImportJson();
    const mode = qs('import-mode').value;
    const target = qs('import-target').value;
    const pending = buildPreviewAndPending(records, mode, target);
    pendingImport = { ...pending, mode, targetBranch: target };
    renderImportPreview(pendingImport);
    qs('import-json-btn').disabled = pendingImport.records.length === 0;
  } catch (err) {
    qs('import-preview').textContent = `Błąd walidacji: ${err.message}`;
    pendingImport = null;
  }
}

async function handleImportJson() {
  if (!pendingImport || !pendingImport.records.length) return;

  try {
    const payload = {
      mode: pendingImport.mode === 'force' ? 'force' : 'auto',
      targetBranch: pendingImport.targetBranch,
      records: pendingImport.records
    };
    const result = await apiPost('/api/questions/import', payload);
    renderImportReport(result.report || {});
    await loadQuestions(qs('list-branch-filter').value);
    qs('import-json-btn').disabled = true;
    pendingImport = null;
  } catch (err) {
    qs('import-report').textContent = `Błąd importu: ${err.message}`;
  }
}

function setupListInteractions() {
  qs('list-branch-filter').addEventListener('change', (e) => renderQuestionTable(e.target.value));

  qs('questions-table').addEventListener('click', async (event) => {
    const btn = event.target.closest('button.delete');
    if (!btn) return;
    const branch = btn.getAttribute('data-branch');
    const id = btn.getAttribute('data-id');
    if (!branch || !id) return;

    try {
      await apiDelete(`/api/questions/${encodeURIComponent(branch)}/${encodeURIComponent(id)}`);
      await loadQuestions(qs('list-branch-filter').value);
    } catch (err) {
      alert(`Nie udało się usunąć: ${err.message}`);
    }
  });
}

function logout() {
  if (!supabaseClient) return;
  supabaseClient.auth.signOut().finally(() => {
    window.location.href = '../';
  });
}

function toggleDropdown(event, menuId) {
  event.stopPropagation();
  const menu = document.getElementById(menuId);
  if (!menu) return;
  document.querySelectorAll('.profile-menu.show').forEach((m) => m.classList.remove('show'));
  menu.classList.toggle('show');
}

function renderProfile(user) {
  const container = qs('admin-auth-container');
  const fullName = user.user_metadata?.full_name || user.email || 'Admin';
  const firstName = fullName.split(' ')[0];
  const avatarUrl = user.user_metadata?.avatar_url || '';

  container.innerHTML = `
    <div class="profile-dropdown">
      <div class="profile-trigger" onclick="toggleDropdown(event, 'admin-menu')">
        ${avatarUrl ? `<img src="${avatarUrl}" alt="avatar" style="width:24px;height:24px;border-radius:50%;">` : `<div style="width:24px;height:24px;border-radius:50%;background:var(--c-primary);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:bold;">${firstName.charAt(0)}</div>`}
        <span style="font-size:.85rem;font-weight:600;color:var(--c-text);">${escapeHtml(firstName)}</span>
      </div>
      <div class="profile-menu" id="admin-menu">
        <button class="profile-menu-item" onclick="window.location.href='../'">🏠 Strona główna</button>
        <button class="profile-menu-item" onclick="window.location.href='../e8/'">📘 E8</button>
        <div class="profile-menu-divider"></div>
        <button class="profile-menu-item" onclick="logout()" style="color:var(--c-red)">🚪 Wyloguj</button>
      </div>
    </div>
  `;
}

async function boot() {
  document.addEventListener('click', (event) => {
    if (!event.target.closest('.profile-dropdown')) {
      document.querySelectorAll('.profile-menu.show').forEach((m) => m.classList.remove('show'));
    }
  });

  setupImportModeToggle();

  if (typeof window.getSupabaseClient === 'function') {
    try {
      supabaseClient = await window.getSupabaseClient();
    } catch (err) {
      console.error('Supabase init error:', err);
    }
  }

  if (!supabaseClient) {
    qs('admin-guard').classList.remove('hidden');
    return;
  }

  const { data } = await supabaseClient.auth.getUser();
  const user = data?.user;
  if (!user) {
    qs('admin-guard').classList.remove('hidden');
    return;
  }

  renderProfile(user);
  qs('admin-app').classList.remove('hidden');

  qs('manual-form').addEventListener('submit', handleManualSubmit);
  qs('manual-clear').addEventListener('click', resetManualForm);
  qs('validate-json-btn').addEventListener('click', handleValidateJson);
  qs('import-json-btn').addEventListener('click', handleImportJson);

  setupListInteractions();
  await loadQuestions('all');
}

window.logout = logout;
window.toggleDropdown = toggleDropdown;
window.validateQuestionRecord = validateQuestionRecord;
window.splitRecordsByBranch = splitRecordsByBranch;

document.addEventListener('DOMContentLoaded', boot);
