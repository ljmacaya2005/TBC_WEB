# 🔥 Firebase Quick Reference - The Brew Cave

## 📦 What's Installed

✅ Firebase SDK v9.22.0 (Compat Mode)
✅ Firestore Database
✅ Authentication
✅ Storage
✅ Analytics

## 🚀 Quick Start

### Test Firebase Connection
Open browser console and run:
```javascript
console.log('Firebase:', firebaseApp);
console.log('Database:', db);
```

### Add Your First Document
```javascript
FirebaseDB.addDocument('test', { 
  message: 'Hello from The Brew Cave!',
  timestamp: new Date().toISOString()
}).then(id => console.log('Created:', id));
```

### Get All Documents
```javascript
FirebaseDB.getAllDocuments('test')
  .then(docs => console.log('Documents:', docs));
```

## 📝 Common Operations

### Products
```javascript
// Add product
FirebaseDB.addDocument(FirebaseDB.COLLECTIONS.PRODUCTS, {
  name: 'Cappuccino',
  price: 150,
  stock: 30
});

// Get all products
FirebaseDB.getAllDocuments(FirebaseDB.COLLECTIONS.PRODUCTS);

// Update stock
FirebaseDB.updateDocument(FirebaseDB.COLLECTIONS.PRODUCTS, productId, {
  stock: 25
});
```

### Orders
```javascript
// Create order
FirebaseDB.addDocument(FirebaseDB.COLLECTIONS.ORDERS, {
  items: [{productId: 'abc', quantity: 2}],
  total: 300,
  status: 'pending'
});

// Get pending orders
FirebaseDB.queryDocuments(FirebaseDB.COLLECTIONS.ORDERS, [
  ['status', '==', 'pending']
]);
```

### Real-Time Updates
```javascript
// Listen to orders
const unsubscribe = FirebaseDB.listenToCollection(
  FirebaseDB.COLLECTIONS.ORDERS,
  (orders) => {
    console.log('Orders updated:', orders);
    // Update your UI here
  }
);

// Stop listening when done
// unsubscribe();
```

## 🔐 Authentication

### Sign In
```javascript
auth.signInWithEmailAndPassword('user@example.com', 'password')
  .then(user => console.log('Signed in:', user.uid));
```

### Sign Out
```javascript
auth.signOut()
  .then(() => console.log('Signed out'));
```

### Check Auth State
```javascript
auth.onAuthStateChanged(user => {
  if (user) {
    console.log('User:', user.uid);
  } else {
    console.log('Not signed in');
  }
});
```

## 📁 File Upload
```javascript
const file = fileInput.files[0];
const ref = storage.ref().child(`images/${file.name}`);

ref.put(file)
  .then(snapshot => snapshot.ref.getDownloadURL())
  .then(url => console.log('File URL:', url));
```

## 🎯 Collections Available

- `FirebaseDB.COLLECTIONS.USERS` → 'users'
- `FirebaseDB.COLLECTIONS.PRODUCTS` → 'products'
- `FirebaseDB.COLLECTIONS.ORDERS` → 'orders'
- `FirebaseDB.COLLECTIONS.INVENTORY` → 'inventory'
- `FirebaseDB.COLLECTIONS.SALES` → 'sales'
- `FirebaseDB.COLLECTIONS.SETTINGS` → 'settings'

## ⚙️ Setup Checklist

1. ✅ Firebase SDK loaded in index.html
2. ✅ Configuration file created (firebase-config.js)
3. ✅ Helper functions available (firebase-db.js)
4. ⬜ Set up Firestore rules in Firebase Console
5. ⬜ Enable Authentication (if needed)
6. ⬜ Create initial collections
7. ⬜ Test with sample data

## 🔗 Important Links

- **Firebase Console**: https://console.firebase.google.com/
- **Your Project**: https://console.firebase.google.com/project/thebrewcave-ph
- **Full Guide**: See `FIREBASE_SETUP_GUIDE.md`

## 💡 Tips

- Always handle errors with try/catch or .catch()
- Use SweetAlert2 for user feedback
- Test in browser console first
- Check Firebase Console for data
- Set up security rules before production

## 🆘 Troubleshooting

**Firebase not defined?**
→ Check if scripts are loaded in correct order

**Permission denied?**
→ Update Firestore rules in Firebase Console

**Data not showing?**
→ Check browser console for errors
→ Verify collection names are correct

---

**Need help?** Check `FIREBASE_SETUP_GUIDE.md` for detailed examples!
