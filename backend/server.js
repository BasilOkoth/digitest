const express = require('express');
const cors = require('cors');
const crypto = require('crypto');

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());

const DERIV_OAUTH = {
    clientId: '33rp9Oy3CuZ2io6XAuLZ6',
    tokenUrl: 'https://auth.deriv.com/oauth2/token'
};

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Exchange code for token
app.post('/api/oauth/token', async (req, res) => {
    const { code, code_verifier, redirect_uri } = req.body;
    
    console.log('🔐 Token exchange request');
    console.log('Code provided:', !!code);
    console.log('Code verifier provided:', !!code_verifier);
    
    if (!code || !code_verifier) {
        return res.status(400).json({ 
            success: false, 
            message: 'Missing code or code_verifier' 
        });
    }
    
    try {
        const params = new URLSearchParams({
            grant_type: 'authorization_code',
            client_id: DERIV_OAUTH.clientId,
            code: code,
            code_verifier: code_verifier,
            redirect_uri: redirect_uri || 'https://www.digitmatchstar.com/index.html'
        });
        
        console.log('🔄 Exchanging code for token...');
        
        const tokenResponse = await fetch(DERIV_OAUTH.tokenUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params
        });
        
        const tokenData = await tokenResponse.json();
        
        if (!tokenResponse.ok) {
            console.error('❌ Token exchange failed:', tokenData);
            return res.status(tokenResponse.status).json({ 
                success: false, 
                message: tokenData.error_description || 'Token exchange failed'
            });
        }
        
        console.log('✅ Token exchange successful');
        
        res.json({
            success: true,
            access_token: tokenData.access_token,
            expires_in: tokenData.expires_in,
            token_type: tokenData.token_type
        });
        
    } catch (error) {
        console.error('❌ Token exchange error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// OAuth config endpoint
app.get('/api/oauth/config', (req, res) => {
    res.json({
        success: true,
        clientId: DERIV_OAUTH.clientId,
        tokenUrl: DERIV_OAUTH.tokenUrl
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({ message: 'DigitMatch Backend API', status: 'running' });
});

module.exports = app;
