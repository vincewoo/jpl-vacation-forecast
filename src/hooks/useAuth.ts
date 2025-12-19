import { useState, useEffect } from 'react';
import {
  User,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { getFirebaseAuth, isFirebaseConfigured } from '../config/firebase';
import { storageService } from '../services/storageService';

export interface UseAuthResult {
  user: User | null;
  loading: boolean;
  error: string | null;
  isFirebaseAvailable: boolean;
  initialSyncComplete: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const STORAGE_KEYS = [
  'jpl-vacation-user-profile',
  'jpl-vacation-planned-vacations',
];

/**
 * Hook for managing Firebase authentication and cloud sync
 */
export function useAuth(): UseAuthResult {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFirebaseAvailable] = useState(isFirebaseConfigured());
  const [initialSyncComplete, setInitialSyncComplete] = useState(false);

  // Listen to auth state changes
  useEffect(() => {
    if (!isFirebaseAvailable) {
      setLoading(false);
      return;
    }

    const auth = getFirebaseAuth();
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      setLoading(false);

      if (user) {
        // User signed in - enable cloud sync
        storageService.setMode('cloud-sync', user.uid);

        // Check if we need to sync data
        try {
          // Try to load data from cloud first (in case user has data there)
          await storageService.syncFromCloud(STORAGE_KEYS);
        } catch (err) {
          console.log('No cloud data found, will sync local data to cloud');
          // If no cloud data, sync local data to cloud
          try {
            await storageService.syncToCloud(STORAGE_KEYS);
          } catch (syncErr) {
            console.error('Error syncing to cloud:', syncErr);
          }
        } finally {
          // Mark sync as complete regardless of success/failure
          setInitialSyncComplete(true);
        }
      } else {
        // User signed out - back to localStorage only
        storageService.setMode('localStorage');
        setInitialSyncComplete(true);
      }
    });

    return () => unsubscribe();
  }, [isFirebaseAvailable]);

  /**
   * Sign in with Google popup
   */
  const signInWithGoogle = async () => {
    if (!isFirebaseAvailable) {
      setError('Firebase is not configured. Cloud sync is not available.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const auth = getFirebaseAuth();
      if (!auth) {
        throw new Error('Firebase auth not initialized');
      }

      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);

      console.log('Signed in as:', result.user.email);

      // Enable cloud sync
      storageService.setMode('cloud-sync', result.user.uid);

      // Sync existing localStorage data to cloud
      await storageService.syncToCloud(STORAGE_KEYS);

      setUser(result.user);
    } catch (err: any) {
      console.error('Sign in error:', err);
      setError(err.message || 'Failed to sign in');
      storageService.setMode('localStorage');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Sign out
   */
  const signOut = async () => {
    if (!isFirebaseAvailable) {
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const auth = getFirebaseAuth();
      if (!auth) {
        throw new Error('Firebase auth not initialized');
      }

      await firebaseSignOut(auth);

      // Back to localStorage only
      storageService.setMode('localStorage');

      setUser(null);
      console.log('Signed out successfully');
    } catch (err: any) {
      console.error('Sign out error:', err);
      setError(err.message || 'Failed to sign out');
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    loading,
    error,
    isFirebaseAvailable,
    initialSyncComplete,
    signInWithGoogle,
    signOut,
  };
}
