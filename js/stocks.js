/**
 * THE BREW CAVE — Stocks Management (localStorage)
 * Full CRUD: Add, Edit, Delete stock items
 */

const LS_STOCKS_KEY = 'brewcave_stocks';
const LOW_STOCK_THRESHOLD = 10;

// ─── Data Helpers ───
function getStocks() {
    return JSON.parse(localStorage.getItem(LS_STOCKS_KEY)) || [];
}

function saveStocks(stocks) {
    localStorage.setItem(LS_STOCKS_KEY, JSON.stringify(stocks));
}

function generateStockId() {
    const stocks = JSON.parse(localStorage.getItem(LS_STOCKS_KEY)) || [];
    let maxNum = 0;
    stocks.forEach(s => {
        const match = s.product_id.match(/^STK-(\d+)$/);
        if (match) maxNum = Math.max(maxNum, parseInt(match[1]));
    });
    return `STK-${String(maxNum + 1).padStart(3, '0')}`;
}

function calcStatus(qty) {
    if (qty <= 0) return 'Out of Stock';
    if (qty <= LOW_STOCK_THRESHOLD) return 'Low Stock';
    return 'In Stock';
}

// ─── State ───
let editingStockId = null;
let searchQuery = '';

// ─── Initialization ───
document.addEventListener('DOMContentLoaded', () => {
    getStocks(); // seed if needed
    renderStocks();
    setupSearch();
});

function setupSearch() {
    const input = document.querySelector('.search-input');
    if (input) {
        input.addEventListener('input', (e) => {
            searchQuery = e.target.value.toLowerCase();
            renderStocks();
        });
    }
}

// ─── Render ───
function renderStocks() {
    const list = document.getElementById('stocksList');
    if (!list) return;

    const stocks = getStocks().filter(item =>
        item.item_name.toLowerCase().includes(searchQuery) ||
        item.product_id.toLowerCase().includes(searchQuery) ||
        item.category.toLowerCase().includes(searchQuery)
    );

    if (stocks.length === 0) {
        list.innerHTML = `<tr><td colspan="8" style="text-align:center; padding: 40px; opacity: 0.5;">No inventory data available.</td></tr>`;
        return;
    }

    list.innerHTML = stocks.map(item => {
        // Recalculate status live
        const status = calcStatus(item.quantity);
        return `
        <tr class="animate-fade-in">
            <td style="font-family: monospace;">${item.product_id}</td>
            <td style="font-weight: 500;">${item.item_name}</td>
            <td>${item.category}</td>
            <td>${item.created_at}</td>
            <td style="${item.quantity <= LOW_STOCK_THRESHOLD ? 'color: #e74c3c; font-weight: bold;' : ''}">${item.quantity}</td>
            <td>${item.unit}</td>
            <td><span class="status-badge status-${status.toLowerCase().replace(/ /g, '-')}">${status}</span></td>
            <td>
                <button class="btn-icon" title="Edit" onclick="editStock('${item.product_id}')">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                </button>
                <button class="btn-icon" title="Delete" onclick="deleteStock('${item.product_id}')" style="color: #e74c3c;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                </button>
            </td>
        </tr>`;
    }).join('');
}

// ─── Modal ───
// ─── Constants ───
const DEFAULT_CATEGORIES = [
    'Coffee Beans & Tea',
    'Syrups & Sweeteners',
    'Dairy & Milk Alternatives',
    'Powders & Frappe Mixes',
    'Pastries & Prepared Food',
    'Cups, Lids & Straws',
    'Napkins & Utensils',
    'Cleaning & Janitorial',
    'Barista Tools & Equipment',
    'Retail Merchandise',
    'Takeout Packaging',
    'Office & POS Supplies'
];
const LS_CUSTOM_CATS_KEY = 'brewcave_custom_categories';

// ─── Category Helpers ───
function getCustomCategories() {
    return JSON.parse(localStorage.getItem(LS_CUSTOM_CATS_KEY)) || [];
}

function saveCustomCategory(category) {
    const custom = getCustomCategories();
    // Check if it exists in default or custom
    if (!DEFAULT_CATEGORIES.includes(category) && !custom.includes(category)) {
        custom.push(category);
        localStorage.setItem(LS_CUSTOM_CATS_KEY, JSON.stringify(custom));
    }
}

function renderCategoryOptions(selectedVal = null) {
    if (!categorySelect) return;

    categorySelect.innerHTML = '';

    // Combine Default + Custom
    const allCategories = [...DEFAULT_CATEGORIES, ...getCustomCategories()];

    allCategories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        categorySelect.appendChild(option);
    });

    // Add Custom Option
    const customOption = document.createElement('option');
    customOption.value = 'custom';
    customOption.textContent = 'Other / Custom...';
    categorySelect.appendChild(customOption);

    // Set selection
    if (selectedVal && allCategories.includes(selectedVal)) {
        categorySelect.value = selectedVal;
    } else if (selectedVal) {
        // If selectedVal is not in list (shouldn't happen if we saved it), default to custom?
        // Actually, if we just saved it, it should be in the list now.
        // If coming from Edit and it's a legacy category not in new defaults? 
        // We should add it to custom list if it's missing?
        // For now, let's just select it if present.
    } else {
        categorySelect.value = DEFAULT_CATEGORIES[0];
    }
}

// ─── Modal Logic ───
const stockForm = document.getElementById('stockForm');
const categorySelect = stockForm ? stockForm.elements['category'] : null;
const categoryInput = stockForm ? stockForm.elements['categoryInput'] : null;

