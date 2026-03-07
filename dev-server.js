const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, 'data', 'questions');
const BRANCHES = ['grammar', 'reading', 'vocab'];
const PORT = Number(process.env.PORT || 3000);

function loadDotEnv() {
  const envPath = path.join(ROOT, '.env');
  if (!fs.existsSync(envPath)) return;
  const raw = fs.readFileSync(envPath, 'utf8');
  raw.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const idx = trimmed.indexOf('=');
    if (idx === -1) return;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    if (key && process.env[key] === undefined) process.env[key] = value;
  });
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function ensureDataFiles() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  for (const branch of BRANCHES) {
    const file = path.join(DATA_DIR, `${branch}.json`);
    if (!fs.existsSync(file)) fs.writeFileSync(file, '[]\n', 'utf8');
  }
}

function sendJson(res, status, payload) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let buf = '';
    req.on('data', (chunk) => {
      buf += chunk;
      if (buf.length > 2_000_000) {
        reject(new Error('Payload too large'));
        req.destroy();
      }
    });
    req.on('end', () => {
      if (!buf.trim()) return resolve({});
      try {
        resolve(JSON.parse(buf));
      } catch (err) {
        reject(new Error('Invalid JSON body'));
      }
    });
    req.on('error', reject);
  });
}

function sanitizeBranch(branch) {
  return BRANCHES.includes(branch) ? branch : null;
}

function readBranch(branch) {
  const file = path.join(DATA_DIR, `${branch}.json`);
  const raw = fs.readFileSync(file, 'utf8');
  const parsed = JSON.parse(raw || '[]');
  return Array.isArray(parsed) ? parsed : [];
}

function writeBranch(branch, records) {
  const file = path.join(DATA_DIR, `${branch}.json`);
  fs.writeFileSync(file, `${JSON.stringify(records, null, 2)}\n`, 'utf8');
}

function getAllQuestions() {
  const out = [];
  for (const branch of BRANCHES) {
    out.push(...readBranch(branch));
  }
  return out;
}

function validOptions(options) {
  return Array.isArray(options) && options.filter((o) => typeof o === 'string' && o.trim()).length >= 2;
}

function normalizeRecord(raw, forcedBranch = null) {
  const branch = forcedBranch || raw.branch;
  if (!sanitizeBranch(branch)) return { ok: false, error: 'Invalid branch' };

  const question = typeof raw.question === 'string' ? raw.question.trim() : '';
  const type = typeof raw.type === 'string' && raw.type.trim() ? raw.type.trim() : 'multiple_choice';
  const options = Array.isArray(raw.options) ? raw.options.map((o) => String(o).trim()).filter(Boolean) : [];
  const correctAnswer = typeof raw.correctAnswer === 'string' ? raw.correctAnswer.trim() : '';

  if (!question) return { ok: false, error: 'Missing question' };
  if (!validOptions(options)) return { ok: false, error: 'Invalid options' };
  if (!correctAnswer || !options.includes(correctAnswer)) return { ok: false, error: 'correctAnswer must match one option' };

  const rec = {
    id: typeof raw.id === 'string' && raw.id.trim() ? raw.id.trim() : null,
    branch,
    type,
    question,
    options,
    correctAnswer,
    explanationWhy: raw.explanationWhy ? String(raw.explanationWhy).trim() : '',
    explanationPattern: raw.explanationPattern ? String(raw.explanationPattern).trim() : '',
    difficulty: raw.difficulty ? String(raw.difficulty).trim() : '',
    topic: raw.topic ? String(raw.topic).trim() : '',
    tags: Array.isArray(raw.tags) ? raw.tags.map((t) => String(t)) : [],
    source: raw.source ? String(raw.source) : 'admin',
    createdAt: raw.createdAt ? String(raw.createdAt) : new Date().toISOString()
  };

  return { ok: true, record: rec };
}

function generateId(branch) {
  const rand = Math.random().toString(36).slice(2, 8);
  return `${branch}_${Date.now()}_${rand}`;
}

function addRecord(record) {
  const branchRecords = readBranch(record.branch);
  const isDuplicate = branchRecords.some(
    (q) => String(q.question || '').trim().toLowerCase() === record.question.trim().toLowerCase()
      && String(q.branch || '').trim() === record.branch
  );

  if (isDuplicate) return { duplicate: true };

  if (!record.id) record.id = generateId(record.branch);
  branchRecords.push(record);
  writeBranch(record.branch, branchRecords);
  return { duplicate: false, record };
}

