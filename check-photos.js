const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, limit } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyBzKa1lWa6aS769lnnG2IECrq6ldIhS9Ts",
  authDomain: "ktp-skk.firebaseapp.com",
  projectId: "ktp-skk"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkPhotos() {
  const docsRef = collection(db, 'photos');
  const q = query(docsRef, limit(10));
  const snap = await getDocs(q);
  snap.forEach(d => console.log(d.id, d.data().title, d.data().imageUrl));
  process.exit(0);
}
checkPhotos();
