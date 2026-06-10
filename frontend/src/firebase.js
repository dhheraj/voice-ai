import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyCcot06RDbZ_YuOhj9vQdZtpyw4-8YQ0Rg',
  authDomain: 'talki-talki.firebaseapp.com',
  projectId: 'talki-talki',
  storageBucket: 'talki-talki.firebasestorage.app',
  messagingSenderId: '857371434116',
  appId: '1:857371434116:web:493fd7d6737690f08fb6d1',
  measurementId: 'G-WFS164VCYB',
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('profile');
googleProvider.addScope('email');

const firebaseReady = true;

export {
  auth,
  googleProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged,
  firebaseReady,
};
