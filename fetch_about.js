const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

const firebaseConfig = {
  projectId: "saikhamakawnktp-67519",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
  const snapshot = await getDocs(collection(db, 'About'));
  snapshot.forEach(doc => console.log(doc.id, '=>', doc.data()));
}
run();
