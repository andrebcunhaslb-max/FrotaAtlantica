const { readJson, writeJson } = require('./lib/data');

const COMUNICADOS_MAX = 100;

module.exports = async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  const grupo = typeof req.query?.grupo === 'string' ? req.query.grupo.trim() : null;

  if (req.method === 'GET') {
    try {
      if (!grupo) return res.status(200).json([]);
      const data = await readJson('comunicados');
      const byGrupo = data && typeof data === 'object' && !Array.isArray(data) ? data : {};
      const list = Array.isArray(byGrupo[grupo]) ? byGrupo[grupo] : [];
      res.status(200).json(list.slice(-COMUNICADOS_MAX));
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erro ao ler comunicados' });
    }
    return;
  }

  if (req.method === 'POST') {
    try {
      const body = req.body || {};
      const g = typeof body.grupo === 'string' ? body.grupo.trim() : null;
      if (!g || !body.userId || !body.userName || typeof body.text !== 'string') {
        return res.status(400).json({ error: 'Corpo deve ter grupo, userId, userName e text' });
      }
      const text = String(body.text).trim();
      if (!text) return res.status(400).json({ error: 'text não pode estar vazio' });

      const usuariosData = await readJson('usuarios');
      const usuariosList = Array.isArray(usuariosData) ? usuariosData : [];
      const u = usuariosList.find((x) => String(x.id) === String(body.userId));
      if (!u || (u.grupo || '').trim() !== g) {
        return res.status(403).json({ error: 'Sem permissão para publicar comunicados nesta equipa' });
      }
      if ((u.cargo || '').toLowerCase() !== 'supervisor') {
        return res.status(403).json({ error: 'Apenas supervisores podem publicar comunicados' });
      }

      const msg = {
        id: Date.now() + Math.random(),
        userId: body.userId,
        userName: String(body.userName),
        grupo: g,
        text,
        timestamp: new Date().toISOString(),
      };

      const data = await readJson('comunicados');
      const byGrupo = data && typeof data === 'object' && !Array.isArray(data) ? data : {};
      const list = Array.isArray(byGrupo[g]) ? byGrupo[g] : [];
      list.push(msg);
      byGrupo[g] = list.slice(-COMUNICADOS_MAX);
      await writeJson('comunicados', byGrupo);
      res.status(200).json({ ok: true, message: msg });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erro ao guardar comunicado' });
    }
    return;
  }

  res.setHeader('Allow', 'GET, POST');
  res.status(405).json({ error: 'Method Not Allowed' });
};
