const { readJson, writeJson } = require('./lib/data');

function isDirecao(usuariosList, userId) {
  const u = usuariosList.find((x) => String(x.id) === String(userId));
  return u && (u.cargo || '').toLowerCase() === 'direcao';
}

module.exports = async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  if (req.method === 'GET') {
    try {
      const userId = typeof req.query.userId === 'string' ? req.query.userId.trim() : null;
      if (!userId) {
        return res.status(400).json({ error: 'Query userId é obrigatório' });
      }
      const usuariosData = await readJson('usuarios');
      const usuariosList = Array.isArray(usuariosData) ? usuariosData : [];
      if (!isDirecao(usuariosList, userId)) {
        return res.status(403).json({ error: 'Apenas a direção pode aceder' });
      }
      const data = await readJson('notas-admin');
      const content = data && typeof data.content === 'string' ? data.content : '';
      res.status(200).json({ content });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erro ao ler notas da direção' });
    }
    return;
  }
  if (req.method === 'POST') {
    try {
      const body = req.body || {};
      const userId = body.userId != null ? String(body.userId).trim() : null;
      const content = typeof body.content === 'string' ? body.content : '';
      if (!userId) {
        return res.status(400).json({ error: 'Corpo deve ter userId' });
      }
      const usuariosData = await readJson('usuarios');
      const usuariosList = Array.isArray(usuariosData) ? usuariosData : [];
      if (!isDirecao(usuariosList, userId)) {
        return res.status(403).json({ error: 'Apenas a direção pode guardar' });
      }
      await writeJson('notas-admin', { content });
      res.status(200).json({ ok: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erro ao guardar notas da direção' });
    }
    return;
  }
  res.setHeader('Allow', 'GET, POST');
  res.status(405).json({ error: 'Method Not Allowed' });
};
