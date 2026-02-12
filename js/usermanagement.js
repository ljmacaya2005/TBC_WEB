document.addEventListener('DOMContentLoaded', async () => {
    // Wait for Supabase to initialize
    let attempts = 0;
    while (!window.sb && attempts < 20) {
        await new Promise(r => setTimeout(r, 200));
        attempts++;
    }

    if (!window.sb) {
        console.error("Supabase failed to initialize.");
        Swal.fire('Error', 'Database connection failed. Please refresh.', 'error');
        return;
    }

    // Initial Fetch
    fetchUsers();

    // Event Listeners
    const userForm = document.getElementById('userForm');
    if (userForm) {
        userForm.addEventListener('submit', handleUserSubmit);
    }
});

/**
 * Fetch and Display Users
 */
async function fetchUsers() {
    const usersList = document.getElementById('usersList');
    usersList.innerHTML = '<tr><td colspan="8" class="text-center p-4">Loading users...</td></tr>';

    try {
        // Fetch users (auth/system info)
        const { data: users, error: usersError } = await window.sb
            .from('users')
            .select('*')
            .order('created_at', { ascending: false });

        if (usersError) throw usersError;

        // Fetch profiles (personal info)
        // Note: Assuming profiles are linked by user_id
        const { data: profiles, error: profilesError } = await window.sb
            .from('profiles')
            .select('*');

        if (profilesError) throw profilesError;

        // Map profiles for easier access
        const profilesMap = {};
        if (profiles) {
            profiles.forEach(p => {
                profilesMap[p.user_id] = p;
            });
        }

        renderUsersTable(users, profilesMap);

    } catch (error) {
        console.error('Error fetching users:', error);
        usersList.innerHTML = `<tr><td colspan="8" class="text-center p-4 text-danger">Error loading users: ${error.message}</td></tr>`;
    }
}

/**
 * Render Table Rows
 */
function renderUsersTable(users, profilesMap) {
    const usersList = document.getElementById('usersList');
    usersList.innerHTML = '';

    if (!users || users.length === 0) {
        usersList.innerHTML = '<tr><td colspan="8" class="text-center p-4" style="opacity: 0.7;">No user records found.</td></tr>';
        return;
    }

    users.forEach(user => {
        const profile = profilesMap[user.user_id] || {};
        const firstName = profile.first_name || 'N/A';
        const lastName = profile.last_name || '';
        const email = profile.email || 'N/A';
        const contact = profile.contact_num || 'N/A';
        const role = user.role_id || 'Unknown';
        const status = user.is_active ?
            '<span class="badge bg-success" style="padding: 5px 10px; border-radius: 20px;">Active</span>' :
            '<span class="badge bg-danger" style="padding: 5px 10px; border-radius: 20px;">Inactive</span>';

        // Avatar logic
        const initials = (firstName[0] || 'U') + (lastName[0] || '');
        const avatarUrl = profile['profile-url'] || `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=random&color=fff`;

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <div style="width: 40px; height: 40px; border-radius: 50%; overflow: hidden; border: 2px solid #eee;">
                    <img src="${avatarUrl}" alt="User" style="width: 100%; height: 100%; object-fit: cover;">
                </div>
            </td>
            <td>${firstName}</td>
            <td>${lastName}</td>
            <td>${role}</td>
            <td>${contact}</td>
            <td>${email}</td>
            <td>${status}</td>
            <td>
                <button class="btn-sm btn-action" onclick="editUser(${user.user_id})">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                </button>
            </td>
        `;
        usersList.appendChild(row);
    });
}

/**
 * Handle Add User Form Submission
 */
async function handleUserSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);

    // Get values
    const first_name = formData.get('first_name');
    const last_name = formData.get('last_name');
    const role_id = formData.get('role_id');
    const contact_num = formData.get('contact_num');
    const email = formData.get('email');
    const pin = formData.get('pin');
    const confirmPassword = formData.get('confirmPassword');

    // Basic Validation
    if (!first_name || !last_name || !email || !role_id || !pin) {
        Swal.fire('Error', 'Please fill in all required fields.', 'warning');
        return;
    }

    if (pin !== confirmPassword) {
        Swal.fire('Error', 'PINs do not match.', 'warning');
        return;
    }

    try {
        Swal.fire({
            title: 'Saving...',
            allowOutsideClick: false,
            didOpen: () => { Swal.showLoading(); }
        });

        // 1. Insert into public.users
        const userPayload = {
            role_id: role_id,
            is_active: 1, // Default active
            failed_login_attempts: 0,
            lockout_level: 0,
            enable_pn_lock: 0,
            pin: pin,
            updated_at: new Date().toISOString()
        };

        const { data: userData, error: userError } = await window.sb
            .from('users')
            .insert([userPayload])
            .select()
            .single();

        if (userError) throw new Error('Failed to create user record: ' + userError.message);

        const newUserId = userData.user_id;

        // 2. Insert into public.profiles
        const profilePayload = {
            user_id: newUserId, // Link to the created user
            first_name: first_name,
            last_name: last_name,
            email: email,
            contact_num: contact_num ? parseInt(contact_num.replace(/\D/g, '')) || 0 : null,
            created_at: new Date().toISOString()
        };

        const { error: profileError } = await window.sb
            .from('profiles')
            .insert([profilePayload]);

        if (profileError) {
            // Rollback user creation if profile fails? 
            // For now, simpler to just warn. Real app would use transaction or RLS.
            console.error('Profile creation failed:', profileError);
            throw new Error('User created but profile failed: ' + profileError.message);
        }

        // Success
        Swal.fire('Success', 'User created successfully!', 'success');
        closeUserModal();
        form.reset();
        fetchUsers();

    } catch (error) {
        console.error('Submission Error:', error);
        Swal.fire('Error', error.message, 'error');
    }
}


/* --- Modal Helpers --- */
function openUserModal() {
    const modal = document.getElementById('userModalOverlay');
    if (modal) {
        modal.classList.add('show');
        document.getElementById('userForm').reset();
    }
}

function closeUserModal() {
    const modal = document.getElementById('userModalOverlay');
    if (modal) modal.classList.remove('show');
}

function closeAllModals() {
    document.querySelectorAll('.modal-overlay').forEach(modal => modal.classList.remove('show'));
}

function editUser(id) {
    Swal.fire('Info', 'Edit functionality to be implemented.', 'info');
}

// Attach to window for HTML accessibility
window.openUserModal = openUserModal;
window.closeUserModal = closeUserModal;
window.closeAllModals = closeAllModals;
window.editUser = editUser;
