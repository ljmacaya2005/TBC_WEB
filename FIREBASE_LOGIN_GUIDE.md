# 🔐 Firebase Login Integration - Complete Guide

## ✅ What Changed

Your login system has been successfully updated to authenticate against the Firebase database instead of using hardcoded credentials!

## 🔄 Key Changes

### 1. **Login Handler (`js/main.js`)**

**Before:**
```javascript
// Hardcoded credentials
const validUsername = 'admin';
const validPassword = '123';

if (username === validUsername && password === validPassword) {
  // Login success
}
```

**After:**
```javascript
// Firebase authentication
const userQuery = await FirebaseDB.queryDocuments(
  FirebaseDB.COLLECTIONS.USERS,
  [['username', '==', username]]
);

if (userDoc.password === password) {
  // Login success
}
```

### 2. **User Data (`js/firebase-init-data.js`)**

Added password fields to sample users:
- **admin** → password: `123`
- **manager** → password: `manager123`
- **staff** → password: `staff123`

## 🎯 New Features

### ✨ Enhanced Login Features

1. **Database Authentication**
   - Validates credentials against Firestore users collection
   - Checks if user account is active
   - Stores user role and full name in session

2. **Login History Tracking**
   - Logs all login attempts (successful and failed) to Firebase
   - Records username, timestamp, role, and attempt count
   - Useful for security auditing

3. **Account Status Check**
   - Prevents login if account is disabled (`active: false`)
   - Shows specific error message for disabled accounts

4. **Enhanced Session Data**
   - Stores: `userId`, `username`, `userRole`, `userFullName`
   - Available for use throughout the application

5. **Improved User Feedback**
   - Loading indicator during authentication
   - Personalized welcome message with user's full name
   - Better error messages

## 📝 How to Use

### Step 1: Set Up Firestore Database

1. Go to: https://console.firebase.google.com/project/thebrewcave-ph
2. Click **"Firestore Database"** → **"Create database"**
3. Choose **"Start in test mode"**
4. Select region: **`asia-southeast1`**
5. Click **"Enable"**

### Step 2: Initialize User Data

Add this script to your `index.html` temporarily (before `</body>`):

```html
<script src="js/firebase-init-data.js"></script>
```

Then open your browser console (F12) and run:

```javascript
// Initialize all data (products, users, settings, orders)
FirebaseInit.initializeDatabase();

// Or just initialize users
FirebaseInit.initializeUsers();
```

This creates 3 users in your database:

| Username | Password | Role | Full Name |
|----------|----------|------|-----------|
| admin | 123 | admin | System Administrator |
| manager | manager123 | manager | Store Manager |
| staff | staff123 | staff | Staff Member |

### Step 3: Test Login

1. Open your application
2. Try logging in with:
   - Username: `admin`
   - Password: `123`

You should see:
- Loading indicator
- Success message: "Welcome back, System Administrator!"
- Redirect to home.html

## 🔍 How It Works

### Authentication Flow

```
1. User enters username & password
   ↓
2. Check lockout status (existing security)
   ↓
3. Query Firebase for user with matching username
   ↓
4. Verify user exists and is active
   ↓
5. Compare password (plain text for now)
   ↓
6. If valid:
   - Clear failed attempt counters
   - Store session data (userId, role, etc.)
   - Log successful login to Firebase
   - Show welcome message
   - Redirect to dashboard
   ↓
7. If invalid:
   - Increment failed attempts
   - Log failed attempt to Firebase
   - Show error message
   - Apply lockout if needed (3 attempts)
```

### Session Data Stored

After successful login, these values are stored in `sessionStorage`:

```javascript
sessionStorage.getItem('isLoggedIn')    // 'true'
sessionStorage.getItem('username')      // 'admin'
sessionStorage.getItem('userId')        // Firebase document ID
sessionStorage.getItem('userRole')      // 'admin', 'manager', or 'staff'
sessionStorage.getItem('userFullName')  // 'System Administrator'
```

You can use these throughout your application:

```javascript
// Check if user is admin
const userRole = sessionStorage.getItem('userRole');
if (userRole === 'admin') {
  // Show admin features
}

// Display user's name
const fullName = sessionStorage.getItem('userFullName');
document.getElementById('userName').textContent = fullName;
```

## 📊 Login History

All login attempts are logged to the `loginHistory` collection:

### Successful Login Record
```javascript
{
  userId: "abc123",
  username: "admin",
  role: "admin",
  loginTime: "2026-02-05T12:46:53+08:00",
  success: true,
  ipAddress: "N/A"
}
```

### Failed Login Record
```javascript
{
  username: "admin",
  loginTime: "2026-02-05T12:46:53+08:00",
  success: false,
  attempts: 1,
  reason: "INVALID_CREDENTIALS"
}
```

### View Login History

