const fs = require('fs').promises;
const path = require('path');

// On Vercel, filesystem is read-only except /tmp; use it for ephemeral JSON storage
const DATA_DIR = process.env.VERCEL
  ? path.join('/tmp', 'frota-data')
  : path.join(process.cwd(), 'data');

function dataPath(name) {
  return path.join(DATA_DIR, `${name}.json`);
}

async function readJson(name) {
  try {
    const raw = await fs.readFile(dataPath(name), 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    if (err.code === 'ENOENT') return null;
    throw err;
  }
}

async function writeJson(name, data) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(dataPath(name), JSON.stringify(data, null, 2), 'utf8');
}

module.exports = { readJson, writeJson, dataPath, DATA_DIR };
