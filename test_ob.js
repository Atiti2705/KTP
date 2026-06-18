const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

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

async function run() {
  const querySnapshot = await getDocs(collection(db, 'ob_members'));
  querySnapshot.forEach((doc) => {
    console.log(doc.id, " => ", doc.data());
  });
  process.exit(0);
}
run();
