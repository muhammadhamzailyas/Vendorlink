const admin = require("firebase-admin");

let initialized = false;

const getPrivateKey = () => {
  const raw = process.env.FIREBASE_PRIVATE_KEY || "";
  return raw.replace(/\\n/g, "\n");
};

const initializeFirebaseAdmin = () => {
  if (initialized || admin.apps.length) {
    initialized = true;
    return admin;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = getPrivateKey();

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("Firebase Admin is not configured");
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });

  initialized = true;
  return admin;
};

const verifyFirebaseIdToken = async (idToken) => {
  const sdk = initializeFirebaseAdmin();
  return sdk.auth().verifyIdToken(idToken);
};

module.exports = {
  verifyFirebaseIdToken,
};
