/**
 * THE BREW CAVE - Take Order / POS Logic
 */

// --- Data ---
const products = [
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

            // Update state
            currentCategory = value;
            selectedCategoryName.textContent = text;

            // Update UI classes
            categoryOptions.forEach(opt => opt.classList.remove('active'));
            option.classList.add('active');

            // Close menu and filter
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
            // Prevent triggering if clicked logic handled elsewhere, but here whole card adds to cart is fine?
            // Actually usually clicking the card might open details, bit add btn adds to cart.
            // Let's make whole card clickable for speed.
            addToCart(product.id, e); // Pass event

            // Visual feedback - Card Press
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

    const existingItem = cart.find(item => item.id === productId);
    if (existingItem) {
        existingItem.qty++;
    } else {
        cart.push({ ...product, qty: 1 });
    }
    renderCart();

    // Show Toast
    const isMobile = window.innerWidth <= 900;

    Toast.fire({
        icon: 'success',
        title: `Added ${product.name}`,
        position: isMobile ? 'bottom' : 'top',
        customClass: {
            popup: isMobile ? 'mobile-toast-popup' : ''
        },
        showClass: {
            popup: isMobile ? 'animate-toast-slide-up' : 'swal2-show'
        },
        hideClass: {
            popup: isMobile ? 'swal2-hide' : 'swal2-hide'
        }
    });
}

function updateQty(productId, delta) {
    const item = cart.find(i => i.id === productId);
    if (!item) return;

    item.qty += delta;
    if (item.qty <= 0) {
        removeFromCart(productId);
    } else {
        renderCart();
    }
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
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
        itemEl.innerHTML = `
            <img src="${item.image}" alt="${item.name}" class="cart-item-img" onerror="this.src='https://placehold.co/100/4E342E/FFF?text=${item.name.charAt(0)}'">
            <div class="cart-item-details">
                <div class="cart-item-title">${item.name}</div>
                <div class="cart-item-price">₱${(item.price * item.qty).toFixed(2)}</div>
            </div>
            <div class="cart-item-controls">
                <button class="qty-btn" onclick="updateQty('${item.id}', -1)">-</button>
                <span class="qty-display">${item.qty}</span>
                <button class="qty-btn" onclick="updateQty('${item.id}', 1)">+</button>
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
                const itemEl = document.createElement('div');
                itemEl.className = 'cart-item slide-in-right';
                itemEl.innerHTML = `
                    <div class="cart-item-details">
                        <div class="cart-item-title">${item.name}</div>
                        <div class="cart-item-price">₱${(item.price * item.qty).toFixed(2)}</div>
                    </div>
                    <div class="cart-item-controls">
                        <button class="qty-btn" onclick="updateQty('${item.id}', -1)">-</button>
                        <span class="qty-display">${item.qty}</span>
                        <button class="qty-btn" onclick="updateQty('${item.id}', 1)">+</button>
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
    const tax = subtotal * 0.05; // 5% tax
    const total = subtotal + tax;

    cartSubtotalEl.textContent = `₱${subtotal.toFixed(2)}`;
    cartTaxEl.textContent = `₱${tax.toFixed(2)}`;
    cartTotalEl.textContent = `₱${total.toFixed(2)}`;

    // Update Mobile Modal Totals
    const mobileSub = document.getElementById('mobileCartSubtotal');
    const mobileTax = document.getElementById('mobileCartTax');
    const mobileTotalDisplay = document.getElementById('mobileCartTotalDisplay');

    if (mobileSub) mobileSub.textContent = `₱${subtotal.toFixed(2)}`;
    if (mobileTax) mobileTax.textContent = `₱${tax.toFixed(2)}`;
    if (mobileTotalDisplay) mobileTotalDisplay.textContent = `₱${total.toFixed(2)}`;

    // Update Mobile Cart Toggler
    const mobileCountEl = document.getElementById('mobileCartCount');
    const mobileTotalEl = document.getElementById('mobileCartTotal');
    if (mobileCountEl && mobileTotalEl) {
        const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
        mobileCountEl.textContent = totalItems;
        mobileTotalEl.textContent = `₱${total.toFixed(2)}`;

        // Optional: Animate badge
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

// Close cart when clicking outside (click on overlay)
document.addEventListener('click', (e) => {
    const mobileModal = document.getElementById('mobileCartModal');
    // If click target IS the overlay (background), close it
    if (isCartOpen && e.target === mobileModal) {
        window.toggleCart();
    }
});

// Auto-hide mobile modal when switching to desktop/landscape (> 900px)
window.addEventListener('resize', () => {
    if (window.innerWidth > 900 && isCartOpen) {
        // Force close logic without toggling if already open (to avoid accidental re-opening logic if customized)
        // Re-using toggleCart cleanly if it just flips state, but here we want to force Close.
        isCartOpen = false;
        const mobileModal = document.getElementById('mobileCartModal');
        const togglerText = document.querySelector('.toggler-text');

        if (mobileModal) mobileModal.classList.remove('show');
        if (togglerText) togglerText.textContent = "View Cart";
    }
});

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

    const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0) * 1.05;
    // Call the modal function exposed in the HTML script or attach listener here
    // Since we defined openPaymentModal globally in HTML script block, we can call it.
    // However, best practice is to have it here. For now, assuming it's available.
    if (typeof openPaymentModal === 'function') {
        openPaymentModal('₱' + total.toFixed(2));
    } else {
        console.error("openPaymentModal function not found");
    }
};

window.processPayment = () => {
    // Get values
    const customer = document.getElementById('payCustomerName').value || 'Walk-in';
    const amountTendered = parseFloat(document.getElementById('payTendered').value) || 0;
    const totalStr = document.getElementById('payTotal').value.replace(/[^\d.]/g, '');
    const total = parseFloat(totalStr) || 0;

    if (amountTendered < total) {
        Swal.fire({
            icon: 'error',
            title: 'Insufficient Amount',
            text: 'Amount tendered is less than the total amount.',
            confirmButtonColor: '#e74c3c'
        });
        return;
    }

    // Success
    if (typeof closePaymentModal === 'function') closePaymentModal();

    Swal.fire({
        title: 'Payment Successful!',
        text: `Change: ₱${(amountTendered - total).toFixed(2)}`,
        icon: 'success',
        timer: 3000,
        showConfirmButton: false
    }).then(() => {
        cart = [];
        renderCart();
        // Reset form
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
