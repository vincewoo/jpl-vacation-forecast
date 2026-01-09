import { useAuth } from '../../hooks/useAuth';
import PrivacyNotice from '../PrivacyNotice/PrivacyNotice';
import './CloudSyncSettings.css';

interface CloudSyncSettingsProps {
  isOpen?: boolean;
  onClose?: () => void;
}

/**
 * Component for managing cloud sync settings
 * Allows users to enable/disable cloud sync with Google authentication
 */
export function CloudSyncSettings({ isOpen = true, onClose }: CloudSyncSettingsProps) {
  const { user, loading, error, isFirebaseAvailable, signInWithGoogle, signOut } = useAuth();

  // If Firebase is not configured, don't show anything
  if (!isFirebaseAvailable) {
    return null;
  }

  // If panel is closed, don't show anything
  if (!isOpen) {
    return null;
  }

  if (loading) {
    return (
      <div
        className="cloud-sync-settings loading"
        aria-busy="true"
        aria-live="polite"
        role="status"
      >
        {onClose && (
          <button onClick={onClose} className="close-button" aria-label="Close">
            ✕
          </button>
        )}
        <div className="spinner"></div>
        <p>Connecting to cloud...</p>
      </div>
    );
  }

  if (user) {
    // User is signed in - show sync status
    return (
      <div className="cloud-sync-settings signed-in">
        {onClose && (
          <button onClick={onClose} className="close-button" aria-label="Close">
            ✕
          </button>
        )}
        <div className="sync-status">
          <div className="sync-icon">☁️</div>
          <div className="sync-info">
            <div className="sync-title">Cloud Sync Enabled</div>
            <div className="sync-email">{user.email}</div>
            <div className="sync-description">
              Your vacation data is automatically synced across all your devices
            </div>
          </div>
        </div>
        <PrivacyNotice context="cloudsync" />
        <button onClick={signOut} className="sign-out-button">
          Disable Cloud Sync
        </button>
        {error && <div className="error-message">{error}</div>}
      </div>
    );
  }

  // User is not signed in - show enable button
  return (
    <div className="cloud-sync-settings signed-out">
      {onClose && (
        <button onClick={onClose} className="close-button" aria-label="Close">
          ✕
        </button>
      )}
      <div className="sync-promo">
        <div className="sync-icon">☁️</div>
        <div className="sync-info">
          <div className="sync-title">Enable Cloud Sync</div>
          <div className="sync-description">
            Sign in with Google to sync your vacation data across multiple devices and browsers
          </div>
        </div>
      </div>
      <PrivacyNotice context="cloudsync" />
      <button onClick={signInWithGoogle} className="sign-in-button">
        Sign in with Google
      </button>
      {error && <div className="error-message">{error}</div>}
    </div>
  );
}
