export async function apiGet(name) {
  const r = await fetch(`/api/${name}`);
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function apiPost(name, data) {
  const r = await fetch(`/api/${name}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}
