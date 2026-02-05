# Firebase Setup Guide for The Brew Cave

## Overview
Firebase has been successfully configured for The Brew Cave application. This document provides guidance on how to use Firebase services in your application.

## What's Been Set Up

### 1. Firebase SDK (v9.22.0 - Compat Mode)
The following Firebase services are now available:
- **Firestore Database** - NoSQL cloud database
- **Authentication** - User authentication and management
- **Storage** - File storage (images, documents, etc.)
- **Analytics** - App usage analytics

### 2. Configuration Files

#### `js/firebase-config.js`
Contains your Firebase project configuration and initializes all Firebase services.

**Available Global Variables:**
```javascript
window.firebaseApp  // Firebase app instance
window.db           // Firestore database
window.auth         // Firebase Authentication
window.storage      // Firebase Storage
window.analytics    // Firebase Analytics
```

#### `js/firebase-db.js`
Provides helper functions for common database operations.

**Available Collections:**
```javascript
FirebaseDB.COLLECTIONS = {
  USERS: 'users',
  PRODUCTS: 'products',
  ORDERS: 'orders',
  INVENTORY: 'inventory',
  SALES: 'sales',
  SETTINGS: 'settings'
}
```

## How to Use Firebase

### Basic Database Operations

#### 1. Add a Document
```javascript
// Add a new product
const productData = {
  name: 'Espresso',
  price: 120,
  category: 'Coffee',
  stock: 50
};

FirebaseDB.addDocument(FirebaseDB.COLLECTIONS.PRODUCTS, productData)
  .then(docId => {
    console.log('Product added with ID:', docId);
    Swal.fire('Success', 'Product added successfully!', 'success');
  })
  .catch(error => {
    console.error('Error:', error);
    Swal.fire('Error', 'Failed to add product', 'error');
  });
```

#### 2. Get All Documents
```javascript
// Get all products
FirebaseDB.getAllDocuments(FirebaseDB.COLLECTIONS.PRODUCTS)
  .then(products => {
    console.log('All products:', products);
    // Display products in your UI
    products.forEach(product => {
      console.log(`${product.name}: ₱${product.price}`);
    });
  })
  .catch(error => {
    console.error('Error:', error);
  });
```

#### 3. Get a Specific Document
```javascript
// Get a specific product by ID
const productId = 'abc123';
FirebaseDB.getDocument(FirebaseDB.COLLECTIONS.PRODUCTS, productId)
  .then(product => {
    if (product) {
      console.log('Product found:', product);
    } else {
      console.log('Product not found');
    }
  });
```

#### 4. Update a Document
```javascript
// Update product stock
const productId = 'abc123';
const updates = {
  stock: 45,
  lastUpdated: new Date().toISOString()
};

FirebaseDB.updateDocument(FirebaseDB.COLLECTIONS.PRODUCTS, productId, updates)
  .then(() => {
    console.log('Product updated successfully');
    Swal.fire('Success', 'Stock updated!', 'success');
  })
  .catch(error => {
    console.error('Error:', error);
  });
```

#### 5. Delete a Document
```javascript
// Delete a product
const productId = 'abc123';
FirebaseDB.deleteDocument(FirebaseDB.COLLECTIONS.PRODUCTS, productId)
  .then(() => {
    console.log('Product deleted');
    Swal.fire('Deleted', 'Product removed successfully', 'success');
  })
  .catch(error => {
    console.error('Error:', error);
  });
```

#### 6. Query Documents
```javascript
// Find all products with low stock (less than 10)
const conditions = [
  ['stock', '<', 10],
  ['category', '==', 'Coffee']
];

FirebaseDB.queryDocuments(FirebaseDB.COLLECTIONS.PRODUCTS, conditions)
  .then(products => {
    console.log('Low stock coffee products:', products);
  });
```

### Real-Time Updates

#### Listen to Collection Changes
```javascript
// Listen to all products in real-time
const unsubscribe = FirebaseDB.listenToCollection(
  FirebaseDB.COLLECTIONS.PRODUCTS,
  (products) => {
    console.log('Products updated:', products);
    // Update your UI with the new data
    updateProductTable(products);
  }
);

// To stop listening (call when leaving the page)
// unsubscribe();
```

