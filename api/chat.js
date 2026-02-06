const { readJson, writeJson } = require('./lib/data');

const CHAT_MAX = 200;

module.exports = async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  const grupo = typeof req.query?.grupo === 'string' ? req.query.grupo.trim() : null;

  if (req.method === 'GET') {
    try {
      if (grupo) {
        const data = await readJson('chat-equipa');
        const byGrupo = data && typeof data === 'object' && !Array.isArray(data) ? data : {};
        const list = Array.isArray(byGrupo[grupo]) ? byGrupo[grupo] : [];
        return res.status(200).json(list.slice(-CHAT_MAX));
      }
      const data = await readJson('chat');
      const list = Array.isArray(data) ? data : [];
      res.status(200).json(list.slice(-CHAT_MAX));
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erro ao ler chat' });
    }
    return;
  }

  if (req.method === 'POST') {
    try {
      const body = req.body || {};
      if (typeof body.text !== 'string' || !body.userId || !body.userName) {
        return res.status(400).json({ error: 'Corpo deve ter userId, userName e text' });
      }
      const text = String(body.text).trim();
      if (!text) return res.status(400).json({ error: 'text não pode estar vazio' });

      const message = {
        id: Date.now() + Math.random(),
        userId: body.userId,
        userName: String(body.userName),
        cargo: body.cargo != null ? String(body.cargo) : '',
        text,
        timestamp: new Date().toISOString(),
      };

      const g = typeof body.grupo === 'string' ? body.grupo.trim() : null;
      if (g) {
        const usuariosData = await readJson('usuarios');
        const usuariosList = Array.isArray(usuariosData) ? usuariosData : [];
        const u = usuariosList.find((x) => String(x.id) === String(body.userId));
        if (!u) return res.status(403).json({ error: 'Utilizador não encontrado' });
        const cargo = (u.cargo || '').toLowerCase();
        const isDirecaoGestor = cargo === 'direcao' || cargo === 'gestor';
        const inTeam = (u.grupo || '').trim() === g;
        if (!isDirecaoGestor && !inTeam) {
          return res.status(403).json({ error: 'Sem permissão para enviar mensagens nesta equipa' });
        }
        message.grupo = g;
        const data = await readJson('chat-equipa');
        const byGrupo = data && typeof data === 'object' && !Array.isArray(data) ? data : {};
        const list = Array.isArray(byGrupo[g]) ? byGrupo[g] : [];
        list.push(message);
        byGrupo[g] = list.slice(-CHAT_MAX);
        await writeJson('chat-equipa', byGrupo);
      } else {
        const data = await readJson('chat');
        const list = Array.isArray(data) ? data : [];
        list.push(message);
        await writeJson('chat', list.slice(-CHAT_MAX));
      }
      res.status(200).json({ ok: true, message });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erro ao guardar mensagem' });
    }
    return;
  }

  res.setHeader('Allow', 'GET, POST');
  res.status(405).json({ error: 'Method Not Allowed' });
};
