export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://dontbeanaskhole.com');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const entry = { ...req.body, timestamp: new Date().toISOString() };

  const API = `https://api.github.com/repos/commonsensicaldpo/dontbeanaskhole/contents/data.json`;
  const headers = {
    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    Accept: 'application/vnd.github+json',
    'User-Agent': 'vercel-askhole-form',
    'Content-Type': 'application/json'
  };

  const fileRes = await fetch(`${API}?ref=gh-pages`, { headers });
  if (!fileRes.ok) return res.status(500).json({ error: 'Could not read data.json' });

  const file = await fileRes.json();
  const current = JSON.parse(Buffer.from(file.content, 'base64').toString('utf8'));
  current.push(entry);

  const putRes = await fetch(API, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      message: `Form submission – ${entry.email}`,
      content: Buffer.from(JSON.stringify(current, null, 2)).toString('base64'),
      sha: file.sha,
      branch: 'gh-pages'
    })
  });

  if (!putRes.ok) {
    const err = await putRes.json();
    return res.status(500).json({ error: err.message });
  }

  res.status(200).json({ ok: true });
}
