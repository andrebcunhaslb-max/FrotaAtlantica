const { readJson, writeJson } = require('./lib/data');

module.exports = async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  if (req.method === 'GET') {
    try {
      const data = await readJson('caixa');
      res.status(200).json(
        data && typeof data.valorTotal === 'number' ? data : { valorTotal: 0 }
      );
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erro ao ler caixa' });
    }
    return;
  }
  if (req.method === 'POST') {
    try {
      const body = req.body;
      if (body == null || typeof body.valorTotal !== 'number') {
        return res.status(400).json({ error: 'Corpo deve ter valorTotal (número)' });
      }
      await writeJson('caixa', { valorTotal: body.valorTotal });
      res.status(200).json({ ok: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erro ao guardar caixa' });
    }
    return;
  }
  res.setHeader('Allow', 'GET, POST');
  res.status(405).json({ error: 'Method Not Allowed' });
};
