import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { logError } from '../utils/logger';

// Firebase configuration using environment variables
// These will be set in .env.local file (not committed to git)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

/**
 * Check if Firebase is configured (environment variables are set)
 */
export const isFirebaseConfigured = (): boolean => {
  return !!(
    firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId
  );
};

/**
 * Initialize Firebase app, auth, and firestore
 * Only initializes if configuration is available
 */
export const initializeFirebase = () => {
  if (!isFirebaseConfigured()) {
    return { app: null, auth: null, db: null };
  }

  try {
    if (!app) {
      app = initializeApp(firebaseConfig);
      auth = getAuth(app);
      db = getFirestore(app);
    }
    return { app, auth, db };
  } catch (error) {
    logError('Failed to initialize Firebase', error);
    return { app: null, auth: null, db: null };
  }
};

/**
 * Get Firebase auth instance
 */
export const getFirebaseAuth = (): Auth | null => {
  if (!auth) {
    const { auth: newAuth } = initializeFirebase();
    return newAuth;
  }
  return auth;
};

/**
 * Get Firestore instance
 */
export const getFirebaseDb = (): Firestore | null => {
  if (!db) {
    const { db: newDb } = initializeFirebase();
    return newDb;
  }
  return db;
};
