import * as admin from 'firebase-admin';

export const firebaseApp = admin.initializeApp({
  projectId: 'eduedu-escola-hub---stg',
  storageBucket: 'eduedu-escola-hub---stg.appspot.com',
  credential: admin.credential.cert(JSON.parse(process.env.FIRESTORE_READ_SERVICEACCOUNT) as admin.ServiceAccount),
});
