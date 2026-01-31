
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ivitjddaxpcuftljgvdo.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2aXRqZGRheHBjdWZ0bGpndmRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4NjYzNTYsImV4cCI6MjA4NTQ0MjM1Nn0._AAcH7RObOdM_quY37d6KwuXXfZSDt_m3Uk5T7LJHo8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const signUpWithEmail = async (email: string, password: string, firstName: string, lastName: string) => {
  const result = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name: firstName,
        last_name: lastName
      }
    }
  });

  if (!result.error && result.data.user) {
    // Attempt forced profile creation to bypass trigger latency
    try {
      await supabase.from('profiles').upsert({
        id: result.data.user.id,
        email: email,
        first_name: firstName,
        last_name: lastName,
        current_level: 1,
        target_wpm: 15,
        target_accuracy: 95
      });
    } catch (e) {
      console.warn("Manual profile sync issue handled.");
    }
  }

  return result;
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

export const getLeaderboard = async () => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, first_name, last_name, current_level, avg_wpm, avg_accuracy, max_wpm, max_accuracy, levels_completed, total_mistakes')
      .order('current_level', { ascending: false })
      .order('avg_wpm', { ascending: false })
      .limit(50);
    
    if (error) return [];
    return data || [];
  } catch (err) {
    return [];
  }
};

export const recordLevelPerformance = async (
  userId: string, 
  levelNum: number, 
  wpm: number, 
  accuracy: number, 
  mistakesCount: number, 
  mistakeMap: any, 
  fingerWeakness: string,
  suggestion: string
) => {
  try {
    // 1. Record specific level progress
    await supabase.from('level_progress').upsert({
      profile_id: userId,
      level_number: levelNum,
      wpm,
      accuracy,
      mistakes_count: mistakesCount,
      mistake_map: mistakeMap, 
      finger_weakness: fingerWeakness,
      suggestion: suggestion,
      updated_at: new Date()
    }, { onConflict: 'profile_id,level_number' });

    // 2. Fetch all history to update profile averages
    const { data: allHistory } = await supabase
      .from('level_progress')
      .select('wpm, accuracy, mistakes_count')
      .eq('profile_id', userId);

    if (allHistory && allHistory.length > 0) {
      const numLevels = allHistory.length;
      const sumWpm = allHistory.reduce((s, row) => s + row.wpm, 0);
      const sumAcc = allHistory.reduce((s, row) => s + row.accuracy, 0);
      const totalMistakes = allHistory.reduce((s, row) => s + (row.mistakes_count || 0), 0);

      await supabase.from('profiles').update({
        avg_wpm: parseFloat((sumWpm / numLevels).toFixed(1)),
        avg_accuracy: parseFloat((sumAcc / numLevels).toFixed(1)),
        levels_completed: numLevels,
        total_mistakes: totalMistakes,
        updated_at: new Date()
      }).eq('id', userId);
    }
  } catch (err) {
    console.error("Performance sync error:", err);
  }
};

export const resetUserProgress = async (userId: string) => {
  await supabase.from('level_progress').delete().eq('profile_id', userId);
  await supabase.from('profiles').update({
    current_level: 1,
    max_wpm: 0,
    max_accuracy: 0,
    avg_wpm: 0,
    avg_accuracy: 0,
    levels_completed: 0,
    total_mistakes: 0,
    target_wpm: 15,
    target_accuracy: 95,
    updated_at: new Date()
  }).eq('id', userId);
};
