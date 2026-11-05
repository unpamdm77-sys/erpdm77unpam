import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
  User
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App safely (singleton)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

// Configure Google Auth Provider with Google Sheets and Google Drive Scopes
const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/spreadsheets');
provider.addScope('https://www.googleapis.com/auth/drive');
provider.addScope('https://www.googleapis.com/auth/drive.file');
provider.setCustomParameters({
  prompt: 'select_account'
});

// Flag to track sign-in in progress
let isSigningIn = false;

// In-memory token cache (Do NOT store in localStorage per security instructions)
let cachedAccessToken: string | null = null;

/**
 * Initialize auth listener on application start
 */
export const initGoogleAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user && cachedAccessToken) {
      if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
    } else if (user && !cachedAccessToken && !isSigningIn) {
      // User is signed in with Firebase, but accessToken was in-memory and lost on page reload.
      // We will notify failure or trigger re-auth when needed.
      if (onAuthFailure) onAuthFailure();
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

/**
 * Trigger Google Sign In popup with Google Drive & Sheets scopes
 */
export const googleSignIn = async (): Promise<{ user: User; accessToken: string }> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);

    if (!credential?.accessToken) {
      throw new Error('Gagal memperoleh akses token Google dari Firebase Auth');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google Sign In Error:', error);
    if (error?.code === 'auth/unauthorized-domain') {
      const currentDomain = typeof window !== 'undefined' ? window.location.hostname : 'domain aplikasi';
      throw new Error(`Domain '${currentDomain}' belum didaftarkan di Authorized Domains Firebase Authentication project gen-lang-client-0989370800.`);
    }
    throw error;
  } finally {
    isSigningIn = false;
  }
};

/**
 * Get the in-memory cached Google Access Token
 */
export const getGoogleAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

/**
 * Manually update cached access token if acquired
 */
export const setCachedGoogleToken = (token: string | null) => {
  cachedAccessToken = token;
};

/**
 * Sign out from Google Auth
 */
export const googleSignOut = async (): Promise<void> => {
  await signOut(auth);
  cachedAccessToken = null;
};
