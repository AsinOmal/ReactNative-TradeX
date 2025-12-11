import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp } from 'firebase/app';
import { getAuth, getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { Platform } from 'react-native';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDkRlRmjnAg9ygbA_Qm2f_XFWLA4fnxUqo",
  authDomain: "trading-pnl-tracker-13686.firebaseapp.com",
  projectId: "trading-pnl-tracker-13686",
  storageBucket: "trading-pnl-tracker-13686.firebasestorage.app",
  messagingSenderId: "910150341676",
  appId: "1:910150341676:web:388a90ec578e12e5ae2d89"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with React Native persistence
let auth;
if (Platform.OS === 'web') {
  auth = getAuth(app);
} else {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
}

// Initialize Firestore
const db = getFirestore(app);

export { app, auth, db };
