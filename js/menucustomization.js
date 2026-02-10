/**
 * THE BREW CAVE — Menu Customization Logic
 * Manages menu items and their ingredients via localStorage
 */

// ─── Default Products (seed on first load) ───
const DEFAULT_PRODUCTS = [
    { id: 'c1', name: 'Espresso', price: 110.00, category: 'coffee', image: 'assets/CoffeeBean.png' },
    { id: 'c2', name: 'Americano', price: 120.00, category: 'coffee', image: 'assets/CoffeeBean.png' },
    { id: 'c3', name: 'Cappuccino', price: 140.00, category: 'coffee', image: 'assets/CoffeeBean.png' },
    { id: 'c4', name: 'Latte', price: 150.00, category: 'coffee', image: 'assets/CoffeeBean.png' },
    { id: 'c5', name: 'Mocha', price: 160.00, category: 'coffee', image: 'assets/CoffeeBean.png' },
    { id: 'c6', name: 'Caramel Macchiato', price: 170.00, category: 'coffee', image: 'assets/CoffeeBean.png' },
    { id: 'c7', name: 'Cold Brew', price: 145.00, category: 'coffee', image: 'assets/CoffeeBean.png' },
    { id: 'nc1', name: 'Hot Chocolate', price: 130.00, category: 'non-coffee', image: 'assets/CoffeeBean.png' },
    { id: 'nc2', name: 'Matcha Latte', price: 160.00, category: 'non-coffee', image: 'assets/CoffeeBean.png' },
    { id: 'nc3', name: 'Chai Tea', price: 135.00, category: 'non-coffee', image: 'assets/CoffeeBean.png' },
    { id: 'nc4', name: 'Iced Tea', price: 100.00, category: 'non-coffee', image: 'assets/CoffeeBean.png' },
    { id: 'p1', name: 'Croissant', price: 95.00, category: 'pastries', image: 'assets/CoffeeBean.png' },
    { id: 'p2', name: 'Choc Croissant', price: 115.00, category: 'pastries', image: 'assets/CoffeeBean.png' },
    { id: 'p3', name: 'Blueberry Muffin', price: 105.00, category: 'pastries', image: 'assets/CoffeeBean.png' },
    { id: 'p4', name: 'Bagel & Cream Cheese', price: 110.00, category: 'pastries', image: 'assets/CoffeeBean.png' },
    { id: 'b1', name: 'Breakfast Sandwich', price: 220.00, category: 'breakfast', image: 'assets/CoffeeBean.png' },
    { id: 'b2', name: 'Oatmeal', price: 120.00, category: 'breakfast', image: 'assets/CoffeeBean.png' },
    { id: 'm1', name: 'Brew Cave Mug', price: 450.00, category: 'apparel', image: 'assets/CoffeeBean.png' },
    { id: 'm2', name: 'Coffee Beans (1lb)', price: 650.00, category: 'apparel', image: 'assets/CoffeeBean.png' },
];

const LS_MENU_KEY = 'brewcave_menu_items';
const LS_INGREDIENTS_KEY = 'brewcave_menu_ingredients';

// ─── Data Helpers ───
function getMenuItems() {
    let items = JSON.parse(localStorage.getItem(LS_MENU_KEY));
    if (!items || items.length === 0) {
        items = JSON.parse(JSON.stringify(DEFAULT_PRODUCTS));
        localStorage.setItem(LS_MENU_KEY, JSON.stringify(items));
    }
    return items;
}

function saveMenuItems(items) {
    localStorage.setItem(LS_MENU_KEY, JSON.stringify(items));
}

function getIngredients() {
    return JSON.parse(localStorage.getItem(LS_INGREDIENTS_KEY)) || {};
}

function saveIngredients(data) {
    localStorage.setItem(LS_INGREDIENTS_KEY, JSON.stringify(data));
}

function generateMenuId() {
    const items = getMenuItems();
    let maxNum = 0;
    items.forEach(item => {
        const match = item.id.match(/^custom(\d+)$/);
        if (match) maxNum = Math.max(maxNum, parseInt(match[1]));
    });
    return `custom${maxNum + 1}`;
}

