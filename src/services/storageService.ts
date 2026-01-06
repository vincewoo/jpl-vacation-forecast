import { doc, setDoc, getDoc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { getFirebaseDb } from '../config/firebase';

export type StorageMode = 'localStorage' | 'cloud-sync';

export interface StorageListener<T> {
  (value: T): void;
}

/**
 * Unified storage service that handles both localStorage and Firebase sync
 */
export class StorageService {
  private mode: StorageMode = 'localStorage';
  private userId: string | null = null;
  private listeners: Map<string, Set<StorageListener<any>>> = new Map();
  private unsubscribers: Map<string, Unsubscribe> = new Map();

  /**
   * Get current storage mode
   */
  getMode(): StorageMode {
    return this.mode;
  }

  /**
   * Set storage mode and user ID for cloud sync
   */
  setMode(mode: StorageMode, userId?: string) {
    const wasCloudSync = this.mode === 'cloud-sync';
    this.mode = mode;
    this.userId = userId || null;

    // If switching away from cloud sync, clean up listeners
    if (wasCloudSync && mode === 'localStorage') {
      this.cleanupFirebaseListeners();
    }
  }

  /**
   * Read value from storage
   */
  async get<T>(key: string, defaultValue: T): Promise<T> {
    // Always try localStorage first
    try {
      const localItem = window.localStorage.getItem(key);
      if (localItem) {
        return JSON.parse(localItem);
      }
    } catch (error) {
      console.error(`Error reading ${key} from localStorage:`, error);
    }

    // If in cloud sync mode and have userId, try Firebase
    if (this.mode === 'cloud-sync' && this.userId) {
      try {
        const db = getFirebaseDb();
        if (db) {
          const docRef = doc(db, 'users', this.userId, 'data', key);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            return docSnap.data().value as T;
          }
        }
      } catch (error) {
        console.error(`Error reading ${key} from Firebase:`, error);
      }
    }

    return defaultValue;
  }

  /**
   * Write value to storage
   */
  async set<T>(key: string, value: T): Promise<void> {
    // Always write to localStorage first (offline fallback)
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error writing ${key} to localStorage:`, error);
    }

    // If in cloud sync mode, also write to Firebase
    if (this.mode === 'cloud-sync' && this.userId) {
      try {
        const db = getFirebaseDb();
        if (db) {
          const docRef = doc(db, 'users', this.userId, 'data', key);
          await setDoc(docRef, {
            value,
            updatedAt: new Date().toISOString(),
          });
        }
      } catch (error) {
        console.error(`Error writing ${key} to Firebase:`, error);
        // Don't throw - localStorage write succeeded
      }
    }

    // Notify listeners
    this.notifyListeners(key, value);
  }

  /**
   * Subscribe to changes for a specific key
   * In cloud sync mode, this listens to Firebase real-time updates
   */
  subscribe<T>(key: string, listener: StorageListener<T>): () => void {
    // Add listener to local registry
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key)!.add(listener);

    // If in cloud sync mode, set up Firebase listener
    if (this.mode === 'cloud-sync' && this.userId && !this.unsubscribers.has(key)) {
      this.setupFirebaseListener(key);
    }

    // Return unsubscribe function
    return () => {
      const keyListeners = this.listeners.get(key);
      if (keyListeners) {
        keyListeners.delete(listener);
        if (keyListeners.size === 0) {
          this.listeners.delete(key);
          // Clean up Firebase listener if no more local listeners
          const unsubscribe = this.unsubscribers.get(key);
          if (unsubscribe) {
            unsubscribe();
            this.unsubscribers.delete(key);
          }
        }
      }
    };
  }

  /**
   * Sync localStorage data to Firebase
   * Used when enabling cloud sync for the first time
   */
  async syncToCloud(keys: string[]): Promise<void> {
    if (this.mode !== 'cloud-sync' || !this.userId) {
      throw new Error('Cloud sync not enabled');
    }

    const db = getFirebaseDb();
    if (!db) {
      throw new Error('Firebase not configured');
    }

    for (const key of keys) {
      try {
        const localItem = window.localStorage.getItem(key);
        if (localItem) {
          const value = JSON.parse(localItem);
          const docRef = doc(db, 'users', this.userId, 'data', key);
          await setDoc(docRef, {
            value,
            updatedAt: new Date().toISOString(),
          });
        }
      } catch (error) {
        console.error(`Error syncing ${key} to Firebase:`, error);
      }
    }
  }

  /**
   * Load data from Firebase to localStorage
   * Used when signing in on a new device
   */
  async syncFromCloud(keys: string[]): Promise<void> {
    if (this.mode !== 'cloud-sync' || !this.userId) {
      throw new Error('Cloud sync not enabled');
    }

    const db = getFirebaseDb();
    if (!db) {
      throw new Error('Firebase not configured');
    }

    for (const key of keys) {
      try {
        const docRef = doc(db, 'users', this.userId, 'data', key);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          window.localStorage.setItem(key, JSON.stringify(data.value));
          this.notifyListeners(key, data.value);
        }
      } catch (error) {
        console.error(`Error loading ${key} from Firebase:`, error);
      }
    }
  }

  /**
   * Set up real-time Firebase listener for a key
   */
  private setupFirebaseListener(key: string) {
    if (!this.userId) return;

    const db = getFirebaseDb();
    if (!db) return;

    try {
      const docRef = doc(db, 'users', this.userId, 'data', key);
      const unsubscribe = onSnapshot(docRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          const value = data.value;

          // Update localStorage
          window.localStorage.setItem(key, JSON.stringify(value));

          // Notify listeners
          this.notifyListeners(key, value);
        }
      }, (error) => {
        console.error(`Firebase listener error for ${key}:`, error);
      });

      this.unsubscribers.set(key, unsubscribe);
    } catch (error) {
      console.error(`Error setting up Firebase listener for ${key}:`, error);
    }
  }

  /**
   * Notify all listeners for a key
   */
  private notifyListeners<T>(key: string, value: T) {
    const keyListeners = this.listeners.get(key);
    if (keyListeners) {
      keyListeners.forEach(listener => {
        try {
          listener(value);
        } catch (error) {
          console.error('Error in storage listener:', error);
        }
      });
    }
  }

  /**
   * Clean up all Firebase listeners
   */
  private cleanupFirebaseListeners() {
    this.unsubscribers.forEach(unsubscribe => unsubscribe());
    this.unsubscribers.clear();
  }
}

// Singleton instance
export const storageService = new StorageService();
