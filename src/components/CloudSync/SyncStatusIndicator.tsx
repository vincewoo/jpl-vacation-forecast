import { useAuth } from '../../hooks/useAuth';
import './SyncStatusIndicator.css';

/**
 * Small indicator showing cloud sync status in the header
 */
export function SyncStatusIndicator() {
  const { user, isFirebaseAvailable } = useAuth();

  // Don't show anything if Firebase isn't configured
  if (!isFirebaseAvailable) {
    return null;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="sync-status-indicator" title="Cloud sync enabled">
      <span className="sync-icon">☁️</span>
      <span className="sync-text">Synced</span>
    </div>
  );
}
