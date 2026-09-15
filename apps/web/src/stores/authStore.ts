import { create } from 'zustand';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/supabase/client';

interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  age: number | null;
  gender: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  fitness_level: 'beginner' | 'intermediate' | 'advanced';
  fitness_goal: 'weight_loss' | 'muscle_gain' | 'endurance' | 'flexibility' | 'general_fitness';
  workout_preference: 'home' | 'gym' | 'outdoor' | 'mixed';
  available_time_minutes: number;
  dietary_preference: string;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  isInitialized: boolean;
  
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setProfile: (profile: Profile | null) => void;
  setLoading: (loading: boolean) => void;
  setInitialized: (initialized: boolean) => void;
  
  fetchProfile: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  signOut: () => Promise<void>;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  profile: null,
  isLoading: true,
  isInitialized: false,
  
  setUser: (user) => set({ user }),
  setSession: (session) => set({ session }),
  setProfile: (profile) => set({ profile }),
  setLoading: (isLoading) => set({ isLoading }),
  setInitialized: (isInitialized) => set({ isInitialized }),
  
  fetchProfile: async () => {
    const { user } = get();
    if (!user) return;
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (error) {
      console.error('Error fetching profile:', error);
      return;
    }
    
    set({ profile: data as Profile | null });
  },
  
  updateProfile: async (updates) => {
    const { user } = get();
    if (!user) return;
    
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('user_id', user.id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
    
    set({ profile: data as Profile });
  },
  
  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, session: null, profile: null });
  },
  
  initialize: () => {
    supabase.auth.onAuthStateChange((event, session) => {
      set({ session, user: session?.user ?? null });
      
      if (session?.user) {
        setTimeout(() => {
          get().fetchProfile();
        }, 0);
      } else {
        set({ profile: null });
      }
    });
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      set({ 
        session, 
        user: session?.user ?? null, 
        isLoading: false,
        isInitialized: true 
      });
      
      if (session?.user) {
        get().fetchProfile();
      }
    });
  },
}));
