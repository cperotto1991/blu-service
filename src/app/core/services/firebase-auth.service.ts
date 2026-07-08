import { Injectable, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import {
  User,
  browserLocalPersistence,
  getAuth,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  getDocFromServer,
  getFirestore,
} from 'firebase/firestore';
import { getFirebaseApp, hasFirebaseConfig } from '../firebase/firebase.config';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class FirebaseAuthService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  private readonly userSignal = signal<User | null>(null);
  private readonly readySignal = signal(false);
  private readonly adminSignal = signal(false);
  private readonly adminEmails = (environment.adminEmails ?? []).map((email) =>
    email.toLowerCase().trim(),
  );

  readonly user = this.userSignal.asReadonly();
  readonly isReady = this.readySignal.asReadonly();
  readonly isLoggedIn = computed(() => !!this.userSignal());
  readonly isAdmin = computed(() => this.isLoggedIn() && this.adminSignal());

  constructor() {
    if (!this.isBrowser || !hasFirebaseConfig() || !getFirebaseApp()) {
      this.readySignal.set(true);
      return;
    }

    const auth = getAuth(getFirebaseApp()!);
    void setPersistence(auth, browserLocalPersistence).catch(() => undefined);

    onAuthStateChanged(auth, (user) => {
      this.userSignal.set(user);

      if (!user) {
        this.adminSignal.set(false);
        this.readySignal.set(true);
        return;
      }

      this.adminSignal.set(false);
      this.readySignal.set(false);
      void this.loadAdminState(user);
    });
  }

  async signIn(email: string, password: string): Promise<void> {
    if (!hasFirebaseConfig() || !getFirebaseApp()) {
      throw new Error(
        'Firebase non configurato. Inserisci i dati in environment.ts',
      );
    }

    const auth = getAuth(getFirebaseApp()!);
    await signInWithEmailAndPassword(auth, email, password);
  }

  async signOut(): Promise<void> {
    if (!hasFirebaseConfig() || !getFirebaseApp()) {
      return;
    }

    this.adminSignal.set(false);
    await signOut(getAuth(getFirebaseApp()!));
  }

  private async loadAdminState(user: User): Promise<void> {
    if (!hasFirebaseConfig() || !getFirebaseApp()) {
      this.adminSignal.set(false);
      this.readySignal.set(true);
      return;
    }

    const userEmail = user.email?.toLowerCase().trim();
    if (userEmail && this.adminEmails.includes(userEmail)) {
      this.adminSignal.set(true);
      this.readySignal.set(true);
      return;
    }

    try {
      const firestore = getFirestore(getFirebaseApp()!);
      const adminRef = doc(firestore, 'admins', user.uid);
      const adminSnapshot = await getDocFromServer(adminRef).catch(() =>
        getDoc(adminRef),
      );
      this.adminSignal.set(adminSnapshot.exists());
    } catch (error) {
      console.error('Impossibile verificare ruolo admin:', error);
      this.adminSignal.set(false);
    } finally {
      this.readySignal.set(true);
    }
  }
}
