const { readJson, writeJson } = require('./lib/data');

module.exports = async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'DELETE') {
    res.setHeader('Allow', 'DELETE');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
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
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao apagar mensagem' });
  }
};
