(function() {
    const urlParams = new URLSearchParams(window.location.search);
    
    // 1. Capture tokens after Deriv Redirect
    if (urlParams.has('token1')) {
        localStorage.setItem('derivToken', urlParams.get('token1'));
        localStorage.setItem('activeAccount', urlParams.get('acct1'));
        
        // Clean URL and go to bot
        window.location.href = 'bot-authenticated.html';
    }

    // 2. Protect the bot page
    if (window.location.pathname.includes('bot.html')) {
        if (!localStorage.getItem('derivToken')) {
            window.location.href = 'index.html';
        }
    }
})();
