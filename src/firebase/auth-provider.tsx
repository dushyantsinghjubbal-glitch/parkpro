'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useUser } from './provider';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getFirebaseClient } from '@/firebase';

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const { firestore } = getFirebaseClient();

  useEffect(() => {
    if (isUserLoading) {
      return; // Wait for user status to be determined
    }

    const isAuthPage = pathname === '/';

    if (user && !isAuthPage) {
        // Ensure user profile exists
        const userRef = doc(firestore, 'users', user.uid);
        getDoc(userRef).then(docSnap => {
            if (!docSnap.exists()) {
                // Create profile if it doesn't exist
                const role = user.email === 'admin@parkpro.com' ? 'admin' : 'staff';
                setDoc(userRef, {
                    id: user.uid,
                    email: user.email,
                    role: role,
                });
            }
        });
    }

    if (!user && !isAuthPage) {
      // If user is not logged in and not on an auth page, redirect to login
      router.push('/');
    } else if (user && isAuthPage) {
      // If user is logged in and on an auth page, redirect to dashboard
      router.push('/dashboard');
    }
  }, [user, isUserLoading, router, pathname, firestore]);
  
  return <>{children}</>;
}
