import { generateMockTest, regenerateQuestion, regenerateAllQuestions, normalizeConfig } from './edu-generator.js';
import { getAllTests, getTestById, saveTest, deleteTest, duplicateTest } from './edu-storage.js';
import { renderTestPreview, renderSavedTests, setStatus } from './edu-ui.js';

let currentTest = null;

const refs = {
  form: document.getElementById('edu-generator-form'),
  preview: document.getElementById('edu-preview'),
  status: document.getElementById('edu-status'),
  actions: document.getElementById('edu-test-actions'),
  btnRegenerateAll: document.getElementById('edu-regenerate-all'),
  btnSave: document.getElementById('edu-save-test'),
  btnCopy: document.getElementById('edu-copy-test'),
  btnShare: document.getElementById('edu-generate-link'),
  shareSection: document.getElementById('edu-share'),
  shareInput: document.getElementById('edu-share-link'),
  btnCopyLink: document.getElementById('edu-copy-link'),
  savedList: document.getElementById('edu-saved-tests')
};

function getFormPayload() {
  const formData = new FormData(refs.form);
  return normalizeConfig(Object.fromEntries(formData.entries()));
}

function updateVisibility() {
  const hasTest = Boolean(currentTest);
  refs.actions.classList.toggle('hidden', !hasTest);
}

function buildShareLink(testId) {
  const base = new URL('./test.html', window.location.href);
  base.searchParams.set('id', testId);
  return base.toString();
}

async function copyToClipboard(value) {
  if (!value) return false;
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    const temp = document.createElement('textarea');
    temp.value = value;
    document.body.appendChild(temp);
    temp.select();
    document.execCommand('copy');
    temp.remove();
    return true;
  }
}

function refreshSavedTests() {
  const tests = getAllTests();
  renderSavedTests(tests, refs.savedList);
}

function render() {
  renderTestPreview(currentTest, refs.preview);
  updateVisibility();
}

function handleQuestionAction(event) {
  const target = event.target.closest('button[data-action]');
  if (!target || !currentTest) return;

  const action = target.getAttribute('data-action');
  const questionId = target.getAttribute('data-question-id');
  const question = currentTest.questions.find((item) => item.id === questionId);
  if (!question) return;

  if (action === 'edit') {
    const nextPrompt = window.prompt('Edytuj treść pytania:', question.prompt);
    if (nextPrompt === null) return;
    question.prompt = nextPrompt.trim() || question.prompt;

    if (question.type === 'multiple-choice') {
      const nextOptionsRaw = window.prompt('Opcje (oddziel przecinkiem):', question.options.join(', '));
      if (nextOptionsRaw !== null) {
        const parsed = nextOptionsRaw
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean);
        if (parsed.length >= 2) {
          question.options = parsed;
          if (!question.options.includes(question.correctAnswer)) {
            question.correctAnswer = question.options[0];
          }
        }
      }
    }

    if (question.type === 'true-false') {
      const nextAnswer = window.prompt('Poprawna odpowiedź (true/false):', question.correctAnswer || 'true');
      if (nextAnswer && ['true', 'false'].includes(nextAnswer.trim().toLowerCase())) {
        question.correctAnswer = nextAnswer.trim().toLowerCase();
      }
    }

    render();
    setStatus(refs.status, 'Pytanie zaktualizowane.', 'success');
    return;
  }

  if (action === 'regenerate') {
    currentTest = regenerateQuestion(currentTest, questionId);
    render();
    setStatus(refs.status, 'Pytanie zregenerowane.', 'success');
    return;
  }

  if (action === 'delete') {
    currentTest.questions = currentTest.questions.filter((item) => item.id !== questionId);
    render();
    setStatus(refs.status, 'Pytanie usunięte.', 'warning');
  }
}

function handleSavedAction(event) {
  const target = event.target.closest('button[data-saved-action]');
  if (!target) return;
  const action = target.getAttribute('data-saved-action');
  const testId = target.getAttribute('data-test-id');

  if (action === 'open') {
    currentTest = getTestById(testId);
    render();
    setStatus(refs.status, 'Załadowano zapisany test.', 'success');
    return;
  }

  if (action === 'copy') {
    const copied = duplicateTest(testId);
    if (copied) {
      currentTest = copied;
      refreshSavedTests();
      render();
      setStatus(refs.status, 'Utworzono kopię testu.', 'success');
    }
    return;
  }

  if (action === 'delete') {
    deleteTest(testId);
    if (currentTest?.id === testId) {
      currentTest = null;
      render();
    }
    refreshSavedTests();
    setStatus(refs.status, 'Test usunięty z pamięci lokalnej.', 'warning');
  }
}

function bindEvents() {
  refs.form.addEventListener('submit', (event) => {
    event.preventDefault();
    currentTest = generateMockTest(getFormPayload());
    render();
    setStatus(refs.status, 'Test wygenerowany.', 'success');
    refs.shareSection.classList.add('hidden');
  });

  refs.preview.addEventListener('click', handleQuestionAction);
  refs.savedList.addEventListener('click', handleSavedAction);

  refs.btnRegenerateAll.addEventListener('click', () => {
    if (!currentTest) return;
    currentTest = regenerateAllQuestions(currentTest);
    render();
    setStatus(refs.status, 'Wszystkie pytania zregenerowane.', 'success');
  });

  refs.btnSave.addEventListener('click', () => {
    if (!currentTest) return;
    saveTest(currentTest);
    refreshSavedTests();
    setStatus(refs.status, 'Test zapisany w localStorage.', 'success');
  });

  refs.btnCopy.addEventListener('click', () => {
    if (!currentTest) return;
    saveTest(currentTest);
    const copied = duplicateTest(currentTest.id);
    if (copied) {
      currentTest = copied;
      refreshSavedTests();
      render();
      setStatus(refs.status, 'Utworzono kopię testu.', 'success');
    }
  });

  refs.btnShare.addEventListener('click', () => {
    if (!currentTest) return;
    saveTest(currentTest);
    const link = buildShareLink(currentTest.id);
    refs.shareInput.value = link;
    refs.shareSection.classList.remove('hidden');
    setStatus(refs.status, 'Link gotowy do udostępnienia.', 'success');
  });

  refs.btnCopyLink.addEventListener('click', async () => {
    const ok = await copyToClipboard(refs.shareInput.value);
    setStatus(refs.status, ok ? 'Link skopiowany.' : 'Nie udało się skopiować linku.', ok ? 'success' : 'error');
  });
}

function init() {
  bindEvents();
  refreshSavedTests();
  render();
}

init();
