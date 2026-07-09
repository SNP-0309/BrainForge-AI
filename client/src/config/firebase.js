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

const firebaseConfig = {
  apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Enforce real Firebase Authentication setup (no mock fallbacks)
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
const githubProvider = new GithubAuthProvider();
const isMockAuth = false;

export const loginWithEmailAndPassword = async (email, password) => {
  return signInWithEmailAndPassword(auth, email, password);
};

export const registerWithEmail = async (name, email, password) => {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(credential.user, { displayName: name });
  return credential;
};

export const loginWithGoogle = async () => {
  return signInWithPopup(auth, googleProvider);
};

export const loginWithGithub = async () => {
  return signInWithPopup(auth, githubProvider);
};

export const logoutUser = async () => {
  return signOut(auth);
};

export const onAuthChanged = (callback) => {
  return onAuthStateChanged(auth, callback);
};

export { auth, googleProvider, githubProvider, isMockAuth };
