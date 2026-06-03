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

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Get OAuth URL
app.get('/api/oauth/authorize', (req, res) => {
    console.log('🔐 OAuth authorize request');
    
    try {
        const { codeVerifier, codeChallenge } = generatePKCE();
        const state = crypto.randomBytes(16).toString('hex');
        
        pkceStore.set(state, { codeVerifier, createdAt: Date.now() });
        
        const authUrl = `${DERIV_OAUTH.authUrl}?` + new URLSearchParams({
            response_type: 'code',
            client_id: DERIV_OAUTH.clientId,
            redirect_uri: DERIV_OAUTH.redirectUri,
            scope: 'trade account_manage',
            state: state,
            code_challenge: codeChallenge,
            code_challenge_method: 'S256'
        });
        
        res.json({ success: true, authUrl, state });
        
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Exchange code for token
app.post('/api/oauth/token', async (req, res) => {
    const { code, state } = req.body;
    
    if (!code || !state) {
        return res.status(400).json({ success: false, message: 'Missing code or state' });
    }
    
    const pkceData = pkceStore.get(state);
    if (!pkceData) {
        return res.status(400).json({ success: false, message: 'Invalid or expired state' });
    }
    
    pkceStore.delete(state);
    
    try {
        const params = new URLSearchParams({
            grant_type: 'authorization_code',
            client_id: DERIV_OAUTH.clientId,
            code: code,
            code_verifier: pkceData.codeVerifier,
            redirect_uri: DERIV_OAUTH.redirectUri
        });
        
        const tokenResponse = await fetch(DERIV_OAUTH.tokenUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params
        });
        
        const tokenData = await tokenResponse.json();
        
        if (!tokenResponse.ok) {
            return res.status(tokenResponse.status).json({ 
                success: false, 
                message: tokenData.error_description || 'Token exchange failed'
            });
        }
        
        res.json({
            success: true,
            access_token: tokenData.access_token,
            expires_in: tokenData.expires_in,
            token_type: tokenData.token_type
        });
        
    } catch (error) {
        console.error('Token exchange error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// OAuth config
app.get('/api/oauth/config', (req, res) => {
    res.json({
        success: true,
        clientId: DERIV_OAUTH.clientId,
        redirectUri: DERIV_OAUTH.redirectUri,
        authUrl: DERIV_OAUTH.authUrl
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({ message: 'DigitMatch Backend API', status: 'running' });
});

module.exports = app;
