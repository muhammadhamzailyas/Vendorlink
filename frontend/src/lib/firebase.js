import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  sendEmailVerification,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

googleProvider.setCustomParameters({ prompt: "select_account" });

export const setupRecaptcha = (containerId) => {
  if (!auth) return null;
  return new RecaptchaVerifier(auth, containerId, {
    size: "invisible",
  });
};

export const createFirebaseUser = async (email, password) => {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  await sendEmailVerification(result.user);
  return result.user;
};

export const signInFirebase = async (email, password) => {
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
};

/**
 * Helper to get the current Firebase ID Token.
 * Waits for Auth to initialize if it's currently null.
 */
export const getFirebaseIdToken = async (forceRefresh = false) => {
  // If user is already available, get token immediately
  if (auth.currentUser) {
    return auth.currentUser.getIdToken(forceRefresh);
  }

  // Otherwise, wait for the first auth state change (with a timeout)
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      unsubscribe();
      resolve(null);
    }, 5000); // 5s timeout

    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      clearTimeout(timeout);
      unsubscribe();
      if (user) {
        const token = await user.getIdToken(forceRefresh);
        resolve(token);
      } else {
        resolve(null);
      }
    });
  });
};

export const signInWithGoogle = async () => {
  const result = await signInWithPopup(auth, googleProvider);
  const credential = GoogleAuthProvider.credentialFromResult(result);
  const idToken = credential?.idToken || "";
  return { user: result.user, idToken };
};

export const signOutFirebase = async () => {
  await firebaseSignOut(auth);
};

export const sendPasswordReset = async (email) => {
  return await sendPasswordResetEmail(auth, email);
};

export const isFirebaseConfigured = () => {
  return Boolean(
    firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.appId
  );
};

export { auth, signInWithPhoneNumber };
