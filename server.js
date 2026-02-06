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

app.get('/api/metas', async (req, res) => {
  try {
    const data = await readJson('metas');
    res.json(Array.isArray(data) ? data : []);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao ler metas' });
  }
});

app.get('/api/valor-receber', async (req, res) => {
  try {
    const data = await readJson('valorReceber');
    res.json(data && typeof data === 'object' && !Array.isArray(data) ? data : {});
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao ler valor a receber' });
  }
});

const PRECO_PEIXE_DEFAULT = { sem: 36, parceria: 38 };
app.get('/api/preco-peixe', async (req, res) => {
  try {
    const data = await readJson('precoPeixe');
    const sem = typeof data?.sem === 'number' ? data.sem : PRECO_PEIXE_DEFAULT.sem;
    const parceria = typeof data?.parceria === 'number' ? data.parceria : PRECO_PEIXE_DEFAULT.parceria;
    const raw = data?.porUtilizador && typeof data.porUtilizador === 'object' ? data.porUtilizador : {};
    const porUtilizador = {};
    for (const [uid, val] of Object.entries(raw)) {
      if (typeof val === 'number' && !Number.isNaN(val) && val >= 0) {
        porUtilizador[uid] = val;
      } else if (val && typeof val === 'object' && typeof val.sem === 'number') {
        porUtilizador[uid] = val.sem;
      }
    }
    res.json({ sem, parceria, porUtilizador });
  } catch (err) {
    console.error(err);
    res.json({ ...PRECO_PEIXE_DEFAULT, porUtilizador: {} });
  }
});

app.post('/api/preco-peixe', async (req, res) => {
  try {
    const body = req.body;
    if (body == null || typeof body !== 'object') {
      return res.status(400).json({ error: 'Corpo deve ser um objeto { sem?, parceria?, porUtilizador? }' });
    }
    const existing = await readJson('precoPeixe');
    const sem = body.sem != null ? (typeof body.sem === 'number' ? body.sem : Number(body.sem)) : (typeof existing?.sem === 'number' ? existing.sem : PRECO_PEIXE_DEFAULT.sem);
    const parceria = body.parceria != null ? (typeof body.parceria === 'number' ? body.parceria : Number(body.parceria)) : (typeof existing?.parceria === 'number' ? existing.parceria : PRECO_PEIXE_DEFAULT.parceria);
    if (Number.isNaN(sem) || Number.isNaN(parceria) || sem < 0 || parceria < 0) {
      return res.status(400).json({ error: 'sem e parceria devem ser números não negativos' });
    }
    let porUtilizador = existing?.porUtilizador && typeof existing.porUtilizador === 'object' ? { ...existing.porUtilizador } : {};
    if (body.porUtilizador != null && typeof body.porUtilizador === 'object') {
      porUtilizador = {};
      for (const [uid, val] of Object.entries(body.porUtilizador)) {
        const num = typeof val === 'number' ? val : Number(val);
        if (!Number.isNaN(num) && num >= 0) {
          porUtilizador[uid] = num;
        }
      }
    }
    await writeJson('precoPeixe', { sem, parceria, porUtilizador });
    res.json({ ok: true, sem, parceria, porUtilizador });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao guardar preços do peixe' });
  }
});

function startOfCurrentWeekISO() {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - now.getUTCDay() + 1, 0, 0, 0, 0));
  return start.toISOString();
}

app.get('/api/ciclo-pagamento', async (req, res) => {
  try {
    const data = await readJson('cicloPagamento');
    const defaultCicloInicio = startOfCurrentWeekISO();
    let cicloInicio = data && typeof data.cicloInicio === 'string' ? data.cicloInicio : defaultCicloInicio;
    let porUtilizador = data && data.porUtilizador && typeof data.porUtilizador === 'object' ? data.porUtilizador : {};
    const noUserCycles = !porUtilizador || Object.keys(porUtilizador).length === 0;
    const cicloDate = new Date(cicloInicio);
    const now = new Date();
    const sameDay = cicloDate.getUTCDate() === now.getUTCDate() && cicloDate.getUTCMonth() === now.getUTCMonth() && cicloDate.getUTCFullYear() === now.getUTCFullYear();
    if (data && noUserCycles && sameDay && cicloDate.getTime() > now.getTime() - 24 * 60 * 60 * 1000) {
      cicloInicio = defaultCicloInicio;
      await writeJson('cicloPagamento', { cicloInicio, porUtilizador: {} });
    } else if (!data || typeof data.cicloInicio !== 'string') {
      await writeJson('cicloPagamento', { cicloInicio, porUtilizador: porUtilizador && Object.keys(porUtilizador).length ? porUtilizador : {} });
    }
    res.json({ cicloInicio, porUtilizador });
  } catch (err) {
    console.error(err);
    res.json({ cicloInicio: startOfCurrentWeekISO(), porUtilizador: {} });
  }
});

