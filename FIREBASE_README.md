# 🔥 Firebase Integration - The Brew Cave

![Firebase Setup Complete](firebase_setup_diagram_1770266023138.png)

## 📋 Overview

Firebase has been successfully integrated into The Brew Cave POS system. This document provides a quick overview of the setup and how to get started.

## 🎯 What's Included

### Core Files
- **`js/firebase-config.js`** - Firebase initialization and configuration
- **`js/firebase-db.js`** - Database helper functions (CRUD operations)
- **`js/firebase-auth-example.js`** - Authentication integration examples
- **`js/firebase-init-data.js`** - Sample data initialization script

### Documentation
- **`FIREBASE_SETUP_COMPLETE.md`** - ⭐ **START HERE** - Complete setup guide
- **`FIREBASE_SETUP_GUIDE.md`** - Detailed usage examples
- **`FIREBASE_QUICK_REFERENCE.md`** - Quick reference cheat sheet

## 🚀 Quick Start

### 1. Configure Firebase Console

Visit: **https://console.firebase.google.com/project/thebrewcave-ph**

1. **Enable Firestore Database**
   - Click "Create database"
   - Choose "Test mode" for development
   - Select region: `asia-southeast1` (Singapore)

2. **Enable Authentication** (Optional)
   - Go to Authentication → Get started
   - Enable Email/Password method

### 2. Test the Setup

Open your application and press **F12** to open the console:

```javascript
// Check if Firebase is loaded
console.log('Firebase:', firebaseApp);
console.log('Database:', db);

// Test database connection
FirebaseDB.addDocument('test', { 
  message: 'Hello Firebase!',
  timestamp: new Date().toISOString()
});
```

### 3. Initialize Sample Data

Load the initialization script in your HTML:

```html
<script src="js/firebase-init-data.js"></script>
```

Then run in console:

```javascript
FirebaseInit.initializeDatabase();
```

This creates:
- ✅ 10 sample products
- ✅ 3 user profiles
- ✅ Store settings
- ✅ 2 sample orders

## 📚 Available Functions

### Database Operations

```javascript
// Add document
FirebaseDB.addDocument(collection, data)

// Get document
FirebaseDB.getDocument(collection, docId)

// Get all documents
FirebaseDB.getAllDocuments(collection)

// Update document
FirebaseDB.updateDocument(collection, docId, data)

// Delete document
FirebaseDB.deleteDocument(collection, docId)

// Query documents
FirebaseDB.queryDocuments(collection, conditions)

// Real-time listener
FirebaseDB.listenToCollection(collection, callback)
```

### Collections

```javascript
FirebaseDB.COLLECTIONS.PRODUCTS    // 'products'
FirebaseDB.COLLECTIONS.ORDERS      // 'orders'
FirebaseDB.COLLECTIONS.USERS       // 'users'
FirebaseDB.COLLECTIONS.INVENTORY   // 'inventory'
FirebaseDB.COLLECTIONS.SALES       // 'sales'
FirebaseDB.COLLECTIONS.SETTINGS    // 'settings'
```

## 💡 Usage Examples

### Save an Order

```javascript
const orderData = {
  orderNumber: 'TBC-' + Date.now(),
  items: [
    { productId: 'abc123', productName: 'Cappuccino', quantity: 2, price: 150 }
  ],
  total: 300,
  status: 'pending'
};

FirebaseDB.addDocument(FirebaseDB.COLLECTIONS.ORDERS, orderData)
  .then(orderId => {
    Swal.fire('Success', 'Order saved!', 'success');
  });
```

### Load Products

```javascript
FirebaseDB.getAllDocuments(FirebaseDB.COLLECTIONS.PRODUCTS)
  .then(products => {
    products.forEach(product => {
      console.log(`${product.name}: ₱${product.price}`);
    });
  });
```

### Real-Time Updates

```javascript
FirebaseDB.listenToCollection(
  FirebaseDB.COLLECTIONS.ORDERS,
  (orders) => {
    console.log('Orders updated:', orders);
    // Update your UI here
  }
);
```

## 📖 Documentation Guide

1. **New to Firebase?** → Start with `FIREBASE_SETUP_COMPLETE.md`
2. **Need examples?** → Check `FIREBASE_SETUP_GUIDE.md`
3. **Quick lookup?** → Use `FIREBASE_QUICK_REFERENCE.md`
4. **Authentication?** → See `js/firebase-auth-example.js`

## 🔐 Security

### Development Mode
Currently using test mode - anyone can read/write. This is fine for development.

### Production Mode
Before going live, update Firestore rules in Firebase Console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 🆘 Troubleshooting

| Issue | Solution |
|-------|----------|
| Firebase not defined | Check script load order in HTML |
| Permission denied | Enable test mode in Firestore rules |
| Data not saving | Check browser console for errors |
| Can't connect | Verify API key in firebase-config.js |

## 📞 Resources

- **Firebase Console**: https://console.firebase.google.com/project/thebrewcave-ph
- **Firebase Docs**: https://firebase.google.com/docs
- **Firestore Guide**: https://firebase.google.com/docs/firestore

## ✨ Next Steps

1. ✅ Set up Firestore in Firebase Console
2. ✅ Test the connection
3. ✅ Initialize sample data
4. ✅ Integrate with your pages
5. ✅ Read the documentation

---

**Project**: The Brew Cave v4.7  
**Firebase Project**: thebrewcave-ph  
**Setup Date**: February 5, 2026  

**Happy coding! 🚀☕**
