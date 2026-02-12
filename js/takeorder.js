/**
 * THE BREW CAVE — Take Order (Supabase Integration)
 */

// ─── Supabase State ───
let products = [];
let categories = [];
let addons = [];
let cart = [];
let currentCategory = 'all';
let searchQuery = '';

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

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    initTakeOrder();
});

async function initTakeOrder() {
    const checkSb = setInterval(async () => {
        if (window.sb) {
            clearInterval(checkSb);
            await fetchInitialData();
            renderCart();
            setupSearch();
            setupCategoryDropdown();
        }
    }, 500);
}

async function fetchInitialData() {
    try {
        // 1. Fetch Categories
        const { data: catData } = await window.sb.from('menu_categories').select('*');
        categories = catData || [];

        // 2. Fetch Menu Items
        const { data: itemData } = await window.sb.from('menu_items')
            .select(`*, category:menu_categories(category_name)`)
            .is('deleted_at', null)
            .eq('is_available', true);

        products = (itemData || []).map(item => ({
            id: item.menu_id,
            name: item.product_name,
            price: parseFloat(item.price),
            category: item.category?.category_name.toLowerCase() || 'other',
            image: item.image_url || 'assets/CoffeeBean.png'
        }));

        // 3. Fetch Addons with Pairings
        const { data: addonData } = await window.sb.from('addons').select(`*, addon_pairing(*)`);
        addons = addonData || [];

        renderCategoryDropdown();
        renderProducts();
    } catch (err) {
        console.error("Fetch Data Error:", err);
    }
}

function renderCategoryDropdown() {
    const categoryMenu = document.getElementById('categoryMenu');
    const selectedCategoryName = document.getElementById('selectedCategoryName');
    const categoryDropdown = document.getElementById('categoryDropdown');

    if (!categoryMenu) return;

    let html = `<div class="dropdown-option-premium ${currentCategory === 'all' ? 'active' : ''}" data-value="all">All Items</div>`;
    categories.forEach(cat => {
        const catValue = cat.category_name.toLowerCase();
        html += `<div class="dropdown-option-premium ${currentCategory === catValue ? 'active' : ''}" data-value="${catValue}">${cat.category_name}</div>`;
    });
    categoryMenu.innerHTML = html;

    categoryMenu.querySelectorAll('.dropdown-option-premium').forEach(option => {
        option.addEventListener('click', (e) => {
            e.stopPropagation();
            currentCategory = option.dataset.value;
            selectedCategoryName.textContent = option.textContent.trim();
            document.querySelectorAll('#categoryMenu .dropdown-option-premium').forEach(opt => opt.classList.remove('active'));
            option.classList.add('active');
            categoryDropdown.classList.remove('active');
            renderProducts();
        });
    });

    const trigger = document.getElementById('categoryTrigger');
    if (trigger) {
        trigger.onclick = (e) => {
            e.stopPropagation();
            categoryDropdown.classList.toggle('active');
        };
    }
}

function renderProducts() {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;
    grid.innerHTML = '';

    const filtered = products.filter(p => {
        const matchesCategory = currentCategory === 'all' || p.category === currentCategory;
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    if (filtered.length === 0) {
        grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; opacity: 0.5; padding: 40px;">No products found.</div>`;
        return;
    }

    filtered.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card animate-fade-in';
        card.onclick = (e) => addToCart(product.id, e);

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
        grid.appendChild(card);
    });
}

function addToCart(productId, event) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    // Filter add-ons valid for this product from Supabase addons list
    const applicableAddons = addons.filter(a =>
        a.addon_pairing?.some(p => p.menu_id === productId)
    );

    if (applicableAddons.length > 0) {
        openAddonSelectionModal(product, applicableAddons);
    } else {
        addToCartFinal(product, []);
    }
}

function addToCartFinal(product, selectedAddons = []) {
    const addonIds = selectedAddons.map(a => a.addon_id).sort().join(',');
    const cartId = product.id + (addonIds ? '|' + addonIds : '');

    const existingItem = cart.find(item => item.cartId === cartId);

    if (existingItem) {
        existingItem.qty++;
    } else {
        const addonTotal = selectedAddons.reduce((sum, a) => sum + parseFloat(a.price), 0);
        cart.push({
            ...product,
            cartId: cartId,
            qty: 1,
            selectedAddons: selectedAddons,
            originalPrice: product.price,
            price: product.price + addonTotal
        });
    }
    renderCart();

    Toast.fire({
        icon: 'success',
        title: `Added ${product.name}`,
        position: window.innerWidth <= 900 ? 'bottom' : 'top'
    });
}

