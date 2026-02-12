// View Orders - Premium Design Logic & Workflow

// State management
let currentStatus = 'all';
let searchQuery = '';
let lastRenderedHTML = ''; // To prevent blinking

// ─── Fetch Orders from Local Storage ───
function getOrders() {
    return JSON.parse(localStorage.getItem('brewcave_orders')) || [];
}

// ─── Save Orders to Local Storage ───
function saveOrders(orders) {
    localStorage.setItem('brewcave_orders', JSON.stringify(orders));
}

document.addEventListener('DOMContentLoaded', () => {
    // Initial render
    renderOrders();

    // Auto-refresh every 5 seconds to pick up new orders
    setInterval(renderOrders, 5000);

    // Tab Filtering Logic
    const tabs = document.querySelectorAll('.status-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all
            tabs.forEach(t => t.classList.remove('active'));
            // Add to clicked
            tab.classList.add('active');

            // Update state and re-render
            currentStatus = tab.dataset.status;
            // Force re-render when switching tabs (ignore anti-blink)
            lastRenderedHTML = '';
            renderOrders();
        });
    });

    // Search Logic
    const searchInput = document.getElementById('orderSearchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value.toLowerCase().trim();
            // Force re-render on search (ignore anti-blink)
            lastRenderedHTML = '';
            renderOrders();
        });
    }
});

function renderOrders() {
    const list = document.getElementById('ordersList');
    if (!list) return;

    let orders = getOrders();

    // 1. Filter by Status
    // Note: 'all' shows everything except maybe 'cancelled' if desired, but user said "all orders section".
    // Usually "All" shows everything. 
    if (currentStatus !== 'all') {
        orders = orders.filter(order => order.status.toLowerCase() === currentStatus);
    }

    // 2. Filter by Search Query
    if (searchQuery) {
        orders = orders.filter(order =>
            order.id.toLowerCase().includes(searchQuery) ||
            order.items.toLowerCase().includes(searchQuery) ||
            (order.customer && order.customer.toLowerCase().includes(searchQuery))
        );
    }

    // Generate HTML
    let htmlContent = '';

    if (orders.length === 0) {
        const message = searchQuery
            ? `No "${currentStatus}" orders match your search.`
            : `No ${currentStatus === 'all' ? 'active' : currentStatus} orders found.`;

        htmlContent = `<tr><td colspan="9" style="text-align:center; padding: 60px; opacity: 0.5;">
            <div style="display:flex; flex-direction:column; align-items:center; gap:10px;">
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" style="opacity:0.5;">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                ${message}
            </div>
        </td></tr>`;
    } else {
        htmlContent = orders.map(order => {
            const statusLower = order.status.toLowerCase();
            let actionButtons = '';

            // Define Buttons based on Current Tab/Status
            // User Request:
            // All Orders -> Cancel Order
            // Pending -> Prepare, Cancel
            // Preparing -> Complete, Cancel
            // Cancelled -> Undo

            if (currentStatus === 'all') {
                // In "All Orders", explicitly requested "Cancel Order" button
                if (statusLower !== 'cancelled' && statusLower !== 'completed') {
                    actionButtons += createButton(order.id, 'cancel', 'Cancel Order', 'rgba(231, 76, 60, 0.1)', '#e74c3c');
                }
            } else if (currentStatus === 'pending') {
                actionButtons += createButton(order.id, 'prepare', 'Start Preparing', 'rgba(52, 152, 219, 0.1)', '#3498db');
                actionButtons += createButton(order.id, 'cancel', 'Cancel Order', 'rgba(231, 76, 60, 0.1)', '#e74c3c');
            } else if (currentStatus === 'preparing') {
                actionButtons += createButton(order.id, 'complete', 'Mark Completed', 'rgba(46, 204, 113, 0.1)', '#2ecc71');
                actionButtons += createButton(order.id, 'cancel', 'Cancel Order', 'rgba(231, 76, 60, 0.1)', '#e74c3c');
            } else if (currentStatus === 'cancelled') {
                actionButtons += createButton(order.id, 'undo', 'Undo Cancel', 'rgba(166, 123, 91, 0.1)', '#A67B5B');
            } else if (currentStatus === 'completed') {
                // No specific actions requested for completed, maybe just view?
                // Leaving empty for now as verified.
            }

            // Always add a "View" button for details if needed, or keep minimal
            const viewButton = `<button class="btn-icon" title="View Details" style="background: rgba(166, 123, 91, 0.1); color: #A67B5B; border-color: rgba(166, 123, 91, 0.2);">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                    </button>`;

            return `
        <tr style="animation: fadeIn 0.3s ease forwards;">
            <td data-label="Order ID" style="font-weight: 700; font-family: monospace; color: var(--accent-color);">${order.id}</td>
            <td data-label="Date" style="font-size:0.85rem; opacity:0.8;">${order.date}</td>
            <td data-label="Items" style="max-width: 200px; line-height:1.4;">
                <span style="font-weight:500;">${order.items}</span>
                ${order.customer ? `<div style="font-size:0.75rem; opacity:0.6; margin-top:2px;">Cust: ${order.customer}</div>` : ''}
            </td>
            <td data-label="Payment">${order.payment}</td>
            <td data-label="Change">${order.change}</td>
            <td data-label="Ref No." style="font-family: monospace; opacity:0.7;">${order.ref || '-'}</td>
            <td data-label="Total" style="font-weight: 700; color: var(--text-color); font-size:1rem;">${order.total}</td>
            <td data-label="Status">
                <div style="display:flex; align-items:center; gap:8px;">
                     <span class="status-badge status-${statusLower}">${order.status}</span>
                     ${actionButtons}
                </div>
            </td>
            <td data-label="Actions">
                <div style="display:flex; justify-content:flex-end; gap:8px;">
                    ${viewButton}
                </div>
            </td>
        </tr>
    `}).join('');
    }

    // Anti-Blink Check
    // We only update the DOM if the HTML string is different from the last render
    if (htmlContent !== lastRenderedHTML) {
        list.innerHTML = htmlContent;
        lastRenderedHTML = htmlContent;
    }
}

