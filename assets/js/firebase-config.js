/* ============================================
   KṬP Saikhamakawn — Firebase Config & Init
   ============================================ */

let customSettings = null;
try {
  const stored = localStorage.getItem('db_settings');
  if (stored) {
    customSettings = JSON.parse(stored);
  }
} catch (e) {
  console.warn("Could not read custom settings from localStorage", e);
}

const customFirebaseConfig = customSettings?.apiKeys?.firebaseConfig || {};

const firebaseConfig = {
  apiKey: customFirebaseConfig.apiKey || "AIzaSyCjAtBVv3rxinMWomrXhlD3bvorEoEwYqQ",
  authDomain: customFirebaseConfig.authDomain || "saikhamakawnktp-67519.firebaseapp.com",
  projectId: customFirebaseConfig.projectId || "saikhamakawnktp-67519",
  storageBucket: customFirebaseConfig.storageBucket || "saikhamakawnktp-67519.firebasestorage.app",
  messagingSenderId: customFirebaseConfig.messagingSenderId || "1070032910802",
  appId: customFirebaseConfig.appId || "1:1070032910802:web:ed6370c2492102d03a300b",
  measurementId: customFirebaseConfig.measurementId || "G-K2Y01XTWY8"
};

// Google Drive API Key for folder imports
const googleDriveApiKey = customSettings?.apiKeys?.googleDriveApiKey || "AIzaSyDCwWaSh_RsIW94JkE6rjW2qi1uP8waj2c";

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
