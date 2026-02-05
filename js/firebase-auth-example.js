// Firebase Authentication Integration Example
// This file shows how to integrate Firebase Authentication with your existing login system

/**
 * OPTION 1: Replace localStorage authentication with Firebase Authentication
 * This is the recommended approach for production
 */

// Modified handleLogin function using Firebase Auth
async function handleLoginWithFirebase(event) {
    event.preventDefault();

    const username = document.getElementById('username').value.trim();
    const password = (window.actualPassword || document.getElementById('password').value).trim();

    // Check for empty fields
    if (!username || password) {
        Swal.fire({
            title: 'Input Required',
            text: 'Please enter both username and password.',
            icon: 'warning',
            confirmButtonColor: '#7066e0'
        });
        return;
    }

    try {
        // Sign in with Firebase
        const email = `${username}@thebrewcave.local`; // Convert username to email format
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;

        // Get user profile from Firestore
        const userProfile = await FirebaseDB.getDocument(FirebaseDB.COLLECTIONS.USERS, user.uid);

        // Store login state
        sessionStorage.setItem('isLoggedIn', 'true');
        sessionStorage.setItem('userId', user.uid);
        sessionStorage.setItem('username', userProfile?.username || username);
        sessionStorage.setItem('userRole', userProfile?.role || 'staff');

        // Log login activity
        await FirebaseDB.addDocument('loginHistory', {
            userId: user.uid,
            username: userProfile?.username || username,
            loginTime: new Date().toISOString(),
            ipAddress: 'N/A' // You can get this from a service if needed
        });

        // Show success and redirect
        Swal.fire({
            title: 'Login Successful!',
            text: 'Redirecting...',
            icon: 'success',
            showConfirmButton: false,
            timer: 1500,
            timerProgressBar: true,
            allowOutsideClick: false,
            didClose: () => {
                window.location.href = 'home.html';
            }
        });

    } catch (error) {
        console.error('Login error:', error);

        let errorMessage = 'Invalid username or password';

        if (error.code === 'auth/user-not-found') {
            errorMessage = 'User not found';
        } else if (error.code === 'auth/wrong-password') {
            errorMessage = 'Incorrect password';
        } else if (error.code === 'auth/too-many-requests') {
            errorMessage = 'Too many failed attempts. Please try again later.';
        }

        Swal.fire({
            title: 'Login Failed',
            text: errorMessage,
            icon: 'error',
            confirmButtonColor: '#7066e0'
        });
    }
}

/**
 * OPTION 2: Hybrid approach - Keep existing auth but sync with Firebase
 * Use this if you want to gradually migrate to Firebase
 */

// Modified handleLogin to also log to Firebase
async function handleLoginHybrid(event) {
    event.preventDefault();

    const now = Date.now();

    // ... (keep your existing lockout and validation logic)

    const username = document.getElementById('username').value.trim();
    const password = (window.actualPassword || document.getElementById('password').value).trim();

    if (!username || !password) {
        Swal.fire({
            title: 'Input Required',
            text: 'Please enter both username and password.',
            icon: 'warning',
            confirmButtonColor: '#7066e0'
        });
        return;
    }

    // Your existing credentials check
    const validUsername = 'admin';
    const validPassword = '123';

    if (username === validUsername && password === validPassword) {
        // SUCCESS - Clear penalties
        localStorage.removeItem('login_failed_attempts');
        localStorage.removeItem('login_penalty_level');
        localStorage.removeItem('login_lockout_end');
        localStorage.removeItem('login_last_fail_time');

        // Store login state
        sessionStorage.setItem('isLoggedIn', 'true');
        sessionStorage.setItem('username', username);

        // NEW: Log to Firebase
        try {
            await FirebaseDB.addDocument('loginHistory', {
                username: username,
                loginTime: new Date().toISOString(),
                success: true,
                method: 'local'
            });
            console.log('Login logged to Firebase');
        } catch (error) {
            console.error('Failed to log to Firebase:', error);
            // Don't block login if Firebase fails
        }

        // Show success and redirect
        Swal.fire({
            title: 'Login Successful!',
            text: 'Redirecting...',
            icon: 'success',
            showConfirmButton: false,
            timer: 1500,
            timerProgressBar: true,
            allowOutsideClick: false,
            didClose: () => {
                window.location.href = 'home.html';
            }
        });

    } else {
        // FAILURE - Handle penalties
        let failedAttempts = parseInt(localStorage.getItem('login_failed_attempts') || '0', 10);
        failedAttempts++;
        localStorage.setItem('login_failed_attempts', failedAttempts);
        localStorage.setItem('login_last_fail_time', now);

        // NEW: Log failed attempt to Firebase
        try {
            await FirebaseDB.addDocument('loginHistory', {
                username: username,
                loginTime: new Date().toISOString(),
                success: false,
                method: 'local',
                attempts: failedAttempts
            });
        } catch (error) {
            console.error('Failed to log to Firebase:', error);
        }

        // ... (keep your existing lockout logic)
    }
}

/**
 * Create a new user account in Firebase
 * Call this function to set up admin accounts
 */
async function createFirebaseUser(username, email, password, role = 'staff') {
    try {
        // Create Firebase Auth user
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;

        // Create user profile in Firestore
        await FirebaseDB.addDocument(FirebaseDB.COLLECTIONS.USERS, {
            uid: user.uid,
            username: username,
            email: email,
            role: role,
            createdAt: new Date().toISOString(),
            active: true
        });

        console.log('User created successfully:', username);
        return user.uid;

    } catch (error) {
        console.error('Error creating user:', error);
        throw error;
    }
}

/**
 * Example: Create admin account
 * Run this once in browser console to create your admin account
 */
async function setupAdminAccount() {
    try {
        const userId = await createFirebaseUser(
            'admin',
            'admin@thebrewcave.local',
            '123', // Change this to a secure password in production!
            'admin'
        );

        Swal.fire('Success', 'Admin account created!', 'success');
        console.log('Admin user ID:', userId);
    } catch (error) {
        if (error.code === 'auth/email-already-in-use') {
            Swal.fire('Info', 'Admin account already exists', 'info');
        } else {
            Swal.fire('Error', error.message, 'error');
        }
    }
}

// Uncomment to run setup (only run once!)
// setupAdminAccount();

/**
 * Check if user is authenticated (for protected pages)
 * Add this to the top of your dashboard pages
 */
function checkAuthentication() {
    auth.onAuthStateChanged((user) => {
        if (!user) {
            // User is not signed in
            sessionStorage.clear();
            window.location.href = 'index.html';
        } else {
            // User is signed in
            console.log('Authenticated user:', user.uid);
        }
    });
}

/**
 * Sign out function
 */
async function signOut() {
    try {
        await auth.signOut();
        sessionStorage.clear();
        localStorage.clear();
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Sign out error:', error);
        Swal.fire('Error', 'Failed to sign out', 'error');
    }
}

// Export functions
window.FirebaseAuth = {
    handleLoginWithFirebase,
    handleLoginHybrid,
    createFirebaseUser,
    setupAdminAccount,
    checkAuthentication,
    signOut
};

console.log('Firebase Auth integration loaded');
