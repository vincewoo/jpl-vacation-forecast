import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import PrivacyNotice from '../PrivacyNotice/PrivacyNotice';
import { logError } from '../../utils/logger';
import './WelcomeScreen.css';

interface WelcomeScreenProps {
  onNewUser: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onNewUser }) => {
  const { signInWithGoogle, error, loading, isFirebaseAvailable } = useAuth();
  const [signingIn, setSigningIn] = useState(false);

  const handleExistingUser = async () => {
    setSigningIn(true);
    try {
      await signInWithGoogle();
      // After sign-in, the auth state change will trigger cloud sync
      // and the App component will handle the transition
    } catch (err) {
      logError('Sign-in error', err);
      setSigningIn(false);
    }
  };

  return (
    <div className="welcome-screen">
      <div className="welcome-content">
        <h2>Welcome to JPL Vacation Forecast</h2>
        <p className="welcome-subtitle">Track your vacation balance and plan your time off</p>

        <PrivacyNotice context="welcome" />

        <div className="user-choice-container">
          <div className="choice-card">
            <div className="choice-icon">🆕</div>
            <h3>New User</h3>
            <p>Set up your vacation tracking profile</p>
            <button
              onClick={onNewUser}
              className="choice-button primary-button"
              disabled={signingIn}
            >
              Get Started
            </button>
          </div>

          {isFirebaseAvailable && (
            <div className="choice-card">
              <div className="choice-icon">☁️</div>
              <h3>Existing User</h3>
              <p>Sign in to sync your data across devices</p>
              <button
                onClick={handleExistingUser}
                className="choice-button secondary-button"
                disabled={loading || signingIn}
              >
                {signingIn ? 'Signing in...' : 'Sign in with Google'}
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {!isFirebaseAvailable && (
          <div className="info-message">
            Cloud sync is not available. You can still use the app with local storage only.
          </div>
        )}
      </div>
    </div>
  );
};

export default WelcomeScreen;