// Event Listeners for UI interaction
if (stockForm) {
    // When Category changes
    categorySelect.addEventListener('change', (e) => {
        const val = e.target.value;
        if (val === 'custom') {
            // Show Custom Category Input
            categoryInput.style.display = 'block';
            categoryInput.required = true;
            categoryInput.focus();
        } else {
            // Hide Custom Category Input
            categoryInput.style.display = 'none';
            categoryInput.required = false;
        }
    });

    // Form Submit
    stockForm.addEventListener('submit', (e) => {
        e.preventDefault();

        // Determine Category
        let finalCategory = '';
        if (categorySelect.value === 'custom') {
            finalCategory = categoryInput.value.trim();
        } else {
            finalCategory = categorySelect.value;
        }

        const itemName = stockForm.elements['itemName'].value.trim();
        const quantity = parseInt(stockForm.elements['quantity'].value) || 0;
        const unit = stockForm.elements['unit'].value;

        if (!finalCategory) {
            Swal.fire({ icon: 'error', title: 'Missing Category', text: 'Please enter a category.', confirmButtonColor: '#A67B5B' });
            return;
        }

        // Save Custom Category if needed
        if (categorySelect.value === 'custom') {
            saveCustomCategory(finalCategory);
            // Re-render categories to include the new one (optional, but good for next time)
            // We usually close the modal right after, so it will re-render on next open.
        }

        if (!itemName) {
            Swal.fire({ icon: 'error', title: 'Missing Name', text: 'Please enter an item name.', confirmButtonButtonColor: '#A67B5B' });
            return;
        }

        let stocks = getStocks();

        if (editingStockId) {
            // Update existing
            const idx = stocks.findIndex(s => s.product_id === editingStockId);
            if (idx !== -1) {
                stocks[idx].item_name = itemName;
                stocks[idx].category = finalCategory;
                stocks[idx].quantity = quantity;
                stocks[idx].unit = unit;
                stocks[idx].status = calcStatus(quantity);
            }
            Swal.fire({ icon: 'success', title: 'Updated!', text: `${itemName} has been updated.`, timer: 1500, showConfirmButton: false });
        } else {
            // Add new
            const now = new Date();
            const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
            const newItem = {
                product_id: generateStockId(),
                item_name: itemName,
                category: finalCategory,
                created_at: dateStr,
                quantity,
                unit,
                status: calcStatus(quantity)
            };
            stocks.push(newItem);
            Swal.fire({ icon: 'success', title: 'Added!', text: `${itemName} added to inventory.`, timer: 1500, showConfirmButton: false });
        }

        saveStocks(stocks);
        closeStockModal();
        renderStocks();
    });
}

window.openStockModal = () => {
    editingStockId = null;
    document.getElementById('stockModalTitle').textContent = 'Add New Item';
    const submitBtn = document.querySelector('#stockForm button[type="submit"]');
    if (submitBtn) submitBtn.textContent = 'Add Item';

    stockForm.reset();

    // Reset UI state
    renderCategoryOptions(); // Populate dropdown
    categorySelect.selectedIndex = 0; // Default first item
    categoryInput.style.display = 'none';

    document.getElementById('stockModalOverlay').classList.add('show');
};

window.closeStockModal = () => {
    document.getElementById('stockModalOverlay').classList.remove('show');
    editingStockId = null;
};

// ─── Edit ───
window.editStock = (id) => {
    const stocks = getStocks();
    const item = stocks.find(s => s.product_id === id);
    if (!item) return;

    editingStockId = id;
    document.getElementById('stockModalTitle').textContent = 'Edit Item';
    const submitBtn = document.querySelector('#stockForm button[type="submit"]');
    if (submitBtn) submitBtn.textContent = 'Update Item';

    // Populate Categories (Default + Custom)
    renderCategoryOptions(item.category);

    // Check if category matches one of the options (now including custom saved ones)
    // If renderCategoryOptions handled it, categorySelect.value should be set.
    // However, if the item has a legacy category or a custom one that somehow wasn't saved?
    // Secure check:
    if (categorySelect.value !== item.category) {
        // It's a custom category that might not be in the list? 
        // Or renderCategoryOptions didn't find it.
        // Let's force custom mode.
        categorySelect.value = 'custom';
        categoryInput.style.display = 'block';
        categoryInput.value = item.category;
    } else {
        // It matched a list item
        categoryInput.style.display = 'none';
    }

    stockForm.elements['itemName'].value = item.item_name;
    stockForm.elements['quantity'].value = item.quantity;
    stockForm.elements['unit'].value = item.unit;

    document.getElementById('stockModalOverlay').classList.add('show');
};

// ─── Delete ───
window.deleteStock = (id) => {
    const stocks = getStocks();
    const item = stocks.find(s => s.product_id === id);
    if (!item) return;

    Swal.fire({
        title: 'Delete Item?',
        text: `Permanently delete "${item.item_name}" (${id})?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#e74c3c',
        cancelButtonColor: '#6e7881',
        confirmButtonText: 'Yes, Delete'
    }).then((result) => {
        if (result.isConfirmed) {
            const updated = stocks.filter(s => s.product_id !== id);
            saveStocks(updated);
            renderStocks();
            Swal.fire({ icon: 'success', title: 'Deleted', text: `${item.item_name} removed.`, timer: 1500, showConfirmButton: false });
        }
    });
};