function generateIngredientId() {
    return 'ing_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
}

// ─── State ───
let currentTab = 'menu';
let menuSearchQuery = '';
let editingMenuId = null;
let selectedMenuItemId = null;
let editingIngredientId = null;

// ─── Initialization ───
document.addEventListener('DOMContentLoaded', () => {
    // Seed menu items if not present
    getMenuItems();

    renderMenuTab();
    renderIngredientsTab();
    setupTabSwitching();
    setupMenuSearch();
});

// ─── Tab Switching ───
function setupTabSwitching() {
    document.querySelectorAll('.mc-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            currentTab = tab;

            document.querySelectorAll('.mc-tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            document.querySelectorAll('.mc-tab-content').forEach(c => c.classList.remove('active'));
            document.getElementById(`tab-${tab}`).classList.add('active');

            if (tab === 'ingredients') renderIngredientsTab();
        });
    });
}

// ─── Search ───
function setupMenuSearch() {
    const input = document.getElementById('mcMenuSearch');
    if (input) {
        input.addEventListener('input', (e) => {
            menuSearchQuery = e.target.value.toLowerCase();
            renderMenuGrid();
        });
    }
}

// ════════════════════════════════════════════════
//  CUSTOMIZE MENU TAB
// ════════════════════════════════════════════════

function renderMenuTab() {
    renderMenuGrid();
}

function renderMenuGrid() {
    const grid = document.getElementById('mcMenuGrid');
    if (!grid) return;

    const items = getMenuItems().filter(item =>
        item.name.toLowerCase().includes(menuSearchQuery)
    );

    if (items.length === 0) {
        grid.innerHTML = `<div class="mc-empty-state">No menu items found.</div>`;
        return;
    }

    grid.innerHTML = items.map(item => `
        <div class="mc-menu-card animate-fade-in">
            <div class="mc-card-img-wrapper">
                <img src="${item.image}" alt="${item.name}" onerror="this.src='https://placehold.co/300x200/4E342E/FFF?text=${encodeURIComponent(item.name.charAt(0))}'">
            </div>
            <div class="mc-card-body">
                <div class="mc-card-name">${item.name}</div>
                <div class="mc-card-category">${item.category}</div>
                <div class="mc-card-footer">
                    <span class="mc-card-price">₱${item.price.toFixed(2)}</span>
                    <div class="mc-card-actions">
                        <button class="btn-icon" title="Edit" onclick="openEditMenuModal('${item.id}')">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        </button>
                        <button class="btn-icon delete-btn" title="Delete" onclick="deleteMenuItem('${item.id}')">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// ─── Add / Edit Menu Item Modal ───
window.openAddMenuModal = () => {
    editingMenuId = null;
    document.getElementById('menuModalTitle').textContent = 'Add Menu Item';
    document.getElementById('menuModalSubmitBtn').textContent = 'Add Item';
    document.getElementById('menuForm').reset();
    document.getElementById('menuImgPreview').src = 'assets/CoffeeBean.png';
    document.getElementById('menuModalOverlay').classList.add('show');
};

window.openEditMenuModal = (id) => {
    const items = getMenuItems();
    const item = items.find(i => i.id === id);
    if (!item) return;

    editingMenuId = id;
    document.getElementById('menuModalTitle').textContent = 'Edit Menu Item';
    document.getElementById('menuModalSubmitBtn').textContent = 'Update Item';
    document.getElementById('menuItemName').value = item.name;
    document.getElementById('menuItemPrice').value = item.price;
    document.getElementById('menuItemCategory').value = item.category;
    document.getElementById('menuItemImage').value = item.image;
    document.getElementById('menuImgPreview').src = item.image;
    document.getElementById('menuModalOverlay').classList.add('show');
};

window.closeMenuModal = () => {
    document.getElementById('menuModalOverlay').classList.remove('show');
    editingMenuId = null;
};

window.previewMenuImage = () => {
    const val = document.getElementById('menuItemImage').value;
    document.getElementById('menuImgPreview').src = val || 'assets/CoffeeBean.png';
};

window.handleMenuFormSubmit = (e) => {
    e.preventDefault();
    const name = document.getElementById('menuItemName').value.trim();
    const price = parseFloat(document.getElementById('menuItemPrice').value);
    const category = document.getElementById('menuItemCategory').value;
    const image = document.getElementById('menuItemImage').value.trim() || 'assets/CoffeeBean.png';

    if (!name || isNaN(price)) {
        Swal.fire({ icon: 'error', title: 'Invalid Input', text: 'Please fill in all required fields.', confirmButtonColor: '#A67B5B' });
        return;
    }

    let items = getMenuItems();

    if (editingMenuId) {
        const idx = items.findIndex(i => i.id === editingMenuId);
        if (idx !== -1) {
            items[idx].name = name;
            items[idx].price = price;
            items[idx].category = category;
            items[idx].image = image;
        }
        Swal.fire({ icon: 'success', title: 'Updated!', text: `${name} has been updated.`, timer: 1500, showConfirmButton: false });
    } else {
        const newItem = { id: generateMenuId(), name, price, category, image };
        items.push(newItem);
        Swal.fire({ icon: 'success', title: 'Added!', text: `${name} has been added to the menu.`, timer: 1500, showConfirmButton: false });
    }

    saveMenuItems(items);
    closeMenuModal();
    renderMenuGrid();
    renderIngredientsTab(); // refresh dropdown
};

window.deleteMenuItem = (id) => {
    const items = getMenuItems();
    const item = items.find(i => i.id === id);
    if (!item) return;

    Swal.fire({
        title: 'Delete Menu Item?',
        text: `Remove "${item.name}" from the menu?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#e74c3c',
        cancelButtonColor: '#6e7881',
        confirmButtonText: 'Yes, Delete'
    }).then(result => {
        if (result.isConfirmed) {
            const updatedItems = items.filter(i => i.id !== id);
            saveMenuItems(updatedItems);

            // Also remove any ingredients for this item
            const ingredients = getIngredients();
            delete ingredients[id];
            saveIngredients(ingredients);

            renderMenuGrid();
            renderIngredientsTab();
            Swal.fire({ icon: 'success', title: 'Deleted', text: `${item.name} removed.`, timer: 1500, showConfirmButton: false });
        }
    });
};

