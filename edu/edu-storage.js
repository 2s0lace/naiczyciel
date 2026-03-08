const STORAGE_KEY = 'naiczyciel_edu_tests_v1';

function parseTests(raw) {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function getAllTests() {
  const tests = parseTests(localStorage.getItem(STORAGE_KEY));
  return tests.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
}

function persistTests(tests) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tests));
}

function getTestById(id) {
  if (!id) return null;
  return getAllTests().find((test) => test.id === id) || null;
}

function saveTest(test) {
  if (!test?.id) return null;
  const tests = getAllTests();
  const idx = tests.findIndex((item) => item.id === test.id);
  if (idx >= 0) tests[idx] = test;
  else tests.unshift(test);
  persistTests(tests);
  return test;
}

function deleteTest(id) {
  const tests = getAllTests().filter((item) => item.id !== id);
  persistTests(tests);
}

function duplicateTest(id) {
  const existing = getTestById(id);
  if (!existing) return null;
  const copy = {
    ...existing,
    id: `edu_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    title: `${existing.title} (kopia)`,
    createdAt: new Date().toISOString(),
    questions: (existing.questions || []).map((q, idx) => ({
      ...q,
      id: `q_${Date.now()}_${idx}_${Math.floor(Math.random() * 1000)}`
    }))
  };
  saveTest(copy);
  return copy;
}

export {
  getAllTests,
  getTestById,
  saveTest,
  deleteTest,
  duplicateTest
};
