// Import necessary functions from Firebase SDKs
import { initializeApp, getApps, getApp } from "firebase/app"; // Firebase App initialization
import { getFirestore } from "firebase/firestore"; // Firestore for database operations
import { getAnalytics } from "firebase/analytics"; // Firebase Analytics for app analytics

// Firebase configuration object
// These values are sourced from environment variables for security and flexibility.
// Ensure the values are defined in a .env file or environment configuration.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY, // API Key for Firebase services
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN, // Auth domain for Firebase Authentication
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID, // Project ID for the Firebase project
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET, // Storage bucket for Firebase Storage
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID, // Messaging sender ID for Firebase Cloud Messaging
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID, // App ID for identifying the Firebase app
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID, // Measurement ID for Firebase Analytics
};

// Initialize Firebase App
// Use the Singleton pattern to ensure that the Firebase app is initialized only once.
// If an app instance already exists, retrieve it using `getApp()`.
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore for database operations
// Firestore is used to store and retrieve application data.
const firestore = getFirestore(app);

// Initialize Firebase Analytics (only in browser environments)
// Analytics is optional and only available in client-side code.
const analytics = typeof window !== "undefined" ? getAnalytics(app) : null;

// Export Firebase instances for use throughout the application
export { app, firestore, analytics };