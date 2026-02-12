/**
 * Session Handler & Global UI Injector
 * Handles:
 * 1. Session verification (redirects to login if invalid)
 * 2. Injects the Global Glass Pill Footer
 */

(function () {
    // --- 1. Session Verification Logic (Supabase + LocalStorage Fallback) ---
    const path = window.location.pathname;
    const isLoginPage = path.endsWith('index.html') || path.endsWith('/') || path.endsWith('Work/') || path.endsWith('WORK/');
    const isCallbackPage = path.endsWith('auth-callback.html'); // Exception for auth verification


    // Hide body immediately
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

    async function checkSession() {
        let isAuthenticated = false;

        // 1. Check LocalStorage (Temporary Hardcoded Login)
        if (localStorage.getItem('isLoggedIn') === 'true') {
            isAuthenticated = true;
        }

        // 2. Check Supabase Session (Real Auth)
        // Wait briefly for Supabase to load
        if (window.sb) {
            const { data } = await window.sb.auth.getSession();
            if (data.session) isAuthenticated = true;
        } else {
            // If sb isn't loaded yet, we might rely on localStorage for speed
            // or retry. For now, localStorage is the primary "fast" check.
        }

        handleRedirect(isAuthenticated);
    }

    function handleRedirect(isLoggedIn) {
        // Allow callback page to process without interruption
        if (isCallbackPage) {
            showBody();
            return;
        }

        if (!isLoginPage) {
            // Protected Page
            if (!isLoggedIn) {
                window.location.replace('index.html?session_expired=true');
            } else {
                showBody();
            }
        } else {
            // Login Page
            if (isLoggedIn) {
                window.location.replace('home.html');
            } else {
                showBody();
            }
        }
    }

    // Run check when DOM is ready or Supabase is loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => setTimeout(checkSession, 100));
    } else {
        setTimeout(checkSession, 100);
    }

    // --- 2. Footer Injection / Global UI ---
    // DISABLED: User requested removal of footer to match Refreshed UI
    /*
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
                <span style="opacity: 0.7; scale: 0.9;">The Brew Cave - POS & Inventory Management System</span>
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
    */

    // --- 3. Global Profile UI Update ---
    async function updateGlobalProfileUI() {
        try {
            // Robust Wait for Supabase
            let attempts = 0;
            while (!window.sb && attempts < 20) { // Wait up to 4 seconds
                await new Promise(r => setTimeout(r, 200));
                attempts++;
            }

            if (!window.sb) {
                console.warn("Supabase not loaded for Profile UI");
            }

            let user = null;
            let profile = null;

            if (window.sb) {
                // Ensure session is actually ready
                const { data } = await window.sb.auth.getSession();
                if (data.session) {
                    user = data.session.user;

                    // Fetch profile with joins to match schema
                    const { data: profileData, error } = await window.sb
                        .from('users')
                        .select(`
                            user_id,
                            role:roles(role_name),
                            profile:profiles(first_name, last_name, profile_url)
                        `)
                        .eq('user_id', user.id)
                        .maybeSingle(); // Use maybeSingle to prevent PGRST116 error if row is missing

                    if (profileData) {
                        profile = profileData;
                        // Map properties to match user's logic if needed, or update logic below
                    }
                    if (error) console.warn("Profile fetch error:", error);
                }
            }

            // Fallback to localStorage if no DB profile yet
            const lsUsername = localStorage.getItem('username') || 'User';
            const lsRole = localStorage.getItem('role') || 'Staff';

            // Determine Display Values
            let displayName = lsUsername;
            let displayAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=A67B5B&color=fff`;
            let displayRole = lsRole;

            if (profile) {
                // profile here is the object from 'users' table JOINED with 'profiles' and 'roles'
                const p = profile.profile || {}; // profiles join
                const r = profile.role || {};    // roles join

                const fullName = (p.first_name || '') + ' ' + (p.last_name || '');
                if (fullName.trim()) displayName = fullName.trim();

                if (p.profile_url) displayAvatar = p.profile_url;
                else displayAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=A67B5B&color=fff`;

                if (r.role_name) displayRole = r.role_name;
            } else if (user && user.email) {
                // Use email as fallback name if LS is empty
                if (displayName === 'User') displayName = user.email.split('@')[0];
                displayAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=A67B5B&color=fff`;
            }

            // Update DOM Elements
            // 1. Header Profile Button
            const profileBtn = document.getElementById('profileBtn');
            if (profileBtn) {
                const img = profileBtn.querySelector('img');
                const name = profileBtn.querySelector('.user-name');
                if (img) img.src = displayAvatar;
                if (name) name.textContent = displayName;
            }

            // 2. Sidebar Profile (if exists)
            const sidebarAvatar = document.querySelector('.sidebar-user-avatar');
            const sidebarName = document.querySelector('.sidebar-user-name');
            const sidebarRole = document.querySelector('.sidebar-user-role');

            if (sidebarAvatar) sidebarAvatar.src = displayAvatar;
            if (sidebarName) sidebarName.textContent = displayName;
            if (sidebarRole) sidebarRole.textContent = displayRole;

        } catch (e) {
            console.warn("Profile UI Update Failed:", e);
        }
    }

    // Run UI update on load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', updateGlobalProfileUI);
    } else {
        updateGlobalProfileUI();
    }

})();
