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

const STORAGE_KEY = 'nenkin_current_user_cache';

let cachedUser: CurrentUser | null = null;
let cachedPromise: Promise<CurrentUser | null> | null = null;
const listeners = new Set<(user: CurrentUser | null) => void>();

function getStoredUser(): CurrentUser | null {
  if (typeof window === 'undefined') return null;
  if (cachedUser) return cachedUser;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      cachedUser = JSON.parse(raw);
      return cachedUser;
    }
  } catch (e) {
    // ignore
  }
  return null;
}

async function fetchUser(): Promise<CurrentUser | null> {
  if (cachedPromise) return cachedPromise;

  cachedPromise = fetch('/api/auth/employee/me')
    .then(async (res) => {
      if (!res.ok) {
        if (res.status === 401 && typeof window !== 'undefined') {
          cachedUser = null;
          try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
          listeners.forEach(cb => cb(null));
        }
        return null;
      }
      const data = await res.json();
      if (data.success && data.user) {
        cachedUser = data.user as CurrentUser;
        if (typeof window !== 'undefined') {
          try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cachedUser)); } catch (e) {}
        }
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
  const [user, setUser] = useState<CurrentUser | null>(() => cachedUser || getStoredUser());
  const [loading, setLoading] = useState<boolean>(() => !cachedUser && !getStoredUser());

  useEffect(() => {
    let mounted = true;

    const listener = (u: CurrentUser | null) => {
      if (mounted) {
        setUser(u);
        setLoading(false);
      }
    };
    listeners.add(listener);

    // Always revalidate in background to keep session fresh
    fetchUser().then((u) => {
      if (mounted) {
        setUser(u);
        setLoading(false);
      }
    });

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
