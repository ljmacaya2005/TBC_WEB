// Order History - Dummy Data and Logic

const history = [
    { id: 'TRX-5501', date: 'Oct 23, 2023 05:45 PM', customer: 'Alice Smith', payment: 'Card', change: '₱0.00', ref: 'VISA-9900', total: '₱450.00', status: 'Completed' },
    { id: 'TRX-5500', date: 'Oct 23, 2023 04:20 PM', customer: 'Walk-in', payment: 'Cash', change: '₱20.00', ref: '-', total: '₱180.00', status: 'Completed' },
    { id: 'TRX-5499', date: 'Oct 23, 2023 02:10 PM', customer: 'Bob Jones', payment: 'GCash', change: '₱0.00', ref: 'RX-7722', total: '₱320.00', status: 'Refunded' },
];

document.addEventListener('DOMContentLoaded', () => {
    renderHistory();
});

function renderHistory() {
    const list = document.getElementById('historyList');
    if (!list) return;

    if (history.length === 0) {
        list.innerHTML = `<tr><td colspan="9" style="text-align:center; padding: 40px; opacity: 0.5;">No order history found.</td></tr>`;
        return;
    }

    list.innerHTML = history.map(item => `
        <tr class="animate-fade-in">
            <td style="font-family: monospace;">${item.id}</td>
            <td>${item.date}</td>
            <td>${item.customer}</td>
            <td>${item.payment}</td>
            <td>${item.change}</td>
            <td style="font-family: monospace;">${item.ref}</td>
            <td style="font-weight: 600; color: #A67B5B;">${item.total}</td>
            <td><span class="status-badge status-${item.status.toLowerCase()}">${item.status}</span></td>
            <td>
                <button class="btn-icon" title="View Details">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                </button>
            </td>
        </tr>
    `).join('');
}