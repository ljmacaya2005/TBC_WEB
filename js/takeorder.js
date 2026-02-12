/**
 * THE BREW CAVE - Take Order / POS Logic
 * Now loads menu items from localStorage and deducts stock on checkout
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
const LS_STOCKS_KEY = 'brewcave_stocks';

// ─── Load products from localStorage ───
function getProducts() {
    let items = JSON.parse(localStorage.getItem(LS_MENU_KEY));
    if (!items || items.length === 0) {
        items = JSON.parse(JSON.stringify(DEFAULT_PRODUCTS));
        localStorage.setItem(LS_MENU_KEY, JSON.stringify(items));
    }
    return items;
}

let products = getProducts();
let cart = [];
let currentCategory = 'all';
let searchQuery = '';

// --- DOM Elements ---
const productsGrid = document.getElementById('productsGrid');
const cartItemsContainer = document.getElementById('cartItemsContainer');
const cartSubtotalEl = document.getElementById('cartSubtotal');
const cartTaxEl = document.getElementById('cartTax');
const cartTotalEl = document.getElementById('cartTotal');
const categoryButtons = document.querySelectorAll('.category-btn');
const searchInput = document.getElementById('productSearch');

// --- Toast Config ---
const Toast = Swal.mixin({
    toast: true,
    showConfirmButton: false,
    timer: 1500,
    timerProgressBar: false,
    didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer);
        toast.addEventListener('mouseleave', Swal.resumeTimer);
    }
});

const categoryDropdown = document.getElementById('categoryDropdown');
const categoryTrigger = document.getElementById('categoryTrigger');
const categoryMenu = document.getElementById('categoryMenu');
const selectedCategoryName = document.getElementById('selectedCategoryName');
const categoryOptions = document.querySelectorAll('.dropdown-option-premium');

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    // Refresh products from localStorage every time the page loads
    products = getProducts();
    renderProducts();
    renderCart();

    // Custom Category Dropdown Logic
    if (categoryTrigger) {
        categoryTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            categoryDropdown.classList.toggle('active');
        });
    }

    // Handle Option Selection
    categoryOptions.forEach(option => {
        option.addEventListener('click', (e) => {
            e.stopPropagation();
            const value = option.dataset.value;
            const text = option.textContent.trim();

            currentCategory = value;
            selectedCategoryName.textContent = text;

            categoryOptions.forEach(opt => opt.classList.remove('active'));
            option.classList.add('active');

            categoryDropdown.classList.remove('active');
            renderProducts();
        });
    });

    // Close on outside click
    document.addEventListener('click', () => {
        if (categoryDropdown) categoryDropdown.classList.remove('active');
    });

    // Search Filtering
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value.toLowerCase();
            renderProducts();
        });
    }
});

// --- Functions ---

// ─── Add-on Logic ───
const LS_ADDONS_KEY = 'brewcave_addons';
function getAddons() {
    return JSON.parse(localStorage.getItem(LS_ADDONS_KEY)) || [];
}

let currentSelectedProduct = null;
let currentSelectedAddons = [];

function renderProducts() {
    productsGrid.innerHTML = '';
    const filtered = products.filter(p => {
        const matchesCategory = currentCategory === 'all' || p.category === currentCategory;
        const matchesSearch = p.name.toLowerCase().includes(searchQuery);
        return matchesCategory && matchesSearch;
    });

    if (filtered.length === 0) {
        productsGrid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; opacity: 0.5; padding: 40px;">No products found.</div>`;
        return;
    }

    filtered.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card animate-fade-in';
        card.onclick = (e) => {
            addToCart(product.id, e);
            card.style.transform = 'scale(0.95)';
            setTimeout(() => card.style.transform = '', 100);
        };

        card.innerHTML = `
            <div class="product-image-area">
                <img src="${product.image}" alt="${product.name}" onerror="this.src='https://placehold.co/300x200/4E342E/FFF?text=${product.name.charAt(0)}'">
            </div>
            <div class="product-info">
                <h3 class="product-title">${product.name}</h3>
                <div class="product-meta">
                    <span class="product-price">₱${product.price.toFixed(2)}</span>
                    <button class="add-btn-mini">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    </button>
                </div>
            </div>
        `;
        productsGrid.appendChild(card);
    });
}

function addToCart(productId, event) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const allAddons = getAddons();
    // Filter add-ons valid for this product
    const applicableAddons = allAddons.filter(a => a.applicableItems && a.applicableItems.includes(productId));

    if (applicableAddons.length > 0) {
        openAddonSelectionModal(product, applicableAddons);
    } else {
        addToCartFinal(product, []);
    }
}

function addToCartFinal(product, addons = []) {
    // Generate unique ID based on product ID and sorted add-on IDs
    const addonIds = addons.map(a => a.id).sort().join(',');
    const cartId = product.id + (addonIds ? '|' + addonIds : '');

    const existingItem = cart.find(item => item.cartId === cartId);

    if (existingItem) {
        existingItem.qty++;
    } else {
        const addonTotal = addons.reduce((sum, a) => sum + parseFloat(a.price), 0);
        cart.push({
            ...product,
            cartId: cartId, // Unique Cart ID
            qty: 1,
            selectedAddons: addons,
            originalPrice: product.price,
            price: product.price + addonTotal // Price includes add-ons for total calculation
        });
    }
    renderCart();

    const isMobile = window.innerWidth <= 900;
    Toast.fire({
        icon: 'success',
        title: `Added ${product.name}`,
        position: isMobile ? 'bottom' : 'top',
        customClass: { popup: isMobile ? 'mobile-toast-popup' : '' },
        showClass: { popup: isMobile ? 'animate-toast-slide-up' : 'swal2-show' },
        hideClass: { popup: 'swal2-hide' }
    });
}

// Modal Functions
function openAddonSelectionModal(product, addons) {
    currentSelectedProduct = product;
    document.getElementById('addonModalProductName').textContent = product.name;
    const list = document.getElementById('addonSelectionList');
    list.innerHTML = '';

    addons.forEach(addon => {
        const div = document.createElement('div');
        div.style.display = 'flex';
        div.style.justifyContent = 'space-between';
        div.style.alignItems = 'center';
        div.style.padding = '8px 0';
        div.style.borderBottom = '1px solid #eee';

        div.innerHTML = `
            <div style="display:flex; align-items:center;">
                <input type="checkbox" id="add_addon_${addon.id}" value="${addon.id}" class="addon-checkbox" style="margin-right:10px; width:18px; height:18px;">
                <label for="add_addon_${addon.id}" style="cursor:pointer; font-weight:500;">${addon.name}</label>
            </div>
            <span style="font-size:0.9em; color:#A67B5B; font-weight:600;">+₱${parseFloat(addon.price).toFixed(2)}</span>
        `;
        list.appendChild(div);
    });

    // Attach click event for confirm button
    const confirmBtn = document.getElementById('confirmAddonsBtn');
    // Remove old listeners to avoid duplicates if any (cloning technique or simple onclick)
    confirmBtn.onclick = () => confirmAddons(addons);

    document.getElementById('addonSelectionModal').classList.add('show');
}

function closeAddonSelectionModal() {
    document.getElementById('addonSelectionModal').classList.remove('show');
    currentSelectedProduct = null;
}

function confirmAddons(availableAddons) {
    if (!currentSelectedProduct) return;

    const checkboxes = document.querySelectorAll('.addon-checkbox:checked');
    const selectedIds = Array.from(checkboxes).map(cb => cb.value);

    // Get full addon objects
    const selectedAddons = availableAddons.filter(a => selectedIds.includes(a.id));

    addToCartFinal(currentSelectedProduct, selectedAddons);
    closeAddonSelectionModal();
}


function updateQty(cartId, delta) {
    const item = cart.find(i => i.cartId === cartId);
    if (!item) return;

    item.qty += delta;
    if (item.qty <= 0) {
        removeFromCart(cartId);
    } else {
        renderCart();
    }
}

function removeFromCart(cartId) {
    cart = cart.filter(item => item.cartId !== cartId);
    renderCart();
}

function clearCart() {
    if (cart.length === 0) return;

    Swal.fire({
        title: 'Clear Cart?',
        text: "Remove all items from the current order?",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#e74c3c',
        cancelButtonColor: '#6e7881',
        confirmButtonText: 'Yes, Clear All'
    }).then((result) => {
        if (result.isConfirmed) {
            cart = [];
            renderCart();
        }
    });
}

function renderCart() {
    cartItemsContainer.innerHTML = '';

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = `
            <div class="empty-cart-state">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
                <span>Cart is empty</span>
            </div>
        `;
        updateTotals();
        return;
    }

    cart.forEach(item => {
        const itemEl = document.createElement('div');
        itemEl.className = 'cart-item slide-in-right';

        let addonsHtml = '';
        if (item.selectedAddons && item.selectedAddons.length > 0) {
            addonsHtml = `<div style="font-size: 0.8rem; opacity: 0.8; margin-top: 2px;">
                ${item.selectedAddons.map(a => `+ ${a.name}`).join('<br>')}
            </div>`;
        }

        itemEl.innerHTML = `
            <img src="${item.image}" alt="${item.name}" class="cart-item-img" onerror="this.src='https://placehold.co/100/4E342E/FFF?text=${item.name.charAt(0)}'">
            <div class="cart-item-details">
                <div class="cart-item-title">${item.name}</div>
                ${addonsHtml}
                <div class="cart-item-price">₱${(item.price * item.qty).toFixed(2)}</div>
            </div>
            <div class="cart-item-controls">
                <button class="qty-btn" onclick="updateQty('${item.cartId}', -1)">-</button>
                <span class="qty-display">${item.qty}</span>
                <button class="qty-btn" onclick="updateQty('${item.cartId}', 1)">+</button>
            </div>
        `;
        cartItemsContainer.appendChild(itemEl);
    });

    // --- RENDER MOBILE CART ITEMS ---
    const mobileContainer = document.getElementById('mobileCartItemsContainer');
    if (mobileContainer) {
        mobileContainer.innerHTML = '';
        if (cart.length === 0) {
            mobileContainer.innerHTML = `
                <div class="empty-cart-state">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
                    <span>Cart is empty</span>
                </div>`;
        } else {
            cart.forEach(item => {
                let addonsHtml = '';
                if (item.selectedAddons && item.selectedAddons.length > 0) {
                    addonsHtml = `<div style="font-size: 0.8rem; opacity: 0.8; margin-top: 2px;">
                        ${item.selectedAddons.map(a => `+ ${a.name}`).join('<br>')}
                    </div>`;
                }

                const itemEl = document.createElement('div');
                itemEl.className = 'cart-item slide-in-right';
                itemEl.innerHTML = `
                    <div class="cart-item-details">
                        <div class="cart-item-title">${item.name}</div>
                        ${addonsHtml}
                        <div class="cart-item-price">₱${(item.price * item.qty).toFixed(2)}</div>
                    </div>
                    <div class="cart-item-controls">
                        <button class="qty-btn" onclick="updateQty('${item.cartId}', -1)">-</button>
                        <span class="qty-display">${item.qty}</span>
                        <button class="qty-btn" onclick="updateQty('${item.cartId}', 1)">+</button>
                    </div>
                `;
                mobileContainer.appendChild(itemEl);
            });
        }
    }

    updateTotals();
}

function updateTotals() {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const total = subtotal;

    cartSubtotalEl.textContent = `₱${subtotal.toFixed(2)}`;
    cartTotalEl.textContent = `₱${total.toFixed(2)}`;

    const mobileSub = document.getElementById('mobileCartSubtotal');
    const mobileTotalDisplay = document.getElementById('mobileCartTotalDisplay');

    if (mobileSub) mobileSub.textContent = `₱${subtotal.toFixed(2)}`;
    if (mobileTotalDisplay) mobileTotalDisplay.textContent = `₱${total.toFixed(2)}`;

    const mobileCountEl = document.getElementById('mobileCartCount');
    const mobileTotalEl = document.getElementById('mobileCartTotal');
    if (mobileCountEl && mobileTotalEl) {
        const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
        mobileCountEl.textContent = totalItems;
        mobileTotalEl.textContent = `₱${total.toFixed(2)}`;

        if (totalItems > 0) {
            mobileCountEl.parentElement.classList.add('bounce');
            setTimeout(() => mobileCountEl.parentElement.classList.remove('bounce'), 300);
        }
    }
}

// Mobile Cart Toggle
let isCartOpen = false;
window.toggleCart = () => {
    isCartOpen = !isCartOpen;
    const mobileModal = document.getElementById('mobileCartModal');
    const togglerText = document.querySelector('.toggler-text');

    if (isCartOpen) {
        mobileModal.classList.add('show');
        if (togglerText) togglerText.textContent = "Close Cart";
    } else {
        mobileModal.classList.remove('show');
        if (togglerText) togglerText.textContent = "View Cart";
    }
};

document.addEventListener('click', (e) => {
    const mobileModal = document.getElementById('mobileCartModal');
    if (isCartOpen && e.target === mobileModal) {
        window.toggleCart();
    }
});

window.addEventListener('resize', () => {
    if (window.innerWidth > 900 && isCartOpen) {
        isCartOpen = false;
        const mobileModal = document.getElementById('mobileCartModal');
        const togglerText = document.querySelector('.toggler-text');
        if (mobileModal) mobileModal.classList.remove('show');
        if (togglerText) togglerText.textContent = "View Cart";
    }
});

// ─── Stock Deduction on Checkout ───
function deductStocksForCart() {
    const ingredientsData = JSON.parse(localStorage.getItem(LS_INGREDIENTS_KEY)) || {};
    let stocks = JSON.parse(localStorage.getItem(LS_STOCKS_KEY)) || [];

    if (stocks.length === 0) return; // No stocks to deduct from

    cart.forEach(cartItem => {
        const menuIngredients = ingredientsData[cartItem.id] || [];
        menuIngredients.forEach(ing => {
            // Try to find a matching stock item by name (case-insensitive)
            const stockItem = stocks.find(s =>
                s.item_name.toLowerCase().includes(ing.name.toLowerCase()) ||
                ing.name.toLowerCase().includes(s.item_name.toLowerCase())
            );
            if (stockItem) {
                const deduction = ing.quantity * cartItem.qty;
                stockItem.quantity = Math.max(0, stockItem.quantity - deduction);
                // Recalculate status
                if (stockItem.quantity <= 0) stockItem.status = 'Out of Stock';
                else if (stockItem.quantity <= 10) stockItem.status = 'Low Stock';
                else stockItem.status = 'In Stock';
            }
        });
    });

    localStorage.setItem(LS_STOCKS_KEY, JSON.stringify(stocks));
}

window.handleCheckout = () => {
    if (cart.length === 0) {
        Swal.fire({
            icon: 'error',
            title: 'Empty Cart',
            text: 'Please add items before checking out!',
            confirmButtonColor: '#A67B5B'
        });
        return;
    }

    const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    if (typeof openPaymentModal === 'function') {
        openPaymentModal('₱' + total.toFixed(2));
    } else {
        console.error("openPaymentModal function not found");
    }
};

window.processPayment = () => {
    const customer = document.getElementById('payCustomerName').value || 'Walk-in';
    const amountTendered = parseFloat(document.getElementById('payTendered').value) || 0;
    const totalStr = document.getElementById('payTotal').value.replace(/[^\d.]/g, '');
    const total = parseFloat(totalStr) || 0;
    const paymentMethod = document.getElementById('payMethod').value;
    const refNo = document.getElementById('payRefNo').value || '-';

    if (amountTendered < total) {
        Swal.fire({
            icon: 'error',
            title: 'Insufficient Amount',
            text: 'Amount tendered is less than the total amount.',
            confirmButtonColor: '#e74c3c'
        });
        return;
    }

    // Deduct stocks based on ingredients
    deductStocksForCart();

    if (typeof closePaymentModal === 'function') closePaymentModal();

    // --- SAVE ORDER TO LOCAL STORAGE ---
    const orderId = 'ORD-' + Date.now().toString().slice(-6); // Simple ID generation
    const date = new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true });

    // Create items summary string
    const itemsSummary = cart.map(item => `${item.qty}x ${item.name}`).join(', ');

    const newOrder = {
        id: orderId,
        date: date,
        items: itemsSummary,
        payment: paymentMethod.charAt(0).toUpperCase() + paymentMethod.slice(1), // Capitalize
        change: '₱' + (amountTendered - total).toFixed(2),
        ref: refNo,
        total: '₱' + total.toFixed(2),
        status: 'Pending',
        customer: customer
    };

    const existingOrders = JSON.parse(localStorage.getItem('brewcave_orders')) || [];
    existingOrders.unshift(newOrder); // Add to beginning
    localStorage.setItem('brewcave_orders', JSON.stringify(existingOrders));
    // -----------------------------------

    Swal.fire({
        title: 'Payment Successful!',
        text: `Change: ₱${(amountTendered - total).toFixed(2)}`,
        icon: 'success',
        timer: 3000,
        showConfirmButton: false
    }).then(() => {
        cart = [];
        renderCart();
        document.getElementById('paymentForm').reset();
    });
};

// Expose functions globally for onclick events in HTML
window.addToCart = addToCart;
window.updateQty = updateQty;
window.removeFromCart = removeFromCart;
window.clearCart = clearCart;

window.refreshPage = () => {
    Swal.fire({
        title: 'Refresh Page?',
        text: "Any unsaved changes or current order items might be lost.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, refresh it!'
    }).then((result) => {
        if (result.isConfirmed) {
            window.location.reload();
        }
    });
};
