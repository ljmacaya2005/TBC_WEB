/**
 * THE BREW CAVE — Menu Customization Logic (Supabase Integration)
 * Manages menu items, ingredients, and addons via Supabase DB.
 */

// --- Supabase State ---
let products = [];
let categories = [];
let stocks = [];
let ingredients = {}; // menu_id -> Array of ingredients
let addons = [];
let addonCategories = [];

let currentTab = 'categories';
let menuSearchQuery = '';
let categorySearchQuery = '';
let menuFilterCategory = 'all';
let editingMenuId = null;
let editingCategoryId = null;
let selectedMenuItemId = null;
let editingIngredientId = null;

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    initPage();
});

async function initPage() {
    // Wait for Supabase
    const checkSb = setInterval(async () => {
        if (window.sb) {
            clearInterval(checkSb);
            await fetchAllData();

            // Render dynamic categories everywhere
            renderCategoryFilterDropdown();
            renderModalCategoryDropdown();

            setupTabSwitching();
            setupMenuSearch();
            setupCategorySearch();
            setupCategoryDropdown();
            setupIngredientMenuDropdown();
            setupStockDropdown();
            setupAddonSearch();
            setupAddonStockDropdown();

            // Initial Renders
            renderCategoryGrid();
            renderMenuGrid();
            renderIngredientsTab();
            renderAddonsTab();
        }
    }, 500);
}

async function fetchAllData() {
    try {
        // 1. Fetch Categories
        const { data: catData } = await window.sb.from('menu_categories').select('*');
        categories = catData || [];

        // 2. Fetch Menu Items
        const { data: itemData } = await window.sb.from('menu_items')
            .select(`*, category:menu_categories(category_name)`)
            .is('deleted_at', null);
        products = itemData || [];

        // 3. Fetch Stocks
        const { data: stockData } = await window.sb.from('stocks').select('*');
        stocks = stockData || [];

        // 4. Fetch Addon Categories
        const { data: adcData } = await window.sb.from('addon_category').select('*');
        addonCategories = adcData || [];

        // 5. Fetch Addons with Pairings
        const { data: adData } = await window.sb.from('addons').select(`*, addon_pairing(*)`);
        addons = adData || [];

        // 6. Fetch Ingredients 
        // Note: Assuming 'menu_ingredients' table exists. 
        // If it doesn't, this will fail gracefully.
        const { data: ingData, error: ingError } = await window.sb.from('menu_ingredients').select('*');
        if (!ingError && ingData) {
            ingredients = {};
            ingData.forEach(ing => {
                if (!ingredients[ing.menu_id]) ingredients[ing.menu_id] = [];
                ingredients[ing.menu_id].push(ing);
            });
        }
    } catch (err) {
        console.error("Fetch Data Error:", err);
    }
}

// ─── Menu Tab Logic ───

