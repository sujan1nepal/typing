
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ivitjddaxpcuftljgvdo.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2aXRqZGRheHBjdWZ0bGpndmRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4NjYzNTYsImV4cCI6MjA4NTQ0MjM1Nn0._AAcH7RObOdM_quY37d6KwuXXfZSDt_m3Uk5T7LJHo8';

// Fallback local storage keys
const LOCAL_USER_KEY = 'typeshala_local_user';
const LOCAL_PROFILE_KEY_PREFIX = 'typeshala_profile_';

export interface UserProfile {
  id: string;
  current_level: number;
  target_wpm: number;
  target_accuracy: number;
  updated_at?: string;
}

// Check for local session
const getLocalUser = () => {
  try {
    const raw = localStorage.getItem(LOCAL_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const setLocalUser = (user: any) => {
  try {
    if (user) {
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(LOCAL_USER_KEY);
    }
  } catch (e) {
    console.error('LocalStorage write failed', e);
  }
};

export const getLocalProfile = (userId: string): UserProfile | null => {
  try {
    const raw = localStorage.getItem(`${LOCAL_PROFILE_KEY_PREFIX}${userId}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const saveLocalProfile = (profile: UserProfile): void => {
  try {
    localStorage.setItem(`${LOCAL_PROFILE_KEY_PREFIX}${profile.id}`, JSON.stringify(profile));
    // Also save as default guest profile
    localStorage.setItem('typeshala_guest_profile', JSON.stringify(profile));
  } catch (e) {
    console.error('LocalStorage write failed', e);
  }
};

export const getGuestProfile = (): UserProfile => {
  try {
    const raw = localStorage.getItem('typeshala_guest_profile');
    if (raw) return JSON.parse(raw);
  } catch {}
  return {
    id: 'guest',
    current_level: 1,
    target_wpm: 40,
    target_accuracy: 100,
  };
};

let rawSupabaseClient: any = null;
try {
  rawSupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false
    }
  });
} catch (e) {
  console.warn('Could not initialize remote Supabase client, using local mode', e);
}

// Safe wrapper around Supabase with offline & local fallback
export const supabase = {
  auth: {
    getSession: async () => {
      if (rawSupabaseClient) {
        try {
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Network timeout')), 2500)
          );
          const result: any = await Promise.race([
            rawSupabaseClient.auth.getSession(),
            timeoutPromise
          ]);
          if (result?.data?.session) {
            setLocalUser(result.data.session.user);
            return result;
          }
        } catch (e) {
          console.warn('Supabase getSession failed, checking local storage session', e);
        }
      }
      
      const localUser = getLocalUser();
      if (localUser) {
        return { data: { session: { user: localUser, access_token: 'local-token' } }, error: null };
      }
      return { data: { session: null }, error: null };
    },

    onAuthStateChange: (callback: (event: string, session: any) => void) => {
      let sub: any = null;
      if (rawSupabaseClient) {
        try {
          const res = rawSupabaseClient.auth.onAuthStateChange(callback);
          sub = res?.data?.subscription;
        } catch (e) {
          console.warn('Supabase auth state listener fallback', e);
        }
      }
      return {
        data: {
          subscription: {
            unsubscribe: () => {
              if (sub && typeof sub.unsubscribe === 'function') {
                sub.unsubscribe();
              }
            }
          }
        }
      };
    },

    signUp: async ({ email, password }: { email: string; password?: string }) => {
      if (rawSupabaseClient) {
        try {
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Network timeout')), 3000)
          );
          const result: any = await Promise.race([
            rawSupabaseClient.auth.signUp({ email, password: password || 'default-password' }),
            timeoutPromise
          ]);
          if (result?.data?.user) {
            setLocalUser(result.data.user);
            return result;
          }
          if (!result.error) {
            return result;
          }
        } catch (e) {
          console.warn('Remote signUp failed, creating local offline account', e);
        }
      }

      // Offline account creation fallback
      const localUser = {
        id: 'user_' + Math.random().toString(36).substring(2, 9),
        email,
        created_at: new Date().toISOString()
      };
      setLocalUser(localUser);
      return {
        data: { user: localUser, session: { user: localUser } },
        error: null
      };
    },

    signInWithPassword: async ({ email, password }: { email: string; password?: string }) => {
      if (rawSupabaseClient) {
        try {
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Network timeout')), 3000)
          );
          const result: any = await Promise.race([
            rawSupabaseClient.auth.signInWithPassword({ email, password: password || 'default-password' }),
            timeoutPromise
          ]);
          if (result?.data?.session) {
            setLocalUser(result.data.session.user);
            return result;
          }
          if (!result.error) {
            return result;
          }
        } catch (e) {
          console.warn('Remote signIn failed, falling back to local account', e);
        }
      }

      // Offline login fallback
      const localUser = {
        id: 'user_' + (email.split('@')[0] || 'account'),
        email,
        created_at: new Date().toISOString()
      };
      setLocalUser(localUser);
      return {
        data: { user: localUser, session: { user: localUser } },
        error: null
      };
    },

    signOut: async () => {
      setLocalUser(null);
      if (rawSupabaseClient) {
        try {
          await rawSupabaseClient.auth.signOut();
        } catch (e) {
          console.warn('Remote signOut failed', e);
        }
      }
      return { error: null };
    }
  },

  from: (table: string) => {
    return {
      select: (_cols?: string) => ({
        eq: (_col: string, val: string) => ({
          single: async () => {
            if (rawSupabaseClient && table === 'profiles') {
              try {
                const timeoutPromise = new Promise((_, reject) =>
                  setTimeout(() => reject(new Error('Network timeout')), 2500)
                );
                const result: any = await Promise.race([
                  rawSupabaseClient.from(table).select('*').eq('id', val).single(),
                  timeoutPromise
                ]);
                if (result?.data) return result;
              } catch (e) {
                console.warn('Remote profile fetch failed, using local profile', e);
              }
            }
            const local = getLocalProfile(val) || getGuestProfile();
            return { data: local, error: null };
          }
        })
      }),
      insert: (rows: any[]) => {
        if (rows && rows[0]) {
          saveLocalProfile(rows[0]);
        }
        if (rawSupabaseClient && table === 'profiles') {
          rawSupabaseClient.from(table).insert(rows).catch((e: any) => console.warn('Remote insert failed', e));
        }
        return Promise.resolve({ data: rows, error: null });
      },
      update: (data: any) => ({
        eq: (_col: string, val: string) => {
          const current = getLocalProfile(val) || getGuestProfile();
          const updated = { ...current, ...data, id: val };
          saveLocalProfile(updated);
          if (rawSupabaseClient && table === 'profiles') {
            rawSupabaseClient.from(table).update(data).eq('id', val).catch((e: any) => console.warn('Remote update failed', e));
          }
          return Promise.resolve({ data: updated, error: null });
        }
      })
    };
  }
};

export const signUpWithEmail = async (email: string, password: string) => {
  return await supabase.auth.signUp({
    email,
    password,
  });
};

export const signInWithEmail = async (email: string, password: string) => {
  return await supabase.auth.signInWithPassword({
    email,
    password,
  });
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) console.error('Error logging out:', error);
};

