const SUPABASE_URL = 'https://owyqpitxqxvxlrfszoyc.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_yXsk_Q-tbYT8BgQTy2R1Eg_FnZzPwpF';

const LS_QUESTIONS = 'admin_question_bank_v1';
const LS_CATEGORIES = 'admin_categories_v1';
const LS_SETS = 'admin_published_sets_v1';

let supabaseClient = null;
let currentUser = null;
let questions = [];
let categories = [];
let publishedSets = [];

const fallbackQuestions = [
  {
    id: 1001,
    type: 'reactions',
    topic: 'Szkoła',
    level: 'A2',
    question: 'Kolega pyta o plan lekcji. Co odpowiesz?',
    answers: ['A. I have my notebook.', "B. According to my timetable, it's Biology.", 'C. I am very tired.'],
    correct: 1,
    explanation: {
      why: 'To bezpośrednia odpowiedź na pytanie o przedmiot.',
      watch_out: 'notebook nie odpowiada na pytanie o plan.',
      pattern: "According to my timetable, it's..."
    }
  },
  {
    id: 1002,
    type: 'grammar',
    topic: 'Present Perfect',
    level: 'A2',
    question: 'She ___ already ___ her homework.',
    answers: ['A. has / finished', 'B. did / finish', 'C. is / finishing'],
    correct: 0,
    explanation: {
      why: 'Present Perfect z already pokazuje ukończoną czynność.',
      watch_out: 'did finish to inny czas.',
      pattern: 'has/have + already + past participle'
    }
  }
];

const fallbackCategories = [
  { key: 'reactions', label: 'Reakcje językowe', color: '#6c63ff', description: 'Typowe reakcje', active: true },
  { key: 'reading', label: 'Reading', color: '#22c55e', description: 'Rozumienie tekstu', active: true },
  { key: 'vocabulary', label: 'Słownictwo', color: '#f59e0b', description: 'Kolokacje i słowa', active: true },
  { key: 'grammar', label: 'Gramatyka', color: '#ef4444', description: 'Zadania gramatyczne', active: true }
];

function saveState() {
  localStorage.setItem(LS_QUESTIONS, JSON.stringify(questions));
  localStorage.setItem(LS_CATEGORIES, JSON.stringify(categories));
  localStorage.setItem(LS_SETS, JSON.stringify(publishedSets));
}

function loadState() {
  questions = JSON.parse(localStorage.getItem(LS_QUESTIONS) || 'null') || [];
  categories = JSON.parse(localStorage.getItem(LS_CATEGORIES) || 'null') || [];
  publishedSets = JSON.parse(localStorage.getItem(LS_SETS) || 'null') || [];

  if (!categories.length) {
    categories = [...fallbackCategories];
  }
}

function seedFallbackQuestions() {
  if (!questions.length) {
    questions = [...fallbackQuestions];
    saveState();
  }
}

function getNextQuestionId() {
  const maxId = questions.reduce((max, q) => Math.max(max, Number(q.id) || 0), 0);
  return maxId + 1;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function adminPath() {
  return './';
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
  document.querySelectorAll('.profile-menu.show').forEach((m) => {
    if (m.id !== menuId) m.classList.remove('show');
  });
  menu.classList.toggle('show');
}

function injectProfile(user) {
  const container = document.getElementById('admin-auth-container');
  if (!container) return;

  const avatarUrl = user.user_metadata?.avatar_url || '';
  const fullName = user.user_metadata?.full_name || user.email || 'Admin';
  const firstName = fullName.split(' ')[0];

  container.innerHTML = `
    <div class="profile-dropdown" id="profile-dropdown-admin">
      <div class="profile-trigger" onclick="toggleDropdown(event, 'menu-admin')">
        ${avatarUrl ? `<img src="${avatarUrl}" alt="Avatar" style="width: 24px; height: 24px; border-radius: 50%;">` : `<div style="width: 24px; height: 24px; border-radius: 50%; background: var(--c-primary); display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: bold;">${firstName.charAt(0)}</div>`}
        <span style="font-size: .85rem; font-weight: 600; color: var(--c-text);">${escapeHtml(firstName)}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-left: 2px; color: var(--c-muted);"><polyline points="6 9 12 15 18 9"></polyline></svg>
      </div>
      <div class="profile-menu" id="menu-admin">
        <button class="profile-menu-item" onclick="window.location.href='../'">🏠 Strona główna</button>
        <button class="profile-menu-item" onclick="window.location.href='../e8/'">📘 Quiz E8</button>
        <div class="profile-menu-divider"></div>
        <button class="profile-menu-item" onclick="logout()" style="color: var(--c-red);">🚪 Wyloguj</button>
      </div>
    </div>
  `;
}

function setupTabSwitching() {
  const tabs = document.querySelectorAll('.admin__tab');
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => {
        t.classList.remove('is-active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('is-active');
      tab.setAttribute('aria-selected', 'true');

      const target = tab.dataset.tab;
      document.querySelectorAll('.admin__panel').forEach((p) => p.classList.add('hidden'));
      const panel = document.getElementById(`panel-${target}`);
      if (panel) panel.classList.remove('hidden');
    });
  });
}

