const { initializeApp } = require('firebase/app');
const { getAuth } = require('firebase/auth');
const { initializeApp: initAdmin } = require('firebase-admin/app');
const { getAuth: getAdminAuth } = require('firebase-admin/auth');

initAdmin({ projectId: "saikhamakawnktp-67519" });

async function run() {
  try {
    const listUsersResult = await getAdminAuth().listUsers(1000);
    listUsersResult.users.forEach((userRecord) => {
      console.log('user', userRecord.toJSON());
    });
  } catch (error) {
    console.log('Error listing users:', error);
  }
}
run();
