/**
 * Session Handler & RBAC Enforcement Module
 * Handles:
 * 1. Session verification (Supabase + LocalStorage)
 * 2. RBAC Enforcement (Page-level restrictions based on roles)
 * 3. Dynamic UI adjustment (Sidebar/Action hiding)
 */

(function () {
    'use strict';

    const PAGE_MAPPING = {
        'dashboard.html': 'can_dashboard',
        'takeorder.html': 'can_take_orders',
        'vieworders.html': 'can_view_orders',
        'stocks.html': 'can_stocks',
        'menucustomization.html': 'can_menu_customization',
        'orderhistory.html': 'can_order_history',
        'usermanagement.html': 'can_user_management',
        'sessionmanagement.html': 'can_session_management',
        'settings.html': 'can_settings',
        'auditlog.html': 'can_auditlog',
        'profile.html': 'can_profile',
        'home.html': 'can_home'
    };

    const path = window.location.pathname;
    const currentPage = path.split('/').pop() || 'index.html';
    const isLoginPage = currentPage === 'index.html' || currentPage === '';
    const isCallbackPage = currentPage === 'auth-callback.html';

    // Immediate Auth Protection: Hide body
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
        let permissions = null;

        // 1. Fast Check: LocalStorage
        if (localStorage.getItem('isLoggedIn') === 'true') {
            isAuthenticated = true;
            try {
                const storedPerms = localStorage.getItem('permissions');
                if (storedPerms) permissions = JSON.parse(storedPerms);
            } catch (e) { /* corrupted perms */ }
        }

        // 2. Real Auth & Perms Check (Supabase)
        if (window.sb) {
            const { data: { session } } = await window.sb.auth.getSession();
            if (session) {
                isAuthenticated = true;
                // Fetch fresh permissions if missing or periodically
                if (!permissions) {
                    permissions = await fetchUserPermissions(session.user.id);
                }
            } else {
                isAuthenticated = false;
            }
        }

        handleEnforcement(isAuthenticated, permissions);
    }

    async function fetchUserPermissions(userId) {
        try {
            const { data, error } = await window.sb
                .from('users')
                .select(`
                    role:roles(*)
                `)
                .eq('user_id', userId)
                .maybeSingle();

            if (data && data.role) {
                const perms = data.role;
                localStorage.setItem('permissions', JSON.stringify(perms));
                localStorage.setItem('role', perms.role_name);
                return perms;
            }
        } catch (e) {
            console.error("RBAC: Failed to fetch permissions", e);
        }
        return null;
    }

    function handleEnforcement(isLoggedIn, permissions) {
        if (isCallbackPage) {
            showBody();
            return;
        }

        if (!isLoggedIn) {
            if (!isLoginPage) {
                window.location.replace('index.html?session_expired=true');
            } else {
                showBody();
            }
            return;
        }

        // User Is Logged In
        if (isLoginPage) {
            window.location.replace('home.html');
            return;
        }

        // --- RBAC Enforcement ---
        const requiredPerm = PAGE_MAPPING[currentPage];

        // If the page is mapped but user lacks permission
        if (requiredPerm && permissions && permissions[requiredPerm] === false) {
            console.warn(`RBAC: Access blocked for ${currentPage}. Redirecting to home.`);

            // If they can't even access home.html, we have a problem. 
            // We'll try to find the first allowed page.
            if (currentPage !== 'home.html') {
                window.location.replace('home.html');
            } else {
                // Find first allowed page
                const firstAllowed = Object.keys(PAGE_MAPPING).find(pg => permissions[PAGE_MAPPING[pg]] === true);
                if (firstAllowed) window.location.replace(firstAllowed);
                else {
                    // Critical: No access to anything. Sign out.
                    localStorage.clear();
                    window.location.replace('index.html?error=no_access');
                }
            }
            return;
        }

        // Access Granted
        applyUITweaks(permissions);
        updateGlobalProfileUI(permissions);
        showBody();
    }

    function applyUITweaks(permissions) {
        if (!permissions) return;

        // 1. Sidebar Links
        document.querySelectorAll('.nav-link').forEach(link => {
            const href = link.getAttribute('href');
            if (href) {
                const pg = href.split('/').pop();
                const perm = PAGE_MAPPING[pg];
                if (perm && permissions[perm] === false) {
                    link.closest('.nav-item').style.display = 'none';
                }
            }
        });

        // 2. Home Page Quick Actions
        const quickActions = document.querySelectorAll('.action-btn-mini');
        quickActions.forEach(btn => {
            const onclick = btn.getAttribute('onclick');
            if (onclick && onclick.includes('location.href')) {
                const pgMatch = onclick.match(/'([^']+)'/);
                if (pgMatch) {
                    const pg = pgMatch[1];
                    const perm = PAGE_MAPPING[pg];
                    if (perm && permissions[perm] === false) {
                        btn.style.display = 'none';
                    }
                }
            }
        });
    }

    async function updateGlobalProfileUI(permissions) {
        // Updated to use both Supabase and permissions
        try {
            const lsUsername = localStorage.getItem('username') || 'User';
            const lsRole = localStorage.getItem('role') || 'Staff';

            let displayName = lsUsername;
            let displayRole = lsRole;
            let displayAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=A67B5B&color=fff`;

            // If we have permissions, we already have the role name
            if (permissions && permissions.role_name) {
                displayRole = permissions.role_name;
            }

            // Optional: Fetch full profile details if they aren't in permissions object
            // (permissions object is the 'roles' table record)

            // Update Header
            const profileBtn = document.getElementById('profileBtn');
            if (profileBtn) {
                const nameEl = profileBtn.querySelector('.user-name');
                if (nameEl) nameEl.textContent = displayName;
            }

            // Update Sidebar
            const sidebarName = document.querySelector('.sidebar-user-name');
            const sidebarRole = document.querySelector('.sidebar-user-role');
            if (sidebarName) sidebarName.textContent = displayName;
            if (sidebarRole) sidebarRole.textContent = displayRole;

            // Update Home Display
            const heroName = document.querySelector('.user-name-display');
            if (heroName) heroName.textContent = displayName;

        } catch (e) {
            console.warn("RBAC: UI update failed", e);
        }
    }

    // Run check when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => setTimeout(checkSession, 50));
    } else {
        setTimeout(checkSession, 50);
    }

})();
