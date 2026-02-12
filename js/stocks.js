/**
 * THE BREW CAVE — Stocks Management (Supabase Integration)
 * Full CRUD: Add, Edit, Delete stock items linked to Supabase DB.
 */

// --- Supabase State ---
let stocks = [];
let addons = [];
let categories = [];

const LOW_STOCK_THRESHOLD = 10;

// --- State ---
let editingStockPk = null;
let searchQuery = '';
let currentStatus = 'all';
let currentCategoryFilter = 'all';
let lastRenderedHTML = ''; // To prevent blinking

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    initStocks();
});

async function initStocks() {
    // Wait for Supabase
    const checkSb = setInterval(async () => {
        if (window.sb) {
            clearInterval(checkSb);
            await fetchStocksData();
            setupSearch();
            setupStatusTabs();
            setupCategoryFilter();
            renderStocks();
        }
    }, 500);
}

async function fetchStocksData() {
    try {
        // 1. Fetch Categories
        const { data: catData } = await window.sb.from('menu_categories').select('*');
        categories = catData || [];

        // 2. Fetch Stocks
        const { data: stockData, error: stockError } = await window.sb.from('stocks').select('*');
        if (stockError) throw stockError;
        stocks = stockData || [];

        // 3. Fetch Addons (for the combined view)
        const { data: addonData, error: addonError } = await window.sb.from('addons').select('*');
        if (addonError) throw addonError;
        addons = addonData || [];

    } catch (err) {
        console.error("Fetch Stocks Data Error:", err);
    }
}

function calcStatus(qty) {
    if (qty <= 0) return 'Out of Stock';
    if (qty <= LOW_STOCK_THRESHOLD) return 'Low Stock';
    return 'In Stock';
}

// ─── Render ───
function renderStocks() {
    const list = document.getElementById('stocksList');
    if (!list) return;

    // 1. Normalize data
    const stockItems = stocks.map(s => {
        const cat = categories.find(c => c.category_id === s.category_id);
        return {
            id: s.stock_pk,
            displayId: s.stock_id ? `STK-${s.stock_id.toString().padStart(3, '0')}` : `ID-${s.stock_pk}`,
            name: s.stock_name,
            category: cat ? cat.category_name : 'Ingredients',
            created_at: s.created_at ? new Date(s.created_at).toLocaleDateString() : '--',
            quantity: s.quantity,
            unit: s.unit || 'pcs',
            type: 'ingredients'
        };
    });

    const addonItems = addons.map(a => ({
        id: a.addon_id,
        displayId: `ADD-${a.addon_id.toString().padStart(3, '0')}`,
        name: a.name,
        category: 'Add-ons',
        created_at: a.created_at ? new Date(a.created_at).toLocaleDateString() : '--',
        quantity: 0, // Addons don't have separate stock records in this view currently
        unit: 'pcs',
        type: 'addons'
    }));

    // Combine
    let combined = [...stockItems, ...addonItems];

    // 2. Filter by Type
    if (currentCategoryFilter !== 'all') {
        combined = combined.filter(item => item.type === currentCategoryFilter);
    }

    // 3. Filter by Status (Only for ingredients since addons have no stock logic here)
    if (currentStatus !== 'all') {
        combined = combined.filter(item => {
            const status = calcStatus(item.quantity).toLowerCase();
            return status === currentStatus;
        });
    }

    // 4. Filter by Search Query
    if (searchQuery) {
        combined = combined.filter(item =>
            item.name.toLowerCase().includes(searchQuery) ||
            item.displayId.toLowerCase().includes(searchQuery)
        );
    }

    updateCategoryDropdown();

    let htmlContent = '';

    if (combined.length === 0) {
        htmlContent = `<tr><td colspan="8" style="text-align:center; padding: 60px; opacity: 0.5;">
            No items found match your criteria.
        </td></tr>`;
    } else {
        htmlContent = combined.map(item => {
            const status = calcStatus(item.quantity);
            const statusClass = status.toLowerCase().replace(/ /g, '-');
            const displayCategory = item.type === 'ingredients' ? item.category : 'Add-ons';

            return `
            <tr style="animation: fadeIn 0.3s ease forwards;">
                <td data-label="Product ID" style="font-family: monospace; font-weight: 600; color: var(--accent-color);">${item.displayId}</td>
                <td data-label="Item Name" style="font-weight: 700;">${item.name}</td>
                <td data-label="Category">
                    <span class="badge" style="background: ${item.type === 'ingredients' ? 'rgba(166,123,91,0.1)' : 'rgba(112,102,224,0.1)'}; color: ${item.type === 'ingredients' ? '#A67B5B' : '#7066e0'}; padding: 4px 8px; border-radius: 6px; font-size: 0.8rem; font-weight: 600;">
                        ${displayCategory}
                    </span>
                </td>
                <td data-label="Created At" style="font-size: 0.85rem; opacity: 0.6;">${item.created_at}</td>
                <td data-label="Quantity">
                    <span style="${item.quantity <= LOW_STOCK_THRESHOLD && item.type === 'ingredients' ? 'color: #e74c3c; font-weight: 800;' : 'font-weight: 600;'}">
                        ${item.type === 'ingredients' ? item.quantity : '--'}
                    </span>
                </td>
                <td data-label="Unit" style="opacity: 0.8;">${item.type === 'ingredients' ? item.unit : '--'}</td>
                <td data-label="Status">
                    ${item.type === 'ingredients' ? `<span class="status-badge status-${statusClass}">${status}</span>` : '<span class="status-badge" style="background:#eee; color:#666;">Service</span>'}
                </td>
                <td data-label="Actions">
                    <div style="display: flex; justify-content: flex-end; gap: 8px;">
                        ${item.type === 'ingredients' ? `
                            <button class="btn-icon" title="Edit" onclick="editStock('${item.id}')">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                            </button>
                            <button class="btn-icon delete-btn" title="Delete" onclick="deleteStock('${item.id}')">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                            </button>
                        ` : `
                            <span style="font-size: 0.75rem; opacity: 0.5; font-style: italic;">Managed in Menu</span>
                        `}
                    </div>
                </td>
            </tr>`;
        }).join('');
    }

    if (htmlContent !== lastRenderedHTML) {
        list.innerHTML = htmlContent;
        lastRenderedHTML = htmlContent;
    }
}

