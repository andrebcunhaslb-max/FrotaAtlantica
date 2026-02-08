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

app.get('/api/armazem-patrao', async (req, res) => {
  try {
    const data = await readJson('armazemPatrao');
    const list = Array.isArray(data) ? data : [];
    const normalized = list.map((r) => {
      const tipo = r?.tipo === 'saida' ? 'saida' : 'entrada';
      if (r?.itens && Array.isArray(r.itens)) return { ...r, tipo };
      if (r?.nome != null) return { id: r.id, dataRegisto: r.dataRegisto, registadoPor: r.registadoPor, tipo, itens: [{ nome: r.nome, quantidade: r.quantidade ?? 0 }] };
      return { ...r, tipo };
    });
    res.json(normalized);
  } catch (err) {
    console.error(err);
    res.json([]);
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

const PRECO_PLASTICO_DEFAULT = { sem: 3, parceria: 38 };
app.get('/api/preco-plastico', async (req, res) => {
  try {
    const data = await readJson('precoPlastico');
    const sem = typeof data?.sem === 'number' ? data.sem : PRECO_PLASTICO_DEFAULT.sem;
    const parceria = typeof data?.parceria === 'number' ? data.parceria : PRECO_PLASTICO_DEFAULT.parceria;
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
    res.json({ ...PRECO_PLASTICO_DEFAULT, porUtilizador: {} });
  }
});

app.post('/api/preco-plastico', async (req, res) => {
  try {
    const body = req.body;
    if (body == null || typeof body !== 'object') {
      return res.status(400).json({ error: 'Corpo deve ser um objeto { sem?, parceria?, porUtilizador? }' });
    }
    const existing = await readJson('precoPlastico');
    const sem = body.sem != null ? (typeof body.sem === 'number' ? body.sem : Number(body.sem)) : (typeof existing?.sem === 'number' ? existing.sem : PRECO_PLASTICO_DEFAULT.sem);
    const parceria = body.parceria != null ? (typeof body.parceria === 'number' ? body.parceria : Number(body.parceria)) : (typeof existing?.parceria === 'number' ? existing.parceria : PRECO_PLASTICO_DEFAULT.parceria);
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
    await writeJson('precoPlastico', { sem, parceria, porUtilizador });
    res.json({ ok: true, sem, parceria, porUtilizador });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao guardar preços do plástico' });
  }
});

app.get('/api/apanhas-plastico', async (req, res) => {
  try {
    const data = await readJson('apanhasPlastico');
    res.json(Array.isArray(data) ? data : []);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao ler apanhas de plástico' });
  }
});

app.post('/api/apanhas-plastico', async (req, res) => {
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
    await writeJson('apanhasPlastico', out);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao guardar apanhas de plástico' });
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
    const aprovadoPor = body != null && body.aprovadoPor != null ? String(body.aprovadoPor).trim() || null : null;
    const valor = body != null && body.valor != null && !Number.isNaN(Number(body.valor)) ? Number(body.valor) : null;
    let data = await readJson('cicloPagamento');
    const cicloInicio = data && typeof data.cicloInicio === 'string' ? data.cicloInicio : now;
    let porUtilizador = data && data.porUtilizador && typeof data.porUtilizador === 'object' ? { ...data.porUtilizador } : {};
    porUtilizador[userId] = { data: now, aprovadoPor: aprovadoPor || undefined, valor: valor != null ? valor : undefined };
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

app.get('/api/ciclo-pagamento-plastico', async (req, res) => {
  try {
    const data = await readJson('cicloPagamentoPlastico');
    const defaultCicloInicio = startOfCurrentWeekISO();
    let cicloInicio = data && typeof data.cicloInicio === 'string' ? data.cicloInicio : defaultCicloInicio;
    let porUtilizador = data && data.porUtilizador && typeof data.porUtilizador === 'object' ? data.porUtilizador : {};
    const noUserCycles = !porUtilizador || Object.keys(porUtilizador).length === 0;
    const cicloDate = new Date(cicloInicio);
    const now = new Date();
    const sameDay = cicloDate.getUTCDate() === now.getUTCDate() && cicloDate.getUTCMonth() === now.getUTCMonth() && cicloDate.getUTCFullYear() === now.getUTCFullYear();
    if (data && noUserCycles && sameDay && cicloDate.getTime() > now.getTime() - 24 * 60 * 60 * 1000) {
      cicloInicio = defaultCicloInicio;
      await writeJson('cicloPagamentoPlastico', { cicloInicio, porUtilizador: {} });
    } else if (!data || typeof data.cicloInicio !== 'string') {
      await writeJson('cicloPagamentoPlastico', { cicloInicio, porUtilizador: porUtilizador && Object.keys(porUtilizador).length ? porUtilizador : {} });
    }
    res.json({ cicloInicio, porUtilizador });
  } catch (err) {
    console.error(err);
    res.json({ cicloInicio: startOfCurrentWeekISO(), porUtilizador: {} });
  }
});

app.post('/api/ciclo-pagamento-plastico/pagar', async (req, res) => {
  try {
    const body = req.body;
    const userId = body != null && body.userId != null ? String(body.userId) : null;
    if (!userId) {
      return res.status(400).json({ error: 'Corpo deve ter userId' });
    }
    const now = new Date().toISOString();
    const aprovadoPor = body != null && body.aprovadoPor != null ? String(body.aprovadoPor).trim() || null : null;
    const valor = body != null && body.valor != null && !Number.isNaN(Number(body.valor)) ? Number(body.valor) : null;
    let data = await readJson('cicloPagamentoPlastico');
    const cicloInicio = data && typeof data.cicloInicio === 'string' ? data.cicloInicio : now;
    let porUtilizador = data && data.porUtilizador && typeof data.porUtilizador === 'object' ? { ...data.porUtilizador } : {};
    porUtilizador[userId] = { data: now, aprovadoPor: aprovadoPor || undefined, valor: valor != null ? valor : undefined };
    await writeJson('cicloPagamentoPlastico', { cicloInicio, porUtilizador });

    const metasList = await readJson('metasPlastico');
    const metasArray = Array.isArray(metasList) ? metasList : [];
    const metasFiltered = metasArray.filter((m) => String(m.userId) !== userId);
    await writeJson('metasPlastico', metasFiltered);

    res.json({ ok: true, porUtilizador });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao marcar pagamento de plástico' });
  }
});

app.get('/api/metas-plastico', async (req, res) => {
  try {
    const data = await readJson('metasPlastico');
    res.json(Array.isArray(data) ? data : []);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao ler metas de plástico' });
  }
});

app.post('/api/metas-plastico', async (req, res) => {
  try {
    const body = req.body;
    if (!Array.isArray(body)) {
      return res.status(400).json({ error: 'Corpo deve ser um array' });
    }
    await writeJson('metasPlastico', body);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao guardar metas de plástico' });
  }
});

const CHAT_MAX = 200;
const COMUNICADOS_MAX = 100;

app.get('/api/chat', async (req, res) => {
  try {
    const grupo = typeof req.query.grupo === 'string' ? req.query.grupo.trim() : null;
    if (grupo) {
      const data = await readJson('chat-equipa');
      const byGrupo = data && typeof data === 'object' && !Array.isArray(data) ? data : {};
      const list = Array.isArray(byGrupo[grupo]) ? byGrupo[grupo] : [];
      res.json(list.slice(-CHAT_MAX));
    } else {
      const data = await readJson('chat');
      const list = Array.isArray(data) ? data : [];
      res.json(list.slice(-CHAT_MAX));
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao ler chat' });
  }
});

app.get('/api/comunicados', async (req, res) => {
  try {
    const grupo = typeof req.query.grupo === 'string' ? req.query.grupo.trim() : null;
    if (!grupo) return res.json([]);
    const data = await readJson('comunicados');
    const byGrupo = data && typeof data === 'object' && !Array.isArray(data) ? data : {};
    const list = Array.isArray(byGrupo[grupo]) ? byGrupo[grupo] : [];
    res.json(list.slice(-COMUNICADOS_MAX));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao ler comunicados' });
  }
});

const CHAT_PRIVADO_MAX = 500;
const PARCEIROS_MAX = 200;
const COMUNICADOS_GLOBAIS_MAX = 200;

app.get('/api/chat-privado', async (req, res) => {
  try {
    const userId = typeof req.query.userId === 'string' ? req.query.userId.trim() : null;
    const withId = typeof req.query.with === 'string' ? req.query.with.trim() : null;
    if (!userId || !withId) return res.json([]);
    const data = await readJson('chat-privado');
    const list = Array.isArray(data) ? data : [];
    const filtered = list.filter(
      (m) =>
        (String(m.fromUserId) === userId && String(m.toUserId) === withId) ||
        (String(m.fromUserId) === withId && String(m.toUserId) === userId)
    );
    res.json(filtered.slice(-CHAT_PRIVADO_MAX));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao ler mensagens privadas' });
  }
});

app.get('/api/parceiros', async (req, res) => {
  try {
    const data = await readJson('parceiros');
    const list = Array.isArray(data) ? data : [];
    res.json(list.slice(-PARCEIROS_MAX));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao ler parceiros' });
  }
});

app.get('/api/comunicados-globais', async (req, res) => {
  try {
    const data = await readJson('comunicados-globais');
    const list = Array.isArray(data) ? data : [];
    res.json(list.slice(-COMUNICADOS_GLOBAIS_MAX));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao ler comunicados globais' });
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

app.post('/api/armazem-patrao', async (req, res) => {
  try {
    const body = req.body;
    if (body == null || typeof body !== 'object') {
      return res.status(400).json({ error: 'Corpo deve ser um objeto { itens: [{ nome, quantidade }], registadoPor? }' });
    }
    const rawItens = Array.isArray(body.itens) ? body.itens : [];
    const itens = [];
    for (const it of rawItens) {
      const nome = it?.nome != null ? String(it.nome).trim() : '';
      if (!nome) continue;
      const quantidade = it?.quantidade != null ? Number(it.quantidade) : 0;
      if (Number.isNaN(quantidade) || quantidade < 0) continue;
      itens.push({ nome, quantidade });
    }
    if (itens.length === 0) return res.status(400).json({ error: 'Deve incluir pelo menos um item válido (nome e quantidade)' });
    const registadoPor = body.registadoPor != null ? String(body.registadoPor).trim() || null : null;
    const tipoRaw = body.tipo != null ? String(body.tipo).toLowerCase().trim() : 'entrada';
    const tipo = tipoRaw === 'saida' ? 'saida' : 'entrada';
    const now = new Date().toISOString();
    const id = Date.now();
    const registo = { id, dataRegisto: now, registadoPor: registadoPor || undefined, tipo, itens };
    let list = await readJson('armazemPatrao');
    if (!Array.isArray(list)) list = [];
    list = [...list, registo];
    await writeJson('armazemPatrao', list);
    res.json({ ok: true, registo });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao guardar registo do armazém' });
  }
});

app.delete('/api/armazem-patrao', async (req, res) => {
  try {
    const body = req.body;
    const id = body?.id != null ? body.id : null;
    if (id == null) return res.status(400).json({ error: 'Corpo deve ter id' });
    let list = await readJson('armazemPatrao');
    if (!Array.isArray(list)) list = [];
    list = list.filter((r) => String(r.id) !== String(id));
    await writeJson('armazemPatrao', list);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao apagar registo' });
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
    const grupo = typeof body.grupo === 'string' ? body.grupo.trim() : null;
    const message = {
      id: Date.now() + Math.random(),
      userId: body.userId,
      userName: String(body.userName),
      cargo: body.cargo != null ? String(body.cargo) : '',
      text,
      timestamp: new Date().toISOString()
    };
    if (grupo) {
      const usuariosData = await readJson('usuarios');
      const usuariosList = Array.isArray(usuariosData) ? usuariosData : [];
      const u = usuariosList.find((x) => String(x.id) === String(body.userId));
      if (!u) return res.status(403).json({ error: 'Utilizador não encontrado' });
      const cargo = (u.cargo || '').toLowerCase();
      const isDirecaoGestor = cargo === 'direcao' || cargo === 'gestor';
      const inTeam = (u.grupo || '').trim() === grupo;
      if (!isDirecaoGestor && !inTeam) {
        return res.status(403).json({ error: 'Sem permissão para enviar mensagens nesta equipa' });
      }
      message.grupo = grupo;
      const data = await readJson('chat-equipa');
      const byGrupo = data && typeof data === 'object' && !Array.isArray(data) ? data : {};
      const list = Array.isArray(byGrupo[grupo]) ? byGrupo[grupo] : [];
      list.push(message);
      byGrupo[grupo] = list.slice(-CHAT_MAX);
      await writeJson('chat-equipa', byGrupo);
    } else {
      const data = await readJson('chat');
      const list = Array.isArray(data) ? data : [];
      list.push(message);
      await writeJson('chat', list.slice(-CHAT_MAX));
    }
    res.json({ ok: true, message });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao guardar mensagem' });
  }
});

app.post('/api/chat-privado', async (req, res) => {
  try {
    const body = req.body;
    if (body == null || typeof body.text !== 'string' || !body.userId || !body.userName || body.toUserId == null) {
      return res.status(400).json({ error: 'Corpo deve ter userId, userName, toUserId e text' });
    }
    const text = String(body.text).trim();
    if (!text) return res.status(400).json({ error: 'text não pode estar vazio' });
    const fromUserId = String(body.userId);
    const toUserId = String(body.toUserId);
    if (fromUserId === toUserId) return res.status(400).json({ error: 'Não podes enviar mensagem a ti próprio' });
    const message = {
      id: Date.now() + Math.random(),
      fromUserId,
      toUserId,
      userName: String(body.userName),
      text,
      timestamp: new Date().toISOString()
    };
    const data = await readJson('chat-privado');
    const list = Array.isArray(data) ? data : [];
    list.push(message);
    await writeJson('chat-privado', list.slice(-CHAT_PRIVADO_MAX));
    res.json({ ok: true, message });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao enviar mensagem privada' });
  }
});

function isDirecaoOnly(usuariosList, userId) {
  const u = usuariosList.find((x) => String(x.id) === String(userId));
  if (!u) return false;
  return (u.cargo || '').toLowerCase() === 'direcao';
}

app.post('/api/parceiros', async (req, res) => {
  try {
    const body = req.body;
    if (body == null || typeof body.text !== 'string' || !body.userId || !body.userName) {
      return res.status(400).json({ error: 'Corpo deve ter userId, userName e text' });
    }
    const text = String(body.text).trim();
    if (!text) return res.status(400).json({ error: 'text não pode estar vazio' });
    const usuariosData = await readJson('usuarios');
    const usuariosList = Array.isArray(usuariosData) ? usuariosData : [];
    if (!isDirecaoOnly(usuariosList, body.userId)) {
      return res.status(403).json({ error: 'Apenas a direção pode publicar em Parceiros' });
    }
    const msg = {
      id: Date.now() + Math.random(),
      userId: body.userId,
      userName: String(body.userName),
      text,
      timestamp: new Date().toISOString()
    };
    const data = await readJson('parceiros');
    const list = Array.isArray(data) ? data : [];
    list.push(msg);
    await writeJson('parceiros', list.slice(-PARCEIROS_MAX));
    res.json({ ok: true, message: msg });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao publicar em Parceiros' });
  }
});

app.post('/api/comunicados-globais', async (req, res) => {
  try {
    const body = req.body;
    if (body == null || typeof body.text !== 'string' || !body.userId || !body.userName) {
      return res.status(400).json({ error: 'Corpo deve ter userId, userName e text' });
    }
    const text = String(body.text).trim();
    if (!text) return res.status(400).json({ error: 'text não pode estar vazio' });
    const usuariosData = await readJson('usuarios');
    const usuariosList = Array.isArray(usuariosData) ? usuariosData : [];
    if (!isDirecaoOnly(usuariosList, body.userId)) {
      return res.status(403).json({ error: 'Apenas a direção pode publicar Comunicados globais' });
    }
    const msg = {
      id: Date.now() + Math.random(),
      userId: body.userId,
      userName: String(body.userName),
      text,
      timestamp: new Date().toISOString()
    };
    const data = await readJson('comunicados-globais');
    const list = Array.isArray(data) ? data : [];
    list.push(msg);
    await writeJson('comunicados-globais', list.slice(-COMUNICADOS_GLOBAIS_MAX));
    res.json({ ok: true, message: msg });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao publicar comunicado global' });
  }
});

app.delete('/api/chat-equipa', async (req, res) => {
  try {
    const body = req.body || {};
    const grupo = typeof body.grupo === 'string' ? body.grupo.trim() : null;
    const messageId = body.messageId ?? body.id;
    const userId = body.userId;
    if (!grupo || messageId == null || !userId) {
      return res.status(400).json({ error: 'Corpo deve ter grupo, messageId e userId' });
    }
    const usuariosData = await readJson('usuarios');
    const usuariosList = Array.isArray(usuariosData) ? usuariosData : [];
    const u = usuariosList.find((x) => String(x.id) === String(userId));
    if (!u) return res.status(403).json({ error: 'Utilizador não encontrado' });
    const cargo = (u.cargo || '').toLowerCase();
    const isDirecaoGestor = cargo === 'direcao' || cargo === 'gestor';
    const isSupervisorInTeam = cargo === 'supervisor' && (u.grupo || '').trim() === grupo;
    if (!isDirecaoGestor && !isSupervisorInTeam) {
      return res.status(403).json({ error: 'Apenas supervisores da equipa ou direção/gestores podem apagar mensagens' });
    }
    const data = await readJson('chat-equipa');
    const byGrupo = data && typeof data === 'object' && !Array.isArray(data) ? data : {};
    const list = Array.isArray(byGrupo[grupo]) ? byGrupo[grupo] : [];
    const filtered = list.filter((m) => String(m.id) !== String(messageId));
    if (filtered.length === list.length) {
      return res.status(404).json({ error: 'Mensagem não encontrada' });
    }
    byGrupo[grupo] = filtered;
    await writeJson('chat-equipa', byGrupo);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao apagar mensagem' });
  }
});

app.delete('/api/comunicados', async (req, res) => {
  try {
    const body = req.body || {};
    const grupo = typeof body.grupo === 'string' ? body.grupo.trim() : null;
    const messageId = body.messageId ?? body.id;
    const userId = body.userId;
    if (!grupo || messageId == null || !userId) {
      return res.status(400).json({ error: 'Corpo deve ter grupo, messageId e userId' });
    }
    const usuariosData = await readJson('usuarios');
    const usuariosList = Array.isArray(usuariosData) ? usuariosData : [];
    const u = usuariosList.find((x) => String(x.id) === String(userId));
    if (!u) return res.status(403).json({ error: 'Utilizador não encontrado' });
    const cargo = (u.cargo || '').toLowerCase();
    const isDirecaoGestor = cargo === 'direcao' || cargo === 'gestor';
    const isSupervisorInTeam = cargo === 'supervisor' && (u.grupo || '').trim() === grupo;
    if (!isDirecaoGestor && !isSupervisorInTeam) {
      return res.status(403).json({ error: 'Apenas supervisores da equipa ou direção/gestores podem apagar comunicados' });
    }
    const data = await readJson('comunicados');
    const byGrupo = data && typeof data === 'object' && !Array.isArray(data) ? data : {};
    const list = Array.isArray(byGrupo[grupo]) ? byGrupo[grupo] : [];
    const filtered = list.filter((m) => String(m.id) !== String(messageId));
    if (filtered.length === list.length) {
      return res.status(404).json({ error: 'Comunicado não encontrado' });
    }
    byGrupo[grupo] = filtered;
    await writeJson('comunicados', byGrupo);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao apagar comunicado' });
  }
});

app.post('/api/comunicados', async (req, res) => {
  try {
    const body = req.body;
    const grupo = typeof body.grupo === 'string' ? body.grupo.trim() : null;
    if (!grupo || !body.userId || !body.userName || typeof body.text !== 'string') {
      return res.status(400).json({ error: 'Corpo deve ter grupo, userId, userName e text' });
    }
    const text = String(body.text).trim();
    if (!text) return res.status(400).json({ error: 'text não pode estar vazio' });
    const usuariosData = await readJson('usuarios');
    const usuariosList = Array.isArray(usuariosData) ? usuariosData : [];
    const u = usuariosList.find((x) => String(x.id) === String(body.userId));
    if (!u) return res.status(403).json({ error: 'Utilizador não encontrado' });
    const cargo = (u.cargo || '').toLowerCase();
    const isDirecaoGestor = cargo === 'direcao' || cargo === 'gestor';
    const isSupervisorInTeam = cargo === 'supervisor' && (u.grupo || '').trim() === grupo;
    if (!isDirecaoGestor && !isSupervisorInTeam) {
      return res.status(403).json({ error: 'Apenas supervisores da equipa ou direção/gestores podem publicar comunicados' });
    }
    const data = await readJson('comunicados');
    const byGrupo = data && typeof data === 'object' && !Array.isArray(data) ? data : {};
    const list = Array.isArray(byGrupo[grupo]) ? byGrupo[grupo] : [];
    const msg = {
      id: Date.now() + Math.random(),
      userId: body.userId,
      userName: String(body.userName),
      grupo,
      text,
      timestamp: new Date().toISOString()
    };
    list.push(msg);
    byGrupo[grupo] = list.slice(-COMUNICADOS_MAX);
    await writeJson('comunicados', byGrupo);
    res.json({ ok: true, message: msg });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao guardar comunicado' });
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
