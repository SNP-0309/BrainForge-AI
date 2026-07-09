import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  GithubAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';

const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;

let app;
let auth;
let googleProvider;
let githubProvider;
let isMockAuth = false;

// Determine if we should run in mock mode
const isInvalidKey = !apiKey || apiKey === 'your_firebase_api_key' || apiKey.startsWith('mock-');

if (isInvalidKey) {
  console.warn('Firebase API key is missing or placeholder. Running in Mock Auth Mode.');
  isMockAuth = true;
  googleProvider = {};
  githubProvider = {};
  auth = {
    currentUser: null,
  };
} else {
  const firebaseConfig = {
    apiKey,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  };

  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
    githubProvider = new GithubAuthProvider();
  } catch (err) {
    console.error('Firebase initialization failed. Falling back to Mock Auth Mode.', err);
    isMockAuth = true;
    auth = {
      currentUser: null,
    };
  }
}

// Global active auth listener callback for mock mode
let mockAuthCallback = null;

// High-level Unified Auth Wrappers
export const loginWithEmailAndPassword = async (email, password) => {
  if (isMockAuth) {
    // Determine mock role based on email keyword
    const role = email.includes('teacher') ? 'teacher' : (email.includes('admin') ? 'admin' : 'student');
    const username = email.split('@')[0];
    const mockToken = `mock-${role}-${username}`;
    const mockUser = {
      uid: `mock-${role}-${username}-uid`,
      email,
      displayName: `Mock ${username}`,
      role,
      getIdToken: async () => mockToken,
    };

    localStorage.setItem('mock_user', JSON.stringify(mockUser));
    localStorage.setItem('mock_token', mockToken);
    auth.currentUser = mockUser;

    if (mockAuthCallback) {
      mockAuthCallback(mockUser);
    }
    return { user: mockUser };
  }

  return signInWithEmailAndPassword(auth, email, password);
};

export const registerWithEmail = async (name, email, password) => {
  if (isMockAuth) {
    const role = email.includes('teacher') ? 'teacher' : (email.includes('admin') ? 'admin' : 'student');
    const username = email.split('@')[0];
    const mockToken = `mock-${role}-${username}`;
    const mockUser = {
      uid: `mock-${role}-${username}-uid`,
      email,
      displayName: name || `Mock ${username}`,
      role,
      getIdToken: async () => mockToken,
    };

    localStorage.setItem('mock_user', JSON.stringify(mockUser));
    localStorage.setItem('mock_token', mockToken);
    auth.currentUser = mockUser;

    if (mockAuthCallback) {
      mockAuthCallback(mockUser);
    }
    return { user: mockUser };
  }

  const credential = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(credential.user, { displayName: name });
  return credential;
};

export const loginWithGoogle = async () => {
  if (isMockAuth) {
    return loginWithEmailAndPassword('google-student@example.com', 'password123');
  }
  return signInWithPopup(auth, googleProvider);
};

export const loginWithGithub = async () => {
  if (isMockAuth) {
    return loginWithEmailAndPassword('github-student@example.com', 'password123');
  }
  return signInWithPopup(auth, githubProvider);
};

export const logoutUser = async () => {
  if (isMockAuth) {
    localStorage.removeItem('mock_user');
    localStorage.removeItem('mock_token');
    auth.currentUser = null;
    if (mockAuthCallback) {
      mockAuthCallback(null);
    }
    return Promise.resolve();
  }
  return signOut(auth);
};

export const onAuthChanged = (callback) => {
  if (isMockAuth) {
    mockAuthCallback = callback;
    const mockUserStr = localStorage.getItem('mock_user');
    if (mockUserStr) {
      try {
        const mockUser = JSON.parse(mockUserStr);
        // Bind mock function to return token
        mockUser.getIdToken = async () => localStorage.getItem('mock_token') || '';
        auth.currentUser = mockUser;
        callback(mockUser);
      } catch {
        callback(null);
      }
    } else {
      callback(null);
    }
    return () => {
      mockAuthCallback = null;
    };
  }

  return onAuthStateChanged(auth, callback);
};

export { auth, googleProvider, githubProvider, isMockAuth };
