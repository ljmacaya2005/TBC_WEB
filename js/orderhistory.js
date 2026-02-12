/**
 * THE BREW CAVE — Order History (Supabase Integration)
 * Fetches and displays past transactions from Supabase.
 */

let historyData = [];
let searchQuery = '';

document.addEventListener('DOMContentLoaded', () => {
    // Initial load polling for Supabase
    const checkSb = setInterval(() => {
        if (window.sb) {
            clearInterval(checkSb);
            fetchHistory();
        }
    }, 500);

    // Search Filtering
    const searchInput = document.querySelector('.search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value.toLowerCase().trim();
            renderHistory();
        });
    }

    // Refresh FAB
    const refreshBtn = document.getElementById('fabRefresh');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            fetchHistory();
        });
    }
});

async function fetchHistory() {
    try {
        if (!window.sb) return;

        const { data, error } = await window.sb
            .from('orders')
            .select(`
                *,
                payments (payment_method, change_amount, amount_tendered, reference_no),
                order_items (
                    *,
                    menu_items (product_name)
                )
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;
        historyData = data || [];
        renderHistory();

    } catch (err) {
        console.error("Fetch History Error:", err);
    }
}

function renderHistory() {
    const list = document.getElementById('historyList');
    if (!list) return;

    const filtered = historyData.filter(item => {
        const matchesSearch = item.order_code.toLowerCase().includes(searchQuery) ||
            (item.notes && item.notes.toLowerCase().includes(searchQuery));
        return matchesSearch;
    });

    if (filtered.length === 0) {
        list.innerHTML = `<tr><td colspan="9" style="text-align:center; padding: 40px; opacity: 0.5;">No order history found.</td></tr>`;
        return;
    }

    list.innerHTML = filtered.map(item => {
        const payment = item.payments?.[0];
        const date = new Date(item.created_at).toLocaleString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric',
            hour: 'numeric', minute: 'numeric', hour12: true
        });
        const status = item.status.toLowerCase();

        // Extract customer name from notes if possible (e.g., "Customer: John")
        let customer = 'Walk-in';
        if (item.notes && item.notes.includes('Customer:')) {
            customer = item.notes.split('Customer:')[1].trim();
        }

        return `
            <tr class="animate-fade-in">
                <td style="font-family: monospace; font-weight: 600;">${item.order_code}</td>
                <td>${date}</td>
                <td>${customer}</td>
                <td>${payment?.payment_method || 'N/A'}</td>
                <td>₱${(payment?.change_amount || 0).toFixed(2)}</td>
                <td style="font-family: monospace;">${payment?.reference_no || '-'}</td>
                <td style="font-weight: 600; color: #A67B5B;">₱${item.total_amount.toFixed(2)}</td>
                <td><span class="status-badge status-${status}">${item.status}</span></td>
                <td>
                    <button class="btn-icon" title="View Details" onclick="viewHistoryDetails('${item.order_id}')">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

window.viewHistoryDetails = (orderId) => {
    const order = historyData.find(o => o.order_id.toString() === orderId.toString());
    if (!order) return;

    const itemsHtml = order.order_items.map(i => `
        <div style="display: flex; justify-content: space-between; margin-bottom: 5px; border-bottom: 1px dashed rgba(0,0,0,0.1); padding-bottom: 5px;">
            <span>${i.quantity}x ${i.menu_items?.product_name || 'Item'}</span>
            <span>₱${(i.price_at_time * i.quantity).toFixed(2)}</span>
        </div>
    `).join('');

    Swal.fire({
        title: `Order Details: ${order.order_code}`,
        html: `
            <div style="text-align: left; font-size: 0.9rem;">
                <div style="margin-bottom: 15px;">
                    <strong>Date:</strong> ${new Date(order.created_at).toLocaleString()}<br>
                    <strong>Status:</strong> <span class="status-badge status-${order.status.toLowerCase()}">${order.status}</span>
                </div>
                <div style="margin-bottom: 15px;">
                    <strong>Items:</strong>
                    <div style="margin-top: 10px; background: rgba(0,0,0,0.02); padding: 10px; border-radius: 8px;">
                        ${itemsHtml}
                        <div style="display: flex; justify-content: space-between; margin-top: 10px; font-weight: 700; color: #A67B5B; font-size: 1.1rem;">
                            <span>Total</span>
                            <span>₱${order.total_amount.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
                ${order.notes ? `<div><strong>Notes:</strong> ${order.notes}</div>` : ''}
            </div>
        `,
        confirmButtonColor: '#A67B5B'
    });
};
