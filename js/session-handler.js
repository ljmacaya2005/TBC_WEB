/**
 * Session Handler & Global UI Injector
 * Handles:
 * 1. Session verification (redirects to login if invalid)
 * 2. Injects the Global Glass Pill Footer
 */

(function () {
    // --- 1. Session Verification Logic ---
    const isLoginPage = window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/');

    function checkSession() {
        // Re-read storage every time for strictness (in case cleared by another tab or Back button logic)
        const isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true';

        if (!isLoginPage) {
            // We are on a protected page
            if (!isLoggedIn) {
                // User is not logged in, hide content immediately to prevent flash
                document.documentElement.style.display = 'none';
                // Redirect to login with expiration flag
                console.warn('Session invalid. Redirecting to login.');
                window.location.href = 'index.html?session_expired=true';
            } else {
                // Make sure content is visible if valid
                document.documentElement.style.display = '';
            }
        }
    }

    // Run on initial load
    checkSession();

    // --- STRICT SESSION LOCK: Handle Back/Forward Cache (bfcache) ---
    // Browsers often cache the page state (including DOM) when navigating away.
    // The 'pageshow' event fires when a session history entry is being traversed to.
    window.addEventListener('pageshow', function (event) {
        // If the page was persisted (loaded from bfcache) or just navigated to normally
        checkSession();
    });

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