```javascript
// Get all login history
FirebaseDB.getAllDocuments('loginHistory')
  .then(logs => console.log('Login history:', logs));

// Get successful logins only
FirebaseDB.queryDocuments('loginHistory', [
  ['success', '==', true]
]).then(logs => console.log('Successful logins:', logs));

// Get failed attempts
FirebaseDB.queryDocuments('loginHistory', [
  ['success', '==', false]
]).then(logs => console.log('Failed attempts:', logs));
```

## 🔐 Security Features

### Maintained Features
✅ 3-attempt lockout system
✅ Progressive lockout duration (1min, 3min, 5min...)
✅ 1-hour idle reset
✅ Password masking
✅ Session-based authentication

### New Features
✅ Database-driven user management
✅ Account activation/deactivation
✅ Login attempt logging
✅ Role-based access control
✅ User status checking

## 🛠️ Managing Users

### Add a New User

```javascript
FirebaseDB.addDocument(FirebaseDB.COLLECTIONS.USERS, {
  username: 'newuser',
  password: 'password123', // Use hashed passwords in production!
  email: 'newuser@thebrewcave.local',
  role: 'staff',
  fullName: 'New User Name',
  active: true,
  permissions: ['orders']
}).then(userId => {
  console.log('User created:', userId);
  Swal.fire('Success', 'User created!', 'success');
});
```

### Disable a User Account

```javascript
const userId = 'abc123'; // Get from database
FirebaseDB.updateDocument(FirebaseDB.COLLECTIONS.USERS, userId, {
  active: false
}).then(() => {
  Swal.fire('Success', 'User account disabled', 'success');
});
```

### Change User Password

```javascript
const userId = 'abc123';
FirebaseDB.updateDocument(FirebaseDB.COLLECTIONS.USERS, userId, {
  password: 'newPassword123' // Use hashed passwords in production!
}).then(() => {
  Swal.fire('Success', 'Password updated', 'success');
});
```

### Get All Users

```javascript
FirebaseDB.getAllDocuments(FirebaseDB.COLLECTIONS.USERS)
  .then(users => {
    users.forEach(user => {
      console.log(`${user.username} - ${user.role} - ${user.active ? 'Active' : 'Disabled'}`);
    });
  });
```

## ⚠️ Important Notes

### Password Security

**Current Implementation:**
- Passwords are stored in **plain text** in Firestore
- This is **NOT secure** for production use
- Only suitable for development/testing

**For Production:**
You should implement password hashing. Here's a recommended approach:

```javascript
// When creating user (use bcrypt or similar)
const hashedPassword = await bcrypt.hash(password, 10);

// When logging in
const isValid = await bcrypt.compare(password, userDoc.hashedPassword);
```

### Test Mode Security

Your Firestore is currently in **test mode**, which means:
- ✅ Good for development
- ❌ Anyone can read/write your database
- ⚠️ Must update rules before production

**Production Rules Example:**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection - only authenticated users can read
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Login history - only system can write
    match /loginHistory/{logId} {
      allow read: if request.auth != null;
      allow write: if false; // Only server-side can write
    }
  }
}
```

## 🧪 Testing

### Test Valid Login
```
Username: admin
Password: 123
Expected: Success, redirect to home.html
```

### Test Invalid Password
```
Username: admin
Password: wrong
Expected: Error message, 2 attempts remaining
```

### Test Non-existent User
```
Username: notexist
Password: anything
Expected: Error message, 2 attempts remaining
```

### Test Disabled Account

First, disable the account:
```javascript
// Get admin user ID first
FirebaseDB.queryDocuments(FirebaseDB.COLLECTIONS.USERS, [
  ['username', '==', 'admin']
]).then(users => {
  const userId = users[0].id;
  return FirebaseDB.updateDocument(FirebaseDB.COLLECTIONS.USERS, userId, {
    active: false
  });
});
```

Then try to login:
```
Username: admin
Password: 123
Expected: "Account Disabled" error
```

### Test Lockout System
Try logging in with wrong password 3 times:
```
Attempt 1: Error, 2 attempts remaining
Attempt 2: Error, 1 attempt remaining
Attempt 3: Locked out for 1 minute
```

## 📱 Next Steps

1. **✅ Set up Firestore** (if not done)
2. **✅ Initialize users** with `FirebaseInit.initializeDatabase()`
3. **✅ Test login** with admin/123
4. **📝 Update other pages** to use session data
5. **🔐 Implement password hashing** (for production)
6. **🛡️ Update Firestore rules** (for production)
7. **👥 Build user management UI** (optional)

## 🎉 Benefits

✅ **Centralized User Management** - Add/remove users without code changes
✅ **Audit Trail** - Track all login attempts
✅ **Role-Based Access** - Different permissions per user
✅ **Account Control** - Enable/disable accounts instantly
✅ **Scalable** - Easy to add more users
✅ **Cloud-Based** - Access from anywhere

---

**Your login system is now powered by Firebase! 🚀**

Test it out and let me know if you need any adjustments!