// ─── Modal & Form Logic ───
const stockForm = document.getElementById('stockForm');
const categorySelect = document.querySelector('select[name="category"]');

window.openStockModal = () => {
    editingStockPk = null;
    document.getElementById('stockModalTitle').textContent = 'Add New Item';
    stockForm.reset();
    populateCategoryOptions();
    document.getElementById('stockModalOverlay').classList.add('show');
};

function populateCategoryOptions() {
    if (!categorySelect) return;
    categorySelect.innerHTML = '';
    categories.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat.category_id;
        opt.textContent = cat.category_name;
        categorySelect.appendChild(opt);
    });
}

window.handleStockSubmit = async (e) => {
    e.preventDefault();
    const itemName = stockForm.elements['itemName'].value.trim();
    const categoryId = categorySelect.value;
    const quantity = parseInt(stockForm.elements['quantity'].value) || 0;
    const unit = stockForm.elements['unit'].value;

    try {
        Swal.fire({ title: 'Saving...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
        const payload = {
            stock_name: itemName,
            category_id: categoryId,
            quantity: quantity,
            unit: unit,
            updated_at: new Date()
        };

        if (editingStockPk) {
            const { error } = await window.sb.from('stocks').update(payload).eq('stock_pk', editingStockPk);
            if (error) throw error;
        } else {
            // Generate a numeric stock_id if needed, or let DB handle PK
            payload.stock_id = Math.floor(Math.random() * 900) + 100;
            const { error } = await window.sb.from('stocks').insert(payload);
            if (error) throw error;
        }

        await fetchStocksData();
        renderStocks();
        closeStockModal();
        Swal.fire('Success', 'Stock item saved', 'success');
    } catch (err) {
        Swal.fire('Error', err.message, 'error');
    }
};

if (stockForm) {
    stockForm.addEventListener('submit', (e) => handleStockSubmit(e));
}

window.editStock = (pk) => {
    const item = stocks.find(s => s.stock_pk.toString() === pk.toString());
    if (!item) return;

    editingStockPk = pk;
    document.getElementById('stockModalTitle').textContent = 'Edit Item';
    populateCategoryOptions();

    categorySelect.value = item.category_id;
    stockForm.elements['itemName'].value = item.stock_name;
    stockForm.elements['quantity'].value = item.quantity;
    stockForm.elements['unit'].value = item.unit;

    document.getElementById('stockModalOverlay').classList.add('show');
};

window.deleteStock = async (pk) => {
    const res = await Swal.fire({ title: 'Delete Stock Item?', icon: 'warning', showCancelButton: true });
    if (res.isConfirmed) {
        try {
            const { error } = await window.sb.from('stocks').delete().eq('stock_pk', pk);
            if (error) throw error;
            await fetchStocksData();
            renderStocks();
            Swal.fire('Deleted', '', 'success');
        } catch (err) {
            Swal.fire('Error', err.message, 'error');
        }
    }
};

window.closeStockModal = () => document.getElementById('stockModalOverlay').classList.remove('show');

function setupSearch() {
    document.getElementById('stockSearchInput')?.addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase().trim();
        renderStocks();
    });
}

function setupStatusTabs() {
    document.querySelectorAll('.status-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.status-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentStatus = tab.dataset.status;
            renderStocks();
        });
    });
}

function setupCategoryFilter() {
    document.querySelectorAll('#categoryFilterDropdown .dropdown-option-premium').forEach(opt => {
        opt.addEventListener('click', () => {
            currentCategoryFilter = opt.dataset.value;
            document.getElementById('selectedCategoryName').textContent = opt.textContent.trim();
            document.getElementById('categoryFilterDropdown').classList.remove('active');
            renderStocks();
        });
    });
}

function updateCategoryDropdown() { } // Minimal implementation