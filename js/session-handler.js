/**
 * Session Handler & Global UI Injector
 * Handles:
 * 1. Session verification (redirects to login if invalid)
 * 2. Injects the Global Glass Pill Footer
 */

(function () {
    // --- 1. Session Verification Logic ---
    const path = window.location.pathname;
    const isLoginPage = path.endsWith('index.html') || path.endsWith('/') || path.endsWith('Work/') || path.endsWith('WORK/');
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

    // Anti-flicker: Hide body immediately until verified
    const style = document.createElement('style');
    style.id = 'auth-protection-style';
    style.innerHTML = 'body { visibility: hidden !important; opacity: 0 !important; }';
    document.head.appendChild(style);

    function showBody() {
        const styleEl = document.getElementById('auth-protection-style');
        if (styleEl) styleEl.remove();
        document.body.style.visibility = 'visible';
        document.body.style.opacity = '1';
    }

    if (!isLoginPage) {
        // We are on a protected page
        if (!isLoggedIn) {
            // User is not logged in, redirect to login with expiration flag
            window.location.replace('index.html?session_expired=true');
        } else {
            // Authorized
            window.addEventListener('DOMContentLoaded', showBody);
            // Fallback in case DOMContentLoaded already fired or takes too long
            setTimeout(showBody, 100);
        }
    } else {
        // We are on the login page
        if (isLoggedIn) {
            // Already logged in, redirect to home
            window.location.replace('home.html');
        } else {
            // Not logged in, show login page
            window.addEventListener('DOMContentLoaded', showBody);
            setTimeout(showBody, 100);
        }
    }

    // --- 2. Footer Injection / Global UI ---

    function injectGlobalUI() {
        // A. Inject CSS for the footer
        if (!document.querySelector('link[href*="footer-pill.css"]')) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'css/footer-pill.css';
            document.head.appendChild(link);
        }

        // B. Inject Footer HTML
        // Check if footer already exists to prevent duplicates
        if (!document.querySelector('.glass-pill-footer')) {
            const footer = document.createElement('div');
            footer.className = 'glass-pill-footer';

            // Footer Content
            footer.innerHTML = `
                <span class="highlight">2026 Elevate</span>
                <span class="separator"></span>
                <span>All rights reserved</span>
                <span class="separator" style="display:none"></span>
                <span style="opacity: 0.7; scale: 0.9;">The Brew Cave POS</span>
            `;

            // TARGETED INJECTION to layout flow if possible
            const dashboardMain = document.querySelector('.home-main-content');
            if (dashboardMain) {
                dashboardMain.appendChild(footer); // Static flow
            } else {
                document.body.appendChild(footer); // Fixed overlay fallback
            }
        }
    }

    // Run injection when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectGlobalUI);
    } else {
        injectGlobalUI();
    }

})();
