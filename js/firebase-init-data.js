// Firebase Database Initialization Script
// Run this script once to populate your database with sample data

/**
 * Sample Products Data
 */
const sampleProducts = [
    {
        name: 'Espresso',
        category: 'Coffee',
        price: 120,
        stock: 50,
        description: 'Strong and bold espresso shot',
        imageUrl: null,
        active: true
    },
    {
        name: 'Cappuccino',
        category: 'Coffee',
        price: 150,
        stock: 45,
        description: 'Espresso with steamed milk and foam',
        imageUrl: null,
        active: true
    },
    {
        name: 'Latte',
        category: 'Coffee',
        price: 160,
        stock: 40,
        description: 'Espresso with steamed milk',
        imageUrl: null,
        active: true
    },
    {
        name: 'Americano',
        category: 'Coffee',
        price: 130,
        stock: 55,
        description: 'Espresso with hot water',
        imageUrl: null,
        active: true
    },
    {
        name: 'Mocha',
        category: 'Coffee',
        price: 170,
        stock: 35,
        description: 'Espresso with chocolate and steamed milk',
        imageUrl: null,
        active: true
    },
    {
        name: 'Iced Coffee',
        category: 'Cold Drinks',
        price: 140,
        stock: 60,
        description: 'Chilled coffee over ice',
        imageUrl: null,
        active: true
    },
    {
        name: 'Frappe',
        category: 'Cold Drinks',
        price: 180,
        stock: 30,
        description: 'Blended iced coffee drink',
        imageUrl: null,
        active: true
    },
    {
        name: 'Croissant',
        category: 'Pastries',
        price: 80,
        stock: 25,
        description: 'Buttery, flaky pastry',
        imageUrl: null,
        active: true
    },
    {
        name: 'Blueberry Muffin',
        category: 'Pastries',
        price: 90,
        stock: 20,
        description: 'Fresh baked muffin with blueberries',
        imageUrl: null,
        active: true
    },
    {
        name: 'Chocolate Cake',
        category: 'Desserts',
        price: 120,
        stock: 15,
        description: 'Rich chocolate cake slice',
        imageUrl: null,
        active: true
    }
];

/**
 * Sample Users Data (for user management)
 * NOTE: In production, passwords should be hashed!
 */
const sampleUsers = [
    {
        username: 'admin',
        password: '123', // In production, use hashed passwords!
        email: 'admin@thebrewcave.local',
        role: 'admin',
        fullName: 'System Administrator',
        active: true,
        permissions: ['all']
    },
    {
        username: 'manager',
        password: 'manager123', // In production, use hashed passwords!
        email: 'manager@thebrewcave.local',
        role: 'manager',
        fullName: 'Store Manager',
        active: true,
        permissions: ['orders', 'inventory', 'reports']
    },
    {
        username: 'staff',
        password: 'staff123', // In production, use hashed passwords!
        email: 'staff@thebrewcave.local',
        role: 'staff',
        fullName: 'Staff Member',
        active: true,
        permissions: ['orders']
    }
];

/**
 * Sample Settings Data
 */
const sampleSettings = {
    storeName: 'The Brew Cave',
    storeAddress: 'Philippines',
    currency: 'PHP',
    taxRate: 0.12, // 12% VAT
    lowStockThreshold: 10,
    orderPrefix: 'TBC',
    receiptFooter: 'Thank you for your purchase!',
    businessHours: {
        monday: '8:00 AM - 8:00 PM',
        tuesday: '8:00 AM - 8:00 PM',
        wednesday: '8:00 AM - 8:00 PM',
        thursday: '8:00 AM - 8:00 PM',
        friday: '8:00 AM - 10:00 PM',
        saturday: '8:00 AM - 10:00 PM',
        sunday: '9:00 AM - 6:00 PM'
    }
};

/**
 * Initialize Products
 */
async function initializeProducts() {
    console.log('Initializing products...');
    const results = [];

    for (const product of sampleProducts) {
        try {
            const docId = await FirebaseDB.addDocument(
                FirebaseDB.COLLECTIONS.PRODUCTS,
                product
            );
            results.push({ success: true, name: product.name, id: docId });
            console.log(`✓ Added: ${product.name} (ID: ${docId})`);
        } catch (error) {
            results.push({ success: false, name: product.name, error: error.message });
            console.error(`✗ Failed: ${product.name}`, error);
        }
    }

    return results;
}

/**
 * Initialize Users (metadata only - not Firebase Auth users)
 */
async function initializeUsers() {
    console.log('Initializing user profiles...');
    const results = [];

    for (const user of sampleUsers) {
        try {
            const docId = await FirebaseDB.addDocument(
                FirebaseDB.COLLECTIONS.USERS,
                user
            );
            results.push({ success: true, username: user.username, id: docId });
            console.log(`✓ Added: ${user.username} (ID: ${docId})`);
        } catch (error) {
            results.push({ success: false, username: user.username, error: error.message });
            console.error(`✗ Failed: ${user.username}`, error);
        }
    }

    return results;
}

/**
 * Initialize Settings
 */
