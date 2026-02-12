/**
 * THE BREW CAVE — Menu Customization Logic
 * Manages menu items and their ingredients via localStorage
 * Ingredients are pulled from stocks (brewcave_stocks)
 */

const LS_STOCKS_KEY_REF = 'brewcave_stocks';

function getStockItems() {
    return JSON.parse(localStorage.getItem(LS_STOCKS_KEY_REF)) || [];
}

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
let menuFilterCategory = 'all'; // New state for category filter
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
    setupCategoryDropdown();
    setupIngredientMenuDropdown(); // Initialize ingredient dropdown
    setupStockDropdown(); // Initialize stock dropdown in modal

    // Add-on Init
    setupAddonSearch();
    setupAddonStockDropdown(); // Initialize stock dropdown for addons
    renderAddonsTab();
});

// ─── Menu Category Dropdown in Modal ───
function setupMenuCategoryDropdown() {
    window.toggleMenuCategoryDropdown = () => {
        document.getElementById('menuCategoryDropdown').classList.toggle('active');
    };

    window.selectMenuCategory = (value, text) => {
        document.getElementById('menuItemCategory').value = value;
        document.getElementById('menuCategorySelected').textContent = text;
        document.getElementById('menuCategoryDropdown').classList.remove('active');
    };

    // Close when clicking outside
    document.addEventListener('click', (e) => {
        const dropdown = document.getElementById('menuCategoryDropdown');
        if (dropdown && !dropdown.contains(e.target) && !e.target.closest('.dropdown-trigger-premium')) {
            dropdown.classList.remove('active');
        }
    });
}

// ─── Dropdown Logic (Copied & Adapted from TakeOrder) ───
function setupCategoryDropdown() {
    const categoryDropdown = document.getElementById('categoryDropdown');
    const categoryTrigger = document.getElementById('categoryTrigger');
    const selectedCategoryName = document.getElementById('selectedCategoryName');
    const categoryOptions = document.querySelectorAll('.dropdown-option-premium');

    if (categoryTrigger) {
        categoryTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            categoryDropdown.classList.toggle('active');
        });
    }

    categoryOptions.forEach(option => {
        option.addEventListener('click', (e) => {
            e.stopPropagation();
            const value = option.dataset.value;
            const text = option.textContent.trim();

            menuFilterCategory = value;
            selectedCategoryName.textContent = text;

            categoryOptions.forEach(opt => opt.classList.remove('active'));
            option.classList.add('active');

            categoryDropdown.classList.remove('active');
            renderMenuGrid(); // Re-render grid on change
        });
    });

    document.addEventListener('click', () => {
        if (categoryDropdown) categoryDropdown.classList.remove('active');
    });
}

// ─── Tab Switching ───
function setupTabSwitching() {
    const tabs = document.querySelectorAll('.mc-tab-btn');
    tabs.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active from all tabs
            tabs.forEach(t => t.classList.remove('active'));
            // Hide all tab contents
            document.querySelectorAll('.mc-tab-content').forEach(c => c.classList.remove('active'));

            // Add active to clicked tab
            btn.classList.add('active');
            const tabId = btn.getAttribute('data-tab');
            document.getElementById(`tab-${tabId}`).classList.add('active');

            currentTab = tabId;

            if (tabId === 'menu') {
                renderMenuTab();
            } else if (tabId === 'ingredients') {
                renderIngredientsTab();
            } else if (tabId === 'addons') {
                renderAddonsTab();
            }
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

    const items = getMenuItems().filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(menuSearchQuery);
        const matchesCategory = menuFilterCategory === 'all' || item.category === menuFilterCategory;
        return matchesSearch && matchesCategory;
    });

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
// ─── Add / Edit Menu Item Modal ───
window.openAddMenuModal = () => {
    editingMenuId = null;
    document.getElementById('menuModalTitle').textContent = 'Add Menu Item';
    document.getElementById('menuModalSubmitBtn').textContent = 'Add Item';
    document.getElementById('menuForm').reset();
    document.getElementById('menuImgPreview').src = 'assets/CoffeeBean.png';
    document.getElementById('menuItemImageBase64').value = 'assets/CoffeeBean.png'; // Default

    // Reset Category Dropdown
    document.getElementById('menuItemCategory').value = 'coffee';
    document.getElementById('menuCategorySelected').textContent = 'Coffee';

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

    // Set Category Dropdown
    document.getElementById('menuItemCategory').value = item.category;
    const categoryMap = {
        'coffee': 'Coffee',
        'non-coffee': 'Non-Coffee',
        'pastries': 'Pastries',
        'breakfast': 'Breakfast',
        'apparel': 'Merchandise'
    };
    document.getElementById('menuCategorySelected').textContent = categoryMap[item.category] || 'Coffee';

    // Handle Image
    document.getElementById('menuItemImageFile').value = ''; // Clear file input
    document.getElementById('menuItemImageBase64').value = item.image;
    document.getElementById('menuImgPreview').src = item.image;

    document.getElementById('menuModalOverlay').classList.add('show');
};

