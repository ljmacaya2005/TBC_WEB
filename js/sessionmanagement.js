/**
 * Session Management Logic
 * Handles displaying and managing active user sessions.
 */

document.addEventListener('DOMContentLoaded', () => {
    loadSessions();

    const searchInput = document.getElementById('sessionSearch');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            filterSessions(e.target.value);
        });
    }
});

// Mocked session data for demonstration
let sessions = [
    {
        id: 'sess_001',
        userName: 'Admin',
        userAvatar: 'https://github.com/mdo.png',
        device: 'MacBook Pro',
        browser: 'Chrome 121.0',
        ip: '192.168.1.15',
        loginTime: '2024-02-08 10:30:00',
        lastActive: 'Just now',
        status: 'active'
    },
    {
        id: 'sess_002',
        userName: 'Staff User',
        userAvatar: 'assets/icon.png',
        device: 'iPhone 15',
        browser: 'Safari Mobile',
        ip: '112.198.54.21',
        loginTime: '2024-02-08 14:15:00',
        lastActive: '5 mins ago',
        status: 'active'
    },
    {
        id: 'sess_003',
        userName: 'Manager',
        userAvatar: 'assets/icon.png',
        device: 'Windows PC',
        browser: 'Edge 120.0',
        ip: '120.28.143.10',
        loginTime: '2024-02-07 09:00:00',
        lastActive: '1 day ago',
        status: 'expired'
    }
];

/**
 * Loads and displays sessions in the table
 */
function loadSessions() {
    const listElement = document.getElementById('sessionsList');
    const activeCountElement = document.getElementById('activeCount');

    if (!listElement) return;

    listElement.innerHTML = '';
    let activeCount = 0;

    sessions.forEach(session => {
        if (session.status === 'active') activeCount++;

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <div class="session-user-info">
                    <img src="${session.userAvatar}" class="session-user-avatar" alt="${session.userName}" onerror="this.src='assets/icon.png'">
                    <span>${session.userName}</span>
                </div>
            </td>
            <td>
                <div class="device-info">
                    <span class="device-name">${session.device}</span>
                    <span class="browser-name">${session.browser}</span>
                </div>
            </td>
            <td><span class="ip-text">${session.ip}</span></td>
            <td>${formatDate(session.loginTime)}</td>
            <td>${session.lastActive}</td>
            <td>
                <span class="status-badge ${session.status === 'active' ? 'status-active' : 'status-expired'}">
                    ${session.status.toUpperCase()}
                </span>
            </td>
            <td>
                <button class="btn-terminate" onclick="terminateSession('${session.id}')">
                    Terminate
                </button>
            </td>
        `;
        listElement.appendChild(row);
    });

    if (activeCountElement) activeCountElement.textContent = activeCount;

    if (sessions.length === 0) {
        listElement.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 40px; opacity: 0.5;">No active sessions found.</td></tr>`;
    }
}

/**
 * Filter sessions based on search query
 */
function filterSessions(query) {
    const filtered = sessions.filter(s =>
        s.userName.toLowerCase().includes(query.toLowerCase()) ||
        s.device.toLowerCase().includes(query.toLowerCase()) ||
        s.ip.includes(query)
    );

    // Temporarily override global sessions for display (primitive approach for demo)
    const originalSessions = [...sessions];
    sessions = filtered;
    loadSessions();
    sessions = originalSessions;
}

/**
 * Handles session termination with a confirmation alert
 */
function terminateSession(sessionId) {
    Swal.fire({
        title: 'Terminate Session?',
        text: "The user will be logged out from this device.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#e74c3c',
        cancelButtonColor: '#A67B5B',
        confirmButtonText: 'Yes, terminate it!'
    }).then((result) => {
        if (result.isConfirmed) {
            // Find and remove the session
            const index = sessions.findIndex(s => s.id === sessionId);
            if (index !== -1) {
                sessions.splice(index, 1);
                loadSessions();

                Swal.fire(
                    'Terminated!',
                    'The session has been forcibly closed.',
                    'success'
                );
            }
        }
    });
}

/**
 * Utility to format dates (simplified)
 */
function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}
