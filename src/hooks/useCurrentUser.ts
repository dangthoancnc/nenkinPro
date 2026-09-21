'use client';

import { useState, useEffect } from 'react';

export type UserRole = 'ADMIN' | 'MANAGER' | 'COLLABORATOR';

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  staffCode?: string | null;
}

let cachedUser: CurrentUser | null = null;
let cachedPromise: Promise<CurrentUser | null> | null = null;
const listeners = new Set<(user: CurrentUser | null) => void>();

async function fetchUser(): Promise<CurrentUser | null> {
  if (cachedUser) return cachedUser;
  if (cachedPromise) return cachedPromise;

  cachedPromise = fetch('/api/auth/employee/me')
    .then(async (res) => {
      if (!res.ok) return null;
      const data = await res.json();
      if (data.success && data.user) {
        cachedUser = data.user as CurrentUser;
        listeners.forEach(cb => cb(cachedUser));
        return cachedUser;
      }
      return null;
    })
    .catch((err) => {
      console.error('Error in useCurrentUser fetch:', err);
      return null;
    })
    .finally(() => {
      cachedPromise = null;
    });

  return cachedPromise;
}

export function useCurrentUser() {
  const [user, setUser] = useState<CurrentUser | null>(cachedUser);
  const [loading, setLoading] = useState<boolean>(!cachedUser);

  useEffect(() => {
    let mounted = true;

    const listener = (u: CurrentUser | null) => {
      if (mounted) {
        setUser(u);
        setLoading(false);
      }
    };
    listeners.add(listener);

    if (!cachedUser) {
      setLoading(true);
      fetchUser().then((u) => {
        if (mounted) {
          setUser(u);
          setLoading(false);
        }
      });
    } else {
      setLoading(false);
    }

    return () => {
      mounted = false;
      listeners.delete(listener);
    };
  }, []);

  const mutate = async () => {
    cachedUser = null;
    cachedPromise = null;
    setLoading(true);
    const updated = await fetchUser();
    setUser(updated);
    setLoading(false);
  };

  const role = user?.role || null;
  const isAdmin = role === 'ADMIN';
  const isManager = role === 'MANAGER';
  const isCollaborator = role === 'COLLABORATOR';

  return {
    user,
    loading,
    isLoading: loading,
    role,
    isAdmin,
    isManager,
    isCollaborator,
    mutate,
  };
}