// ════════════════════════════════════════════════
//  CUSTOMIZE INGREDIENTS TAB
// ════════════════════════════════════════════════

function renderIngredientsTab() {
    renderMenuItemDropdown();
    renderIngredientsList();
}

function renderMenuItemDropdown() {
    const select = document.getElementById('mcIngredientMenuSelect');
    if (!select) return;

    const items = getMenuItems();
    const currentVal = select.value;

    select.innerHTML = '<option value="">— Select a menu item —</option>';
    items.forEach(item => {
        const opt = document.createElement('option');
        opt.value = item.id;
        opt.textContent = `${item.name} (${item.category})`;
        select.appendChild(opt);
    });

    // Restore selection if still valid
    if (currentVal && items.find(i => i.id === currentVal)) {
        select.value = currentVal;
        selectedMenuItemId = currentVal;
    }
}

window.onMenuItemSelect = (selectEl) => {
    selectedMenuItemId = selectEl.value;
    renderIngredientsList();
};

function renderIngredientsList() {
    const panel = document.getElementById('mcIngredientsPanel');
    const headerTitle = document.getElementById('mcIngredientsPanelTitle');
    const addBtn = document.getElementById('mcAddIngredientBtn');
    const listContainer = document.getElementById('mcIngredientList');

    if (!panel || !listContainer) return;

    if (!selectedMenuItemId) {
        panel.style.display = 'none';
        return;
    }

    panel.style.display = 'block';
    const items = getMenuItems();
    const menuItem = items.find(i => i.id === selectedMenuItemId);
    if (!menuItem) { panel.style.display = 'none'; return; }

    headerTitle.textContent = `Ingredients for "${menuItem.name}"`;
    addBtn.style.display = 'inline-flex';

    const allIngredients = getIngredients();
    const itemIngredients = allIngredients[selectedMenuItemId] || [];

    if (itemIngredients.length === 0) {
        listContainer.innerHTML = `<div class="mc-empty-state">No ingredients added yet. Click "Add Ingredient" to start.</div>`;
        return;
    }

    listContainer.innerHTML = itemIngredients.map(ing => `
        <div class="mc-ingredient-item animate-fade-in">
            <div class="mc-ingredient-info">
                <span class="ingredient-name">${ing.name}</span>
                <span class="ingredient-qty">${ing.quantity} ${ing.unit}</span>
            </div>
            <div class="mc-ingredient-actions">
                <button class="btn-icon" title="Edit" onclick="openEditIngredientModal('${ing.id}')">
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                </button>
                <button class="btn-icon delete-btn" title="Delete" onclick="deleteIngredient('${ing.id}')">
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
            </div>
        </div>
    `).join('');
}