#### Listen to Document Changes
```javascript
// Listen to a specific product
const productId = 'abc123';
const unsubscribe = FirebaseDB.listenToDocument(
  FirebaseDB.COLLECTIONS.PRODUCTS,
  productId,
  (product) => {
    if (product) {
      console.log('Product updated:', product);
      // Update UI
    } else {
      console.log('Product deleted');
    }
  }
);
```

### User Authentication

#### Sign Up a New User
```javascript
const email = 'user@example.com';
const password = 'securePassword123';

auth.createUserWithEmailAndPassword(email, password)
  .then((userCredential) => {
    const user = userCredential.user;
    console.log('User created:', user.uid);
    
    // Add user profile to Firestore
    return FirebaseDB.addDocument(FirebaseDB.COLLECTIONS.USERS, {
      uid: user.uid,
      email: user.email,
      role: 'staff',
      createdAt: new Date().toISOString()
    });
  })
  .then(() => {
    Swal.fire('Success', 'User account created!', 'success');
  })
  .catch((error) => {
    console.error('Error:', error);
    Swal.fire('Error', error.message, 'error');
  });
```

#### Sign In User
```javascript
const email = 'user@example.com';
const password = 'securePassword123';

auth.signInWithEmailAndPassword(email, password)
  .then((userCredential) => {
    const user = userCredential.user;
    console.log('User signed in:', user.uid);
    
    // Store session
    sessionStorage.setItem('isLoggedIn', 'true');
    sessionStorage.setItem('userId', user.uid);
    
    // Redirect to dashboard
    window.location.href = 'home.html';
  })
  .catch((error) => {
    console.error('Error:', error);
    Swal.fire('Error', 'Invalid credentials', 'error');
  });
```

#### Sign Out User
```javascript
auth.signOut()
  .then(() => {
    sessionStorage.clear();
    window.location.href = 'index.html';
  })
  .catch((error) => {
    console.error('Error:', error);
  });
```

#### Check Authentication State
```javascript
auth.onAuthStateChanged((user) => {
  if (user) {
    console.log('User is signed in:', user.uid);
    // User is authenticated
  } else {
    console.log('User is signed out');
    // Redirect to login if needed
    window.location.href = 'index.html';
  }
});
```

### File Storage

#### Upload a File
```javascript
const fileInput = document.getElementById('fileInput');
const file = fileInput.files[0];

if (file) {
  const storageRef = storage.ref();
  const fileRef = storageRef.child(`products/${Date.now()}_${file.name}`);
  
  fileRef.put(file)
    .then((snapshot) => {
      console.log('File uploaded successfully');
      return snapshot.ref.getDownloadURL();
    })
    .then((downloadURL) => {
      console.log('File available at:', downloadURL);
      // Save the URL to Firestore
      return FirebaseDB.updateDocument(
        FirebaseDB.COLLECTIONS.PRODUCTS,
        productId,
        { imageUrl: downloadURL }
      );
    })
    .then(() => {
      Swal.fire('Success', 'Image uploaded!', 'success');
    })
    .catch((error) => {
      console.error('Error:', error);
      Swal.fire('Error', 'Upload failed', 'error');
    });
}
```

#### Delete a File
```javascript
const fileUrl = 'https://firebasestorage.googleapis.com/...';
const fileRef = storage.refFromURL(fileUrl);

fileRef.delete()
  .then(() => {
    console.log('File deleted successfully');
  })
  .catch((error) => {
    console.error('Error:', error);
  });
```

## Integration Examples

