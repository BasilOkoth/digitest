/**
 * Auth Handler for Deriv DigitMatch Pro
 * Handles OAuth token extraction and session management
 */
(function() {
    const APP_ID = '118190';

    function init() {
        const urlParams = new URLSearchParams(window.location.search);
        
        // 1. Check if we just arrived from Deriv with tokens
        if (urlParams.has('token1')) {
            const tokens = {};
            // Extract all available tokens (token1, token2, etc.)
            for (let i = 1; i <= 5; i++) {
                const token = urlParams.get(`token${i}`);
                const account = urlParams.get(`acct${i}`);
                const currency = urlParams.get(`cur${i}`);
                if (token) {
                    tokens[account] = { token, currency };
                    // Save primary token for the bot to use
                    if (i === 1) {
                        localStorage.setItem('derivToken', token);
                        localStorage.setItem('activeAccount', account);
                    }
                }
            }
            
            // 2. Clean the URL (remove tokens for security)
            const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
            window.history.replaceState({}, document.title, cleanUrl);
            
            console.log('✅ Authentication successful and tokens saved.');
        }

        // 3. Verify access
        const activeToken = localStorage.getItem('derivToken');
        if (!activeToken && window.location.pathname.includes('bot-authenticated.html')) {
            // Redirect back to landing page if trying to access bot without auth
            alert("Please login via the main page first.");
            window.location.href = 'index.html';
        }
    }

    // Run on load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();