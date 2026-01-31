
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ivitjddaxpcuftljgvdo.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2aXRqZGRheHBjdWZ0bGpndmRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4NjYzNTYsImV4cCI6MjA4NTQ0MjM1Nn0._AAcH7RObOdM_quY37d6KwuXXfZSDt_m3Uk5T7LJHo8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
  if (error) console.error('Error logging out:', error.message);
};