function renderCart() {
    const container = document.getElementById('cartItemsContainer');
    const mobileContainer = document.getElementById('mobileCartItemsContainer');
    if (!container) return;

    const renderItems = (target) => {
        if (cart.length === 0) {
            target.innerHTML = `<div class="empty-cart-state"><span>Cart is empty</span></div>`;
            return;
        }
        target.innerHTML = cart.map(item => `
            <div class="cart-item slide-in-right">
                <img src="${item.image}" alt="${item.name}" class="cart-item-img" onerror="this.src='https://placehold.co/100/4E342E/FFF?text=${item.name.charAt(0)}'">
                <div class="cart-item-details">
                    <div class="cart-item-title">${item.name}</div>
                    <div style="font-size: 0.82rem; opacity: 0.7;">
                        ${item.selectedAddons.map(a => `+ ${a.name}`).join('<br>')}
                    </div>
                    <div class="cart-item-price">₱${(item.price * item.qty).toFixed(2)}</div>
                </div>
                <div class="cart-item-controls">
                    <button class="qty-btn" onclick="updateQty('${item.cartId}', -1)">-</button>
                    <span class="qty-display">${item.qty}</span>
                    <button class="qty-btn" onclick="updateQty('${item.cartId}', 1)">+</button>
                </div>
            </div>
        `).join('');
    };

    renderItems(container);
    if (mobileContainer) renderItems(mobileContainer);
    updateTotals();
}

function updateTotals() {
    const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    document.getElementById('cartSubtotal').textContent = `₱${total.toFixed(2)}`;
    document.getElementById('cartTotal').textContent = `₱${total.toFixed(2)}`;

    if (document.getElementById('mobileCartSubtotal')) document.getElementById('mobileCartSubtotal').textContent = `₱${total.toFixed(2)}`;
    if (document.getElementById('mobileCartTotalDisplay')) document.getElementById('mobileCartTotalDisplay').textContent = `₱${total.toFixed(2)}`;

    const count = cart.reduce((sum, i) => sum + i.qty, 0);
    if (document.getElementById('mobileCartCount')) document.getElementById('mobileCartCount').textContent = count;
}

window.updateQty = (cartId, delta) => {
    const item = cart.find(i => i.cartId === cartId);
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) cart = cart.filter(i => i.cartId !== cartId);
    renderCart();
};

window.clearCart = () => {
    if (cart.length === 0) return;
    Swal.fire({ title: 'Clear Cart?', icon: 'warning', showCancelButton: true }).then(r => {
        if (r.isConfirmed) { cart = []; renderCart(); }
    });
};

window.handleCheckout = () => {
    if (cart.length === 0) return;
    const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    if (typeof openPaymentModal === 'function') openPaymentModal('₱' + total.toFixed(2));
};