### Example 1: Save Order to Database
```javascript
async function saveOrder(orderData) {
  try {
    // Add order to database
    const orderId = await FirebaseDB.addDocument(
      FirebaseDB.COLLECTIONS.ORDERS,
      {
        items: orderData.items,
        total: orderData.total,
        customerName: orderData.customerName,
        status: 'pending',
        orderDate: new Date().toISOString()
      }
    );
    
    // Update inventory
    for (const item of orderData.items) {
      const product = await FirebaseDB.getDocument(
        FirebaseDB.COLLECTIONS.PRODUCTS,
        item.productId
      );
      
      if (product) {
        await FirebaseDB.updateDocument(
          FirebaseDB.COLLECTIONS.PRODUCTS,
          item.productId,
          { stock: product.stock - item.quantity }
        );
      }
    }
    
    Swal.fire('Success', `Order #${orderId} placed successfully!`, 'success');
    return orderId;
  } catch (error) {
    console.error('Error saving order:', error);
    Swal.fire('Error', 'Failed to place order', 'error');
    throw error;
  }
}
```

### Example 2: Load Products for Display
```javascript
async function loadProducts() {
  try {
    const products = await FirebaseDB.getAllDocuments(
      FirebaseDB.COLLECTIONS.PRODUCTS
    );
    
    const productContainer = document.getElementById('productList');
    productContainer.innerHTML = '';
    
    products.forEach(product => {
      const productCard = `
        <div class="product-card" data-id="${product.id}">
          <h3>${product.name}</h3>
          <p>Price: ₱${product.price}</p>
          <p>Stock: ${product.stock}</p>
          <button onclick="addToCart('${product.id}')">Add to Cart</button>
        </div>
      `;
      productContainer.innerHTML += productCard;
    });
  } catch (error) {
    console.error('Error loading products:', error);
    Swal.fire('Error', 'Failed to load products', 'error');
  }
}

// Call when page loads
document.addEventListener('DOMContentLoaded', loadProducts);
```

### Example 3: Real-Time Order Monitoring
```javascript
// Monitor orders in real-time (for dashboard)
function monitorOrders() {
  const unsubscribe = FirebaseDB.listenToCollection(
    FirebaseDB.COLLECTIONS.ORDERS,
    (orders) => {
      // Filter pending orders
      const pendingOrders = orders.filter(order => order.status === 'pending');
      
      // Update dashboard
      document.getElementById('pendingOrderCount').textContent = pendingOrders.length;
      
      // Update order list
      updateOrderList(pendingOrders);
    }
  );
  
  // Clean up listener when leaving page
  window.addEventListener('beforeunload', () => {
    unsubscribe();
  });
}
```

## Next Steps

1. **Set up Firestore Database Rules** in Firebase Console:
   - Go to https://console.firebase.google.com/
   - Select your project: `thebrewcave-ph`
   - Navigate to Firestore Database
   - Set up security rules (start with test mode for development)

2. **Enable Authentication** (if using Firebase Auth):
   - Go to Authentication section
   - Enable Email/Password authentication

3. **Create Collections**:
   - You can create collections automatically by adding documents
   - Or create them manually in the Firebase Console

4. **Test the Setup**:
   - Open your browser console
   - Try adding a test document:
   ```javascript
   FirebaseDB.addDocument('test', { message: 'Hello Firebase!' })
     .then(id => console.log('Test successful! Doc ID:', id));
   ```

## Important Notes

- **Security**: The current setup uses client-side Firebase. Make sure to set up proper Firestore security rules in production.
- **Offline Support**: Firestore supports offline data persistence. Enable it with:
  ```javascript
  db.enablePersistence()
    .catch((err) => {
      console.error('Persistence error:', err);
    });
  ```
- **Timestamps**: Use `firebase.firestore.FieldValue.serverTimestamp()` for consistent server-side timestamps
- **Batch Operations**: For multiple writes, use batch operations for better performance

## Troubleshooting

### Firebase not loading
- Check browser console for errors
- Ensure internet connection is active
- Verify Firebase SDK scripts are loaded before firebase-config.js

### Permission Denied Errors
- Check Firestore security rules in Firebase Console
- Ensure user is authenticated if rules require it

### Data not updating
- Check browser console for errors
- Verify collection and document IDs are correct
- Ensure data structure matches Firestore requirements

## Support Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Guide](https://firebase.google.com/docs/firestore)
- [Firebase Console](https://console.firebase.google.com/)

---

**Your Firebase project is now ready to use!** 🚀
