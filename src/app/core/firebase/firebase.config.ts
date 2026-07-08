import {
  FirebaseApp,
  FirebaseOptions,
  getApp,
  getApps,
  initializeApp,
} from 'firebase/app';
import { environment } from '../../../environments/environment';

function getFirebaseConfig(): FirebaseOptions | null {
  const config = environment.firebase;

  if (
    !config?.apiKey ||
    !config?.authDomain ||
    !config?.projectId ||
    !config?.storageBucket ||
    !config?.messagingSenderId ||
    !config?.appId
  ) {
    return null;
  }

  return config;
}

export function hasFirebaseConfig(): boolean {
  return getFirebaseConfig() !== null;
}

export function getFirebaseApp(): FirebaseApp | null {
  const config = getFirebaseConfig();

  if (!config) {
    return null;
  }

  return getApps().length ? getApp() : initializeApp(config);
}
