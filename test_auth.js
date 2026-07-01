const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword } = require('firebase/auth');

const firebaseConfig = {
  apiKey: "AIzaSyCjAtBVv3rxinMWomrXhlD3bvorEoEwYqQ",
  authDomain: "saikhamakawnktp-67519.firebaseapp.com",
  projectId: "saikhamakawnktp-67519",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

async function run() {
  try {
    await createUserWithEmailAndPassword(auth, 'test_check@ktpsaikhamakawn.org', 'test1234');
    console.log("SUCCESS");
  } catch (err) {
    console.error("ERROR:", err.code, err.message);
  }
  process.exit(0);
}
run();