window.closeMenuModal = () => {
    document.getElementById('menuModalOverlay').classList.remove('show');
    editingMenuId = null;
};

window.handleImageUpload = (input) => {
    if (input.files && input.files[0]) {
        const file = input.files[0];
        const reader = new FileReader();

        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                // Resize image to max 300x300 to save localStorage space
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const MAX_WIDTH = 300;
                const MAX_HEIGHT = 300;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }

                canvas.width = width;
                canvas.height = height;

                // Fill with white background to prevent black transparent PNGs
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, width, height);

                ctx.drawImage(img, 0, 0, width, height);

                const dataUrl = canvas.toDataURL('image/jpeg', 0.7); // Compress
                document.getElementById('menuImgPreview').src = dataUrl;
                document.getElementById('menuItemImageBase64').value = dataUrl;
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
};

window.handleMenuFormSubmit = (e) => {
    e.preventDefault();
    const name = document.getElementById('menuItemName').value.trim();
    const price = parseFloat(document.getElementById('menuItemPrice').value);
    const category = document.getElementById('menuItemCategory').value;
    const image = document.getElementById('menuItemImageBase64').value || 'assets/CoffeeBean.png';

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

// ─── Ingredient Menu Dropdown Logic ───
function setupIngredientMenuDropdown() {
    const dropdown = document.getElementById('ingredientMenuDropdown');
    const trigger = document.getElementById('ingredientMenuTrigger');

    if (trigger) {
        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            // Close other dropdowns if any
            document.querySelectorAll('.pos-dropdown.active').forEach(d => {
                if (d !== dropdown) d.classList.remove('active');
            });
            dropdown.classList.toggle('active');
        });
    }

    // Close on outside click (handled by global listener in setupCategoryDropdown, but ensuring coverage)
    document.addEventListener('click', (e) => {
        if (dropdown && !dropdown.contains(e.target)) {
            dropdown.classList.remove('active');
        }
    });
}

