const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, deleteDoc } = require('firebase/firestore');

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

async function clearAnnouncements() {
  console.log("Starting deletion of announcements...");
  try {
    const docsRef = collection(db, 'announcements');
    const querySnapshot = await getDocs(docsRef);
    
    console.log(`Found ${querySnapshot.size} announcements to delete.`);
    
    for (const document of querySnapshot.docs) {
      console.log(`Deleting: ${document.id}`);
      await deleteDoc(document.ref);
    }
    
    console.log("Deletion completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error during deletion:", error);
    process.exit(1);
  }
}

clearAnnouncements();
