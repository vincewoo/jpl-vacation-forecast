import { useAuth } from '../../hooks/useAuth';
import './CloudSyncSettings.css';

/**
 * Component for managing cloud sync settings
 * Allows users to enable/disable cloud sync with Google authentication
 */
export function CloudSyncSettings() {
  const { user, loading, error, isFirebaseAvailable, signInWithGoogle, signOut } = useAuth();

  // If Firebase is not configured, don't show anything
  if (!isFirebaseAvailable) {
    return null;
  }

  if (loading) {
    return (
      <div className="cloud-sync-settings loading">
        <p>Loading...</p>
      </div>
    );
  }

  if (user) {
    // User is signed in - show sync status
    return (
      <div className="cloud-sync-settings signed-in">
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
      <div className="sync-promo">
        <div className="sync-icon">☁️</div>
        <div className="sync-info">
          <div className="sync-title">Enable Cloud Sync</div>
          <div className="sync-description">
            Sign in with Google to sync your vacation data across multiple devices and browsers
          </div>
          <ul className="sync-benefits">
            <li>Access your data from any device</li>
            <li>Automatic real-time sync</li>
            <li>Your data remains private</li>
            <li>Works offline - syncs when online</li>
          </ul>
        </div>
      </div>
      <button onClick={signInWithGoogle} className="sign-in-button">
        Sign in with Google
      </button>
      {error && <div className="error-message">{error}</div>}
    </div>
  );
}
