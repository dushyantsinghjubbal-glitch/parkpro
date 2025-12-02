import { initializeApp, getApp, getApps, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getAuth, type Auth } from 'firebase/auth';
import { firebaseConfig } from './config';

type FirebaseServerServices = {
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
};

let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const firestore = getFirestore(app);
const auth = getAuth(app);

export function initializeServerApp(): FirebaseServerServices {
  return {
    firebaseApp: app,
    firestore,
    auth,
  };
}
