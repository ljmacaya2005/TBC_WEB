// User Management Logic

// Global State
let allUsers = [];
let isEditMode = false;
let currentEditId = null;

document.addEventListener('DOMContentLoaded', () => {
    fetchUsers();

    // Attach form submit listener
    const form = document.getElementById('userForm');
    if (form) {
        form.addEventListener('submit', handleUserFormSubmit);
    }
});

// --- Fetch Users ---
async function fetchUsers() {
    const list = document.getElementById('usersList');
    if (!list) return;

    // Show loading state
    list.innerHTML = `<tr><td colspan="8" style="text-align:center; padding: 40px;">Loading users...</td></tr>`;

    if (!window.sb) {
        // Retry if SB not ready
        setTimeout(fetchUsers, 500);
        return;
    }

    try {
        const { data, error } = await window.sb
            .from('users')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        allUsers = data || [];
        renderUsers(allUsers);

    } catch (err) {
        console.error('Error fetching users:', err);

        // Build a detailed diagnostic message
        const errMsg = err.message || 'Unknown error';
        const errCode = err.code || '';
        const errHint = err.hint || '';
        const errDetails = err.details || '';

        // Detect common Supabase issues and provide guidance
        let diagnosis = '';
        if (errMsg.includes('permission denied') || errMsg.includes('row-level security') || errCode === '42501') {
            diagnosis = '🔒 RLS Policy Issue: The "users" table has Row Level Security enabled but no policy allows SELECT access. Go to Supabase Dashboard → Table Editor → users → RLS Policies and add a SELECT policy.';
        } else if (errMsg.includes('does not exist') || errMsg.includes('relation') || errCode === '42P01') {
            diagnosis = '❌ Missing Table: The "users" table does not exist in your Supabase database. Create it via the SQL Editor or Table Editor.';
        } else if (errMsg.includes('JWT') || errMsg.includes('apikey')) {
            diagnosis = '🔑 Auth Issue: The Supabase API key may be invalid or expired. Check supabase-config.js credentials.';
        } else if (errMsg.includes('Failed to fetch') || errMsg.includes('NetworkError')) {
            diagnosis = '🌐 Network Issue: Cannot reach Supabase. Check your internet connection or if the Supabase project is paused.';
        } else {
            diagnosis = '⚠️ Check the browser console (F12) for more details.';
        }

        list.innerHTML = `<tr><td colspan="8" style="text-align:center; padding: 30px;">
            <div style="color: #e74c3c; font-weight: 600; margin-bottom: 8px;">Error loading users</div>
            <div style="font-size: 0.85rem; opacity: 0.8; margin-bottom: 4px;"><strong>Message:</strong> ${errMsg}</div>
            ${errCode ? `<div style="font-size: 0.85rem; opacity: 0.8; margin-bottom: 4px;"><strong>Code:</strong> ${errCode}</div>` : ''}
            ${errHint ? `<div style="font-size: 0.85rem; opacity: 0.8; margin-bottom: 4px;"><strong>Hint:</strong> ${errHint}</div>` : ''}
            ${errDetails ? `<div style="font-size: 0.85rem; opacity: 0.8; margin-bottom: 4px;"><strong>Details:</strong> ${errDetails}</div>` : ''}
            <div style="font-size: 0.85rem; margin-top: 12px; padding: 10px; background: rgba(0,0,0,0.04); border-radius: 10px; text-align: left;">${diagnosis}</div>
        </td></tr>`;
    }
}

