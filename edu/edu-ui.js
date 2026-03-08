function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('pl-PL', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function humanType(type) {
  if (type === 'multiple-choice') return 'Multiple choice';
  if (type === 'true-false') return 'True/False';
  if (type === 'open') return 'Otwarte';
  return type || 'Nieznany';
}

function renderQuestionCard(question, index) {
  const optionsHtml = Array.isArray(question.options) && question.options.length
    ? `<ul class="edu-preview__options">${question.options.map((option) => `<li>${escapeHtml(option)}</li>`).join('')}</ul>`
    : '<p class="edu-preview__empty">Pytanie otwarte — odpowiedź sprawdzana ręcznie.</p>';

  const answerHtml = question.correctAnswer
    ? `<p class="edu-preview__answer"><strong>Poprawna:</strong> ${escapeHtml(question.correctAnswer)}</p>`
    : '';

  return `
    <article class="edu-preview__question" data-question-id="${escapeHtml(question.id)}">
      <header class="edu-preview__question-head">
        <div>
          <h4>Pytanie ${index + 1}</h4>
          <p>${escapeHtml(humanType(question.type))} · ${escapeHtml(question.points)} pkt</p>
        </div>
        <div class="edu-preview__actions">
          <button type="button" data-action="edit" data-question-id="${escapeHtml(question.id)}">Edytuj</button>
          <button type="button" data-action="regenerate" data-question-id="${escapeHtml(question.id)}">Regeneruj</button>
          <button type="button" data-action="delete" data-question-id="${escapeHtml(question.id)}">Usuń</button>
        </div>
      </header>
      <p class="edu-preview__prompt">${escapeHtml(question.prompt)}</p>
      ${optionsHtml}
      ${answerHtml}
    </article>
  `;
}

function renderTestPreview(test, mount) {
  if (!mount) return;
  if (!test) {
    mount.innerHTML = '<p class="edu-preview__placeholder">Wygeneruj test, aby zobaczyć podgląd pytań.</p>';
    return;
  }

  mount.innerHTML = `
    <header class="edu-preview__head">
      <h3>${escapeHtml(test.title)}</h3>
      <p>${escapeHtml(test.subject)} · ${escapeHtml(test.topic)} · ${escapeHtml(test.gradeOrAge)}</p>
      <p>Poziom: <strong>${escapeHtml(test.difficulty)}</strong> · Typ: <strong>${escapeHtml(test.questionType)}</strong> · Język: <strong>${escapeHtml(test.instructionLanguage)}</strong></p>
      <p>Utworzono: ${formatDate(test.createdAt)}</p>
      ${test.extraInstructions ? `<p class="edu-preview__extra">Dodatkowe instrukcje: ${escapeHtml(test.extraInstructions)}</p>` : ''}
    </header>
    <div class="edu-preview__list">
      ${(test.questions || []).map((question, index) => renderQuestionCard(question, index)).join('')}
    </div>
  `;
}

function renderSavedTests(tests, mount) {
  if (!mount) return;
  if (!tests?.length) {
    mount.innerHTML = '<p class="edu-saved__placeholder">Brak zapisanych testów.</p>';
    return;
  }

  mount.innerHTML = tests.map((test) => `
    <article class="edu-saved__item" data-test-id="${escapeHtml(test.id)}">
      <div>
        <h4>${escapeHtml(test.title)}</h4>
        <p>${escapeHtml(test.subject)} · ${escapeHtml(test.topic)} · ${escapeHtml(test.questions?.length || 0)} pytań</p>
      </div>
      <div class="edu-saved__actions">
        <button type="button" data-saved-action="open" data-test-id="${escapeHtml(test.id)}">Otwórz</button>
        <button type="button" data-saved-action="copy" data-test-id="${escapeHtml(test.id)}">Kopia</button>
        <button type="button" data-saved-action="delete" data-test-id="${escapeHtml(test.id)}">Usuń</button>
      </div>
    </article>
  `).join('');
}

function setStatus(target, message, tone = 'neutral') {
  if (!target) return;
  target.textContent = message || '';
  target.dataset.tone = tone;
}

export {
  renderTestPreview,
  renderSavedTests,
  setStatus
};
