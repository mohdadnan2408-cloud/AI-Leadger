import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import {
  auth,
  db,
  googleAuthProvider,
  handleFirestoreError,
  OperationType,
} from '../lib/firebase';
import { ALLOWED_CURRENCIES, CurrencyCode, DEFAULT_CATEGORIES, UserProfile } from '../types/ledger';

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  authReady: boolean;
  authError: string | null;
  signingIn: boolean;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  setCurrencyPreference: (currency: CurrencyCode) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [signingIn, setSigningIn] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setAuthError(null);

      if (!firebaseUser) {
        setProfile(null);
        setAuthReady(true);
        return;
      }

      try {
        const userRef = doc(db, 'users', firebaseUser.uid);
        let userSnap;
        try {
          userSnap = await getDoc(userRef);
        } catch (err) {
          handleFirestoreError(err, OperationType.GET, `users/${firebaseUser.uid}`);
        }

        if (userSnap && userSnap.exists()) {
          const data = userSnap.data() as UserProfile;
          const safeCurrency = ALLOWED_CURRENCIES.includes(data.currency) ? data.currency : 'USD';
          setProfile({ ...data, currency: safeCurrency });
        } else {
          const displayName = (firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Member').slice(0, 80);
          const newProfile: UserProfile = {
            uid: firebaseUser.uid,
            displayName,
            currency: 'USD',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };
          try {
            await setDoc(userRef, newProfile);
          } catch (err) {
            handleFirestoreError(err, OperationType.CREATE, `users/${firebaseUser.uid}`);
          }
          setProfile({
            uid: firebaseUser.uid,
            displayName,
            currency: 'USD',
          });
        }

        // Seed starter categories only if the user has zero categories yet
        const catsQuery = query(
          collection(db, 'categories'),
          where('userId', '==', firebaseUser.uid)
        );
        let existingCatsSnap;
        try {
          existingCatsSnap = await getDocs(catsQuery);
        } catch (err) {
          handleFirestoreError(err, OperationType.LIST, 'categories');
        }

        if (existingCatsSnap && existingCatsSnap.empty) {
          const batch = writeBatch(db);
          for (const seed of DEFAULT_CATEGORIES) {
            const catId = `${firebaseUser.uid.slice(0, 16)}_${seed.idSuffix}`;
            const catRef = doc(db, 'categories', catId);
            batch.set(catRef, {
              userId: firebaseUser.uid,
              name: seed.name,
              type: seed.type,
              color: seed.color,
              monthlyBudget: seed.monthlyBudget,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          }
          try {
            await batch.commit();
          } catch (err) {
            handleFirestoreError(err, OperationType.WRITE, 'categories');
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        setAuthError('Unable to initialize your ledger profile. Please try signing in again.');
      } finally {
        setAuthReady(true);
      }
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    setSigningIn(true);
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleAuthProvider);
    } catch (err: unknown) {
      const code =
        typeof err === 'object' && err !== null && 'code' in err
          ? String((err as { code?: unknown }).code)
          : '';
      if (code === 'auth/unauthorized-domain') {
        const host = typeof window !== 'undefined' ? window.location.hostname : 'this domain';
        const projectId = auth.app.options.projectId || 'your Firebase project';
        setAuthError(
          `Domain "${host}" is not authorized for Google Sign-In. Add "${host}" in Firebase Console → Project "${projectId}" → Authentication → Settings → Authorized domains.`
        );
      } else if (code === 'auth/popup-blocked') {
        setAuthError(
          'Your browser blocked the Google Sign-In popup. Please allow popups for this site and try again.'
        );
      } else if (code === 'auth/popup-closed-by-user') {
        setAuthError('Sign-in was cancelled before completing authentication.');
      } else {
        const message =
          err instanceof Error ? err.message : 'Unable to complete Google sign-in.';
        setAuthError(message);
      }
    } finally {
      setSigningIn(false);
    }
  };

  const signOutUser = async () => {
    setAuthError(null);
    await signOut(auth);
  };

  const setCurrencyPreference = async (currency: CurrencyCode) => {
    if (!user || !profile) return;
    const userRef = doc(db, 'users', user.uid);
    try {
      await setDoc(
        userRef,
        {
          uid: user.uid,
          displayName: profile.displayName,
          currency,
          createdAt: profile.createdAt || serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      setProfile((prev) => (prev ? { ...prev, currency } : prev));
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        authReady,
        authError,
        signingIn,
        signInWithGoogle,
        signOutUser,
        setCurrencyPreference,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
