const admin = require('firebase-admin');
const path = require('path');

require('dotenv').config({
  path: path.join(__dirname, '..', '.env'),
});

function getCredential() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    return admin.credential.cert(
      JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON),
    );
  }

  const keyPath =
    process.env.GOOGLE_APPLICATION_CREDENTIALS ||
    path.join(__dirname, '..', 'serviceAccountKey.json');

  return admin.credential.cert(require(path.resolve(keyPath)));
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: getCredential(),
  });
}

module.exports = admin;
