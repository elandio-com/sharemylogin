/**
 * ShareMyLogin Reference Backend
 * 
 * In-Memory Implementation for verification and testing.
 * NOT FOR PRODUCTION USE (Data is lost on restart).
 */

import { createServer } from 'http';

const secrets = new Map();
const PORT = 3001;

// Helper to handle CORS
const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Destroy-Token',
    'Content-Type': 'application/json'
};

const server = createServer(async (req, res) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        res.writeHead(204, headers);
        res.end();
        return;
    }

    const url = new URL(req.url, `http://${req.headers.host}`);
    const path = url.pathname;

    console.log(`[${req.method}] ${path}`);

    try {
        // --- POST /api/create ---
        if (path === '/api/create' && req.method === 'POST') {
            const body = await parseBody(req);

            // Generate IDs
            const id = Math.random().toString(36).substring(2, 15);
            const destroyToken = Math.random().toString(36).substring(2, 15);

            // Store in Memory
            const now = Math.floor(Date.now() / 1000);
            let expiresAt = now + (24 * 60 * 60); // Default 24h

            if (body.expiryType === '7d') expiresAt = now + (7 * 24 * 60 * 60);
            if (body.expiryType === 'one-time') expiresAt = now + (30 * 24 * 60 * 60);

            secrets.set(id, {
                ciphertext: body.ciphertext,
                iv: body.iv,
                salt: body.salt,
                ttlMode: body.expiryType,
                createdAt: now,
                expiresAt: expiresAt,
                destroyToken: destroyToken, // In real app, hash this!
                viewed: false,
                attempts: 0
            });

            res.writeHead(200, headers);
            res.end(JSON.stringify({ id, destroyToken }));
            return;
        }

        // --- GET /api/view/:id ---
        if (path.startsWith('/api/view/') && req.method === 'GET') {
            const id = path.split('/').pop();
            const secret = secrets.get(id);

            if (!secret) {
                res.writeHead(404, headers);
                res.end(JSON.stringify({ error: 'Not found' }));
                return;
            }

            // check expiry
            if (Date.now() / 1000 > secret.expiresAt) {
                secrets.delete(id);
                res.writeHead(404, headers);
                res.end(JSON.stringify({ error: 'Expired' }));
                return;
            }

            // Return metadata only
            res.writeHead(200, headers);
            res.end(JSON.stringify({
                ttlMode: secret.ttlMode,
                expiresAt: secret.expiresAt,
                hasDestroyToken: true
            }));
            return;
        }

        // --- POST /api/reveal/:id ---
        if (path.startsWith('/api/reveal/') && req.method === 'POST') {
            const id = path.split('/').pop();
            const secret = secrets.get(id);

            if (!secret) {
                res.writeHead(404, headers);
                res.end(JSON.stringify({ error: 'Not found' }));
                return;
            }

            // check expiry
            if (Date.now() / 1000 > secret.expiresAt) {
                secrets.delete(id);
                res.writeHead(404, headers);
                res.end(JSON.stringify({ error: 'Expired' }));
                return;
            }

            // One-time logic: NOW MOVED TO DELETE /destroy
            // We no longer burn on fetch.
            if (secret.ttlMode === 'one-time') {
                const clientToken = req.headers['x-destroy-token'];
                if (clientToken !== secret.destroyToken) {
                    res.writeHead(403, headers);
                    res.end(JSON.stringify({ error: 'Missing token for one-time secret' }));
                    return;
                }
            }

            res.writeHead(200, headers);
            res.end(JSON.stringify({
                ciphertext: secret.ciphertext,
                iv: secret.iv,
                salt: secret.salt
            }));
            return;
        }

        // --- POST /api/attempt/:id ---
        if (path.startsWith('/api/attempt/') && req.method === 'POST') {
            const id = path.split('/').pop();
            const secret = secrets.get(id);

            if (!secret) {
                res.writeHead(404, headers);
                res.end(JSON.stringify({ error: 'Not found' }));
                return;
            }

            secret.attempts++;

            // Global Safety Cap (Basic Reference Impl)
            if (secret.attempts >= 30) {
                secrets.delete(id);
                res.writeHead(410, headers);
                res.end(JSON.stringify({ error: "Secret destroyed due to excessive attempts." }));
                return;
            }

            res.writeHead(200, headers);
            res.end(JSON.stringify({ remaining: 30 - secret.attempts }));
            return;
        }

        // --- DELETE /api/destroy/:id ---
        if (path.startsWith('/api/destroy/') && req.method === 'DELETE') {
            const id = path.split('/').pop();
            const body = await parseBody(req);
            const secret = secrets.get(id);

            if (!secret) {
                res.writeHead(404, headers);
                res.end(JSON.stringify({ error: 'Not found' }));
                return;
            }

            if (body.destroyToken !== secret.destroyToken) {
                res.writeHead(403, headers);
                res.end(JSON.stringify({ error: 'Invalid token' }));
                return;
            }

            secrets.delete(id);
            res.writeHead(200, headers);
            res.end(JSON.stringify({ success: true }));
            return;
        }

        res.writeHead(404, headers);
        res.end('Not Found');

    } catch (e) {
        console.error(e);
        res.writeHead(500, headers);
        res.end(JSON.stringify({ error: e.message }));
    }
});

function parseBody(req) {
    return new Promise((resolve) => {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => resolve(JSON.parse(body || '{}')));
    });
}

server.listen(PORT, () => {
    console.log(`Reference Backend running at http://localhost:${PORT}`);
});
