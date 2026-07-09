import { useEffect } from 'react';
import { onAuthChanged } from '../config/firebase';
import { useAuthStore } from '../store/authStore';
import api from '../config/api';

export const useAuth = () => {
  const { user, firebaseUser, loading, setFirebaseUser, setUser, setLoading, clearAuth } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthChanged(async (fbUser) => {
      if (fbUser) {
        setFirebaseUser(fbUser);
        try {
          // Sync user with our MongoDB backend
          const res = await api.post('/auth/sync');
          setUser(res.data.data.user);
        } catch (err) {
          console.error('Backend sync failed:', err.message);
          setUser(null);
        }
      } else {
        clearAuth();
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { user, firebaseUser, loading };
};
