import { Injectable, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import {
  GoogleAuthProvider,
  User,
  browserLocalPersistence,
  getAuth,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  getDocFromServer,
  getFirestore,
} from 'firebase/firestore';
import { getFirebaseApp, hasFirebaseConfig } from '../firebase/firebase.config';

@Injectable({
  providedIn: 'root',
})
export class FirebaseAuthService {
  private readonly unauthorizedMessage =
    'Account non autorizzato. Contatta l’amministratore per l’abilitazione.';
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  private readonly userSignal = signal<User | null>(null);
  private readonly readySignal = signal(false);
  private readonly adminSignal = signal(false);
  private readonly collaboratorSignal = signal(false);
  private readonly authErrorSignal = signal('');

  readonly user = this.userSignal.asReadonly();
  readonly authError = this.authErrorSignal.asReadonly();
  readonly isReady = this.readySignal.asReadonly();
  readonly isLoggedIn = computed(() => !!this.userSignal());
  readonly isAdmin = computed(() => this.isLoggedIn() && this.adminSignal());
  readonly isCollaborator = computed(
    () => this.isLoggedIn() && this.collaboratorSignal(),
  );
  readonly isPrivileged = computed(
    () => this.isAdmin() || this.isCollaborator(),
  );

  constructor() {
    if (this.isBrowser) {
      this.authErrorSignal.set(sessionStorage.getItem('blu-auth-error') ?? '');
    }

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
        this.collaboratorSignal.set(false);
        this.readySignal.set(true);
        return;
      }

      this.adminSignal.set(false);
      this.collaboratorSignal.set(false);
      this.readySignal.set(false);
      void this.loadRoleState(user).then((isAuthorized) => {
        if (!isAuthorized) {
          void this.handleUnauthorizedAuthenticatedUser(auth);
        }
      });
    });
  }

  async signIn(email: string, password: string): Promise<void> {
    if (!hasFirebaseConfig() || !getFirebaseApp()) {
      throw new Error(
        'Firebase non configurato. Inserisci i dati in environment.ts',
      );
    }

    const auth = getAuth(getFirebaseApp()!);
    const normalizedEmail = email.trim().toLowerCase();
    await signInWithEmailAndPassword(auth, normalizedEmail, password);
  }

  async signInWithGoogle(): Promise<void> {
    if (!hasFirebaseConfig() || !getFirebaseApp()) {
      throw new Error(
        'Firebase non configurato. Inserisci i dati in environment.ts',
      );
    }

    this.clearAuthError();

    const auth = getAuth(getFirebaseApp()!);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    try {
      const credential = await signInWithPopup(auth, provider);
      const isAuthorized = await this.loadRoleState(credential.user);

      if (!isAuthorized) {
        await this.handleUnauthorizedAuthenticatedUser(auth);
        throw new Error(this.unauthorizedMessage);
      }
    } catch (error) {
      const code =
        typeof error === 'object' && error && 'code' in error
          ? String((error as { code?: unknown }).code)
          : '';

      // Fallback for browsers/environments that block OAuth popups.
      if (
        code === 'auth/popup-blocked' ||
        code === 'auth/operation-not-supported-in-this-environment'
      ) {
        await signInWithRedirect(auth, provider);
        return;
      }

      throw error;
    }
  }

  async signOut(): Promise<void> {
    if (!hasFirebaseConfig() || !getFirebaseApp()) {
      return;
    }

    this.adminSignal.set(false);
    this.collaboratorSignal.set(false);
    await signOut(getAuth(getFirebaseApp()!));
  }

  consumeAuthError(): string {
    const message = this.authErrorSignal();

    if (message) {
      this.clearAuthError();
    }

    return message;
  }

  private async loadRoleState(user: User): Promise<boolean> {
    if (!hasFirebaseConfig() || !getFirebaseApp()) {
      this.adminSignal.set(false);
      this.collaboratorSignal.set(false);
      this.readySignal.set(true);
      return false;
    }

    try {
      const firestore = getFirestore(getFirebaseApp()!);
      const userRoleRef = doc(firestore, 'users', user.uid);
      const userRoleSnapshot = await getDocFromServer(userRoleRef).catch(() =>
        getDoc(userRoleRef),
      );

      if (!userRoleSnapshot.exists()) {
        this.adminSignal.set(false);
        this.collaboratorSignal.set(false);
        return false;
      }

      const userRoleData = userRoleSnapshot.data() as { role?: unknown };
      const role = String(userRoleData.role ?? '')
        .trim()
        .toUpperCase();

      const isAdmin = role === 'ADMIN';
      const isCollaborator =
        role === 'COLLABORATORE' ||
        role === 'COLLABBORATORE' ||
        role === 'COLLABORATOR';

      this.adminSignal.set(isAdmin);
      this.collaboratorSignal.set(isCollaborator);
      return isAdmin || isCollaborator;
    } catch (error) {
      console.error('Impossibile verificare ruolo utente:', error);
      this.adminSignal.set(false);
      this.collaboratorSignal.set(false);
      return false;
    } finally {
      this.readySignal.set(true);
    }
  }

  private async handleUnauthorizedAuthenticatedUser(
    auth = getAuth(getFirebaseApp()!),
  ): Promise<void> {
    this.authErrorSignal.set(this.unauthorizedMessage);

    if (this.isBrowser) {
      sessionStorage.setItem('blu-auth-error', this.unauthorizedMessage);
    }

    this.userSignal.set(null);
    this.adminSignal.set(false);
    this.collaboratorSignal.set(false);
    await signOut(auth);
  }

  private clearAuthError(): void {
    this.authErrorSignal.set('');

    if (this.isBrowser) {
      sessionStorage.removeItem('blu-auth-error');
    }
  }
}
