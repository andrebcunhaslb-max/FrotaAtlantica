const { readJson, writeJson } = require('./lib/data');

module.exports = async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  if (req.method === 'GET') {
    try {
      const data = await readJson('registos');
      res.status(200).json(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erro ao ler registos' });
    }
    return;
  }
  if (req.method === 'POST') {
    try {
      const body = req.body;
      if (!Array.isArray(body)) {
        return res.status(400).json({ error: 'Corpo deve ser um array' });
      }
      await writeJson('registos', body);
      res.status(200).json({ ok: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erro ao guardar registos' });
    }
    return;
  }
  res.setHeader('Allow', 'GET, POST');
  res.status(405).json({ error: 'Method Not Allowed' });
};
