# Cloud Sync Setup Guide

This document explains how to set up Firebase cloud sync for the JPL Vacation Forecast application.

## Overview

Cloud sync is an **optional feature** that allows users to sync their vacation data across multiple devices and browsers. The application works perfectly fine without cloud sync - it will continue to use localStorage as it always has.

**Key Features:**
- Sign in with Google to enable cloud sync
- Automatic real-time sync across all devices
- Works offline - syncs when connection is restored
- Completely opt-in - localStorage remains the default
- Users can disable sync anytime and revert to localStorage-only

## How It Works

### Default Behavior (No Setup Required)
Without Firebase configuration, the app works exactly as before:
- All data stored in browser localStorage
- Works completely offline
- No account needed
- Cloud sync option simply won't appear

### With Firebase Configuration
When Firebase is configured:
- Users see an optional "Enable Cloud Sync" button in the dashboard
- Clicking it prompts Google sign-in
- After signing in, their localStorage data is uploaded to Firebase
- Future changes sync automatically across all signed-in devices
- Users can sign out to revert to localStorage-only mode

## Setup Instructions

### 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or select an existing project
3. Follow the setup wizard (you can disable Google Analytics if not needed)

### 2. Enable Authentication

1. In your Firebase project, go to **Authentication** in the left sidebar
2. Click **Get started** (if not already enabled)
3. Go to the **Sign-in method** tab
4. Enable **Google** as a sign-in provider
5. Add your authorized domains:
   - `localhost` (for development)
   - Your production domain (e.g., `yourdomain.com`)

### 3. Create Firestore Database

1. In your Firebase project, go to **Firestore Database** in the left sidebar
2. Click **Create database**
3. Choose **Start in production mode** (we'll set up rules next)
4. Select a Cloud Firestore location (choose one closest to your users)

### 4. Set Up Firestore Security Rules

Go to the **Rules** tab in Firestore and replace the rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow users to read/write only their own data
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

Click **Publish** to save the rules.

### 5. Get Firebase Configuration

1. Go to **Project Settings** (gear icon in left sidebar)
2. Scroll down to "Your apps"
3. Click the **</>** (web) icon to add a web app
4. Register your app with a nickname (e.g., "JPL Vacation Forecast")
5. Copy the Firebase configuration values

You'll see something like:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

### 6. Configure Environment Variables

1. Copy `.env.local.example` to `.env.local` in the project root:
   ```bash
   cp .env.local.example .env.local
   ```

2. Open `.env.local` and fill in your Firebase configuration:
   ```
   VITE_FIREBASE_API_KEY=your-api-key-here
   VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   VITE_FIREBASE_APP_ID=your-app-id
   ```

3. **Important:** Never commit `.env.local` to git (it's already in `.gitignore`)

### 7. Test Locally

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open the app in your browser
3. Create a user profile
4. You should see the "Enable Cloud Sync" section
5. Click "Sign in with Google" and test the sync functionality

### 8. Deploy with Cloud Sync

When deploying to production (e.g., GitHub Pages):

**Option 1: Use GitHub Secrets (Recommended for GitHub Pages)**

If deploying via GitHub Actions, add your Firebase config as repository secrets:
1. Go to your GitHub repository settings
2. Navigate to Secrets and variables > Actions
3. Add each environment variable as a secret
4. Update your GitHub Actions workflow to inject these values during build

**Option 2: Build Locally**

Build with environment variables:
```bash
npm run build
npm run deploy
```

The `.env.local` file will be used during the build process.

## Security Considerations

### Firebase Configuration
- The Firebase API key and config values in `VITE_FIREBASE_*` are **safe to expose** in client-side code
- Firebase Security Rules protect your data, not obscuring the API key
- Your Firestore rules ensure users can only access their own data

### Best Practices
1. Always use Firestore Security Rules to protect data
2. The rules provided ensure users can only read/write their own data
3. Consider adding rate limiting in Firebase if you expect high traffic
4. Monitor Firebase usage in the Firebase Console

## Cost Considerations

Firebase has a **generous free tier** that should be sufficient for most use cases:

### Free Tier Limits (Spark Plan)
- **Authentication:** Unlimited users
- **Firestore:**
  - 1 GB storage
  - 50K reads/day
  - 20K writes/day
  - 20K deletes/day

### Estimated Usage Per User
- Storage: ~10 KB per user (vacation data is tiny)
- Writes: ~5-10 per day (when actively planning)
- Reads: ~10-20 per day (loading data across devices)

**Bottom line:** The free tier can support thousands of active users.

## Troubleshooting

### Cloud Sync Button Doesn't Appear
- Check that `.env.local` exists with valid Firebase config
- Restart the dev server after creating/modifying `.env.local`
- Check browser console for initialization errors

### Sign-In Popup Blocked
- Ensure your domain is added to Firebase authorized domains
- Check browser popup blocker settings

### Data Not Syncing
- Check browser console for errors
- Verify Firestore Security Rules are published
- Ensure user is signed in (check for sync indicator in header)
- Check Firebase Console > Firestore to see if data is being written

### "Firebase not configured" Message
- Verify environment variables are set correctly in `.env.local`
- Check that variable names start with `VITE_` prefix
- Restart dev server after adding environment variables

## Disabling Cloud Sync

To completely disable cloud sync:
1. Delete or rename `.env.local`
2. Restart the dev server
3. The cloud sync UI will not appear

The app will work exactly as before with localStorage only.

## Architecture

For technical details about how cloud sync is implemented, see [CLAUDE.md](./CLAUDE.md) which includes:
- Storage service architecture
- Hybrid localStorage + Firebase approach
- Real-time sync mechanism
- Offline-first design
