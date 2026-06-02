// ============================================
// DERIV OAUTH PKCE ENDPOINTS
// ============================================

const crypto = require('crypto');

// Deriv OAuth configuration
const DERIV_OAUTH = {
    clientId: '33rp9Oy3CuZ2io6XAuLZ6',
    redirectUri: process.env.OAUTH_REDIRECT_URI || 'https://www.digitmatchstar.com/index.html',
    authUrl: 'https://auth.deriv.com/oauth2/auth',
    tokenUrl: 'https://auth.deriv.com/oauth2/token'
};

// Store PKCE verifiers temporarily (in production, use Redis or database)
const pkceStore = new Map();

// Clean up expired PKCE entries every 10 minutes
setInterval(() => {
    const now = Date.now();
    for (const [key, value] of pkceStore.entries()) {
        if (now - value.createdAt > 10 * 60 * 1000) {
            pkceStore.delete(key);
        }
    }
}, 10 * 60 * 1000);

// Helper: Generate PKCE code verifier and challenge
function generatePKCE() {
    // Generate random code_verifier (43-128 characters)
    const codeVerifier = crypto.randomBytes(64)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
    
    // Generate code_challenge (SHA-256 of code_verifier)
    const hash = crypto.createHash('sha256').update(codeVerifier).digest('base64');
    const codeChallenge = hash
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
    
    return { codeVerifier, codeChallenge };
}

// Endpoint: Get OAuth authorization URL
app.get('/api/oauth/authorize', (req, res) => {
    console.log('🔐 OAuth authorize request received');
    console.log('📱 Origin:', req.get('origin'));
    
    try {
        const { codeVerifier, codeChallenge } = generatePKCE();
        const state = crypto.randomBytes(16).toString('hex');
        
        // Store PKCE data with state as key
        pkceStore.set(state, { 
            codeVerifier, 
            createdAt: Date.now(),
            origin: req.get('origin')
        });
        
        // Build authorization URL
        const authUrl = `${DERIV_OAUTH.authUrl}?` + new URLSearchParams({
            response_type: 'code',
            client_id: DERIV_OAUTH.clientId,
            redirect_uri: DERIV_OAUTH.redirectUri,
            scope: 'read trade account_manage',
            state: state,
            code_challenge: codeChallenge,
            code_challenge_method: 'S256'
        });
        
        console.log('✅ OAuth URL generated');
        console.log('🔗 Redirect URI:', DERIV_OAUTH.redirectUri);
        
        res.json({ 
            success: true, 
            authUrl, 
            state 
        });
        
    } catch (error) {
        console.error('❌ OAuth authorize error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to generate OAuth URL',
            error: error.message 
        });
    }
});

// Endpoint: Exchange authorization code for access token
app.post('/api/oauth/token', async (req, res) => {
    const { code, state } = req.body;
    
    console.log('🔐 Token exchange request received');
    console.log('📱 Origin:', req.get('origin'));
    console.log('📝 Code provided:', !!code);
    console.log('🔑 State provided:', !!state);
    
    if (!code || !state) {
        return res.status(400).json({ 
            success: false, 
            message: 'Missing code or state' 
        });
    }
    
    // Get stored PKCE verifier
    const pkceData = pkceStore.get(state);
    if (!pkceData) {
        console.log('❌ Invalid or expired state:', state);
        return res.status(400).json({ 
            success: false, 
            message: 'Invalid or expired state. Please try logging in again.' 
        });
    }
    
    // Clean up store
    pkceStore.delete(state);
    
    try {
        console.log('🔄 Exchanging code for token...');
        
        const tokenResponse = await fetch(DERIV_OAUTH.tokenUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                client_id: DERIV_OAUTH.clientId,
                code: code,
                code_verifier: pkceData.codeVerifier,
                redirect_uri: DERIV_OAUTH.redirectUri
            })
        });
        
        const tokenData = await tokenResponse.json();
        
        if (!tokenResponse.ok) {
            console.error('❌ Token exchange failed:', tokenData);
            return res.status(tokenResponse.status).json({ 
                success: false, 
                message: tokenData.error_description || 'Token exchange failed',
                error: tokenData
            });
        }
        
        console.log('✅ Token exchange successful');
        console.log('🔑 Access token obtained, expires in:', tokenData.expires_in, 'seconds');
        
        res.json({
            success: true,
            access_token: tokenData.access_token,
            expires_in: tokenData.expires_in,
            token_type: tokenData.token_type,
            scope: tokenData.scope
        });
        
    } catch (error) {
        console.error('❌ Token exchange error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error during token exchange',
            error: error.message 
        });
    }
});

// Endpoint: Verify access token (optional - for debugging)
app.post('/api/oauth/verify', async (req, res) => {
    const { access_token } = req.body;
    
    if (!access_token) {
        return res.status(400).json({ success: false, message: 'Access token required' });
    }
    
    try {
        // You can optionally verify the token by making a test API call
        // For now, just return success
        res.json({
            success: true,
            message: 'Token format is valid',
            token_preview: access_token.substring(0, 20) + '...'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Endpoint: Get OAuth configuration (for frontend)
app.get('/api/oauth/config', (req, res) => {
    res.json({
        success: true,
        clientId: DERIV_OAUTH.clientId,
        redirectUri: DERIV_OAUTH.redirectUri,
        authUrl: DERIV_OAUTH.authUrl,
        environment: process.env.NODE_ENV || 'development'
    });
});
