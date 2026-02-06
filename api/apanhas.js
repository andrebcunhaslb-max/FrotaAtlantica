const { readJson, writeJson } = require('./lib/data');

module.exports = async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  if (req.method === 'GET') {
    try {
      const data = await readJson('apanhas');
      res.status(200).json(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erro ao ler apanhas' });
    }
    return;
  }
  if (req.method === 'POST') {
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
      }));
      await writeJson('apanhas', out);
      res.status(200).json({ ok: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erro ao guardar apanhas' });
    }
    return;
  }
  res.setHeader('Allow', 'GET, POST');
  res.status(405).json({ error: 'Method Not Allowed' });
};
