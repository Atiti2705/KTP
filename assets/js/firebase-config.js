/* ============================================
   KṬP Saikhamakawn — Firebase Config & Init
   ============================================ */

const firebaseConfig = {
  apiKey: "AIzaSyBzKa1lWa6aS769lnnG2IECrq6ldIhS9Ts",
  authDomain: "ktp-skk.firebaseapp.com",
  projectId: "ktp-skk",
  storageBucket: "ktp-skk.firebasestorage.app",
  messagingSenderId: "437184405719",
  appId: "1:437184405719:web:d3c4823aa85cc191cc9092",
  measurementId: "G-JB6DGBKJX3"
};

// Google Drive API Key for folder imports
const googleDriveApiKey = "AIzaSyAXV2QBWS3K8YUR7eFtE1jN07jCJohJvCo";

let db = null;
let auth = null;
let firebaseApp = null;
let isFirebaseConfigured = false;

// Detect if credentials have been replaced with real values
if (typeof firebase !== 'undefined' && firebaseConfig.apiKey && firebaseConfig.apiKey !== "YOUR_API_KEY_HERE" && !firebaseConfig.apiKey.includes("YOUR_")) {
  try {
    firebaseApp = firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
    auth = firebase.auth();
    isFirebaseConfigured = true;
    console.log("🔥 Firebase initialized successfully!");
  } catch (error) {
    console.error("❌ Error initializing Firebase:", error);
  }
}

// Export for global access
const FirebaseConfig = {
  isConfigured: isFirebaseConfigured,
  config: firebaseConfig,
  app: firebaseApp,
  db: db,
  auth: auth
};