// --- Render Users ---
function renderUsers(users) {
    const list = document.getElementById('usersList');
    if (!list) return;

    if (users.length === 0) {
        list.innerHTML = `<tr><td colspan="8" style="text-align:center; padding: 40px; opacity: 0.5;">No user records found.</td></tr>`;
        return;
    }

    list.innerHTML = users.map(user => {
        // Fallbacks
        const name = user.first_name ? `${user.first_name} ${user.last_name || ''}` : (user.name || 'Unknown'); // Handle schema variations
        const email = user.email || 'N/A';
        const role = user.role || 'Staff';
        const status = user.status || 'Active'; // Assume Active if missing

        // Avatar logic
        let avatarUrl = user.avatar_url;
        if (!avatarUrl) {
            avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=A67B5B&color=fff`;
        }

        const statusClass = status.toLowerCase() === 'active' ? 'status-active' : 'status-inactive';

        return `
        <tr class="animate-fade-in">
            <td>
                <div style="width: 40px; height: 40px; border-radius: 50%; overflow: hidden; border: 2px solid #ddd;">
                    <img src="${avatarUrl}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='https://github.com/mdo.png'">
                </div>
            </td>
            <td style="font-weight: 600;">${name}</td>
            <td>${user.age || '--'}</td>
            <td>${role}</td>
            <td>${user.contact_number || user.contact || '--'}</td>
            <td>${email}</td>
            <td><span class="status-badge ${statusClass}">${status}</span></td>
            <td>
                <div style="display: flex; gap: 5px;">
                    <button class="btn-edit" onclick="editUser('${user.id}')" title="Edit">
                        Edit
                    </button>
                    <button class="btn-delete" onclick="deleteUser('${user.id}')" title="Delete">
                        Delete
                    </button>
                </div>
            </td>
        </tr>
    `}).join('');
}

// --- Form Handling ---
async function handleUserFormSubmit(e) {
    e.preventDefault();

    // Get Form Data
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    // Basic Validation
    if (data.password && data.password !== data.confirmPassword) {
        Swal.fire('Error', 'Passwords do not match', 'error');
        return;
    }

    try {
        Swal.fire({
            title: isEditMode ? 'Updating...' : 'Creating...',
            text: 'Please wait',
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading()
        });

        // 1. Prepare User Data for DB
        // Determine name splitting if using single "Name" field
        const nameParts = data.name.trim().split(' ');
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(' ') || '';

        const dbPayload = {
            first_name: firstName,
            last_name: lastName,
            // Fallback for schema variations if columns exist or not. 
            // Better to assume a schema. I'll stick to what seemed standard:
            // name, age, role, contact, email, status
            // BUT session-handler used first_name, last_name. I will try to save BOTH or adapt.
            // Let's save flattened 'name' too if the column exists, but usually normalized is better.
            // I'll try to save `name` as well just in case.
            name: data.name,
            age: data.age ? parseInt(data.age) : null,
            role: data.role,
            contact_number: data.contact, // standardize to contact_number
            contact: data.contact,        // and contact just in case
            email: data.email,
            status: 'Active',             // Default for new users
            updated_at: new Date()
        };

        if (isEditMode && currentEditId) {
            // --- UPDATE EXISTING USER ---
            const { error } = await window.sb
                .from('users')
                .update(dbPayload)
                .eq('id', currentEditId);

            if (error) throw error;

            Swal.fire('Success', 'User updated successfully', 'success');

        } else {
            // --- CREATE NEW USER ---
            // 1. Create Auth User (requires workaround logic)
            // Use temporary client to avoid logging out admin
            // Ensure SUPABASE_URL and SUPABASE_ANON_KEY are available
            if (typeof SUPABASE_URL === 'undefined' || typeof SUPABASE_ANON_KEY === 'undefined') {
                throw new Error("Supabase config missing");
            }

            const tempClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

            const { data: authData, error: authError } = await tempClient.auth.signUp({
                email: data.email,
                password: data.password || 'password123', // Default password if missing
                options: {
                    data: {
                        first_name: firstName,
                        last_name: lastName,
                        role: data.role
                    }
                }
            });

            if (authError) throw authError;

            if (authData.user) {
                // 2. Insert into public users table
                // We use tempClient because RLS might only allow Users to insert their OWN row.
                // Or if RLS allows authenticated users to insert, tempClient works.

                const userId = authData.user.id;
                dbPayload.id = userId;
                // Created_at
                dbPayload.created_at = new Date();

                const { error: dbError } = await tempClient
                    .from('users')
                    .insert(dbPayload);

                if (dbError) {
                    console.error("DB Insert Error (Temp Client):", dbError);
                    // Fallback: Try with Admin client (window.sb) if Temp Client failed (maybe RLS blocks insert?)
                    const { error: dbError2 } = await window.sb
                        .from('users')
                        .insert(dbPayload);

                    if (dbError2) throw dbError2;
                }
            }

            Swal.fire('Success', 'User created successfully', 'success');
        }

        closeUserModal();
        fetchUsers(); // Refresh table

    } catch (err) {
        console.error("Operation Error:", err);
        Swal.fire('Error', err.message || 'An error occurred', 'error');
    }
}

// --- Helper Functions ---

window.openUserModal = () => {
    isEditMode = false;
    currentEditId = null;
    document.getElementById('userModalTitle').innerText = 'Create User Profile';
    const form = document.getElementById('userForm');
    form.reset();
    form.email.readOnly = false; // Enable email for new users
    document.getElementById('userModalOverlay').classList.add('show');
};

window.closeUserModal = () => {
    document.getElementById('userModalOverlay').classList.remove('show');
};

window.editUser = (id) => {
    const user = allUsers.find(u => u.id === id);
    if (!user) return;

    isEditMode = true;
    currentEditId = id;

    // Populate Form
    const form = document.getElementById('userForm');
    const name = user.name || (user.first_name + ' ' + user.last_name).trim();

    form.name.value = name;
    form.age.value = user.age || '';
    form.role.value = user.role || 'Staff';
    form.contact.value = user.contact_number || user.contact || '';
    form.email.value = user.email || '';
    form.email.readOnly = true; // Disable email editing

    // Password fields left blank
    form.password.value = '';
    form.confirmPassword.value = '';

    document.getElementById('userModalTitle').innerText = 'Edit User Profile';
    document.getElementById('userModalOverlay').classList.add('show');
};

window.deleteUser = (id) => {
    Swal.fire({
        title: 'Delete User?',
        text: "This action cannot be undone.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#e74c3c',
        cancelButtonColor: '#6e7881',
        confirmButtonText: 'Yes, Delete'
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                const { error } = await window.sb
                    .from('users')
                    .delete()
                    .eq('id', id);

                if (error) throw error;

                Swal.fire('Deleted', 'User has been removed.', 'success');
                fetchUsers();
            } catch (err) {
                Swal.fire('Error', err.message, 'error');
            }
        }
    });
};