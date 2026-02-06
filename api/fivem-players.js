module.exports = async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  const code = req.query.code || '875vq5';
  const url = `https://servers-frontend.fivem.net/api/servers/single/${code}`;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const resp = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!resp.ok) {
      return res.status(200).json({
        players: [],
        online: false,
        error: `FiveM API: ${resp.status}`,
      });
    }
    const json = await resp.json();
    const players = (json.Data && json.Data.players) || json.players || [];
    const stripFivemColors = (s) =>
      typeof s === 'string'
        ? s.replace(/\^./g, '').replace(/~[^~]*~/g, '').trim()
        : '';
    const out = players.map((p) => ({
      name: stripFivemColors(p.name) || p.name,
      id: p.id,
      ping: p.ping,
    }));
    res.status(200).json({ players: out, online: out.length > 0 });
  } catch (err) {
    console.error('fivem-players:', err.message);
    res.status(200).json({
      players: [],
      online: false,
      error: err.message || 'Erro ao obter jogadores',
    });
  }
};
