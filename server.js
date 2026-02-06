const express = require('express');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');

app.use(express.json());
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

function dataPath(name) {
  return path.join(DATA_DIR, `${name}.json`);
}

async function readJson(name) {
  try {
    const raw = await fs.readFile(dataPath(name), 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    if (err.code === 'ENOENT') return null;
    throw err;
  }
}

async function writeJson(name, data) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(dataPath(name), JSON.stringify(data, null, 2), 'utf8');
}

// Utilizadores iniciais quando não existe ficheiro (primeira execução / volume vazio no Docker)
const USUARIOS_SEED = [
  { id: 1, nome: 'admin', cargo: 'direcao', grupo: 'A', fivem_nick: 'Mauricio', pin: '1234' },
  { id: 2, nome: 'André Silva', cargo: 'direcao', grupo: '', fivem_nick: 'MonsterPT', pin: '1990' },
  { id: 3, nome: 'Red', cargo: 'funcionario', grupo: '', pin: '1111' }
];

// GET endpoints
app.get('/api/usuarios', async (req, res) => {
  try {
    const data = await readJson('usuarios');
    if (Array.isArray(data) && data.length > 0) {
      return res.json(data);
    }
    res.json(USUARIOS_SEED);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao ler utilizadores' });
  }
});

app.get('/api/registos', async (req, res) => {
  try {
    const data = await readJson('registos');
    res.json(Array.isArray(data) ? data : []);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao ler registos' });
  }
});

app.get('/api/caixa', async (req, res) => {
  try {
    const data = await readJson('caixa');
    res.json(data && typeof data.valorTotal === 'number' ? data : { valorTotal: 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao ler caixa' });
  }
});

app.get('/api/movimentos', async (req, res) => {
  try {
    const data = await readJson('movimentos');
    res.json(Array.isArray(data) ? data : []);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao ler movimentos' });
  }
});

app.get('/api/apanhas', async (req, res) => {
  try {
    const data = await readJson('apanhas');
    res.json(Array.isArray(data) ? data : []);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao ler apanhas' });
  }
});

const CHAT_MAX = 200;
app.get('/api/chat', async (req, res) => {
  try {
    const data = await readJson('chat');
    const list = Array.isArray(data) ? data : [];
    const last = list.slice(-CHAT_MAX);
    res.json(last);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao ler chat' });
  }
});

// FiveM players proxy (avoids CORS from browser)
app.get('/api/fivem-players', async (req, res) => {
  const code = req.query.code || '875vq5';
  const url = `https://servers-frontend.fivem.net/api/servers/single/${code}`;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const resp = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!resp.ok) {
      return res.json({ players: [], online: false, error: `FiveM API: ${resp.status}` });
    }
    const json = await resp.json();
    const players = (json.Data && json.Data.players) || json.players || [];
    const stripFivemColors = (s) => (typeof s === 'string' ? s.replace(/\^./g, '').replace(/~[^~]*~/g, '').trim() : '');
    const out = players.map((p) => ({ name: stripFivemColors(p.name) || p.name, id: p.id, ping: p.ping }));
    res.json({ players: out, online: out.length > 0 });
  } catch (err) {
    console.error('fivem-players:', err.message);
    res.json({ players: [], online: false, error: err.message || 'Erro ao obter jogadores' });
  }
});

// POST endpoints (replace entire file with body)
app.post('/api/usuarios', async (req, res) => {
  try {
    const body = req.body;
    if (!Array.isArray(body)) {
      return res.status(400).json({ error: 'Corpo deve ser um array' });
    }
    await writeJson('usuarios', body);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao guardar utilizadores' });
  }
});

app.post('/api/registos', async (req, res) => {
  try {
    const body = req.body;
    if (!Array.isArray(body)) {
      return res.status(400).json({ error: 'Corpo deve ser um array' });
    }
    await writeJson('registos', body);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao guardar registos' });
  }
});

app.post('/api/caixa', async (req, res) => {
  try {
    const body = req.body;
    if (body == null || typeof body.valorTotal !== 'number') {
      return res.status(400).json({ error: 'Corpo deve ter valorTotal (número)' });
    }
    await writeJson('caixa', { valorTotal: body.valorTotal });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao guardar caixa' });
  }
});

app.post('/api/movimentos', async (req, res) => {
  try {
    const body = req.body;
    if (!Array.isArray(body)) {
      return res.status(400).json({ error: 'Corpo deve ser um array' });
    }
    await writeJson('movimentos', body);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao guardar movimentos' });
  }
});

app.post('/api/apanhas', async (req, res) => {
  try {
    const body = req.body;
    if (!Array.isArray(body)) {
      return res.status(400).json({ error: 'Corpo deve ser um array' });
    }
    const now = new Date().toISOString();
    const out = body.map((item) => ({
      ...item,
      id: item.id ?? Date.now() + Math.random(),
      datahora: item.datahora ?? now
    }));
    await writeJson('apanhas', out);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao guardar apanhas' });
  }
});

app.post('/api/chat', async (req, res) => {
  try {
    const body = req.body;
    if (body == null || typeof body.text !== 'string' || !body.userId || !body.userName) {
      return res.status(400).json({ error: 'Corpo deve ter userId, userName e text' });
    }
    const text = String(body.text).trim();
    if (!text) {
      return res.status(400).json({ error: 'text não pode estar vazio' });
    }
    const data = await readJson('chat');
    const list = Array.isArray(data) ? data : [];
    const message = {
      id: Date.now() + Math.random(),
      userId: body.userId,
      userName: String(body.userName),
      cargo: body.cargo != null ? String(body.cargo) : '',
      text,
      timestamp: new Date().toISOString()
    };
    list.push(message);
    const trimmed = list.slice(-CHAT_MAX);
    await writeJson('chat', trimmed);
    res.json({ ok: true, message });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao guardar mensagem' });
  }
});

// SPA fallback: serve React app for non-file routes
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(distPath, 'index.html'));
  } else {
    res.status(404).json({ error: 'Not found' });
  }
});

app.listen(PORT, () => {
  console.log(`Frota Atlântico a correr em http://localhost:${PORT}`);
});