window.processPayment = async () => {
    const customer = document.getElementById('payCustomerName').value || 'Walk-in';
    const amountTendered = parseFloat(document.getElementById('payTendered').value) || 0;
    const total = parseFloat(document.getElementById('payTotal').value.replace(/[^\d.]/g, '')) || 0;
    const paymentMethod = document.getElementById('payMethod').value;
    const refNo = document.getElementById('payRefNo').value || '-';

    if (amountTendered < total) {
        Swal.fire('Error', 'Insufficient Amount', 'error');
        return;
    }

    try {
        Swal.fire({ title: 'Processing...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

        const { data: { session } } = await window.sb.auth.getSession();
        const userId = session?.user?.id || null;
        const orderCode = '#ORD-' + Math.floor(Math.random() * 9000 + 1000);

        // 1. Insert Order
        const { data: orderData, error: orderError } = await window.sb.from('orders').insert({
            order_code: orderCode, user_id: userId, status: 'pending', notes: `Customer: ${customer}`,
            subtotal: total, total_amount: total
        }).select().single();
        if (orderError) throw orderError;

        // 2. Insert Items
        const orderItems = cart.map(item => ({
            order_id: orderData.order_id, menu_id: item.id, quantity: item.qty, price_at_time: item.price
        }));
        await window.sb.from('order_items').insert(orderItems);

        // 3. Insert Payment
        await window.sb.from('payments').insert({
            order_id: orderData.order_id, payment_method: paymentMethod, amount_tendered: amountTendered,
            reference_no: refNo, status: 'completed', change_amount: amountTendered - total
        });

        // 4. Deduct Stocks
        await deductStocksFromSupabase();

        if (typeof closePaymentModal === 'function') closePaymentModal();
        Swal.fire({ title: 'Success!', html: `Code: <b>${orderCode}</b>`, icon: 'success' }).then(() => {
            cart = []; renderCart();
            document.getElementById('paymentForm').reset();
        });
    } catch (err) {
        Swal.fire('Error', err.message, 'error');
    }
};

async function deductStocksFromSupabase() {
    try {
        // 1. Core Ingredients Deduction
        const menuIds = [...new Set(cart.map(i => i.id))];
        const { data: mapping } = await window.sb.from('menu_ingredients').select('*').in('menu_id', menuIds);

        for (const item of cart) {
            // Deduct Ingredients
            if (mapping) {
                const ings = mapping.filter(m => m.menu_id === item.id);
                for (const ing of ings) {
                    const totalDeduct = ing.quantity * item.qty;
                    const { data: stockItem } = await window.sb.from('stocks').select('quantity').eq('stock_pk', ing.stock_pk).single();
                    if (stockItem) {
                        await window.sb.from('stocks').update({
                            quantity: Math.max(0, stockItem.quantity - totalDeduct),
                            updated_at: new Date()
                        }).eq('stock_pk', ing.stock_pk);
                    }
                }
            }

            // 2. Add-ons Stock Deduction
            for (const addon of item.selectedAddons) {
                if (addon.stock_pk && addon.stock_quantity > 0) {
                    const totalDeduct = addon.stock_quantity * item.qty;
                    const { data: stockItem } = await window.sb.from('stocks').select('quantity').eq('stock_pk', addon.stock_pk).single();
                    if (stockItem) {
                        await window.sb.from('stocks').update({
                            quantity: Math.max(0, stockItem.quantity - totalDeduct),
                            updated_at: new Date()
                        }).eq('stock_pk', addon.stock_pk);
                    }
                }
            }
        }
    } catch (e) {
        console.warn("Stock deduction failed:", e);
    }
}

function setupSearch() {
    document.getElementById('productSearch')?.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        renderProducts();
    });
}

function setupCategoryDropdown() {
    document.addEventListener('click', () => document.getElementById('categoryDropdown')?.classList.remove('active'));
}

function openAddonSelectionModal(product, applicableAddons) {
    document.getElementById('addonModalProductName').textContent = product.name;
    const list = document.getElementById('addonSelectionList');
    list.innerHTML = applicableAddons.map(a => `
        <div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid #eee;">
            <div style="display:flex; align-items:center;">
                <input type="checkbox" id="add_addon_${a.addon_id}" value="${a.addon_id}" class="addon-checkbox" style="margin-right:10px; width:18px; height:18px;">
                <label for="add_addon_${a.addon_id}" style="cursor:pointer; font-weight:500;">${a.name}</label>
            </div>
            <span style="font-size:0.9em; color:#A67B5B; font-weight:600;">+₱${parseFloat(a.price).toFixed(2)}</span>
        </div>
    `).join('');

    document.getElementById('confirmAddonsBtn').onclick = () => {
        const selectedIds = Array.from(document.querySelectorAll('.addon-checkbox:checked')).map(cb => parseInt(cb.value));
        const selected = applicableAddons.filter(a => selectedIds.includes(a.addon_id));
        addToCartFinal(product, selected);
        document.getElementById('addonSelectionModal').classList.remove('show');
    };
    document.getElementById('addonSelectionModal').classList.add('show');
}
window.closeAddonSelectionModal = () => document.getElementById('addonSelectionModal').classList.remove('show');
window.refreshPage = () => location.reload();
