import React, { useState } from 'react';
import './PrivacyNotice.css';

interface PrivacyNoticeProps {
  context: 'welcome' | 'cloudsync';
}

const PrivacyNotice: React.FC<PrivacyNoticeProps> = ({ context }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const getContent = () => {
    if (context === 'welcome') {
      return {
        summary: 'Your vacation data is stored privately on your device. Optionally sync across devices with Google.',
        details: (
          <ul className="privacy-details-list">
            <li><strong>Local Storage:</strong> Your data is stored in your browser's localStorage, which is private to this device and not shared with anyone.</li>
            <li><strong>Optional Cloud Sync:</strong> You can optionally enable cloud sync via your Google account to access your data across devices.</li>
            <li><strong>No Third-Party Access:</strong> We don't use analytics, tracking, or share your data with any third parties.</li>
            <li><strong>Data Collected:</strong> JPL start date, current vacation balance, planned vacations, and work schedule preferences.</li>
            <li><strong>Your Control:</strong> You can reset or delete all your data at any time using the reset button in the app.</li>
          </ul>
        )
      };
    } else {
      return {
        summary: 'Cloud sync uses your Google account to securely sync data across devices.',
        details: (
          <ul className="privacy-details-list">
            <li><strong>Google Authentication:</strong> Sign in securely using your Google account credentials.</li>
            <li><strong>Firebase Platform:</strong> Data is synced via Google Firebase, ensuring enterprise-grade security.</li>
            <li><strong>Encryption:</strong> Your data is encrypted both in transit and at rest.</li>
            <li><strong>Access Control:</strong> Only you can access your data via your Google account. No one else has access.</li>
            <li><strong>Data Synced:</strong> Your vacation profile and planned vacations are synced across devices.</li>
            <li><strong>Disconnect Anytime:</strong> You can disable cloud sync at any time. Your local data will remain on your device.</li>
          </ul>
        )
      };
    }
  };

  const content = getContent();

  return (
    <div className="privacy-notice">
      <div className="privacy-summary">
        <span className="privacy-icon">🔒</span>
        <span className="privacy-text">{content.summary}</span>
        <button
          onClick={toggleExpanded}
          className="privacy-toggle"
          aria-expanded={isExpanded}
          aria-label={isExpanded ? 'Hide privacy details' : 'Show privacy details'}
        >
          {isExpanded ? 'Show Less' : 'Learn More'}
        </button>
      </div>
      {isExpanded && (
        <div className="privacy-details">
          {content.details}
        </div>
      )}
    </div>
  );
};

export default PrivacyNotice;
