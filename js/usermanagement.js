(() => {
    'use strict';

    // Global State
    let allUsers = [];
    let allRoles = [];
    let currentTab = 'users';

    // DOM Elements
    const usersList = document.getElementById('usersList');
    const rolesList = document.getElementById('rolesList');
    const searchInput = document.querySelector('.search-input');

    // User Modal Elements
    const userModalOverlay = document.getElementById('userModalOverlay');
    const userForm = document.getElementById('userForm');
    const userModalTitle = document.getElementById('userModalTitle');

    // Role Modal Elements
    const roleModalOverlay = document.getElementById('roleModalOverlay');
    const roleForm = document.getElementById('roleForm');
    const roleModalTitle = document.getElementById('roleModalTitle');

    // --- Page Initialization ---
    document.addEventListener('DOMContentLoaded', () => {
        initPage();
    });

    async function initPage() {
        // Wait for Supabase to be initialized
        const checkSb = setInterval(async () => {
            if (window.sb) {
                clearInterval(checkSb);
                // Ensure default roles exist as per schema
                await checkAndSeedRoles();
                await refreshData();
            }
        }, 100);
    }

    async function refreshData() {
        await fetchRoles();
        await loadUsers();
        await loadRolesTable();
    }

    // --- Tab Navigation ---
    window.switchTab = (tab) => {
        currentTab = tab;
        const usersSection = document.getElementById('usersContent');
        const rolesSection = document.getElementById('rolesContent');
        const addUserBtn = document.getElementById('addUserBtn');
        const addRoleBtn = document.getElementById('addRoleBtn');
        const tabUsers = document.getElementById('tab-users');
        const tabRoles = document.getElementById('tab-roles');

        if (!usersSection || !rolesSection) return;

        if (tab === 'users') {
            usersSection.style.display = 'block';
            rolesSection.style.display = 'none';
            addUserBtn.style.display = 'flex';
            addRoleBtn.style.display = 'none';
            // Styling handled by CSS classes
            tabUsers.classList.add('active');
            tabRoles.classList.remove('active');
        } else {
            usersSection.style.display = 'none';
            rolesSection.style.display = 'block';
            addUserBtn.style.display = 'none';
            addRoleBtn.style.display = 'flex';
            // Styling handled by CSS classes
            tabUsers.classList.remove('active');
            tabRoles.classList.add('active');
        }
    };

    // --- Seeding (Ensuring core database data) ---
    async function checkAndSeedRoles() {
        try {
            const { count, error } = await window.sb
                .from('roles')
                .select('*', { count: 'exact', head: true });

            if (error) throw error;

            if (count === 0) {
                const defaultRoles = [
                    {
                        role_name: 'Admin',
                        can_profile: true, can_home: true, can_dashboard: true, can_take_orders: true,
                        can_view_orders: true, can_stocks: true, can_menu_customization: true,
                        can_order_history: true, can_user_management: true, can_auditlog: true,
                        can_session_management: true, can_settings: true
                    },
                    {
                        role_name: 'Staff',
                        can_profile: true, can_home: true, can_dashboard: true, can_take_orders: true,
                        can_view_orders: true, can_stocks: false, can_menu_customization: false,
                        can_order_history: false, can_user_management: false, can_auditlog: false,
                        can_session_management: false, can_settings: false
                    }
                ];
                await window.sb.from('roles').insert(defaultRoles);
            }
        } catch (err) {
            console.error('Database Sync Error:', err);
        }
    }

    // --- ROLE MANAGEMENT FUNCTIONS ---

    async function fetchRoles() {
        try {
            const { data, error } = await window.sb.from('roles').select('*').order('role_id');
            if (error) throw error;
            allRoles = data || [];
            populateRoleDropdown(allRoles);
        } catch (err) {
            console.error('Error fetching roles:', err);
        }
    }

    async function loadRolesTable() {
        if (!rolesList) return;
        rolesList.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 20px;">Loading configuration...</td></tr>';
        await fetchRoles();
        renderRolesTable(allRoles);
    }

    function renderRolesTable(roles) {
        if (!rolesList) return;
        rolesList.innerHTML = '';
        if (roles.length === 0) {
            rolesList.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 40px; opacity: 0.5;">No roles configured.</td></tr>';
            return;
        }

        roles.forEach(role => {
            const tr = document.createElement('tr');

            // List accessible pages based on boolean columns
            const accessiblePages = [];
            if (role.can_dashboard) accessiblePages.push('Dashboard');
            if (role.can_take_orders) accessiblePages.push('Take Order');
            if (role.can_view_orders) accessiblePages.push('View Orders');
            if (role.can_stocks) accessiblePages.push('Stocks');
            if (role.can_menu_customization) accessiblePages.push('Menu Customization');
            if (role.can_order_history) accessiblePages.push('Order History');
            if (role.can_user_management) accessiblePages.push('User Management');
            if (role.can_session_management) accessiblePages.push('Session Management');
            if (role.can_settings) accessiblePages.push('Settings');

            const pagesString = accessiblePages.join(', ') || 'None';
            const date = new Date(role.created_at || new Date()).toLocaleDateString();

            tr.innerHTML = `
                <td style="font-family: monospace; opacity: 0.7;">#${role.role_id}</td>
                <td><span class="badge badge-${getRoleBadgeClass(role.role_name)}">${role.role_name}</span></td>
                <td style="font-size: 0.8rem; opacity: 0.8; max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${pagesString}">
                    ${pagesString}
                </td>
                <td>${date}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-icon" onclick="openRoleModal(${role.role_id})" title="Edit Role">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        </button>
                        <button class="btn-icon danger" onclick="deleteRole(${role.role_id})" title="Delete Role">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        </button>
                    </div>
                </td>
            `;
            rolesList.appendChild(tr);
        });
    }

    window.openRoleModal = (id = null) => {
        const titleElements = document.querySelectorAll('#roleModalTitle');
        const title = titleElements.length > 0 ? titleElements[0] : null;
        roleForm.reset();

        // Clear checkboxes
        roleForm.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);

        if (id && typeof id !== 'object') {
            const role = allRoles.find(r => r.role_id == id);
            if (role) {
                if (title) title.textContent = 'Edit Role Access';
                roleForm.querySelector('[name="id"]').value = role.role_id;
                roleForm.querySelector('[name="roleName"]').value = role.role_name;

                // Map boolean columns to checkboxes
                const permissionColumns = [
                    'can_profile', 'can_home', 'can_dashboard', 'can_take_orders',
                    'can_view_orders', 'can_stocks', 'can_menu_customization',
                    'can_order_history', 'can_user_management', 'can_auditlog',
                    'can_session_management', 'can_settings'
                ];

                permissionColumns.forEach(col => {
                    const cb = roleForm.querySelector(`input[name="${col}"]`);
                    if (cb) cb.checked = !!role[col];
                });
            }
        } else {
            if (title) title.textContent = 'New Role Configuration';
            roleForm.querySelector('[name="id"]').value = '';
        }
        roleModalOverlay.classList.add('show');
    };

    window.closeRoleModal = () => roleModalOverlay.classList.remove('show');

    async function handleRoleSubmit(e) {
        e.preventDefault();
        const data = new FormData(roleForm);
        const name = data.get('roleName');
        const roleId = data.get('id');

        // Build role data object based on checkboxes
        const roleData = {
            role_name: name
        };

        const permissionColumns = [
            'can_profile', 'can_home', 'can_dashboard', 'can_take_orders',
            'can_view_orders', 'can_stocks', 'can_menu_customization',
            'can_order_history', 'can_user_management', 'can_auditlog',
            'can_session_management', 'can_settings'
        ];

        permissionColumns.forEach(col => {
            const cb = roleForm.querySelector(`input[name="${col}"]`);
            roleData[col] = cb ? cb.checked : false;
        });

        try {
            Swal.fire({ title: 'Saving Configuration...', didOpen: () => Swal.showLoading() });
            if (roleId) {
                const { error } = await window.sb.from('roles').update(roleData).eq('role_id', roleId);
                if (error) throw error;
            } else {
                const { error } = await window.sb.from('roles').insert(roleData);
                if (error) throw error;
            }
            Swal.fire('Success', 'Role configuration updated', 'success');
            closeRoleModal();
            refreshData();
        } catch (err) {
            Swal.fire('Error', err.message, 'error');
        }
    }

    window.deleteRole = async (id) => {
        const result = await Swal.fire({
            title: 'Delete this Role?',
            text: "Warning: Users linked to this role may lose access.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Yes, Delete'
        });

        if (result.isConfirmed) {
            try {
                const { error } = await window.sb.from('roles').delete().eq('role_id', id);
                if (error) throw error;
                Swal.fire('Deleted', 'Role removed', 'success');
                refreshData();
            } catch (err) {
                Swal.fire('Error', err.message, 'error');
            }
        }
    };

    // --- USER MANAGEMENT FUNCTIONS (Profiles) ---

    async function loadUsers() {
        if (!usersList) return;
        usersList.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 20px;">Fetching system users...</td></tr>';

        try {
            const { data, error } = await window.sb
                .from('users')
                .select(`
                    user_id,
                    is_active,
                    roles (*),
                    profiles (*)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            allUsers = data.map(u => ({
                id: u.user_id,
                firstName: u.profiles?.first_name || '',
                lastName: u.profiles?.last_name || '',
                fullName: `${u.profiles?.first_name || ''} ${u.profiles?.last_name || ''}`.trim() || 'No Name',
                email: u.profiles?.email || 'No Email',
                contact: u.profiles?.contact_num || '--',
                role: u.roles?.role_name || 'Staff',
                role_id: u.roles?.role_id,
                status: u.is_active ? 'Active' : 'Inactive',
                avatar: u.profiles?.profile_url || null,
                raw: u
            }));

            renderUsersTable(allUsers);
        } catch (err) {
            console.error('User Fetch Error:', err);
            usersList.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 20px; color: red;">Error synchronizing database.</td></tr>';
        }
    }

    function renderUsersTable(users) {
        if (!usersList) return;
        usersList.innerHTML = '';
        if (users.length === 0) {
            usersList.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 40px; opacity: 0.5;">No users found in database.</td></tr>';
            return;
        }

        users.forEach(user => {
            const avatarSrc = user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName)}&background=A67B5B&color=fff`;
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><div class="profile-cell"><img src="${avatarSrc}" alt="${user.fullName}"></div></td>
                <td><span class="fw-bold">${user.fullName}</span></td>
                <td><span class="badge badge-${getRoleBadgeClass(user.role)}">${user.role}</span></td>
                <td>${user.contact}</td>
                <td>${user.email}</td>
                <td><span class="status-indicator ${user.status === 'Active' ? 'status-active' : 'status-inactive'}">${user.status}</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-icon" onclick="openEditModal('${user.id}')" title="Edit Profile">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        </button>
                        <button class="btn-icon danger" onclick="deleteUser('${user.id}')" title="Remove User">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        </button>
                    </div>
                </td>
            `;
            usersList.appendChild(tr);
        });
    }

    async function handleUserSubmit(e) {
        e.preventDefault();
        const data = new FormData(userForm);
        const userId = data.get('id');
        const fName = data.get('firstName');
        const lName = data.get('lastName');
        const email = data.get('email');
        const roleName = data.get('role');
        const contact = data.get('contact');
        const password = data.get('password');

        const selectedRole = allRoles.find(r => r.role_name === roleName);
        const roleId = selectedRole ? selectedRole.role_id : 1;

        try {
            Swal.fire({ title: 'Synchronizing Database...', didOpen: () => Swal.showLoading() });

            if (userId) {
                // UPDATE
                const { error: pErr } = await window.sb.from('profiles').update({ first_name: fName, last_name: lName, contact_num: contact }).eq('user_id', userId);
                if (pErr) throw pErr;
                const { error: uErr } = await window.sb.from('users').update({ role_id: roleId }).eq('user_id', userId);
                if (uErr) throw uErr;

                Swal.fire('Success', 'User profile updated', 'success');
                closeUserModal();
                refreshData();
            } else {
                // CREATE
                const { data: auth, error: aErr } = await window.sb.auth.signUp({ email, password });
                if (aErr) throw aErr;
                const newId = auth.user.id;

                // First, create the user record
                await window.sb.from('users').insert({ user_id: newId, role_id: roleId, is_active: true });
                // Second, create the profile record
                await window.sb.from('profiles').insert({ user_id: newId, first_name: fName, last_name: lName, email, contact_num: contact });

                Swal.fire('Created', 'New user added. Re-authenticating...', 'success');
                window.location.reload();
            }
        } catch (err) {
            Swal.fire('Error', err.message, 'error');
        }
    }

    window.deleteUser = async (id) => {
        const result = await Swal.fire({ title: 'Remove User?', text: 'This will delete the user and their profile.', icon: 'warning', showCancelButton: true });
        if (result.isConfirmed) {
            try {
                const { error } = await window.sb.from('users').delete().eq('user_id', id);
                if (error) throw error;
                Swal.fire('Removed', 'User data deleted', 'success');
                refreshData();
            } catch (err) {
                Swal.fire('Error', err.message, 'error');
            }
        }
    };

    // --- UTILITIES & MODAL LOGIC ---

    function populateRoleDropdown(roles) {
        const select = userForm.querySelector('select[name="role"]');
        if (!select) return;
        select.innerHTML = '<option value="" disabled selected>Select Access Level</option>';
        roles.forEach(role => {
            const option = document.createElement('option');
            option.value = role.role_name;
            option.textContent = role.role_name;
            select.appendChild(option);
        });
    }

    function getRoleBadgeClass(role) {
        if (!role) return 'secondary';
        switch (role.toLowerCase()) {
            case 'admin': return 'primary';
            case 'manager': return 'warning';
            default: return 'secondary';
        }
    }

    window.openUserModal = () => {
        userModalTitle.textContent = 'Add System User';
        userForm.reset();
        userForm.querySelector('[name="id"]').value = '';
        togglePasswordFields(true);
        userModalOverlay.classList.add('show');
    };

    window.openEditModal = (id) => {
        const user = allUsers.find(u => u.id === id);
        if (!user) return;
        userModalTitle.textContent = 'Modify User Profile';
        userForm.querySelector('[name="id"]').value = user.id;
        userForm.querySelector('[name="firstName"]').value = user.firstName;
        userForm.querySelector('[name="lastName"]').value = user.lastName;
        userForm.querySelector('[name="email"]').value = user.email;
        userForm.querySelector('[name="contact"]').value = user.contact === '--' ? '' : user.contact;
        userForm.querySelector('[name="role"]').value = user.role;
        togglePasswordFields(false);
        userModalOverlay.classList.add('show');
    };

    window.closeUserModal = () => userModalOverlay.classList.remove('show');

    function togglePasswordFields(show) {
        userForm.querySelectorAll('input[type="password"]').forEach(f => {
            const group = f.closest('.form-group');
            if (group) group.style.display = show ? 'block' : 'none';
        });
    }

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            const filtered = allUsers.filter(u => u.fullName.toLowerCase().includes(term) || u.email.toLowerCase().includes(term) || u.role.toLowerCase().includes(term));
            renderUsersTable(filtered);
        });
    }

    userForm.addEventListener('submit', handleUserSubmit);
    roleForm.addEventListener('submit', handleRoleSubmit);
    userModalOverlay.addEventListener('click', (e) => { if (e.target === userModalOverlay) closeUserModal(); });
    roleModalOverlay.addEventListener('click', (e) => { if (e.target === roleModalOverlay) closeRoleModal(); });

})();