function renderMenuGrid() {
    const grid = document.getElementById('mcMenuGrid');
    if (!grid) return;

    const filtered = products.filter(item => {
        const matchesSearch = item.product_name.toLowerCase().includes(menuSearchQuery);
        const matchesCategory = menuFilterCategory === 'all' || item.category_id.toString() === menuFilterCategory;
        return matchesSearch && matchesCategory;
    });

    if (filtered.length === 0) {
        grid.innerHTML = `<div class="mc-empty-state">No menu items found.</div>`;
        return;
    }

    grid.innerHTML = filtered.map(item => `
        <div class="mc-menu-card animate-fade-in ${!item.is_available ? 'item-unavailable' : ''}">
            <div class="mc-card-img-wrapper">
                <img src="${item.image_url || 'assets/CoffeeBean.png'}" alt="${item.product_name}" onerror="this.src='https://placehold.co/300x200/4E342E/FFF?text=${encodeURIComponent(item.product_name.charAt(0))}'">
                ${item.is_featured ? '<div class="mc-featured-badge">featured</div>' : ''}
                ${!item.is_available ? '<div class="mc-unavailable-overlay">Sold Out</div>' : ''}
            </div>
            <div class="mc-card-body">
                <div class="mc-card-name">${item.product_name}</div>
                <div class="mc-card-category">${item.category?.category_name || 'Uncategorized'}</div>
                <div class="mc-card-footer">
                    <span class="mc-card-price">₱${parseFloat(item.price).toFixed(2)}</span>
                    <div class="mc-card-actions">
                        <button class="btn-icon" title="Edit" onclick="openEditMenuModal('${item.menu_id}')">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        </button>
                        <button class="btn-icon delete-btn" title="Delete" onclick="deleteMenuItem('${item.menu_id}')">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

function renderCategoryFilterDropdown() {
    const menu = document.getElementById('categoryMenu');
    if (!menu) return;

    let html = `
        <div class="dropdown-option-premium ${menuFilterCategory === 'all' ? 'active' : ''}" data-value="all">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
            All Categories
        </div>
    `;

    categories.forEach(cat => {
        html += `
            <div class="dropdown-option-premium ${menuFilterCategory === cat.category_id.toString() ? 'active' : ''}" data-value="${cat.category_id}">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>
                ${cat.category_name}
            </div>
        `;
    });

    menu.innerHTML = html;

    // Attach listeners
    menu.querySelectorAll('.dropdown-option-premium').forEach(opt => {
        opt.addEventListener('click', (e) => {
            e.stopPropagation();
            menuFilterCategory = opt.dataset.value;
            document.getElementById('selectedCategoryName').textContent = opt.textContent.trim();
            document.querySelectorAll('#categoryMenu .dropdown-option-premium').forEach(o => o.classList.remove('active'));
            opt.classList.add('active');
            document.getElementById('categoryDropdown').classList.remove('active');
            renderMenuGrid();
        });
    });

    const trigger = document.getElementById('categoryTrigger');
    if (trigger) {
        trigger.onclick = (e) => {
            e.stopPropagation();
            document.getElementById('categoryDropdown').classList.toggle('active');
        };
    }
}

function renderModalCategoryDropdown() {
    const container = document.getElementById('menuCategoryOptions');
    if (!container) return;

    if (categories.length === 0) {
        container.innerHTML = '<div style="padding:10px; opacity:0.6;">No categories found</div>';
        return;
    }

    container.innerHTML = categories.map(cat => `
        <div class="dropdown-option-premium" onclick="selectMenuCategory('${cat.category_id}', '${cat.category_name}')">
            ${cat.category_name}
        </div>
    `).join('');
}

window.openAddMenuModal = () => {
    editingMenuId = null;
    document.getElementById('menuModalTitle').textContent = 'Add Menu Item';
    document.getElementById('menuModalSubmitBtn').textContent = 'Add Item';
    document.getElementById('menuForm').reset();
    document.getElementById('menuImgPreview').src = 'assets/CoffeeBean.png';
    document.getElementById('menuItemImageBase64').value = 'assets/CoffeeBean.png';

    // Reset Toggles
    document.getElementById('menuItemAvailable').checked = true;
    document.getElementById('menuItemFeatured').checked = false;

    // Default Category
    if (categories.length > 0) {
        document.getElementById('menuItemCategory').value = categories[0].category_id;
        document.getElementById('menuCategorySelected').textContent = categories[0].category_name;
    }

    document.getElementById('menuModalOverlay').classList.add('show');
};

window.openEditMenuModal = (id) => {
    const item = products.find(i => i.menu_id.toString() === id.toString());
    if (!item) return;

    editingMenuId = id;
    document.getElementById('menuModalTitle').textContent = 'Edit Menu Item';
    document.getElementById('menuModalSubmitBtn').textContent = 'Update Item';
    document.getElementById('menuItemName').value = item.product_name;
    document.getElementById('menuItemPrice').value = item.price;

    document.getElementById('menuItemCategory').value = item.category_id;
    const cat = categories.find(c => c.category_id === item.category_id);
    document.getElementById('menuCategorySelected').textContent = cat ? cat.category_name : 'Select Category';

    document.getElementById('menuItemImageBase64').value = item.image_url || '';
    document.getElementById('menuImgPreview').src = item.image_url || 'assets/CoffeeBean.png';

    // Set Toggles
    document.getElementById('menuItemAvailable').checked = item.is_available;
    document.getElementById('menuItemFeatured').checked = item.is_featured;

    document.getElementById('menuModalOverlay').classList.add('show');
};

window.handleMenuFormSubmit = async (e) => {
    e.preventDefault();
    const name = document.getElementById('menuItemName').value.trim();
    const price = parseFloat(document.getElementById('menuItemPrice').value);
    const categoryId = document.getElementById('menuItemCategory').value;
    const imageUrl = document.getElementById('menuItemImageBase64').value;
    const isAvailable = document.getElementById('menuItemAvailable').checked;
    const isFeatured = document.getElementById('menuItemFeatured').checked;

    if (!name || isNaN(price)) {
        Swal.fire('Error', 'Invalid Input', 'error');
        return;
    }

    try {
        Swal.fire({ title: 'Saving...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

        const payload = {
            product_name: name,
            price: price,
            category_id: categoryId,
            image_url: imageUrl,
            is_available: isAvailable,
            is_featured: isFeatured,
            updated_at: new Date()
        };

        if (editingMenuId) {
            const { error } = await window.sb.from('menu_items').update(payload).eq('menu_id', editingMenuId);
            if (error) throw error;
        } else {
            const { error } = await window.sb.from('menu_items').insert(payload);
            if (error) throw error;
        }

        await fetchAllData();
        renderMenuGrid();
        renderMenuItemDropdown(); // Update ingredients tab dropdown
        closeMenuModal();
        Swal.fire('Success', 'Menu item saved successfully', 'success');
    } catch (err) {
        Swal.fire('Error', err.message, 'error');
    }
};

window.deleteMenuItem = async (id) => {
    const item = products.find(i => i.menu_id.toString() === id.toString());
    if (!item) return;

    const result = await Swal.fire({
        title: 'Delete Menu Item?',
        text: `Are you sure you want to remove "${item.product_name}"?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#e74c3c',
        confirmButtonText: 'Yes, Delete'
    });

    if (result.isConfirmed) {
        try {
            // Soft delete
            const { error } = await window.sb.from('menu_items').update({ deleted_at: new Date() }).eq('menu_id', id);
            if (error) throw error;

            await fetchAllData();
            renderMenuGrid();
            Swal.fire('Deleted', 'Menu item removed', 'success');
        } catch (err) {
            Swal.fire('Error', err.message, 'error');
        }
    }
};

