// Local & Offline-First Storage System for Typeshala Typing Tutor

const LOCAL_USER_KEY = 'typeshala_local_user';
const LOCAL_USERS_DB = 'typeshala_registered_users';
const LOCAL_PROFILE_KEY_PREFIX = 'typeshala_profile_';

export interface UserProfile {
  id: string;
  current_level: number;
  target_wpm: number;
  target_accuracy: number;
  updated_at?: string;
}

export interface StoredUser {
  id: string;
  email: string;
  password?: string;
  created_at: string;
}

const getRegisteredUsers = (): StoredUser[] => {
  try {
    const raw = localStorage.getItem(LOCAL_USERS_DB);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveRegisteredUsers = (users: StoredUser[]) => {
  try {
    localStorage.setItem(LOCAL_USERS_DB, JSON.stringify(users));
  } catch (e) {
    console.warn('LocalStorage save failed', e);
  }
};

const getLocalUser = (): StoredUser | null => {
  try {
    const raw = localStorage.getItem(LOCAL_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const setLocalUser = (user: StoredUser | null) => {
  try {
    if (user) {
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(LOCAL_USER_KEY);
    }
  } catch (e) {
    console.warn('LocalStorage write failed', e);
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
    // Also save as current guest profile
    localStorage.setItem('typeshala_guest_profile', JSON.stringify(profile));
  } catch (e) {
    console.warn('LocalStorage write failed', e);
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

type AuthListener = (event: string, session: any) => void;
const listeners: Set<AuthListener> = new Set();

const notifyAuthChange = (event: string, user: StoredUser | null) => {
  const session = user ? { user, access_token: 'local-session-token' } : null;
  listeners.forEach((listener) => {
    try {
      listener(event, session);
    } catch (e) {
      console.warn('Auth listener error:', e);
    }
  });
};

// Safe, Zero-Network-Error Local Supabase client
export const supabase = {
  auth: {
    getSession: async () => {
      const user = getLocalUser();
      const session = user ? { user, access_token: 'local-session-token' } : null;
      return { data: { session }, error: null };
    },

    onAuthStateChange: (callback: AuthListener) => {
      listeners.add(callback);
      return {
        data: {
          subscription: {
            unsubscribe: () => {
              listeners.delete(callback);
            }
          }
        }
      };
    },

    signUp: async ({ email, password }: { email: string; password?: string }) => {
      const trimmedEmail = email.trim().toLowerCase();
      const users = getRegisteredUsers();
      
      let existing = users.find(u => u.email === trimmedEmail);
      if (existing) {
        setLocalUser(existing);
        notifyAuthChange('SIGNED_IN', existing);
        return {
          data: { user: existing, session: { user: existing, access_token: 'token' } },
          error: null
        };
      }

      const newUser: StoredUser = {
        id: 'usr_' + Math.random().toString(36).substring(2, 9),
        email: trimmedEmail,
        password: password || '',
        created_at: new Date().toISOString()
      };

      users.push(newUser);
      saveRegisteredUsers(users);
      setLocalUser(newUser);

      // Create default profile for this user
      const defaultProf: UserProfile = {
        id: newUser.id,
        current_level: 1,
        target_wpm: 40,
        target_accuracy: 100,
        updated_at: new Date().toISOString()
      };
      saveLocalProfile(defaultProf);

      notifyAuthChange('SIGNED_IN', newUser);
      return {
        data: { user: newUser, session: { user: newUser, access_token: 'token' } },
        error: null
      };
    },

    signInWithPassword: async ({ email, password }: { email: string; password?: string }) => {
      const trimmedEmail = email.trim().toLowerCase();
      const users = getRegisteredUsers();
      
      let user = users.find(u => u.email === trimmedEmail);
      if (!user) {
        // Auto-register convenience
        user = {
          id: 'usr_' + Math.random().toString(36).substring(2, 9),
          email: trimmedEmail,
          password: password || '',
          created_at: new Date().toISOString()
        };
        users.push(user);
        saveRegisteredUsers(users);
        
        const guestProf = getGuestProfile();
        saveLocalProfile({ ...guestProf, id: user.id });
      }

      setLocalUser(user);
      notifyAuthChange('SIGNED_IN', user);
      return {
        data: { user, session: { user, access_token: 'token' } },
        error: null
      };
    },

    signOut: async () => {
      setLocalUser(null);
      notifyAuthChange('SIGNED_OUT', null);
      return { error: null };
    }
  },

  from: (table: string) => {
    return {
      select: (_cols?: string) => ({
        eq: (_col: string, val: string) => ({
          single: async () => {
            const profile = getLocalProfile(val) || getGuestProfile();
            return { data: profile, error: null };
          }
        })
      }),
      insert: async (rows: any[]) => {
        if (rows && rows[0]) {
          saveLocalProfile(rows[0]);
        }
        return { data: rows, error: null };
      },
      update: (data: any) => ({
        eq: async (_col: string, val: string) => {
          const current = getLocalProfile(val) || getGuestProfile();
          const updated = { ...current, ...data, id: val, updated_at: new Date().toISOString() };
          saveLocalProfile(updated);
          return { data: updated, error: null };
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
  if (error) console.warn('Error logging out:', error);
};