function importRecords(records, forceBranch = null) {
  const report = {
    imported: { grammar: 0, reading: 0, vocab: 0 },
    rejected: [],
    duplicates: 0
  };

  for (let i = 0; i < records.length; i++) {
    const n = normalizeRecord(records[i], forceBranch);
    if (!n.ok) {
      report.rejected.push({ index: i, error: n.error });
      continue;
    }

    const result = addRecord({ ...n.record, source: 'admin-import' });
    if (result.duplicate) {
      report.duplicates += 1;
      continue;
    }
    report.imported[n.record.branch] += 1;
  }

  return report;
}

function handleApi(req, res, urlObj) {
  if (req.method === 'GET' && urlObj.pathname === '/api/questions') {
    const branch = urlObj.searchParams.get('branch');
    if (branch) {
      const b = sanitizeBranch(branch);
      if (!b) return sendJson(res, 400, { error: 'Invalid branch' });
      return sendJson(res, 200, { branch: b, questions: readBranch(b) });
    }
    return sendJson(res, 200, { questions: getAllQuestions() });
  }

  if (req.method === 'GET' && urlObj.pathname === '/api/questions/counts') {
    const counts = {};
    for (const b of BRANCHES) counts[b] = readBranch(b).length;
    return sendJson(res, 200, { counts });
  }

  if (req.method === 'POST' && urlObj.pathname === '/api/questions') {
    return readJsonBody(req)
      .then((body) => {
        const normalized = normalizeRecord(body, body.branch || null);
        if (!normalized.ok) return sendJson(res, 400, { error: normalized.error });
        const result = addRecord({ ...normalized.record, source: body.source || 'admin' });
        if (result.duplicate) return sendJson(res, 409, { error: 'Duplicate question in branch' });
        return sendJson(res, 201, { ok: true, record: result.record });
      })
      .catch((err) => sendJson(res, 400, { error: err.message }));
  }

  if (req.method === 'POST' && urlObj.pathname === '/api/questions/import') {
    return readJsonBody(req)
      .then((body) => {
        const mode = body.mode === 'force' ? 'force' : 'auto';
        const records = Array.isArray(body.records) ? body.records : null;
        if (!records) return sendJson(res, 400, { error: 'records must be an array' });

        let forceBranch = null;
        if (mode === 'force') {
          forceBranch = sanitizeBranch(body.targetBranch || '');
          if (!forceBranch) return sendJson(res, 400, { error: 'Invalid targetBranch for force mode' });
        }

        const report = importRecords(records, forceBranch);
        return sendJson(res, 200, { ok: true, report });
      })
      .catch((err) => sendJson(res, 400, { error: err.message }));
  }

  const deleteMatch = urlObj.pathname.match(/^\/api\/questions\/(grammar|reading|vocab)\/([^/]+)$/);
  if (req.method === 'DELETE' && deleteMatch) {
    const branch = deleteMatch[1];
    const id = decodeURIComponent(deleteMatch[2]);
    const records = readBranch(branch);
    const next = records.filter((q) => String(q.id) !== id);
    if (next.length === records.length) return sendJson(res, 404, { error: 'Question not found' });
    writeBranch(branch, next);
    return sendJson(res, 200, { ok: true });
  }

  return false;
}

function serveStatic(req, res, urlObj) {
  let pathname = decodeURIComponent(urlObj.pathname);
  if (pathname === '/') pathname = '/index.html';

  const absPath = path.join(ROOT, pathname);
  if (!absPath.startsWith(ROOT)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  let filePath = absPath;
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    res.writeHead(404);
    res.end('Not Found');
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(res);
}

loadDotEnv();
ensureDataFiles();

const server = http.createServer((req, res) => {
  const urlObj = new URL(req.url, `http://${req.headers.host}`);

  if (urlObj.pathname.startsWith('/api/')) {
    const handled = handleApi(req, res, urlObj);
    if (handled === false) {
      sendJson(res, 404, { error: 'API endpoint not found' });
    }
    return;
  }

  serveStatic(req, res, urlObj);
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
