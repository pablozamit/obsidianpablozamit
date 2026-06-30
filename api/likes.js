const crypto = require('crypto');

const KV_URL = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;

function getClientIP(req) {
    const xff = req.headers['x-forwarded-for'];
    if (xff) return xff.split(',')[0].trim();
    const realIp = req.headers['x-real-ip'];
    if (realIp) return realIp.trim();
    return '127.0.0.1';
}

function hashIP(ip) {
    return crypto.createHash('sha256').update(ip).digest('hex').slice(0, 16);
}

async function kvGet(key) {
    const res = await fetch(`${KV_URL}/get/${encodeURIComponent(key)}`, {
        headers: { Authorization: `Bearer ${KV_TOKEN}` }
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.result;
}

async function kvSet(key, value, ttlSeconds) {
    const params = ttlSeconds ? `?EX=${ttlSeconds}` : '';
    const res = await fetch(`${KV_URL}/set/${encodeURIComponent(key)}${params}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${KV_TOKEN}`, 'Content-Type': 'text/plain' },
        body: String(value)
    });
    if (!res.ok) throw new Error(`KV SET failed: ${res.status}`);
}

async function kvHGet(key, field) {
    const res = await fetch(`${KV_URL}/hget/${encodeURIComponent(key)}/${encodeURIComponent(field)}`, {
        headers: { Authorization: `Bearer ${KV_TOKEN}` }
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.result;
}

async function kvHIncrBy(key, field, incr) {
    const res = await fetch(`${KV_URL}/hincrby/${encodeURIComponent(key)}/${encodeURIComponent(field)}/${incr}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${KV_TOKEN}` }
    });
    if (!res.ok) throw new Error(`KV HINCRBY failed: ${res.status}`);
    const data = await res.json();
    return parseInt(data.result || '0', 10) || 0;
}

module.exports = async function handler(req, res) {
    if (!KV_URL || !KV_TOKEN) {
        return res.status(200).json({ likes: 0, dislikes: 0, fallback: true });
    }

    const slug = (req.query && req.query.slug) || '';
    if (!slug || !/^[a-z0-9.\-]{1,200}$/i.test(slug)) {
        return res.status(400).json({ error: 'slug inválido' });
    }
    const slugKey = `likes:${slug.toLowerCase()}`;

    // GET: return current counts
    if (req.method === 'GET') {
        try {
            const likes = await kvHGet(slugKey, 'likes');
            const dislikes = await kvHGet(slugKey, 'dislikes');
            return res.status(200).json({
                likes: parseInt(likes || '0', 10) || 0,
                dislikes: parseInt(dislikes || '0', 10) || 0
            });
        } catch (e) {
            return res.status(200).json({ likes: 0, dislikes: 0, fallback: true });
        }
    }

    // POST: record a like or dislike
    if (req.method === 'POST') {
        const body = req.body || {};
        const vote = body.vote;
        if (vote !== 'like' && vote !== 'dislike') {
            return res.status(400).json({ error: 'vote debe ser "like" o "dislike"' });
        }

        const ip = getClientIP(req);
        const ipHash = hashIP(ip);
        const rateKey = `ratelimit:${ipHash}`;
        const voteKey = `voted:${ipHash}:${slugKey}`;
        const now = Date.now();

        try {
            // Rate-limit: 1 voto cada 10s por IP-hash
            const lastCall = await kvGet(rateKey);
            if (lastCall != null && (now - parseInt(lastCall, 10)) < 10000) {
                const retryAfter = 10000 - (now - parseInt(lastCall, 10));
                return res.status(429).json({ error: 'Rate limited', retryAfter });
            }

            // Dedup: ¿ya votó esta nota esta IP?
            const alreadyVoted = await kvGet(voteKey);
            if (alreadyVoted != null) {
                const likes = parseInt((await kvHGet(slugKey, 'likes')) || '0', 10) || 0;
                const dislikes = parseInt((await kvHGet(slugKey, 'dislikes')) || '0', 10) || 0;
                return res.status(409).json({ error: 'Already voted', likes, dislikes });
            }

            // Registrar voto
            await kvHIncrBy(slugKey, vote === 'like' ? 'likes' : 'dislikes', 1);
            await kvSet(rateKey, String(now), 10);       // rate-limit: 10s
            await kvSet(voteKey, String(now), 86400);    // dedup: 24h

            const likes = parseInt((await kvHGet(slugKey, 'likes')) || '0', 10) || 0;
            const dislikes = parseInt((await kvHGet(slugKey, 'dislikes')) || '0', 10) || 0;
            return res.status(200).json({ likes, dislikes });
        } catch (e) {
            console.error('Vote error:', e);
            return res.status(500).json({ error: 'Storage error' });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
};
