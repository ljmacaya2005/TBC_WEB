// Firebase Configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyBWCGEpoqeUVAkkgBRm8Ln46P9arp_jR6k",
    authDomain: "thebrewcave-ph.firebaseapp.com",
    projectId: "thebrewcave-ph",
    storageBucket: "thebrewcave-ph.firebasestorage.app",
    messagingSenderId: "490239765411",
    appId: "1:490239765411:web:9cd7be525e45cd6d7e4816",
    measurementId: "G-56VGVX4HEX"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firebase services
const db = firebase.firestore();
const auth = firebase.auth();
const storage = firebase.storage();
const analytics = firebase.analytics();

// Export for use in other files
window.firebaseApp = firebase;
window.db = db;
window.auth = auth;
window.storage = storage;
window.analytics = analytics;

console.log('Firebase initialized successfully');
