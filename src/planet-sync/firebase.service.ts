import * as admin from 'firebase-admin';

var serviceAccountString = Buffer.from(process.env.FIRESTORE_READ_SERVICEACCOUNT, 'base64').toString();

export const firebaseApp = admin.initializeApp({
  projectId: 'eduedu-escola-hub---stg',
  storageBucket: 'eduedu-escola-hub---stg.appspot.com',
  credential: admin.credential.cert(JSON.parse(serviceAccountString) as admin.ServiceAccount),
});