function renderQuestionsTable() {
  const tbody = document.querySelector('#questions-table tbody');
  if (!tbody) return;

  tbody.innerHTML = questions
    .slice()
    .sort((a, b) => Number(a.id) - Number(b.id))
    .map((q) => `
      <tr>
        <td>${escapeHtml(q.id)}</td>
        <td>${escapeHtml(q.type)}</td>
        <td>${escapeHtml(q.topic)}</td>
        <td>${escapeHtml(q.question)}</td>
        <td>
          <div class="admin__row-actions">
            <button data-action="edit" data-id="${q.id}">Edytuj</button>
            <button data-action="delete" data-id="${q.id}">Usuń</button>
          </div>
        </td>
      </tr>
    `)
    .join('');
}

function fillQuestionForm(q) {
  document.getElementById('q-id').value = q.id;
  document.getElementById('q-type').value = q.type;
  document.getElementById('q-topic').value = q.topic;
  document.getElementById('q-level').value = q.level || 'A2';
  document.getElementById('q-correct').value = String(q.correct ?? 0);
  document.getElementById('q-question').value = q.question || '';
  document.getElementById('q-answers').value = (q.answers || []).join(' | ');
  document.getElementById('q-why').value = q.explanation?.why || '';
  document.getElementById('q-watch').value = q.explanation?.watch_out || '';
  document.getElementById('q-pattern').value = q.explanation?.pattern || '';
}

function clearQuestionForm() {
  document.getElementById('question-form').reset();
  document.getElementById('q-id').value = '';
  document.getElementById('q-level').value = 'A2';
  document.getElementById('q-correct').value = '0';
}

function setupQuestionHandlers() {
  const form = document.getElementById('question-form');
  const clearBtn = document.getElementById('clear-question-btn');
  const seedBtn = document.getElementById('seed-questions-btn');
  const tbody = document.querySelector('#questions-table tbody');

  if (seedBtn) {
    seedBtn.addEventListener('click', () => {
      if (questions.length) return;
      questions = [...fallbackQuestions];
      saveState();
      renderQuestionsTable();
      renderStats();
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', clearQuestionForm);
  }

  if (tbody) {
    tbody.addEventListener('click', (event) => {
      const btn = event.target.closest('button[data-action]');
      if (!btn) return;
      const id = Number(btn.dataset.id);
      const action = btn.dataset.action;
      const q = questions.find((item) => Number(item.id) === id);
      if (!q) return;

      if (action === 'edit') {
        fillQuestionForm(q);
      } else if (action === 'delete') {
        questions = questions.filter((item) => Number(item.id) !== id);
        saveState();
        renderQuestionsTable();
        renderStats();
      }
    });
  }

  if (form) {
    form.addEventListener('submit', (event) => {
      event.preventDefault();

      const idValue = document.getElementById('q-id').value;
      const type = document.getElementById('q-type').value.trim();
      const topic = document.getElementById('q-topic').value.trim();
      const level = document.getElementById('q-level').value.trim();
      const correct = Number(document.getElementById('q-correct').value);
      const question = document.getElementById('q-question').value.trim();
      const answersRaw = document.getElementById('q-answers').value;
      const answers = answersRaw.split('|').map((v) => v.trim()).filter(Boolean);
      const why = document.getElementById('q-why').value.trim();
      const watch = document.getElementById('q-watch').value.trim();
      const pattern = document.getElementById('q-pattern').value.trim();

      if (answers.length !== 3) {
        alert('Podaj dokładnie 3 odpowiedzi oddzielone znakiem |');
        return;
      }
      if (correct < 0 || correct > 2) {
        alert('Poprawna odpowiedź musi mieć index 0-2.');
        return;
      }

      const payload = {
        id: idValue ? Number(idValue) : getNextQuestionId(),
        type,
        topic,
        level,
        question,
        answers,
        correct,
        explanation: {
          why,
          watch_out: watch,
          pattern
        }
      };

      const existingIndex = questions.findIndex((q) => Number(q.id) === Number(payload.id));
      if (existingIndex >= 0) {
        questions[existingIndex] = payload;
      } else {
        questions.push(payload);
      }

      saveState();
      renderQuestionsTable();
      renderStats();
      clearQuestionForm();
    });
  }
}

function renderCategories() {
  const wrapper = document.getElementById('categories-list');
  if (!wrapper) return;

  wrapper.innerHTML = categories
    .map((cat) => `
      <div class="admin__chip" style="border-color:${escapeHtml(cat.color || '#2a2d3a')}66">
        <strong>${escapeHtml(cat.label)}</strong>
        <small>${escapeHtml(cat.key)}</small>
        <small>${cat.active ? 'aktywna' : 'ukryta'}</small>
        <button data-del-cat="${escapeHtml(cat.key)}" class="admin__btn admin__btn--ghost" style="padding:4px 7px;font-size:.65rem;">Usuń</button>
      </div>
    `)
    .join('');
}

function setupCategoryHandlers() {
  const form = document.getElementById('category-form');
  const wrapper = document.getElementById('categories-list');

  if (form) {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const key = document.getElementById('cat-key').value.trim();
      const label = document.getElementById('cat-label').value.trim();
      const color = document.getElementById('cat-color').value.trim() || '#6c63ff';
      const description = document.getElementById('cat-desc').value.trim();
      const active = document.getElementById('cat-active').checked;

      if (!key || !label) return;
      if (categories.some((c) => c.key === key)) {
        alert('Kategoria o tym kluczu już istnieje.');
        return;
      }

      categories.push({ key, label, color, description, active });
      saveState();
      renderCategories();
      renderStats();
      form.reset();
      document.getElementById('cat-color').value = '#6c63ff';
      document.getElementById('cat-active').checked = true;
    });
  }

  if (wrapper) {
    wrapper.addEventListener('click', (event) => {
      const btn = event.target.closest('[data-del-cat]');
      if (!btn) return;
      const key = btn.getAttribute('data-del-cat');
      categories = categories.filter((cat) => cat.key !== key);
      saveState();
      renderCategories();
      renderStats();
    });
  }
}

