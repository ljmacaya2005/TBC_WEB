// Firebase Database Helper Functions
// This file provides utility functions for common database operations

/**
 * Database Collections Reference
 * Modify these collection names based on your database structure
 */
const COLLECTIONS = {
    USERS: 'users',
    PRODUCTS: 'products',
    ORDERS: 'orders',
    INVENTORY: 'inventory',
    SALES: 'sales',
    SETTINGS: 'settings'
};

/**
 * Add a document to a collection
 * @param {string} collection - Collection name
 * @param {object} data - Document data
 * @returns {Promise<string>} - Document ID
 */
async function addDocument(collection, data) {
    try {
        const docRef = await db.collection(collection).add({
            ...data,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        console.log(`Document added to ${collection} with ID: ${docRef.id}`);
        return docRef.id;
    } catch (error) {
        console.error(`Error adding document to ${collection}:`, error);
        throw error;
    }
}

/**
 * Get a document by ID
 * @param {string} collection - Collection name
 * @param {string} docId - Document ID
 * @returns {Promise<object>} - Document data
 */
async function getDocument(collection, docId) {
    try {
        const doc = await db.collection(collection).doc(docId).get();
        if (doc.exists) {
            return { id: doc.id, ...doc.data() };
        } else {
            console.log(`No document found in ${collection} with ID: ${docId}`);
            return null;
        }
    } catch (error) {
        console.error(`Error getting document from ${collection}:`, error);
        throw error;
    }
}

/**
 * Get all documents from a collection
 * @param {string} collection - Collection name
 * @returns {Promise<Array>} - Array of documents
 */
async function getAllDocuments(collection) {
    try {
        const snapshot = await db.collection(collection).get();
        const documents = [];
        snapshot.forEach(doc => {
            documents.push({ id: doc.id, ...doc.data() });
        });
        return documents;
    } catch (error) {
        console.error(`Error getting documents from ${collection}:`, error);
        throw error;
    }
}

/**
 * Update a document
 * @param {string} collection - Collection name
 * @param {string} docId - Document ID
 * @param {object} data - Updated data
 * @returns {Promise<void>}
 */
async function updateDocument(collection, docId, data) {
    try {
        await db.collection(collection).doc(docId).update({
            ...data,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        console.log(`Document updated in ${collection} with ID: ${docId}`);
    } catch (error) {
        console.error(`Error updating document in ${collection}:`, error);
        throw error;
    }
}

/**
 * Delete a document
 * @param {string} collection - Collection name
 * @param {string} docId - Document ID
 * @returns {Promise<void>}
 */
async function deleteDocument(collection, docId) {
    try {
        await db.collection(collection).doc(docId).delete();
        console.log(`Document deleted from ${collection} with ID: ${docId}`);
    } catch (error) {
        console.error(`Error deleting document from ${collection}:`, error);
        throw error;
    }
}

/**
 * Query documents with conditions
 * @param {string} collection - Collection name
 * @param {Array} conditions - Array of [field, operator, value] arrays
 * @returns {Promise<Array>} - Array of matching documents
 */
async function queryDocuments(collection, conditions = []) {
    try {
        let query = db.collection(collection);

        // Apply conditions
        conditions.forEach(([field, operator, value]) => {
            query = query.where(field, operator, value);
        });

        const snapshot = await query.get();
        const documents = [];
        snapshot.forEach(doc => {
            documents.push({ id: doc.id, ...doc.data() });
        });
        return documents;
    } catch (error) {
        console.error(`Error querying documents from ${collection}:`, error);
        throw error;
    }
}

/**
 * Listen to real-time updates on a collection
 * @param {string} collection - Collection name
 * @param {function} callback - Callback function to handle updates
 * @returns {function} - Unsubscribe function
 */
function listenToCollection(collection, callback) {
    return db.collection(collection).onSnapshot(snapshot => {
        const documents = [];
        snapshot.forEach(doc => {
            documents.push({ id: doc.id, ...doc.data() });
        });
        callback(documents);
    }, error => {
        console.error(`Error listening to ${collection}:`, error);
    });
}

/**
 * Listen to real-time updates on a specific document
 * @param {string} collection - Collection name
 * @param {string} docId - Document ID
 * @param {function} callback - Callback function to handle updates
 * @returns {function} - Unsubscribe function
 */
function listenToDocument(collection, docId, callback) {
    return db.collection(collection).doc(docId).onSnapshot(doc => {
        if (doc.exists) {
            callback({ id: doc.id, ...doc.data() });
        } else {
            callback(null);
        }
    }, error => {
        console.error(`Error listening to document in ${collection}:`, error);
    });
}

// Export functions for use in other files
window.FirebaseDB = {
    COLLECTIONS,
    addDocument,
    getDocument,
    getAllDocuments,
    updateDocument,
    deleteDocument,
    queryDocuments,
    listenToCollection,
    listenToDocument
};

console.log('Firebase Database helpers loaded');
