import * as admin from 'firebase-admin';
import * as serviceAccount from './service-account.json';

export const firebaseApp = admin.initializeApp({
  projectId: 'eduedu-escola-hub---stg',
  storageBucket: 'eduedu-escola-hub---stg.appspot.com',
  credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
});
