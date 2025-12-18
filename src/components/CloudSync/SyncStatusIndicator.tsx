import { useAuth } from '../../hooks/useAuth';
import './SyncStatusIndicator.css';

interface SyncStatusIndicatorProps {
  onClick?: () => void;
}

/**
 * Small indicator showing cloud sync status in the header
 */
export function SyncStatusIndicator({ onClick }: SyncStatusIndicatorProps) {
  const { user, isFirebaseAvailable } = useAuth();

  // Don't show anything if Firebase isn't configured
  if (!isFirebaseAvailable) {
    return null;
  }

  if (!user) {
    return null;
  }

  return (
    <button
      className="sync-status-indicator"
      title="Cloud sync enabled - Click to manage"
      onClick={onClick}
    >
      <span className="sync-icon">☁️</span>
      <span className="sync-text">Synced</span>
    </button>
  );
}
