// User Management - Dummy Data and Logic

const users = [
    { name: 'Admin User', age: 30, position: 'Manager', contact: '+63 900 123 4567', username: 'admin', role: 'Admin', status: 'Active', avatar: 'https://github.com/mdo.png' },
    { name: 'John Barista', age: 24, position: 'Staff', contact: '+63 900 987 6543', username: 'johnb', role: 'Staff', status: 'Active', avatar: 'https://placehold.co/100x100/A67B5B/FFF?text=J' },
    { name: 'Jane Cashier', age: 22, position: 'Staff', contact: '+63 900 555 4444', username: 'janec', role: 'Staff', status: 'Inactive', avatar: 'https://placehold.co/100x100/4E342E/FFF?text=J' },
];

document.addEventListener('DOMContentLoaded', () => {
    renderUsers();
});

function renderUsers() {
    const list = document.getElementById('usersList');
    if (!list) return;

    if (users.length === 0) {
        list.innerHTML = `<tr><td colspan="8" style="text-align:center; padding: 40px; opacity: 0.5;">No user records found.</td></tr>`;
        return;
    }

    list.innerHTML = users.map(user => `
        <tr class="animate-fade-in">
            <td><div style="width: 40px; height: 40px; border-radius: 50%; overflow: hidden;"><img src="${user.avatar}" style="width: 100%; height: 100%; object-fit: cover;"></div></td>
            <td style="font-weight: 600;">${user.name}</td>
            <td>${user.age}</td>
            <td>${user.position}</td>
            <td>${user.contact}</td>
            <td>${user.username}</td>
            <td><span class="status-badge status-${user.status.toLowerCase()}">${user.status}</span></td>
            <td>
                <button class="btn-icon" title="Edit" onclick="editUser('${user.username}')">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                </button>
                <button class="btn-icon" title="Delete" onclick="deleteUser('${user.username}')" style="color: #e74c3c;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                </button>
            </td>
        </tr>
    `).join('');
}

window.openUserModal = () => {
    document.getElementById('userModalOverlay').classList.add('show');
};

window.closeUserModal = () => {
    document.getElementById('userModalOverlay').classList.remove('show');
};

window.editUser = (username) => {
    // Logic to populate form
    document.getElementById('userModalTitle').innerText = 'Edit User Profile';
    window.openUserModal();
};

window.deleteUser = (username) => {
    Swal.fire({
        title: 'Delete User?',
        text: `Are you sure you want to delete ${username}?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#e74c3c',
        cancelButtonColor: '#6e7881',
        confirmButtonText: 'Yes, Delete'
    }).then((result) => {
        if (result.isConfirmed) {
            Swal.fire('Deleted', 'User account removed.', 'success');
        }
    });
};