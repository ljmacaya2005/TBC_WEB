// View Orders - Supabase Real-time Integration
let currentStatus = 'all';
let searchQuery = '';
let ordersData = [];
let lastRenderedHTML = '';

document.addEventListener('DOMContentLoaded', () => {
    // Initial load polling for Supabase
    const checkSb = setInterval(() => {
        if (window.sb) {
            clearInterval(checkSb);
            renderOrders();
            // Polling for updates every 10 seconds
            setInterval(renderOrders, 10000);
        }
    }, 500);

    // Tab Filtering
    document.querySelectorAll('.status-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.status-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentStatus = tab.dataset.status;
            renderOrders();
        });
    });

    // Search Filtering
    const searchInput = document.getElementById('orderSearchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value.toLowerCase().trim();
            renderOrders();
        });
    }
});

async function renderOrders() {
    const list = document.getElementById('ordersList');
    if (!list) return;

    try {
        if (!window.sb) return;

        // 1. Fetch data from Supabase
        let query = window.sb
            .from('orders')
            .select(`
                *,
                order_items (
                    *,
                    menu_items (product_name)
                ),
                payments (payment_method, change_amount, amount_tendered)
            `)
            .order('created_at', { ascending: false });

        if (currentStatus !== 'all') {
            query = query.eq('status', currentStatus);
        }

        const { data: orders, error } = await query;
        if (error) throw error;

        // 2. Client-side search filter
        let filtered = orders;
        if (searchQuery) {
            filtered = orders.filter(o =>
                o.order_code.toLowerCase().includes(searchQuery) ||
                o.notes?.toLowerCase().includes(searchQuery) ||
                o.order_items.some(item => item.menu_items?.product_name.toLowerCase().includes(searchQuery))
            );
        }

        // 3. Generate HTML
        let htmlContent = '';
        if (filtered.length === 0) {
            htmlContent = `<tr><td colspan="9" style="text-align:center; padding: 60px; opacity: 0.5;">No orders found.</td></tr>`;
        } else {
            htmlContent = filtered.map(order => {
                const status = order.status.toLowerCase();
                const itemsStr = order.order_items.map(i => `${i.quantity}x ${i.menu_items?.product_name || 'Item'}`).join('<br>');
                const date = new Date(order.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true });
                const payment = order.payments?.[0];

                let actionBtn = '';
                if (status === 'pending') {
                    actionBtn = `
                        <button class="btn-icon done-btn" onclick="updateOrderStatus('${order.order_id}', 'completed')" title="Complete">
                           <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        </button>
                        <button class="btn-icon delete-btn" onclick="updateOrderStatus('${order.order_id}', 'cancelled')" title="Cancel">
                           <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                    `;
                } else if (status === 'cancelled') {
                    actionBtn = `
                        <button class="btn-icon done-btn" onclick="updateOrderStatus('${order.order_id}', 'pending')" title="Restore">
                           <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"></polyline><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path></svg>
                        </button>
                    `;
                }

                return `
                    <tr>
                        <td>
                            <div class="code-cell">${order.order_code}</div>
                            <div class="time-cell">${date}</div>
                        </td>
                        <td>
                            <div class="items-list">${itemsStr}</div>
                        </td>
                        <td>${payment?.payment_method || 'N/A'}</td>
                        <td>₱${(payment?.change_amount || 0).toFixed(2)}</td>
                        <td>${payment?.reference_no || '-'}</td>
                        <td><strong>₱${order.total_amount.toFixed(2)}</strong></td>
                        <td>
                            <span class="status-badge status-${status}">${order.status}</span>
                        </td>
                        <td>
                            <div class="action-buttons-cell">
                                ${actionBtn}
                                <button class="btn-icon view-btn" onclick="viewOrderDetails('${order.order_id}')" title="View Details">
                                   <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');
        }

        if (htmlContent !== lastRenderedHTML) {
            list.innerHTML = htmlContent;
            lastRenderedHTML = htmlContent;
        }

    } catch (err) {
        console.error("View Orders Render Error:", err);
    }
}

window.updateOrderStatus = async (orderId, newStatus) => {
    try {
        const { error } = await window.sb
            .from('orders')
            .update({ status: newStatus })
            .eq('order_id', orderId);

        if (error) throw error;

        Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: `Order marked as ${newStatus}`,
            showConfirmButton: false,
            timer: 2000
        });
        renderOrders();
    } catch (err) {
        Swal.fire('Error', err.message, 'error');
    }
};

window.viewOrderDetails = async (orderId) => {
    // Basic implementation of view details
    const order = ordersData.find(o => o.order_id === orderId);
    if (!order) return;

    Swal.fire({
        title: `Order Details: ${order.order_code}`,
        html: `<div style="text-align: left;">
                  <p><b>Items:</b><br>${order.order_items.map(i => `${i.quantity}x ${i.menu_items?.product_name}`).join('<br>')}</p>
                  <p><b>Total:</b> ₱${order.total_amount.toFixed(2)}</p>
                  <p><b>Notes:</b> ${order.notes || 'N/A'}</p>
               </div>`,
        confirmButtonColor: '#A67B5B'
    });
};