// ─── Add / Edit Ingredient Modal ───
window.openAddIngredientModal = () => {
    if (!selectedMenuItemId) return;
    editingIngredientId = null;
    document.getElementById('ingredientModalTitle').textContent = 'Add Ingredient';
    document.getElementById('ingredientModalSubmitBtn').textContent = 'Add';
    document.getElementById('ingredientForm').reset();
    document.getElementById('ingredientModalOverlay').classList.add('show');
};

window.openEditIngredientModal = (ingId) => {
    if (!selectedMenuItemId) return;
    const allIngredients = getIngredients();
    const list = allIngredients[selectedMenuItemId] || [];
    const ing = list.find(i => i.id === ingId);
    if (!ing) return;

    editingIngredientId = ingId;
    document.getElementById('ingredientModalTitle').textContent = 'Edit Ingredient';
    document.getElementById('ingredientModalSubmitBtn').textContent = 'Update';
    document.getElementById('ingredientName').value = ing.name;
    document.getElementById('ingredientQty').value = ing.quantity;
    document.getElementById('ingredientUnit').value = ing.unit;
    document.getElementById('ingredientModalOverlay').classList.add('show');
};

window.closeIngredientModal = () => {
    document.getElementById('ingredientModalOverlay').classList.remove('show');
    editingIngredientId = null;
};

window.handleIngredientFormSubmit = (e) => {
    e.preventDefault();
    const name = document.getElementById('ingredientName').value.trim();
    const quantity = parseFloat(document.getElementById('ingredientQty').value);
    const unit = document.getElementById('ingredientUnit').value;

    if (!name || isNaN(quantity) || quantity <= 0) {
        Swal.fire({ icon: 'error', title: 'Invalid', text: 'Please fill in all fields correctly.', confirmButtonColor: '#A67B5B' });
        return;
    }

    let allIngredients = getIngredients();
    if (!allIngredients[selectedMenuItemId]) allIngredients[selectedMenuItemId] = [];

    if (editingIngredientId) {
        const idx = allIngredients[selectedMenuItemId].findIndex(i => i.id === editingIngredientId);
        if (idx !== -1) {
            allIngredients[selectedMenuItemId][idx].name = name;
            allIngredients[selectedMenuItemId][idx].quantity = quantity;
            allIngredients[selectedMenuItemId][idx].unit = unit;
        }
        Swal.fire({ icon: 'success', title: 'Updated!', timer: 1200, showConfirmButton: false });
    } else {
        allIngredients[selectedMenuItemId].push({
            id: generateIngredientId(),
            name,
            quantity,
            unit
        });
        Swal.fire({ icon: 'success', title: 'Added!', timer: 1200, showConfirmButton: false });
    }

    saveIngredients(allIngredients);
    closeIngredientModal();
    renderIngredientsList();
};

window.deleteIngredient = (ingId) => {
    Swal.fire({
        title: 'Delete Ingredient?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#e74c3c',
        cancelButtonColor: '#6e7881',
        confirmButtonText: 'Yes, Delete'
    }).then(result => {
        if (result.isConfirmed) {
            let allIngredients = getIngredients();
            if (allIngredients[selectedMenuItemId]) {
                allIngredients[selectedMenuItemId] = allIngredients[selectedMenuItemId].filter(i => i.id !== ingId);
                saveIngredients(allIngredients);
                renderIngredientsList();
            }
            Swal.fire({ icon: 'success', title: 'Deleted', timer: 1200, showConfirmButton: false });
        }
    });
};
