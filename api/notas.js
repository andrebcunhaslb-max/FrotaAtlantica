const { readJson, writeJson } = require('./lib/data');

module.exports = async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  if (req.method === 'GET') {
    try {
      const userId = typeof req.query.userId === 'string' ? req.query.userId.trim() : null;
      if (!userId) {
        return res.status(400).json({ error: 'Query userId é obrigatório' });
      }
      const data = await readJson('notas');
      const byUser = data && typeof data === 'object' && !Array.isArray(data) ? data : {};
      const content = typeof byUser[userId] === 'string' ? byUser[userId] : '';
      res.status(200).json({ content });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erro ao ler notas' });
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
      const data = await readJson('notas');
      const byUser = data && typeof data === 'object' && !Array.isArray(data) ? { ...data } : {};
      byUser[userId] = content;
      await writeJson('notas', byUser);
      res.status(200).json({ ok: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erro ao guardar notas' });
    }
    return;
  }
  res.setHeader('Allow', 'GET, POST');
  res.status(405).json({ error: 'Method Not Allowed' });
};
