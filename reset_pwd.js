const admin = require('firebase-admin');

// Initialize with application default credentials or explicit json
const serviceAccount = require('./serviceAccountKey.json'); 

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

admin.auth().updateUser('8Arjaiwl7ocGWxtcL6rcgtCYqoA2', {
  password: 'AdminPassword123!'
})
  .then((userRecord) => {
    console.log('Successfully updated user', userRecord.toJSON());
    process.exit(0);
  })
  .catch((error) => {
    console.log('Error updating user:', error);
    process.exit(1);
  });
