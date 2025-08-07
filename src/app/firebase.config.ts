// src/app/core/firebase.config.ts
import { initializeApp } from 'firebase/app';
import { browserLocalPersistence, getAuth, setPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
// import { getStorage } from 'firebase/storage';
import { environment } from '../environment';

// Initialize Firebase
const app = initializeApp(environment.firebaseConfig);

// Export services
export const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence); // keep user logged in on refresh
export const db = getFirestore(app);
// export const storage = getStorage(app);
