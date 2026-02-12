(() => {
    'use strict';

    // Global State
    let allUsers = [];
    let allRoles = [];
    let currentTab = 'users';

    // DOM Elements (Cached after DOMContentLoaded)
    let usersList, rolesList, searchInput;
    let userModalOverlay, userForm, userModalTitle;
    let roleModalOverlay, roleForm, roleModalTitle;

    // --- Page Initialization ---
    document.addEventListener('DOMContentLoaded', () => {
        // Initialize DOM Elements
        usersList = document.getElementById('usersList');
        rolesList = document.getElementById('rolesList');
        searchInput = document.querySelector('.search-input');

        userModalOverlay = document.getElementById('userModalOverlay');
        userForm = document.getElementById('userForm');
        userModalTitle = document.getElementById('userModalTitle');

        roleModalOverlay = document.getElementById('roleModalOverlay');
        roleForm = document.getElementById('roleForm');
        roleModalTitle = document.getElementById('roleModalTitle');

        // Attachment of listeners
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const term = e.target.value.toLowerCase();
                if (currentTab === 'users') {
                    const filtered = allUsers.filter(u =>
                        u.fullName.toLowerCase().includes(term) ||
                        u.email.toLowerCase().includes(term) ||
                        u.role.toLowerCase().includes(term)
                    );
                    renderUsersTable(filtered);
                }
            });
        }

        if (userForm) userForm.addEventListener('submit', handleUserSubmit);
        if (roleForm) roleForm.addEventListener('submit', handleRoleSubmit);

        if (userModalOverlay) {
            userModalOverlay.addEventListener('click', (e) => {
                if (e.target === userModalOverlay) closeUserModal();
            });
        }

        if (roleModalOverlay) {
            roleModalOverlay.addEventListener('click', (e) => {
                if (e.target === roleModalOverlay) closeRoleModal();
            });
        }

        initPage();
    });

    async function initPage() {
        const checkSb = setInterval(async () => {
            if (window.sb) {
                clearInterval(checkSb);
                await checkAndSeedRoles();
                await refreshData();
            }
        }, 100);
    }

    async function refreshData() {
        await fetchRoles();
        await loadUsers();
        await renderRolesTable(allRoles);
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
            if (addUserBtn) addUserBtn.style.display = 'flex';
            if (addRoleBtn) addRoleBtn.style.display = 'none';
            if (tabUsers) tabUsers.classList.add('active');
            if (tabRoles) tabRoles.classList.remove('active');
        } else {
            usersSection.style.display = 'none';
            rolesSection.style.display = 'block';
            if (addUserBtn) addUserBtn.style.display = 'none';
            if (addRoleBtn) addRoleBtn.style.display = 'flex';
            if (tabUsers) tabUsers.classList.remove('active');
            if (tabRoles) tabRoles.classList.add('active');
        }
    };

    // --- Seeding ---
    async function checkAndSeedRoles() {
        try {
            const { count, error } = await window.sb.from('roles').select('*', { count: 'exact', head: true });
            if (error) throw error;
            if (count === 0) {
                const defaultRoles = [
                    { role_name: 'Admin', can_profile: true, can_home: true, can_dashboard: true, can_take_orders: true, can_view_orders: true, can_stocks: true, can_menu_customization: true, can_order_history: true, can_user_management: true, can_auditlog: true, can_session_management: true, can_settings: true },
                    { role_name: 'Staff', can_profile: true, can_home: true, can_dashboard: true, can_take_orders: true, can_view_orders: true, can_stocks: false, can_menu_customization: false, can_order_history: false, can_user_management: false, can_auditlog: false, can_session_management: false, can_settings: false }
                ];
                await window.sb.from('roles').insert(defaultRoles);
            }
        } catch (err) { console.error('Database Sync Error:', err); }
    }

    // --- ROLE MANAGEMENT ---
    async function fetchRoles() {
        try {
            const { data, error } = await window.sb.from('roles').select('*').order('role_id');
            if (error) throw error;
            allRoles = data || [];
            populateRoleDropdown(allRoles);
        } catch (err) { console.error('Error fetching roles:', err); }
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
            const accessiblePages = [];
            const permCols = ['can_dashboard', 'can_take_orders', 'can_view_orders', 'can_stocks', 'can_menu_customization', 'can_order_history', 'can_user_management', 'can_session_management', 'can_settings'];
            permCols.forEach(col => { if (role[col]) accessiblePages.push(col.replace('can_', '').replace(/_/g, ' ')); });

            const pagesString = accessiblePages.join(', ') || 'None';
            const date = new Date(role.created_at || new Date()).toLocaleDateString();

            tr.innerHTML = `
                <td class="ref-no-cell">#${role.role_id}</td>
                <td><span class="badge badge-${getRoleBadgeClass(role.role_name)}">${role.role_name}</span></td>
                <td class="order-items-cell" title="${pagesString}"><span class="items-list">${pagesString}</span></td>
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
        if (!roleModalOverlay || !roleForm) return;
        roleForm.reset();
        roleForm.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);

        const isEdit = id !== null && typeof id !== 'object' && id !== '';
        if (isEdit) {
            const role = allRoles.find(r => r.role_id == id);
            if (role) {
                if (roleModalTitle) roleModalTitle.textContent = 'Edit Role Access';
                roleForm.querySelector('[name="id"]').value = role.role_id;
                roleForm.querySelector('[name="roleName"]').value = role.role_name;
                const permCols = ['can_profile', 'can_home', 'can_dashboard', 'can_take_orders', 'can_view_orders', 'can_stocks', 'can_menu_customization', 'can_order_history', 'can_user_management', 'can_auditlog', 'can_session_management', 'can_settings'];
                permCols.forEach(col => {
                    const cb = roleForm.querySelector(`input[name="${col}"]`);
                    if (cb) cb.checked = !!role[col];
                });
            }
        } else {
            if (roleModalTitle) roleModalTitle.textContent = 'New Role Configuration';
            roleForm.querySelector('[name="id"]').value = '';
        }
        roleModalOverlay.classList.add('show');
    };

    window.closeRoleModal = () => roleModalOverlay?.classList.remove('show');

    async function handleRoleSubmit(e) {
        e.preventDefault();
        const data = new FormData(roleForm);
        const name = data.get('roleName');
        const roleId = data.get('id');
        const roleData = { role_name: name };
        const permCols = ['can_profile', 'can_home', 'can_dashboard', 'can_take_orders', 'can_view_orders', 'can_stocks', 'can_menu_customization', 'can_order_history', 'can_user_management', 'can_auditlog', 'can_session_management', 'can_settings'];
        permCols.forEach(col => {
            const cb = roleForm.querySelector(`input[name="${col}"]`);
            roleData[col] = cb ? cb.checked : false;
        });

        try {
            Swal.fire({ title: 'Saving...', didOpen: () => Swal.showLoading() });
            if (roleId) await window.sb.from('roles').update(roleData).eq('role_id', roleId);
            else await window.sb.from('roles').insert(roleData);
            Swal.fire('Success', 'Role updated', 'success');
            closeRoleModal();
            refreshData();
        } catch (err) { Swal.fire('Error', err.message, 'error'); }
    }

    window.deleteRole = async (id) => {
        const result = await Swal.fire({ title: 'Delete Role?', text: "Users linked to this role may lose access.", icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33', confirmButtonText: 'Yes, Delete' });
        if (result.isConfirmed) {
            try {
                await window.sb.from('roles').delete().eq('role_id', id);
                Swal.fire('Deleted', 'Role removed', 'success');
                refreshData();
            } catch (err) { Swal.fire('Error', err.message, 'error'); }
        }
    };

    // --- USER MANAGEMENT ---
    async function loadUsers() {
        if (!usersList) return;
        usersList.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 20px;">Fetching users...</td></tr>';
        try {
            const { data, error } = await window.sb.from('users').select('user_id, is_active, roles (*), profiles (*)').order('created_at', { ascending: false });
            if (error) throw error;
            allUsers = data.map(u => ({
                id: u.user_id,
                firstName: u.profiles?.first_name || '',
                lastName: u.profiles?.last_name || '',
                fullName: `${u.profiles?.first_name || ''} ${u.profiles?.last_name || ''}`.trim() || 'No Name',
                email: u.profiles?.email || 'No Email',
                contact: u.profiles?.contact_num || '--',
                role: u.roles?.role_name || 'Staff',
                status: u.is_active ? 'Active' : 'Inactive',
                avatar: u.profiles?.profile_url || null
            }));
            renderUsersTable(allUsers);
        } catch (err) { console.error('User Fetch Error:', err); }
    }

    function renderUsersTable(users) {
        if (!usersList) return;
        usersList.innerHTML = '';
        if (users.length === 0) {
            usersList.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 40px; opacity: 0.5;">No users found.</td></tr>';
            return;
        }

        users.forEach(user => {
            const avatarSrc = user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName)}&background=A67B5B&color=fff`;
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><div class="profile-cell"><img src="${avatarSrc}" alt="${user.fullName}"></div></td>
                <td><span class="items-list">${user.fullName}</span></td>
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
        const confirmPassword = data.get('confirmPassword');

        if (!userId && password !== confirmPassword) {
            Swal.fire('Error', 'Passwords do not match', 'error');
            return;
        }

        try {
            Swal.fire({
                title: userId ? 'Updating Profile...' : 'Creating User...',
                text: 'Connecting to system...',
                allowOutsideClick: false,
                didOpen: () => Swal.showLoading()
            });

            if (userId) {
                // --- UPDATE EXISTING USER ---
                const { error: profileError } = await window.sb
                    .from('profiles')
                    .update({
                        first_name: fName,
                        last_name: lName,
                        contact_num: contact,
                        email: email
                    })
                    .eq('user_id', userId);

                if (profileError) throw profileError;

                const role = allRoles.find(r => r.role_name === roleName);
                if (role) {
                    await window.sb.from('users').update({ role_id: role.role_id }).eq('user_id', userId);
                }

                Swal.fire('Success', 'Profile updated successfully', 'success');
            } else {
                // --- CREATE NEW USER ---

                // Try Auth Creation
                const { data: authData, error: authError } = await window.sb.auth.signUp({
                    email: email,
                    password: password,
                    options: {
                        data: {
                            first_name: fName,
                            last_name: lName
                        }
                    }
                });

                if (authError) {
                    // Check specifically for rate limits
                    if (authError.message.toLowerCase().includes('rate') || authError.status === 429) {
                        throw new Error("Supabase Email Rate Limit Exceeded. To add users directly WITHOUT sending emails, please DISABLE 'Confirm Email' in your Supabase Auth Settings (Dashboard).");
                    }
                    throw authError;
                }

                const newUser = authData.user;
                if (!newUser) throw new Error("Auth user creation failed.");

                // Link Role & Metadata
                const role = allRoles.find(r => r.role_name === roleName);
                if (role) {
                    await window.sb.from('users').upsert({
                        user_id: newUser.id,
                        role_id: role.role_id,
                        is_active: true
                    }, { onConflict: 'user_id' });

                    await window.sb.from('profiles').upsert({
                        user_id: newUser.id,
                        first_name: fName,
                        last_name: lName,
                        email: email,
                        contact_num: contact
                    }, { onConflict: 'user_id' });
                }

                Swal.fire({
                    title: 'User Created!',
                    text: 'The new account is ready. Note: If email confirmation is ON, they must still verify to log in.',
                    icon: 'success',
                    confirmButtonColor: '#A67B5B'
                });
            }

            closeUserModal();
            await refreshData();
        } catch (err) {
            console.error("User Submit Error:", err);
            Swal.fire({
                title: 'Operation Failed',
                html: `<div style="text-align: left; font-size: 0.9rem;">
                        <p><strong>Reason:</strong> ${err.message}</p>
                        <p style="margin-top: 10px; color: #dc3741;"><strong>Tip:</strong> To bypass email limits, go to your Supabase Dashboard and disable <b>Confirm Email</b> in Auth Settings.</p>
                       </div>`,
                icon: 'error',
                confirmButtonColor: '#dc3741'
            });
        }
    }

    window.deleteUser = async (id) => {
        const result = await Swal.fire({ title: 'Remove User?', text: "Permanent deletion of profile and access.", icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33', confirmButtonText: 'Yes, Delete' });
        if (result.isConfirmed) {
            try {
                await window.sb.from('users').delete().eq('user_id', id);
                Swal.fire('Removed', 'User data deleted', 'success');
                refreshData();
            } catch (err) { Swal.fire('Error', err.message, 'error'); }
        }
    };

    // --- UTILITIES ---
    function populateRoleDropdown(roles) {
        if (!userForm) return;
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
        const r = role.toLowerCase();
        if (r === 'admin') return 'primary';
        if (r === 'manager') return 'warning';
        return 'secondary';
    }

    window.openUserModal = () => {
        if (!userModalOverlay || !userForm) return;
        if (userModalTitle) userModalTitle.textContent = 'Add System User';
        userForm.reset();
        userForm.querySelector('[name="id"]').value = '';
        togglePasswordFields(true);
        userModalOverlay.classList.add('show');
    };

    window.openEditModal = (id) => {
        if (!userModalOverlay || !userForm) return;
        const user = allUsers.find(u => u.id === id);
        if (!user) return;
        if (userModalTitle) userModalTitle.textContent = 'Modify User Profile';
        userForm.querySelector('[name="id"]').value = user.id;
        userForm.querySelector('[name="firstName"]').value = user.firstName || '';
        userForm.querySelector('[name="lastName"]').value = user.lastName || '';
        userForm.querySelector('[name="email"]').value = user.email || '';
        userForm.querySelector('[name="contact"]').value = user.contact === '--' ? '' : user.contact;
        userForm.querySelector('[name="role"]').value = user.role;
        togglePasswordFields(false);
        userModalOverlay.classList.add('show');
    };

    window.closeUserModal = () => userModalOverlay?.classList.remove('show');

    function togglePasswordFields(show) {
        if (!userForm) return;
        userForm.querySelectorAll('input[type="password"]').forEach(f => {
            const group = f.closest('.form-group');
            if (group) group.style.display = show ? 'block' : 'none';
        });
    }

})();