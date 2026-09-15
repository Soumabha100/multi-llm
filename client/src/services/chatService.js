import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  getDocs,
  serverTimestamp,
  writeBatch,
  setDoc,
  getDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';

const SESSIONS_COLLECTION = 'sessions';
const MESSAGES_COLLECTION = 'messages';

/**
 * Creates a new chat session.
 * @param {string} userId - The Firebase Auth UID.
 * @param {string} initialPrompt - The first prompt to use as the title.
 * @returns {Promise<string>} The new session ID.
 */
export const createSession = async (userId, initialPrompt) => {
  const title = initialPrompt.split(' ').slice(0, 5).join(' ') + (initialPrompt.split(' ').length > 5 ? '...' : '');
  
  const docRef = await addDoc(collection(db, SESSIONS_COLLECTION), {
    uid: userId,
    title: title,
    selectedModel: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  
  return docRef.id;
};

/**
 * Fetches all sessions for a specific user, ordered by most recently updated.
 * @param {string} userId - The Firebase Auth UID.
 * @returns {Promise<Array>} Array of session objects.
 */
export const getUserSessions = async (userId) => {
  const q = query(
    collection(db, SESSIONS_COLLECTION), 
    where("uid", "==", userId),
    orderBy("updatedAt", "desc")
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

/**
 * Fetches all messages for a specific session, ordered by creation time.
 * @param {string} sessionId - The ID of the session.
 * @returns {Promise<Array>} Array of message objects.
 */
export const getSessionMessages = async (sessionId) => {
  const q = query(
    collection(db, SESSIONS_COLLECTION, sessionId, MESSAGES_COLLECTION),
    orderBy("createdAt", "asc")
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

/**
 * Adds a message (user or model) to a session.
 * @param {string} sessionId - The session ID.
 * @param {Object} messageData - The message data (role, content, model, modelResponses).
 */
export const addMessageToSession = async (sessionId, messageData) => {
  const sessionRef = doc(db, SESSIONS_COLLECTION, sessionId);
  const messagesRef = collection(sessionRef, MESSAGES_COLLECTION);
  
  await addDoc(messagesRef, {
    ...messageData,
    createdAt: serverTimestamp()
  });
  
  // Touch the session's updatedAt timestamp
  await updateDoc(sessionRef, {
    updatedAt: serverTimestamp()
  });
};

/**
 * Updates a session's data (e.g., setting selectedModel or renaming).
 * @param {string} sessionId - The session ID.
 * @param {Object} updates - The fields to update.
 */
export const updateSession = async (sessionId, updates) => {
  const sessionRef = doc(db, SESSIONS_COLLECTION, sessionId);
  await updateDoc(sessionRef, {
    ...updates,
    updatedAt: serverTimestamp()
  });
};

/**
 * Deletes a session and all its subcollection messages.
 * @param {string} sessionId - The session ID.
 */
export const deleteSession = async (sessionId) => {
  const sessionRef = doc(db, SESSIONS_COLLECTION, sessionId);
  const messagesRef = collection(sessionRef, MESSAGES_COLLECTION);
  
  const batch = writeBatch(db);
  
  // Get all messages in the session's subcollection
  const messagesSnapshot = await getDocs(messagesRef);
  
  // Add each message deletion to the batch
  messagesSnapshot.forEach((messageDoc) => {
    batch.delete(messageDoc.ref);
  });
  
  // Add the parent session deletion to the batch
  batch.delete(sessionRef);
  
  // Commit the batch
  await batch.commit();
};

/**
 * Creates or updates a user profile document in the users collection.
 * @param {string} userId - The Firebase Auth UID.
 * @param {Object} userData - Data to store (email, displayName, etc.)
 */
export const createUserProfile = async (userId, userData) => {
  const userRef = doc(db, 'users', userId);
  await setDoc(userRef, {
    ...userData,
    uid: userId,
    updatedAt: serverTimestamp(),
    createdAt: userData.createdAt || serverTimestamp()
  }, { merge: true });
};

/**
 * Fetches a user profile document from the users collection.
 * @param {string} userId - The Firebase Auth UID.
 * @returns {Promise<Object|null>} The user profile data, or null if not found.
 */
export const getUserProfile = async (userId) => {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  
  if (userSnap.exists()) {
    return userSnap.data();
  } else {
    return null;
  }
};
