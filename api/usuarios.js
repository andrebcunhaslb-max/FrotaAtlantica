const { readJson, writeJson } = require('./lib/data');

// Utilizadores iniciais quando não existe ficheiro (primeira execução / Vercel)
const USUARIOS_SEED = [
  { id: 1, nome: 'admin', cargo: 'direcao', grupo: 'A', fivem_nick: 'Mauricio', pin: '1234' },
  { id: 2, nome: 'André Silva', cargo: 'direcao', grupo: '', fivem_nick: 'MonsterPT', pin: '1990' },
  { id: 3, nome: 'Red', cargo: 'funcionario', grupo: '', pin: '1111' }
];

module.exports = async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  if (req.method === 'GET') {
    try {
      const data = await readJson('usuarios');
      if (Array.isArray(data) && data.length > 0) {
        return res.status(200).json(data);
      }
      res.status(200).json(USUARIOS_SEED);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erro ao ler utilizadores' });
    }
    return;
  }
  if (req.method === 'POST') {
    try {
      const body = req.body;
      if (!Array.isArray(body)) {
        return res.status(400).json({ error: 'Corpo deve ser um array' });
      }
      await writeJson('usuarios', body);
      res.status(200).json({ ok: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erro ao guardar utilizadores' });
    }
    return;
  }
  res.setHeader('Allow', 'GET, POST');
  res.status(405).json({ error: 'Method Not Allowed' });
};
