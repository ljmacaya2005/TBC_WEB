// Stocks - Dummy Data and Logic

const stocks = [
    { pId: 'P001', name: 'Coffee Beans (Arabica)', category: 'Coffee', created: '2023-10-01', qty: 50, unit: 'kg', status: 'In Stock' },
    { pId: 'P002', name: 'Almond Milk', category: 'Non-Coffee', created: '2023-10-05', qty: 12, unit: 'L', status: 'Low Stock' },
    { pId: 'P003', name: 'Croissants', category: 'Pastries', created: '2023-10-24', qty: 0, unit: 'pcs', status: 'Out of Stock' },
];

document.addEventListener('DOMContentLoaded', () => {
    renderStocks();
});

function renderStocks() {
    const list = document.getElementById('stocksList');
    if (!list) return;

    if (stocks.length === 0) {
        list.innerHTML = `<tr><td colspan="8" style="text-align:center; padding: 40px; opacity: 0.5;">No inventory data available.</td></tr>`;
        return;
    }

    list.innerHTML = stocks.map(item => `
        <tr class="animate-fade-in">
            <td style="font-family: monospace;">${item.pId}</td>
            <td style="font-weight: 500;">${item.name}</td>
            <td>${item.category}</td>
            <td>${item.created}</td>
            <td style="${item.qty <= 5 ? 'color: #e74c3c; font-weight: bold;' : ''}">${item.qty}</td>
            <td>${item.unit}</td>
            <td><span class="status-badge status-${item.status.toLowerCase().replace(/ /g, '-')}">${item.status}</span></td>
            <td>
                <button class="btn-icon" title="Edit" onclick="editStock('${item.pId}')">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                </button>
                <button class="btn-icon" title="Delete" onclick="deleteStock('${item.pId}')" style="color: #e74c3c;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                </button>
            </td>
        </tr>
    `).join('');
}

window.openStockModal = () => {
    document.getElementById('stockModalOverlay').classList.add('show');
};

window.closeStockModal = () => {
    document.getElementById('stockModalOverlay').classList.remove('show');
};

window.editStock = (id) => {
    // Logic to fill form and open modal would go here
    window.openStockModal();
};

window.deleteStock = (id) => {
    Swal.fire({
        title: 'Delete Item?',
        text: `Permanently delete ${id}?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#e74c3c',
        cancelButtonColor: '#6e7881',
        confirmButtonText: 'Yes, Delete'
    }).then((result) => {
        if (result.isConfirmed) {
            Swal.fire('Deleted', 'Item removed.', 'success');
        }
    });
};