app.post('/api/ciclo-pagamento/pagar', async (req, res) => {
  try {
    const body = req.body;
    const userId = body != null && body.userId != null ? String(body.userId) : null;
    if (!userId) {
      return res.status(400).json({ error: 'Corpo deve ter userId' });
    }
    const now = new Date().toISOString();
    let data = await readJson('cicloPagamento');
    const cicloInicio = data && typeof data.cicloInicio === 'string' ? data.cicloInicio : now;
    let porUtilizador = data && data.porUtilizador && typeof data.porUtilizador === 'object' ? { ...data.porUtilizador } : {};
    porUtilizador[userId] = now;
    await writeJson('cicloPagamento', { cicloInicio, porUtilizador });

    const metasList = await readJson('metas');
    const metasArray = Array.isArray(metasList) ? metasList : [];
    const metasFiltered = metasArray.filter((m) => String(m.userId) !== userId);
    await writeJson('metas', metasFiltered);

    res.json({ ok: true, porUtilizador });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao marcar pagamento' });
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
      datahora: item.datahora ?? now,
      tipo: item.tipo === 'parceria' ? 'parceria' : 'sem'
    }));
    await writeJson('apanhas', out);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao guardar apanhas' });
  }
});

app.post('/api/metas', async (req, res) => {
  try {
    const body = req.body;
    if (!Array.isArray(body)) {
      return res.status(400).json({ error: 'Corpo deve ser um array' });
    }
    await writeJson('metas', body);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao guardar metas' });
  }
});

app.post('/api/valor-receber', async (req, res) => {
  try {
    const body = req.body;
    if (body == null || typeof body !== 'object' || Array.isArray(body)) {
      return res.status(400).json({ error: 'Corpo deve ser um objeto { userId: valor }' });
    }
    await writeJson('valorReceber', body);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao guardar valor a receber' });
  }
});

function getCurrentWeekKey() {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay() + 1);
  return d.toISOString().slice(0, 10);
}

app.get('/api/tempo-online', async (req, res) => {
  try {
    const currentWeek = getCurrentWeekKey();
    const data = await readJson('tempoOnline');
    const weekKey = data && data.weekKey;
    const minutesByUser = data && data.minutesByUser && typeof data.minutesByUser === 'object' ? data.minutesByUser : {};
    if (weekKey !== currentWeek) {
      return res.json({ users: [] });
    }
    const usuariosData = await readJson('usuarios');
    const usuariosList = Array.isArray(usuariosData) ? usuariosData : [];
    const registeredIds = new Set(usuariosList.map((u) => String(u.id)));
    const nameById = {};
    usuariosList.forEach((u) => { nameById[String(u.id)] = u.nome || '—'; });
    const users = Object.entries(minutesByUser)
      .filter(([userId]) => registeredIds.has(userId))
      .filter(([, min]) => Number(min) > 0)
      .map(([userId, minutes]) => ({ userId, nome: nameById[userId] || userId, minutes: Number(minutes) }))
      .sort((a, b) => b.minutes - a.minutes);
    res.json({ users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao ler tempo online' });
  }
});

app.post('/api/tempo-online', async (req, res) => {
  try {
    const body = req.body;
    const userId = body != null && body.userId != null ? String(body.userId) : null;
    const minutesToAdd = body != null && typeof body.minutes === 'number' ? body.minutes : 5;
    if (!userId) {
      return res.status(400).json({ error: 'Corpo deve ter userId' });
    }
    const currentWeek = getCurrentWeekKey();
    let data = await readJson('tempoOnline');
    if (!data || data.weekKey !== currentWeek) {
      data = { weekKey: currentWeek, minutesByUser: {} };
    }
    if (typeof data.minutesByUser !== 'object') data.minutesByUser = {};
    const prev = Number(data.minutesByUser[userId]) || 0;
    data.minutesByUser[userId] = prev + minutesToAdd;
    await writeJson('tempoOnline', data);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao guardar tempo online' });
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
