import { useState, useEffect } from 'react';
import { storageService } from '../services/storageService';
import { logError } from '../utils/logger';

/**
 * Custom hook for localStorage persistence with optional cloud sync support
 *
 * This hook now supports hybrid storage:
 * - By default, uses localStorage (same as before)
 * - When user enables cloud sync, automatically syncs to Firebase
 * - Listens for real-time updates from other devices
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
  // State to store our value
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      logError(`Error loading ${key} from localStorage`, error);
      return initialValue;
    }
  });

  // Subscribe to storage changes (from Firebase real-time sync)
  useEffect(() => {
    const unsubscribe = storageService.subscribe<T>(key, (newValue) => {
      setStoredValue(newValue);
    });

    return unsubscribe;
  }, [key]);

  // Return a wrapped version of useState's setter function that
  // persists the new value to storage (localStorage + optional cloud sync)
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // Allow value to be a function so we have same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);

      // Use storage service which handles both localStorage and cloud sync
      storageService.set(key, valueToStore).catch(error => {
        logError(`Error saving ${key}`, error);
      });
    } catch (error) {
      logError(`Error saving ${key}`, error);
    }
  };

  return [storedValue, setValue];
}
