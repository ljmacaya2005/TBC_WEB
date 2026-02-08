// View Orders - Dummy Data and Logic

const orders = [
    { id: 'ORD-1024', date: 'Oct 24, 2023 10:30 AM', items: '1x Iced Vanilla Latte, 1x Croissant', payment: 'Cash', change: '₱50.00', ref: '-', total: '₱250.00', status: 'Pending' },
    { id: 'ORD-1023', date: 'Oct 24, 2023 09:15 AM', items: '2x Espresso', payment: 'GCash', change: '₱0.00', ref: 'RX-9988', total: '₱220.00', status: 'Completed' },
    { id: 'ORD-1022', date: 'Oct 24, 2023 08:45 AM', items: '1x Cold Brew', payment: 'Card', change: '₱0.00', ref: 'VISA-1234', total: '₱145.00', status: 'Completed' }
];

document.addEventListener('DOMContentLoaded', () => {
    renderOrders();
});

function renderOrders() {
    const list = document.getElementById('ordersList');
    if (!list) return;

    if (orders.length === 0) {
        list.innerHTML = `<tr><td colspan="9" style="text-align:center; padding: 40px; opacity: 0.5;">No active orders found.</td></tr>`;
        return;
    }

    list.innerHTML = orders.map(order => `
        <tr class="animate-fade-in">
            <td style="font-weight: 600;">${order.id}</td>
            <td>${order.date}</td>
            <td style="max-width: 200px;">${order.items}</td>
            <td>${order.payment}</td>
            <td>${order.change}</td>
            <td style="font-family: monospace;">${order.ref}</td>
            <td style="font-weight: 600; color: #A67B5B;">${order.total}</td>
            <td><span class="status-badge status-${order.status.toLowerCase()}">${order.status}</span></td>
            <td>
                <button class="btn-icon" onclick="refundOrder('${order.id}')" title="Refund">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: #e74c3c;"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>
                </button>
            </td>
        </tr>
    `).join('');
}

window.refundOrder = (id) => {
    Swal.fire({
        title: 'Refund Order?',
        text: `Are you sure you want to process a refund for ${id}?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#e74c3c',
        cancelButtonColor: '#6e7881',
        confirmButtonText: 'Yes, Refund'
    }).then((result) => {
        if (result.isConfirmed) {
            Swal.fire('Refunded!', 'The order has been marked for refund.', 'success');
        }
    });
};