async function initializeSettings() {
    console.log('Initializing settings...');

    try {
        const docId = await FirebaseDB.addDocument(
            FirebaseDB.COLLECTIONS.SETTINGS,
            sampleSettings
        );
        console.log(`✓ Settings initialized (ID: ${docId})`);
        return { success: true, id: docId };
    } catch (error) {
        console.error('✗ Failed to initialize settings:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Create Sample Orders (for testing)
 */
async function createSampleOrders() {
    console.log('Creating sample orders...');

    // Get some products first
    const products = await FirebaseDB.getAllDocuments(FirebaseDB.COLLECTIONS.PRODUCTS);

    if (products.length === 0) {
        console.error('No products found. Please initialize products first.');
        return [];
    }

    const sampleOrders = [
        {
            orderNumber: 'TBC-001',
            items: [
                { productId: products[0].id, productName: products[0].name, quantity: 2, price: products[0].price },
                { productId: products[1].id, productName: products[1].name, quantity: 1, price: products[1].price }
            ],
            subtotal: (products[0].price * 2) + products[1].price,
            tax: ((products[0].price * 2) + products[1].price) * 0.12,
            total: ((products[0].price * 2) + products[1].price) * 1.12,
            status: 'completed',
            paymentMethod: 'cash',
            customerName: 'John Doe',
            orderDate: new Date(Date.now() - 86400000).toISOString() // Yesterday
        },
        {
            orderNumber: 'TBC-002',
            items: [
                { productId: products[2].id, productName: products[2].name, quantity: 1, price: products[2].price }
            ],
            subtotal: products[2].price,
            tax: products[2].price * 0.12,
            total: products[2].price * 1.12,
            status: 'pending',
            paymentMethod: 'card',
            customerName: 'Jane Smith',
            orderDate: new Date().toISOString() // Today
        }
    ];

    const results = [];

    for (const order of sampleOrders) {
        try {
            const docId = await FirebaseDB.addDocument(
                FirebaseDB.COLLECTIONS.ORDERS,
                order
            );
            results.push({ success: true, orderNumber: order.orderNumber, id: docId });
            console.log(`✓ Created order: ${order.orderNumber} (ID: ${docId})`);
        } catch (error) {
            results.push({ success: false, orderNumber: order.orderNumber, error: error.message });
            console.error(`✗ Failed: ${order.orderNumber}`, error);
        }
    }

    return results;
}

/**
 * Main initialization function
 * Run this to set up your entire database
 */
async function initializeDatabase() {
    console.log('🚀 Starting database initialization...\n');

    try {
        // Show loading alert
        Swal.fire({
            title: 'Initializing Database',
            text: 'Please wait...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        const results = {
            products: await initializeProducts(),
            users: await initializeUsers(),
            settings: await initializeSettings(),
            orders: await createSampleOrders()
        };

        console.log('\n✅ Database initialization complete!');
        console.log('Results:', results);

        // Count successes
        const productSuccess = results.products.filter(r => r.success).length;
        const userSuccess = results.users.filter(r => r.success).length;
        const orderSuccess = results.orders.filter(r => r.success).length;

        Swal.fire({
            title: 'Database Initialized!',
            html: `
        <div style="text-align: left;">
          <p>✓ Products: ${productSuccess}/${sampleProducts.length}</p>
          <p>✓ Users: ${userSuccess}/${sampleUsers.length}</p>
          <p>✓ Settings: ${results.settings.success ? '1/1' : '0/1'}</p>
          <p>✓ Sample Orders: ${orderSuccess}/2</p>
        </div>
      `,
            icon: 'success',
            confirmButtonColor: '#7066e0'
        });

        return results;

    } catch (error) {
        console.error('❌ Database initialization failed:', error);
        Swal.fire({
            title: 'Initialization Failed',
            text: error.message,
            icon: 'error',
            confirmButtonColor: '#d33'
        });
        throw error;
    }
}

/**
 * Clear all data (use with caution!)
 */
async function clearAllData() {
    const confirmed = await Swal.fire({
        title: 'Are you sure?',
        text: 'This will delete ALL data from your database!',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#7066e0',
        confirmButtonText: 'Yes, delete everything!'
    });

    if (!confirmed.isConfirmed) {
        return;
    }

    console.log('Clearing all data...');

    const collections = [
        FirebaseDB.COLLECTIONS.PRODUCTS,
        FirebaseDB.COLLECTIONS.USERS,
        FirebaseDB.COLLECTIONS.ORDERS,
        FirebaseDB.COLLECTIONS.SETTINGS
    ];

    for (const collection of collections) {
        try {
            const docs = await FirebaseDB.getAllDocuments(collection);
            for (const doc of docs) {
                await FirebaseDB.deleteDocument(collection, doc.id);
            }
            console.log(`✓ Cleared: ${collection}`);
        } catch (error) {
            console.error(`✗ Failed to clear ${collection}:`, error);
        }
    }

    Swal.fire('Cleared!', 'All data has been deleted.', 'success');
}

/**
 * Check database status
 */
async function checkDatabaseStatus() {
    console.log('Checking database status...\n');

    const collections = [
        FirebaseDB.COLLECTIONS.PRODUCTS,
        FirebaseDB.COLLECTIONS.USERS,
        FirebaseDB.COLLECTIONS.ORDERS,
        FirebaseDB.COLLECTIONS.SETTINGS
    ];

    const status = {};

    for (const collection of collections) {
        try {
            const docs = await FirebaseDB.getAllDocuments(collection);
            status[collection] = docs.length;
            console.log(`${collection}: ${docs.length} documents`);
        } catch (error) {
            status[collection] = 'Error: ' + error.message;
            console.error(`${collection}: Error -`, error.message);
        }
    }

    console.log('\nStatus:', status);
    return status;
}

// Export functions
window.FirebaseInit = {
    initializeDatabase,
    initializeProducts,
    initializeUsers,
    initializeSettings,
    createSampleOrders,
    clearAllData,
    checkDatabaseStatus,
    sampleProducts,
    sampleUsers,
    sampleSettings
};

console.log('Firebase initialization script loaded');
console.log('Run: FirebaseInit.initializeDatabase() to set up your database');
console.log('Run: FirebaseInit.checkDatabaseStatus() to check current status');
