import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { ref, set, get } from 'firebase/database';
import { auth, googleProvider, db } from '../firebase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const snap = await get(ref(db, `users/${firebaseUser.uid}`));
        if (snap.exists()) {
          setProfile(snap.val());
        } else {
          // First login — create profile
          const newProfile = {
            uid: firebaseUser.uid,
            name: firebaseUser.displayName || 'Joueur',
            email: firebaseUser.email,
            photoURL: firebaseUser.photoURL || null,
            aftNumber: null,
            aftRanking: null,
            club: null,
            createdAt: Date.now(),
          };
          await set(ref(db, `users/${firebaseUser.uid}`), newProfile);
          setProfile(newProfile);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  async function loginWithGoogle() {
    await signInWithPopup(auth, googleProvider);
  }

  async function logout() {
    await signOut(auth);
  }

  async function updateProfile(updates) {
    if (!user) return;
    await set(ref(db, `users/${user.uid}`), { ...profile, ...updates });
    setProfile(prev => ({ ...prev, ...updates }));
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, loginWithGoogle, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