// ─── Ingredients Tab Logic ───

function renderIngredientsTab() {
    renderMenuItemDropdown();
    renderIngredientsList();
}

function renderMenuItemDropdown() {
    const optionsContainer = document.getElementById('ingredientMenuOptions');
    const selectedNameSpan = document.getElementById('selectedIngredientMenuName');
    if (!optionsContainer) return;

    optionsContainer.innerHTML = '';
    if (products.length === 0) {
        optionsContainer.innerHTML = '<div style="padding:10px; opacity:0.6;">No menu items found</div>';
        return;
    }

    products.forEach(item => {
        const option = document.createElement('div');
        option.className = 'dropdown-option-premium';
        if (selectedMenuItemId && selectedMenuItemId.toString() === item.menu_id.toString()) option.classList.add('active');

        option.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>
            ${item.product_name} <span style="opacity:0.6; font-size:0.8em; margin-left:auto;">${item.category?.category_name || ''}</span>
        `;

        option.addEventListener('click', () => {
            selectedMenuItemId = item.menu_id;
            selectedNameSpan.textContent = item.product_name;
            document.querySelectorAll('#ingredientMenuOptions .dropdown-option-premium').forEach(opt => opt.classList.remove('active'));
            option.classList.add('active');
            document.getElementById('ingredientMenuDropdown').classList.remove('active');
            renderIngredientsList();
        });

        optionsContainer.appendChild(option);
    });

    if (selectedMenuItemId) {
        const sel = products.find(p => p.menu_id === selectedMenuItemId);
        if (sel) selectedNameSpan.textContent = sel.product_name;
    }
}

async function renderIngredientsList() {
    const panel = document.getElementById('mcIngredientsPanel');
    const headerTitle = document.getElementById('mcIngredientsPanelTitle');
    const listContainer = document.getElementById('mcIngredientList');

    if (!selectedMenuItemId) {
        if (panel) panel.style.display = 'none';
        return;
    }

    panel.style.display = 'block';
    const menuItem = products.find(p => p.menu_id === selectedMenuItemId);
    headerTitle.textContent = `Ingredients for "${menuItem?.product_name || ''}"`;

    const itemIngredients = ingredients[selectedMenuItemId] || [];

    if (itemIngredients.length === 0) {
        listContainer.innerHTML = `<div class="mc-empty-state">No ingredients added yet.</div>`;
        return;
    }

    listContainer.innerHTML = itemIngredients.map(ing => {
        const stockItem = stocks.find(s => s.stock_pk === ing.stock_pk);
        return `
            <div class="mc-ingredient-item animate-fade-in">
                <div class="mc-ingredient-info">
                    <span class="ingredient-name">${stockItem?.stock_name || 'Unknown Stock'}</span>
                    <span class="ingredient-qty">${ing.quantity} ${stockItem?.unit || ''}</span>
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
        `;
    }).join('');
}

window.openAddIngredientModal = () => {
    if (!selectedMenuItemId) return;
    editingIngredientId = null;
    document.getElementById('ingredientForm').reset();
    populateStockDropdown(null);
    document.getElementById('ingredientModalOverlay').classList.add('show');
};

window.openEditIngredientModal = (id) => {
    const list = ingredients[selectedMenuItemId] || [];
    const ing = list.find(i => i.id.toString() === id.toString());
    if (!ing) return;

    editingIngredientId = id;
    populateStockDropdown(ing.stock_pk);
    document.getElementById('ingredientQty').value = ing.quantity;
    const stock = stocks.find(s => s.stock_pk === ing.stock_pk);
    document.getElementById('ingredientUnit').value = stock ? stock.unit : '';
    document.getElementById('ingredientModalOverlay').classList.add('show');
};

window.handleIngredientFormSubmit = async (e) => {
    e.preventDefault();
    const stockPk = document.getElementById('ingredientStockSelect').value;
    const quantity = parseFloat(document.getElementById('ingredientQty').value);

    if (!stockPk || isNaN(quantity)) return;

    try {
        Swal.fire({ title: 'Saving...', didOpen: () => Swal.showLoading() });
        const payload = {
            menu_id: selectedMenuItemId,
            stock_pk: stockPk,
            quantity: quantity
        };

        if (editingIngredientId) {
            const { error } = await window.sb.from('menu_ingredients').update(payload).eq('id', editingIngredientId);
            if (error) throw error;
        } else {
            const { error } = await window.sb.from('menu_ingredients').insert(payload);
            if (error) throw error;
        }

        await fetchAllData();
        renderIngredientsList();
        closeIngredientModal();
        Swal.fire('Saved', 'Ingredient record updated', 'success');
    } catch (err) {
        Swal.fire('Error', 'Ensure "menu_ingredients" table exists in Supabase. Details: ' + err.message, 'error');
    }
};

window.deleteIngredient = async (id) => {
    const res = await Swal.fire({ title: 'Remove ingredient?', icon: 'warning', showCancelButton: true });
    if (res.isConfirmed) {
        try {
            const { error } = await window.sb.from('menu_ingredients').delete().eq('id', id);
            if (error) throw error;
            await fetchAllData();
            renderIngredientsList();
            Swal.fire('Removed', '', 'success');
        } catch (err) {
            Swal.fire('Error', err.message, 'error');
        }
    }
};

// ─── Addons Tab Logic ───

function renderAddonsTab() {
    const grid = document.getElementById('mcAddonGrid');
    if (!grid) return;

    const filtered = addons.filter(a => a.name.toLowerCase().includes(menuSearchQuery.toLowerCase()));

    if (filtered.length === 0) {
        grid.innerHTML = '<div class="mc-empty-state">No addons found.</div>';
        return;
    }

    grid.innerHTML = filtered.map(addon => `
        <div class="mc-addon-card">
            <div class="mc-addon-info">
                <div class="mc-addon-header">
                    <h3 class="mc-addon-name">${addon.name}</h3>
                    <span class="mc-addon-price">₱${parseFloat(addon.price).toFixed(2)}</span>
                </div>
                <div class="mc-addon-details">
                    <span class="mc-addon-badge">${addon.addon_pairing?.length || 0} items linked</span>
                </div>
            </div>
            <div class="mc-addon-actions">
                <button class="mc-icon-btn edit" onclick="openEditAddonModal('${addon.addon_id}')">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                </button>
                <button class="mc-icon-btn delete" onclick="deleteAddon('${addon.addon_id}')">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
            </div>
        </div>
    `).join('');
}

window.openAddAddonModal = () => {
    document.getElementById('addonModalTitle').textContent = 'Add New Add-on';
    document.getElementById('editAddonId').value = '';
    document.getElementById('addonForm').reset();
    renderApplicableItemsCheckboxes([]);
    populateAddonStockDropdown(null);
    document.getElementById('addonModal').classList.add('show');
};

window.openEditAddonModal = (id) => {
    const addon = addons.find(a => a.addon_id.toString() === id.toString());
    if (!addon) return;

    document.getElementById('addonModalTitle').textContent = 'Edit Add-on';
    document.getElementById('editAddonId').value = addon.addon_id;
    document.getElementById('addonName').value = addon.name;
    document.getElementById('addonPrice').value = addon.price;

    const linkedIds = addon.addon_pairing?.map(p => p.menu_id) || [];
    renderApplicableItemsCheckboxes(linkedIds);

    // Load Stock Deduction Info
    document.getElementById('addonStockPid').value = addon.stock_pk || '';
    document.getElementById('addonStockQty').value = addon.stock_quantity || 0;
    document.getElementById('addonStockUnit').value = addon.stock_unit || '';

    if (addon.stock_pk) {
        const s = stocks.find(st => st.stock_pk === addon.stock_pk);
        document.getElementById('selectedAddonStockName').textContent = s ? s.stock_name : '— Select Stock Item —';
    } else {
        document.getElementById('selectedAddonStockName').textContent = '— Select Stock Item —';
    }

    populateAddonStockDropdown(addon.stock_pk);
    document.getElementById('addonModal').classList.add('show');
};

window.renderApplicableItemsCheckboxes = (selectedIds) => {
    const container = document.getElementById('addonApplicableItems');
    if (!container) return;
    container.innerHTML = '';

    products.forEach(item => {
        const div = document.createElement('div');
        div.className = 'mc-addon-option';
        const isChecked = selectedIds.includes(item.menu_id) ? 'checked' : '';
        div.innerHTML = `
            <input type="checkbox" id="link_${item.menu_id}" value="${item.menu_id}" ${isChecked}>
            <label class="mc-addon-chip" for="link_${item.menu_id}">${item.product_name}</label>
        `;
        container.appendChild(div);
    });
};

window.handleAddonFormSubmit = async (e) => {
    e.preventDefault();
    const id = document.getElementById('editAddonId').value;
    const name = document.getElementById('addonName').value;
    const price = parseFloat(document.getElementById('addonPrice').value);
    const stockPk = document.getElementById('addonStockPid').value;
    const stockQty = parseFloat(document.getElementById('addonStockQty').value) || 0;
    const stockUnit = document.getElementById('addonStockUnit').value;

    const checkboxes = document.querySelectorAll('#addonApplicableItems input[type="checkbox"]:checked');
    const selectedMenuIds = Array.from(checkboxes).map(cb => parseInt(cb.value));

    try {
        Swal.fire({ title: 'Saving...', didOpen: () => Swal.showLoading() });

        const addonData = {
            name,
            price,
            stock_pk: stockPk || null,
            stock_quantity: stockQty,
            stock_unit: stockUnit
        };

        let addonId = id;
        if (id) {
            const { error } = await window.sb.from('addons').update(addonData).eq('addon_id', id);
            if (error) throw error;
        } else {
            // Ensure we have a category_id if needed by schema
            const catId = addonCategories.length > 0 ? addonCategories[0].category_id : 1;
            const { data, error } = await window.sb.from('addons').insert({ ...addonData, category_id: catId }).select().single();
            if (error) throw error;
            addonId = data.addon_id;
        }

        // Handle Pairings (Clear and re-insert)
        await window.sb.from('addon_pairing').delete().eq('addon_id', addonId);
        if (selectedMenuIds.length > 0) {
            const pairings = selectedMenuIds.map(mid => ({ addon_id: addonId, menu_id: mid }));
            await window.sb.from('addon_pairing').insert(pairings);
        }

        await fetchAllData();
        renderAddonsTab();
        closeAddonModal();
        Swal.fire('Saved', 'Addon updated', 'success');
    } catch (err) {
        Swal.fire('Error', err.message, 'error');
    }
};

window.deleteAddon = async (id) => {
    const res = await Swal.fire({ title: 'Delete Addon?', icon: 'warning', showCancelButton: true });
    if (res.isConfirmed) {
        try {
            await window.sb.from('addons').delete().eq('addon_id', id);
            await fetchAllData();
            renderAddonsTab();
            Swal.fire('Deleted', '', 'success');
        } catch (err) {
            Swal.fire('Error', err.message, 'error');
        }
    }
};

// ─── UI Utility Functions ───

function setupTabSwitching() {
    document.querySelectorAll('.mc-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.mc-tab-btn').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.mc-tab-content').forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            const tabId = btn.dataset.tab;
            document.getElementById(`tab-${tabId}`).classList.add('active');
            currentTab = tabId;

            // Trigger re-render if needed
            if (tabId === 'categories') renderCategoryGrid();
            if (tabId === 'menu') renderMenuGrid();
            if (tabId === 'ingredients') renderIngredientsTab();
            if (tabId === 'addons') renderAddonsTab();
        });
    });
}

function setupMenuSearch() {
    document.getElementById('mcMenuSearch')?.addEventListener('input', (e) => {
        menuSearchQuery = e.target.value.toLowerCase();
        renderMenuGrid();
    });
}

function setupCategoryDropdown() {
    // Redundant - listeners are handled in renderCategoryFilterDropdown()
}

window.toggleMenuCategoryDropdown = () => document.getElementById('menuCategoryDropdown').classList.toggle('active');

window.selectMenuCategory = (id, name) => {
    document.getElementById('menuItemCategory').value = id;
    document.getElementById('menuCategorySelected').textContent = name;
    document.getElementById('menuCategoryDropdown').classList.remove('active');
};

function setupIngredientMenuDropdown() {
    document.getElementById('ingredientMenuTrigger')?.addEventListener('click', (e) => {
        e.stopPropagation();
        document.getElementById('ingredientMenuDropdown').classList.toggle('active');
    });
}

function setupStockDropdown() {
    const trigger = document.getElementById('ingredientStockTrigger');
    const searchInput = document.getElementById('ingredientStockSearch');

    trigger?.addEventListener('click', (e) => {
        e.stopPropagation();
        document.getElementById('ingredientStockDropdownMenu').classList.toggle('active');
    });

    searchInput?.addEventListener('input', (e) => {
        populateStockDropdown(document.getElementById('ingredientStockSelect').value, e.target.value);
    });
}

function populateStockDropdown(selectedStockPk, filter = '') {
    const container = document.getElementById('ingredientStockOptions');
    const label = document.getElementById('selectedStockName');
    const hidden = document.getElementById('ingredientStockSelect');
    if (!container) return;

    container.innerHTML = '';
    const filtered = stocks.filter(s => s.stock_name.toLowerCase().includes(filter.toLowerCase()));

    if (filtered.length === 0) {
        container.innerHTML = '<div style="padding:10px; opacity:0.6; text-align:center;">No match</div>';
        return;
    }

    filtered.forEach(s => {
        const opt = document.createElement('div');
        opt.className = 'dropdown-option-premium';
        if (selectedStockPk && selectedStockPk.toString() === s.stock_pk.toString()) opt.classList.add('active');
        opt.innerHTML = `<div><b>${s.stock_name}</b><br><small>${s.quantity} ${s.unit} avail.</small></div>`;
        opt.addEventListener('click', () => {
            hidden.value = s.stock_pk;
            label.textContent = s.stock_name;
            document.getElementById('ingredientUnit').value = s.unit;
            document.getElementById('ingredientStockDropdownMenu').classList.remove('active');
        });
        container.appendChild(opt);
    });

    if (selectedStockPk) {
        const s = stocks.find(st => st.stock_pk.toString() === selectedStockPk.toString());
        if (s) label.textContent = s.stock_name;
    } else if (!filter) {
        label.textContent = '— Choose from stocks —';
    }
}

function setupAddonSearch() {
    document.getElementById('mcAddonSearch')?.addEventListener('input', (e) => {
        menuSearchQuery = e.target.value;
        renderAddonsTab();
    });
}

function setupAddonStockDropdown() {
    const trigger = document.getElementById('addonStockTrigger');
    const searchInput = document.getElementById('addonStockSearch');

    trigger?.addEventListener('click', (e) => {
        e.stopPropagation();
        document.getElementById('addonStockDropdownMenu').classList.toggle('active');
    });

    searchInput?.addEventListener('input', (e) => {
        populateAddonStockDropdown(document.getElementById('addonStockPid').value, e.target.value);
    });
}

function populateAddonStockDropdown(selectedStockPk, filter = '') {
    const container = document.getElementById('addonStockOptions');
    const label = document.getElementById('selectedAddonStockName');
    const hidden = document.getElementById('addonStockPid');
    const unitInput = document.getElementById('addonStockUnit');
    if (!container) return;

    container.innerHTML = '';
    const filtered = stocks.filter(s => s.stock_name.toLowerCase().includes(filter.toLowerCase()));

    if (filtered.length === 0) {
        container.innerHTML = '<div style="padding:10px; opacity:0.6; text-align:center;">No match</div>';
        return;
    }

    filtered.forEach(s => {
        const opt = document.createElement('div');
        opt.className = 'dropdown-option-premium';
        if (selectedStockPk && selectedStockPk.toString() === s.stock_pk.toString()) opt.classList.add('active');
        opt.innerHTML = `<div><b>${s.stock_name}</b><br><small>${s.unit}</small></div>`;
        opt.addEventListener('click', () => {
            hidden.value = s.stock_pk;
            label.textContent = s.stock_name;
            if (unitInput) unitInput.value = s.unit;
            document.getElementById('addonStockDropdownMenu').classList.remove('active');
        });
        container.appendChild(opt);
    });

    if (selectedStockPk && !filter) {
        const s = stocks.find(st => st.stock_pk.toString() === selectedStockPk.toString());
        if (s) label.textContent = s.stock_name;
    }
}

window.handleImageUpload = (input) => {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = 300; canvas.height = 300;
                ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, 300, 300);
                ctx.drawImage(img, 0, 0, 300, 300);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                document.getElementById('menuImgPreview').src = dataUrl;
                document.getElementById('menuItemImageBase64').value = dataUrl;
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(input.files[0]);
    }
};

window.closeMenuModal = () => document.getElementById('menuModalOverlay').classList.remove('show');
window.closeIngredientModal = () => document.getElementById('ingredientModalOverlay').classList.remove('show');
window.closeAddonModal = () => document.getElementById('addonModal').classList.remove('show');
// ─── Categories Tab Logic ───

function setupCategorySearch() {
    const input = document.getElementById('mcCategorySearch');
    if (input) {
        input.addEventListener('input', (e) => {
            categorySearchQuery = e.target.value.toLowerCase();
            renderCategoryGrid();
        });
    }
}

function renderCategoryGrid() {
    const grid = document.getElementById('mcCategoryGrid');
    if (!grid) return;

    const filtered = categories.filter(cat =>
        cat.category_name.toLowerCase().includes(categorySearchQuery)
    );

    if (filtered.length === 0) {
        grid.innerHTML = `<div class="mc-empty-state">No categories found.</div>`;
        return;
    }

    grid.innerHTML = filtered.map(cat => `
        <div class="mc-menu-card animate-fade-in" style="min-height: auto;">
            <div class="mc-card-body" style="padding: 20px;">
                <div class="mc-card-name" style="font-size: 1.1rem; margin-bottom: 15px;">${cat.category_name}</div>
                <div class="mc-card-footer">
                    <span style="font-size: 0.8rem; opacity: 0.5; font-family: monospace;">ID: ${cat.category_id}</span>
                    <div class="mc-card-actions">
                        <button class="btn-icon" title="Edit" onclick="openEditCategoryModal('${cat.category_id}')">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        </button>
                        <button class="btn-icon delete-btn" title="Delete" onclick="deleteCategory('${cat.category_id}')">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

window.openAddCategoryModal = () => {
    editingCategoryId = null;
    document.getElementById('categoryModalTitle').textContent = 'Add Category';
    document.getElementById('categoryModalSubmitBtn').textContent = 'Add Category';
    document.getElementById('categoryForm').reset();
    document.getElementById('categoryModalOverlay').classList.add('show');
};

window.openEditCategoryModal = (id) => {
    const cat = categories.find(c => c.category_id.toString() === id.toString());
    if (!cat) return;

    editingCategoryId = id;
    document.getElementById('categoryModalTitle').textContent = 'Edit Category';
    document.getElementById('categoryModalSubmitBtn').textContent = 'Update Category';
    document.getElementById('categoryNameInput').value = cat.category_name;
    document.getElementById('categoryModalOverlay').classList.add('show');
};

window.closeCategoryModal = () => {
    document.getElementById('categoryModalOverlay').classList.remove('show');
    editingCategoryId = null;
};

window.handleCategoryFormSubmit = async (e) => {
    e.preventDefault();
    const name = document.getElementById('categoryNameInput').value.trim();

    if (!name) return;

    try {
        Swal.fire({ title: 'Saving...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

        if (editingCategoryId) {
            const { error } = await window.sb.from('menu_categories').update({ category_name: name }).eq('category_id', editingCategoryId);
            if (error) throw error;
        } else {
            const { error } = await window.sb.from('menu_categories').insert({ category_name: name });
            if (error) throw error;
        }

        await fetchAllData();
        renderCategoryGrid();
        renderCategoryFilterDropdown();
        renderModalCategoryDropdown();
        closeCategoryModal();
        Swal.fire('Success', 'Category saved successfully', 'success');
    } catch (err) {
        Swal.fire('Error', err.message, 'error');
    }
};

window.deleteCategory = async (id) => {
    // Check if any products use this category
    const hasProducts = products.some(p => p.category_id.toString() === id.toString());
    if (hasProducts) {
        Swal.fire('Error', 'Cannot delete category that is in use by menu items.', 'error');
        return;
    }

    const res = await Swal.fire({
        title: 'Delete Category?',
        text: 'This action cannot be undone.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#e74c3c'
    });

    if (res.isConfirmed) {
        try {
            const { error } = await window.sb.from('menu_categories').delete().eq('category_id', id);
            if (error) throw error;
            await fetchAllData();
            renderCategoryGrid();
            renderCategoryFilterDropdown();
            renderModalCategoryDropdown();
            Swal.fire('Deleted', 'Category removed', 'success');
        } catch (err) {
            Swal.fire('Error', err.message, 'error');
        }
    }
};
