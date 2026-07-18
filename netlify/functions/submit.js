exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': 'https://dontbeanaskhole.com',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: 'Method not allowed' };

  const entry = { ...JSON.parse(event.body), timestamp: new Date().toISOString() };

  const API = 'https://api.github.com/repos/commonsensicaldpo/dontbeanaskhole/contents/data.json';
  const ghHeaders = {
    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    Accept: 'application/vnd.github+json',
    'User-Agent': 'netlify-askhole-form',
    'Content-Type': 'application/json'
  };

  const fileRes = await fetch(`${API}?ref=gh-pages`, { headers: ghHeaders });
  if (!fileRes.ok) return { statusCode: 500, headers, body: JSON.stringify({ error: 'Could not read data.json' }) };

  const file = await fileRes.json();
  const current = JSON.parse(Buffer.from(file.content, 'base64').toString('utf8'));
  current.push(entry);

  const putRes = await fetch(API, {
    method: 'PUT',
    headers: ghHeaders,
    body: JSON.stringify({
      message: `Form submission – ${entry.email}`,
      content: Buffer.from(JSON.stringify(current, null, 2)).toString('base64'),
      sha: file.sha,
      branch: 'gh-pages'
    })
  });

  if (!putRes.ok) {
    const err = await putRes.json();
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }

  return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
};
