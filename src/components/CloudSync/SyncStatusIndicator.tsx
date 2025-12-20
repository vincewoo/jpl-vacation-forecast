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

  const isSignedIn = !!user;
  const buttonText = isSignedIn ? 'Synced' : 'Sync';
  const buttonTitle = isSignedIn ? 'Cloud sync enabled - Click to manage' : 'Click to enable cloud sync';

  return (
    <button
      className="sync-status-indicator"
      title={buttonTitle}
      onClick={onClick}
    >
      <span className="sync-icon">☁️</span>
      <span className="sync-text">{buttonText}</span>
    </button>
  );
}
