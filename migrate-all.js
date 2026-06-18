const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, collection, getDocs, setDoc, deleteDoc, doc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyBzKa1lWa6aS769lnnG2IECrq6ldIhS9Ts",
  authDomain: "ktp-skk.firebaseapp.com",
  projectId: "ktp-skk",
  storageBucket: "ktp-skk.firebasestorage.app",
  messagingSenderId: "437184405719",
  appId: "1:437184405719:web:d3c4823aa85cc191cc9092",
  measurementId: "G-JB6DGBKJX3"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function migrate() {
  console.log("Authenticating as Admin...");
  try {
    await signInWithEmailAndPassword(auth, 'admin_v3@ktpsaikhamakawn.org', 'admin123');
    console.log("Authentication successful! Starting full migration of all documents to mipuiaw...");
    
    const docsRef = collection(db, 'documents');
    const querySnapshot = await getDocs(docsRef);
    
    if (querySnapshot.empty) {
      console.log("No documents found in 'documents' collection.");
      process.exit(0);
    }

    console.log(`Found ${querySnapshot.size} documents to migrate.`);
    
    for (const document of querySnapshot.docs) {
      const data = document.data();
      // Only move if it looks like a Mipui Aw (categories: 2025, 2026, or Mipui Aw)
      // Actually we determined ALL 75 documents are Mipui Aw
      data.category = 'Mipui Aw'; // Standardize the category!
      console.log(`Migrating: ${data.title}`);
      
      const newRef = doc(db, 'mipuiaw', document.id);
      await setDoc(newRef, data);
      await deleteDoc(document.ref);
    }
    
    console.log("Migration completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error during migration:", error);
    process.exit(1);
  }
}

migrate();