// Helper to create buttons
function createButton(id, type, title, bg, color) {
    let icon = '';
    let onclick = '';

    if (type === 'prepare') {
        icon = '<polygon points="5 3 19 12 5 21 5 3"></polygon>'; // Play
        onclick = `updateStatus('${id}', 'Preparing')`;
    } else if (type === 'complete') {
        icon = '<polyline points="20 6 9 17 4 12"></polyline>'; // Check
        onclick = `updateStatus('${id}', 'Completed')`;
    } else if (type === 'cancel') {
        icon = '<line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>'; // X
        onclick = `cancelOrder('${id}')`;
    } else if (type === 'undo') {
        icon = '<polyline points="1 4 1 10 7 10"></polyline><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>'; // Undo
        onclick = `undoCancel('${id}')`;
    }

    return `
    <button class="btn-icon" onclick="${onclick}" title="${title}" style="background: ${bg}; color: ${color}; border-color: ${color}30;">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${icon}</svg>
    </button>
    `;
}

// ─── Status Actions ───

// Standard Status Update
window.updateStatus = (id, newStatus) => {
    const orders = getOrders();
    const orderIndex = orders.findIndex(o => o.id === id);

    if (orderIndex !== -1) {
        orders[orderIndex].status = newStatus;
        saveOrders(orders);
        renderOrders(); // Re-render immediately (bypass interval)
        showToast(`Order ${id} marked as ${newStatus}`, 'success');
    }
};

// Cancel Order (with stash)
window.cancelOrder = (id) => {
    Swal.fire({
        title: 'Cancel Order?',
        text: `Are you sure you want to cancel ${id}?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#e74c3c',
        cancelButtonColor: '#6e7881',
        confirmButtonText: 'Yes, Cancel'
    }).then((result) => {
        if (result.isConfirmed) {
            const orders = getOrders();
            const orderIndex = orders.findIndex(o => o.id === id);

            if (orderIndex !== -1) {
                // Save previous status to allow undo
                orders[orderIndex].previousStatus = orders[orderIndex].status;
                orders[orderIndex].status = 'Cancelled';

                saveOrders(orders);
                renderOrders();
                showToast('Order has been cancelled.', 'info');
            }
        }
    });
};

// Undo Cancel
window.undoCancel = (id) => {
    const orders = getOrders();
    const orderIndex = orders.findIndex(o => o.id === id);

    if (orderIndex !== -1) {
        // Restore previous status or default to Pending
        const prev = orders[orderIndex].previousStatus || 'Pending';
        orders[orderIndex].status = prev;
        delete orders[orderIndex].previousStatus; // Clean up

        saveOrders(orders);
        renderOrders();
        showToast(`Order restored to ${prev}`, 'success');
    }
};

// Toast Helper
function showToast(title, icon) {
    const toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        didOpen: (toast) => {
            toast.addEventListener('mouseenter', Swal.stopTimer);
            toast.addEventListener('mouseleave', Swal.resumeTimer);
        }
    });

    toast.fire({
        icon: icon,
        title: title
    });
}
