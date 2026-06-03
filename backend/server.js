const express = require('express');
const cors = require('cors');
const crypto = require('crypto');

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());

const DERIV_OAUTH = {
    clientId: '33rp9Oy3CuZ2io6XAuLZ6',
    redirectUri: 'https://www.digitmatchstar.com/index.html',
    authUrl: 'https://auth.deriv.com/oauth2/auth',
    tokenUrl: 'https://auth.deriv.com/oauth2/token'
};

const pkceStore = new Map();

function generatePKCE() {
    const codeVerifier = crypto.randomBytes(64)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
    
    const hash = crypto.createHash('sha256').update(codeVerifier).digest('base64');
    const codeChallenge = hash
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
    
    return { codeVerifier, codeChallenge };
}

app.get('/api/health', (req, res) => {
    res.json({ status: 'OK' });
});

app.get('/api/oauth/authorize', (req, res) => {
    try {
        const { codeVerifier, codeChallenge } = generatePKCE();
        const state = crypto.randomBytes(16).toString('hex');
        
        pkceStore.set(state, { codeVerifier, createdAt: Date.now() });
        
        const authUrl = `${DERIV_OAUTH.authUrl}?` + new URLSearchParams({
            response_type: 'code',
            client_id: DERIV_OAUTH.clientId,
            redirect_uri: DERIV_OAUTH.redirectUri,
            scope: 'read trade account_manage',
            state: state,
            code_challenge: codeChallenge,
            code_challenge_method: 'S256'
        });
        
        res.json({ success: true, authUrl, state });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/oauth/token', async (req, res) => {
    const { code, state } = req.body;
    
    if (!code || !state) {
        return res.status(400).json({ success: false, message: 'Missing code or state' });
    }
    
    const pkceData = pkceStore.get(state);
    if (!pkceData) {
        return res.status(400).json({ success: false, message: 'Invalid state' });
    }
    
    pkceStore.delete(state);
    
    try {
        const response = await fetch(DERIV_OAUTH.tokenUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                client_id: DERIV_OAUTH.clientId,
                code: code,
                code_verifier: pkceData.codeVerifier,
                redirect_uri: DERIV_OAUTH.redirectUri
            })
        });
        
        const data = await response.json();
        res.json({ success: true, access_token: data.access_token, expires_in: data.expires_in });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/oauth/config', (req, res) => {
    res.json({
        success: true,
        clientId: DERIV_OAUTH.clientId,
        redirectUri: DERIV_OAUTH.redirectUri
    });
});

module.exports = app;