function renderStats() {
  const cards = document.getElementById('admin-stats-cards');
  const stats = JSON.parse(localStorage.getItem('e8_stats') || JSON.stringify({
    sets: 0,
    accuracy: 0,
    questions: 0,
    streak: 0,
    history: []
  }));

  if (cards) {
    cards.innerHTML = `
      <div class="admin__stat"><div class="label">Pytania w banku</div><div class="value">${questions.length}</div></div>
      <div class="admin__stat"><div class="label">Kategorie</div><div class="value">${categories.length}</div></div>
      <div class="admin__stat"><div class="label">Średnia skuteczność</div><div class="value">${stats.accuracy}%</div></div>
      <div class="admin__stat"><div class="label">Opublikowane zestawy</div><div class="value">${publishedSets.length}</div></div>
    `;
  }

  const tbody = document.querySelector('#stats-history-table tbody');
  if (tbody) {
    const history = Array.isArray(stats.history) ? stats.history : [];
    tbody.innerHTML = history.length
      ? history.map((item) => {
          const pct = item.total ? Math.round((item.score / item.total) * 100) : 0;
          return `<tr><td>#${escapeHtml(item.id)}</td><td>${escapeHtml(item.score)}/${escapeHtml(item.total)} (${pct}%)</td><td>${escapeHtml(item.time || '-')}</td><td>-</td></tr>`;
        }).join('')
      : '<tr><td colspan="4">Brak historii.</td></tr>';
  }
}

function renderSets() {
  const tbody = document.querySelector('#sets-table tbody');
  if (!tbody) return;

  tbody.innerHTML = publishedSets.length
    ? publishedSets
        .slice()
        .reverse()
        .map((set) => `
          <tr>
            <td>${escapeHtml(set.name)}</td>
            <td>${set.questionIds.length}</td>
            <td>${set.published ? 'Opublikowany' : 'Szkic'}</td>
            <td>${escapeHtml(set.createdAt)}</td>
          </tr>
        `)
        .join('')
    : '<tr><td colspan="4">Brak zestawów.</td></tr>';
}

function setupPublishHandlers() {
  const form = document.getElementById('publish-form');
  if (!form) return;

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!questions.length) {
      alert('Najpierw dodaj pytania do banku.');
      return;
    }

    const name = document.getElementById('set-name').value.trim();
    const size = Math.max(1, Math.min(Number(document.getElementById('set-size').value), questions.length));
    const published = document.getElementById('set-published').checked;

    const shuffled = [...questions].sort(() => Math.random() - 0.5).slice(0, size);
    const newSet = {
      id: Date.now(),
      name,
      questionIds: shuffled.map((q) => q.id),
      published,
      createdAt: new Date().toLocaleString('pl-PL')
    };

    publishedSets.push(newSet);
    saveState();
    renderSets();
    renderStats();
    form.reset();
    document.getElementById('set-size').value = '10';
    document.getElementById('set-published').checked = true;
  });
}

async function boot() {
  document.addEventListener('click', (event) => {
    if (!event.target.closest('.profile-dropdown')) {
      document.querySelectorAll('.profile-menu.show').forEach((m) => m.classList.remove('show'));
    }
  });

  if (window.supabase) {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }

  if (!supabaseClient) {
    document.getElementById('admin-guard').classList.remove('hidden');
    return;
  }

  const { data } = await supabaseClient.auth.getUser();
  currentUser = data?.user || null;

  if (!currentUser) {
    document.getElementById('admin-guard').classList.remove('hidden');
    return;
  }

  injectProfile(currentUser);
  loadState();
  seedFallbackQuestions();

  setupTabSwitching();
  setupQuestionHandlers();
  setupCategoryHandlers();
  setupPublishHandlers();

  renderQuestionsTable();
  renderCategories();
  renderStats();
  renderSets();

  document.getElementById('admin-app').classList.remove('hidden');
}

window.toggleDropdown = toggleDropdown;
window.logout = logout;

document.addEventListener('DOMContentLoaded', boot);
