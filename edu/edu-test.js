import { getTestById } from './edu-storage.js';

const refs = {
  notFound: document.getElementById('edu-test-not-found'),
  app: document.getElementById('edu-test-app'),
  title: document.getElementById('edu-test-title'),
  meta: document.getElementById('edu-test-meta'),
  form: document.getElementById('edu-test-form'),
  questions: document.getElementById('edu-test-questions'),
  result: document.getElementById('edu-test-result')
};

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function parseTestId() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}

function renderQuestion(question, index) {
  const number = index + 1;

  if (question.type === 'multiple-choice') {
    return `
      <article class="edu-student-q">
        <h3>${number}. ${escapeHtml(question.prompt)}</h3>
        <div class="edu-student-options">
          ${(question.options || []).map((option) => `
            <label>
              <input type="radio" name="q_${escapeHtml(question.id)}" value="${escapeHtml(option)}" required />
              <span>${escapeHtml(option)}</span>
            </label>
          `).join('')}
        </div>
      </article>
    `;
  }

  if (question.type === 'true-false') {
    return `
      <article class="edu-student-q">
        <h3>${number}. ${escapeHtml(question.prompt)}</h3>
        <div class="edu-student-options">
          <label><input type="radio" name="q_${escapeHtml(question.id)}" value="true" required /><span>Prawda</span></label>
          <label><input type="radio" name="q_${escapeHtml(question.id)}" value="false" required /><span>Fałsz</span></label>
        </div>
      </article>
    `;
  }

  return `
    <article class="edu-student-q">
      <h3>${number}. ${escapeHtml(question.prompt)}</h3>
      <textarea name="q_${escapeHtml(question.id)}" rows="4" placeholder="Twoja odpowiedź..."></textarea>
    </article>
  `;
}

function renderResult({ studentName, closedCorrect, closedTotal, pointsEarned, pointsTotal, openCount }) {
  const percent = pointsTotal > 0 ? Math.round((pointsEarned / pointsTotal) * 100) : 0;
  refs.result.innerHTML = `
    <h3>Wynik ucznia: ${escapeHtml(studentName || 'Bez imienia')}</h3>
    <p><strong>Pytania zamknięte:</strong> ${closedCorrect} / ${closedTotal}</p>
    <p><strong>Punkty (zamknięte):</strong> ${pointsEarned} / ${pointsTotal} (${percent}%)</p>
    <p><strong>Pytania otwarte:</strong> ${openCount} (do sprawdzenia ręcznego)</p>
  `;
  refs.result.classList.remove('hidden');
}

function attachSubmit(test) {
  refs.form.addEventListener('submit', (event) => {
    event.preventDefault();

    const data = new FormData(refs.form);
    const studentName = String(data.get('studentName') || '').trim();

    let closedCorrect = 0;
    let closedTotal = 0;
    let pointsEarned = 0;
    let pointsTotal = 0;
    let openCount = 0;

    (test.questions || []).forEach((question) => {
      const answer = data.get(`q_${question.id}`);

      if (question.type === 'open') {
        openCount += 1;
        return;
      }

      closedTotal += 1;
      pointsTotal += Number(question.points || 1);

      if (String(answer || '') === String(question.correctAnswer || '')) {
        closedCorrect += 1;
        pointsEarned += Number(question.points || 1);
      }
    });

    renderResult({
      studentName,
      closedCorrect,
      closedTotal,
      pointsEarned,
      pointsTotal,
      openCount
    });
  });
}

function init() {
  const testId = parseTestId();
  const test = getTestById(testId);

  if (!testId || !test) {
    refs.notFound.classList.remove('hidden');
    refs.app.classList.add('hidden');
    return;
  }

  refs.notFound.classList.add('hidden');
  refs.app.classList.remove('hidden');

  refs.title.textContent = test.title || 'Test ucznia';
  refs.meta.textContent = `${test.subject} · ${test.topic} · ${test.gradeOrAge} · ${test.questions?.length || 0} pytań`;
  refs.questions.innerHTML = (test.questions || []).map(renderQuestion).join('');

  attachSubmit(test);
}

init();