function renderMenuItemDropdown() {
    const optionsContainer = document.getElementById('ingredientMenuOptions');
    const selectedNameSpan = document.getElementById('selectedIngredientMenuName');

    if (!optionsContainer) return;

    const items = getMenuItems();
    optionsContainer.innerHTML = '';

    // Add "Select a menu item" placeholder option if needed, or just rely on text
    // We will render actual items

    if (items.length === 0) {
        optionsContainer.innerHTML = '<div style="padding:10px; opacity:0.6;">No menu items available</div>';
        return;
    }

    items.forEach(item => {
        const option = document.createElement('div');
        option.className = 'dropdown-option-premium';
        if (item.id === selectedMenuItemId) option.classList.add('active');

        // Simple icon for items
        option.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="16"></line>
                <line x1="8" y1="12" x2="16" y2="12"></line>
            </svg>
            ${item.name} <span style="opacity:0.6; font-size:0.8em; margin-left:auto;">${item.category}</span>
        `;

        option.addEventListener('click', (e) => {
            e.stopPropagation();
            selectedMenuItemId = item.id;
            selectedNameSpan.textContent = item.name;

            document.querySelectorAll('#ingredientMenuOptions .dropdown-option-premium').forEach(opt => opt.classList.remove('active'));
            option.classList.add('active');

            document.getElementById('ingredientMenuDropdown').classList.remove('active');
            renderIngredientsList();
        });

        optionsContainer.appendChild(option);
    });

    // Restore Selection Display
    if (selectedMenuItemId) {
        const selectedItem = items.find(i => i.id === selectedMenuItemId);
        if (selectedItem) {
            selectedNameSpan.textContent = selectedItem.name;
        } else {
            selectedMenuItemId = null;
            selectedNameSpan.textContent = "— Select a menu item —";
        }
    } else {
        selectedNameSpan.textContent = "— Select a menu item —";
    }
}


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

// ─── Populate stock dropdown ───
// ─── Stock Dropdown Logic ───
function setupStockDropdown() {
    const dropdown = document.getElementById('ingredientStockDropdown');
    const trigger = document.getElementById('ingredientStockTrigger');

    if (trigger) {
        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            // Close other dropdowns
            document.querySelectorAll('.pos-dropdown.active').forEach(d => {
                if (d !== dropdown) d.classList.remove('active');
            });
            dropdown.classList.toggle('active');
        });
    }

    document.addEventListener('click', (e) => {
        if (dropdown && !dropdown.contains(e.target)) {
            dropdown.classList.remove('active');
        }
    });
}

// ─── Populate stock dropdown ───
function populateStockDropdown(selectedStockPid) {
    const optionsContainer = document.getElementById('ingredientStockOptions');
    const selectedStockName = document.getElementById('selectedStockName');
    const hiddenInput = document.getElementById('ingredientStockSelect');

    if (!optionsContainer) return;

    const stocks = getStockItems();
    optionsContainer.innerHTML = '';
    hiddenInput.value = ''; // Reset hidden input
    selectedStockName.textContent = "— Choose from stocks —";

    if (stocks.length === 0) {
        optionsContainer.innerHTML = '<div style="padding:10px; opacity:0.6;">No stock items found — add them in Stocks page</div>';
        return;
    }

    stocks.forEach(s => {
        const option = document.createElement('div');
        option.className = 'dropdown-option-premium';
        if (s.product_id === selectedStockPid) {
            option.classList.add('active');
            selectedStockName.textContent = s.item_name;
            hiddenInput.value = s.product_id;
            // Also trigger unit update if re-opening edit modal
            const unitField = document.getElementById('ingredientUnit');
            if (unitField) unitField.value = s.unit || '';
        }

        option.innerHTML = `
            <div style="display:flex; flex-direction:column; line-height:1.2;">
                <span style="font-weight:600;">${s.item_name}</span>
                <span style="font-size:0.8em; opacity:0.7;">${s.quantity} ${s.unit} available</span>
            </div>
        `;

        option.addEventListener('click', (e) => {
            e.stopPropagation();

            // Update UI
            document.querySelectorAll('#ingredientStockOptions .dropdown-option-premium').forEach(opt => opt.classList.remove('active'));
            option.classList.add('active');
            selectedStockName.textContent = s.item_name;

            // Update Hidden Input
            hiddenInput.value = s.product_id;

            // Auto-fill Unit
            const unitField = document.getElementById('ingredientUnit');
            if (unitField) unitField.value = s.unit || '';

            // Close Dropdown
            document.getElementById('ingredientStockDropdown').classList.remove('active');
        });

        optionsContainer.appendChild(option);
    });
}

// ─── Add / Edit Ingredient Modal ───
window.openAddIngredientModal = () => {
    if (!selectedMenuItemId) return;
    editingIngredientId = null;
    document.getElementById('ingredientModalTitle').textContent = 'Add Ingredient';
    document.getElementById('ingredientModalSubmitBtn').textContent = 'Add';
    document.getElementById('ingredientForm').reset();
    document.getElementById('ingredientUnit').value = '';
    populateStockDropdown(null);
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
    populateStockDropdown(ing.stockPid || null);
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
    const stockPid = document.getElementById('ingredientStockSelect').value;

    // Find stock name from stock ID
    const stocks = getStockItems();
    const stockItem = stocks.find(s => s.product_id === stockPid);
    const name = stockItem ? stockItem.item_name : '';

    const quantity = parseFloat(document.getElementById('ingredientQty').value);
    const unit = document.getElementById('ingredientUnit').value;

    if (!stockPid || !name || isNaN(quantity) || quantity <= 0) {
        Swal.fire({ icon: 'error', title: 'Invalid', text: 'Please select a stock item and enter a valid quantity.', confirmButtonColor: '#A67B5B' });
        return;
    }

    let allIngredients = getIngredients();
    if (!allIngredients[selectedMenuItemId]) allIngredients[selectedMenuItemId] = [];

    if (editingIngredientId) {
        const idx = allIngredients[selectedMenuItemId].findIndex(i => i.id === editingIngredientId);
        if (idx !== -1) {
            allIngredients[selectedMenuItemId][idx].name = name;
            allIngredients[selectedMenuItemId][idx].stockPid = stockPid;
            allIngredients[selectedMenuItemId][idx].quantity = quantity;
            allIngredients[selectedMenuItemId][idx].unit = unit;
        }
        Swal.fire({ icon: 'success', title: 'Updated!', timer: 1200, showConfirmButton: false });
    } else {
        allIngredients[selectedMenuItemId].push({
            id: generateIngredientId(),
            stockPid,
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
// ─── Customize Add-ons Logic ───

const LS_ADDONS_KEY = 'brewcave_addons';

function getAddons() {
    return JSON.parse(localStorage.getItem(LS_ADDONS_KEY)) || [];
}

function saveAddons(addons) {
    localStorage.setItem(LS_ADDONS_KEY, JSON.stringify(addons));
}

function generateAddonId() {
    return 'addon_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
}

// State for Add-ons
let addonSearchQuery = '';

// Add to Initialization
// (Note: You should call renderAddonsTab() and setupAddonSearch() in the main DOMContentLoaded listener manually if replacing whole file, 
//  but since we are appending, we need to make sure these are called or hooked up. 
//  The existing DOMContentLoaded is at the top. We might need to patch it or just rely on tab click.)

function renderAddonsTab() {
    const grid = document.getElementById('mcAddonGrid');
    if (!grid) return;

    grid.innerHTML = '';
    const addons = getAddons();
    const filtered = addons.filter(item =>
        item.name.toLowerCase().includes(addonSearchQuery.toLowerCase())
    );

    if (filtered.length === 0) {
        grid.innerHTML = `
            <div class="no-results">
                <p>No add-ons found.</p>
                ${addonSearchQuery ? '' : '<button class="mc-btn-primary" onclick="openAddAddonModal()">Create First Add-on</button>'}
            </div>
        `;
        return;
    }

    filtered.forEach(addon => {
        const card = document.createElement('div');
        card.className = 'mc-addon-card';
        card.innerHTML = `
            <div class="mc-addon-info">
                <div class="mc-addon-header">
                    <h3 class="mc-addon-name">${addon.name}</h3>
                    <span class="mc-addon-price">₱${parseFloat(addon.price).toFixed(2)}</span>
                </div>
                <div class="mc-addon-details">
                    <span class="mc-addon-badge">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        ${addon.applicableItems ? addon.applicableItems.length : 0} items linked
                    </span>
                </div>
            </div>
            <div class="mc-addon-actions">
                <button class="mc-icon-btn edit" onclick="openEditAddonModal('${addon.id}')" title="Edit">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                </button>
                <button class="mc-icon-btn delete" onclick="deleteAddon('${addon.id}')" title="Delete">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
            </div>
        `;
        grid.appendChild(card);
    });
}

function setupAddonSearch() {
    const searchInput = document.getElementById('mcAddonSearch');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            addonSearchQuery = e.target.value;
            renderAddonsTab();
        });
    }
}

// Modal Logic
function openAddAddonModal() {
    const modal = document.getElementById('addonModal');
    const form = document.getElementById('addonForm');
    document.getElementById('addonModalTitle').textContent = 'Add New Add-on';
    document.getElementById('editAddonId').value = '';
    form.reset();
    renderApplicableItemsCheckboxes();

    // Reset Stock Deduction Fields
    populateAddonStockDropdown(null);
    document.getElementById('addonStockQty').value = '';
    document.getElementById('addonStockUnit').value = '';

    modal.classList.add('show');
}

function openEditAddonModal(id) {
    const addons = getAddons();
    const addon = addons.find(a => a.id === id);
    if (!addon) return;

    const modal = document.getElementById('addonModal');
    document.getElementById('addonModalTitle').textContent = 'Edit Add-on';
    document.getElementById('editAddonId').value = addon.id;
    document.getElementById('addonName').value = addon.name;
    document.getElementById('addonPrice').value = addon.price;

    renderApplicableItemsCheckboxes(addon.applicableItems || []);

    // Load Stock Deduction Fields
    populateAddonStockDropdown(addon.stockPid || null);
    document.getElementById('addonStockQty').value = addon.stockQty || '';
    document.getElementById('addonStockUnit').value = addon.stockUnit || '';

    modal.classList.add('show');
}

function closeAddonModal() {
    document.getElementById('addonModal').classList.remove('show');
}

function renderApplicableItemsCheckboxes(selectedIds = []) {
    const container = document.getElementById('addonApplicableItems');
    container.innerHTML = '';
    const menuItems = getMenuItems(); // From existing logic

    if (menuItems.length === 0) {
        container.innerHTML = '<p style="font-size: 0.9rem; opacity: 0.7; padding: 10px;">No menu items available.</p>';
        return;
    }

    // Sort items by name for better findability
    menuItems.sort((a, b) => a.name.localeCompare(b.name));

    menuItems.forEach(item => {
        const div = document.createElement('div');
        div.className = 'mc-addon-option';

        const isChecked = selectedIds.includes(item.id) ? 'checked' : '';

        div.innerHTML = `
            <input type="checkbox" id="link_${item.id}" value="${item.id}" ${isChecked}>
            <label class="mc-addon-chip" for="link_${item.id}">
                ${item.name}
            </label>
        `;
        container.appendChild(div);
    });
}

function handleAddonFormSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('editAddonId').value;
    const name = document.getElementById('addonName').value;
    const price = parseFloat(document.getElementById('addonPrice').value);

    // Get selected items
    const checkboxes = document.querySelectorAll('#addonApplicableItems input[type="checkbox"]:checked');
    const applicableItems = Array.from(checkboxes).map(cb => cb.value);

    // Get stock deduction data
    const stockPid = document.getElementById('addonStockPid').value;
    const stockQty = parseFloat(document.getElementById('addonStockQty').value) || 0;
    const stockUnit = document.getElementById('addonStockUnit').value.trim();

    let addons = getAddons();

    if (id) {
        // Edit
        const index = addons.findIndex(a => a.id === id);
        if (index !== -1) {
            addons[index] = { ...addons[index], name, price, applicableItems, stockPid, stockQty, stockUnit };
        }
    } else {
        // Add
        const newAddon = {
            id: generateAddonId(),
            name,
            price,
            applicableItems,
            stockPid,
            stockQty,
            stockUnit
        };
        addons.push(newAddon);
    }

    saveAddons(addons);
    closeAddonModal();
    renderAddonsTab();

    Swal.fire({
        icon: 'success',
        title: 'Saved!',
        text: 'Add-on has been saved successfully.',
        timer: 1500,
        showConfirmButton: false,
        theme: 'auto',
        background: 'var(--card-bg)',
        color: 'var(--text-color)'
    });
}

function deleteAddon(id) {
    Swal.fire({
        title: 'Are you sure?',
        text: "You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, delete it!',
        background: 'var(--card-bg)',
        color: 'var(--text-color)'
    }).then((result) => {
        if (result.isConfirmed) {
            let addons = getAddons();
            addons = addons.filter(a => a.id !== id);
            saveAddons(addons);
            renderAddonsTab();
            Swal.fire({
                title: 'Deleted!',
                text: 'Add-on has been deleted.',
                icon: 'success',
                timer: 1500,
                showConfirmButton: false,
                background: 'var(--card-bg)',
                color: 'var(--text-color)'
            });
        }
    });
}

// ─── Add-on Stock Dropdown Logic ───
function setupAddonStockDropdown() {
    const dropdown = document.getElementById('addonStockDropdown');
    const trigger = document.getElementById('addonStockTrigger');

    if (trigger) {
        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            // Close other dropdowns
            document.querySelectorAll('.pos-dropdown.active').forEach(d => {
                if (d !== dropdown) d.classList.remove('active');
            });
            dropdown.classList.toggle('active');
        });
    }

    document.addEventListener('click', (e) => {
        if (dropdown && !dropdown.contains(e.target)) {
            dropdown.classList.remove('active');
        }
    });
}

function populateAddonStockDropdown(selectedStockPid) {
    const optionsContainer = document.getElementById('addonStockOptions');
    const selectedStockName = document.getElementById('selectedAddonStockName');
    const hiddenInput = document.getElementById('addonStockPid');

    if (!optionsContainer) return;

    const stocks = getStockItems();
    optionsContainer.innerHTML = '';
    if (hiddenInput) hiddenInput.value = ''; // Reset hidden input
    if (selectedStockName) selectedStockName.textContent = "— Select Stock Item —";

    if (stocks.length === 0) {
        optionsContainer.innerHTML = '<div style="padding:10px; opacity:0.6;">No stock items found — add them in Stocks page</div>';
        return;
    }

    stocks.forEach(s => {
        const option = document.createElement('div');
        option.className = 'dropdown-option-premium';
        if (s.product_id === selectedStockPid) {
            option.classList.add('active');
            if (selectedStockName) selectedStockName.textContent = s.item_name;
            if (hiddenInput) hiddenInput.value = s.product_id;

            // Auto-fill unit if empty/not set
            const unitField = document.getElementById('addonStockUnit');
            if (unitField && !unitField.value) unitField.value = s.unit || '';
        }

        option.innerHTML = `
            <div style="display:flex; flex-direction:column; line-height:1.2;">
                <span style="font-weight:600;">${s.item_name}</span>
                <span style="font-size:0.8em; opacity:0.7;">${s.quantity} ${s.unit} available</span>
            </div>
        `;

        option.addEventListener('click', (e) => {
            e.stopPropagation();

            // Update UI
            document.querySelectorAll('#addonStockOptions .dropdown-option-premium').forEach(opt => opt.classList.remove('active'));
            option.classList.add('active');
            if (selectedStockName) selectedStockName.textContent = s.item_name;

            // Update Hidden Input
            if (hiddenInput) hiddenInput.value = s.product_id;

            // Auto-fill Unit
            const unitField = document.getElementById('addonStockUnit');
            if (unitField) unitField.value = s.unit || '';

            // Close Dropdown
            document.getElementById('addonStockDropdown').classList.remove('active');
        });

        optionsContainer.appendChild(option);
    });
}
