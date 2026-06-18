const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, setDoc, deleteDoc, doc, query, where, writeBatch } = require('firebase/firestore');

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
const db = getFirestore(app);

async function migrate() {
  console.log("Starting migration...");
  try {
    const docsRef = collection(db, 'documents');
    const q = query(docsRef, where('category', '==', 'Mipui Aw'));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log("No Mipui Aw documents found in 'documents' collection. Checking if there are ANY documents in 'documents' collection just in case...");
      const allDocs = await getDocs(docsRef);
      console.log(`Found ${allDocs.size} total docs in 'documents' collection.`);
      allDocs.forEach(d => {
         console.log(d.id, "=>", d.data().title, d.data().category);
      });
      return;
    }

    console.log(`Found ${querySnapshot.size} Mipui Aw documents to migrate.`);
    
    // Instead of doing a batch, we'll do individual writes to ensure they work
    for (const document of querySnapshot.docs) {
      const data = document.data();
      console.log(`Migrating: ${data.title}`);
      
      const newRef = doc(db, 'mipuiaw', document.id);
      await setDoc(newRef, data);
      await deleteDoc(document.ref);
    }
    
    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("Error during migration:", error);
  }
}

migrate();
