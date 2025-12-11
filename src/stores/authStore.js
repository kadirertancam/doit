import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';

export const useAuthStore = create(
    persist(
        (set, get) => ({
            user: null,
            profile: null,
            isLoading: false,
            isAuthenticated: false,
            authInitialized: false, // Flag to track if initial auth check is done
            error: null,

            // Check current session
            checkAuth: async () => {
                set({ isLoading: true });
                try {
                    const { data: { session } } = await supabase.auth.getSession();
                    if (session?.user) {
                        set({ user: session.user, isAuthenticated: true });
                        await get().fetchProfile(session.user.id);
                    } else {
                        // No valid session - clear auth state
                        set({ user: null, profile: null, isAuthenticated: false });
                    }
                } catch (error) {
                    console.error('Auth check failed:', error);
                    // On error, clear auth state for safety
                    set({ user: null, profile: null, isAuthenticated: false });
                } finally {
                    set({ isLoading: false, authInitialized: true });
                }
            },

            // Sign up with email
            signUp: async (email, password, username, displayName) => {
                set({ isLoading: true, error: null });
                try {
                    const { data, error } = await supabase.auth.signUp({
                        email,
                        password,
                        options: {
                            data: {
                                username,
                                display_name: displayName,
                            }
                        }
                    });

                    if (error) throw error;

                    if (data.user) {
                        // Create profile in profiles table
                        const { error: profileError } = await supabase
                            .from('profiles')
                            .insert({
                                id: data.user.id,
                                username,
                                display_name: displayName,
                                email,
                                avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
                                level: 1,
                                xp: 0,
                                total_wins: 0,
                                total_participations: 0,
                                current_streak: 0,
                                longest_streak: 0,
                                arena_points: 0,
                            });

                        if (profileError) console.error('Profile creation error:', profileError);

                        set({
                            user: data.user,
                            isAuthenticated: true,
                            isLoading: false
                        });

                        await get().fetchProfile(data.user.id);
                        return { success: true };
                    }
                } catch (error) {
                    set({ error: error.message, isLoading: false });
                    return { success: false, error: error.message };
                }
            },

            // Sign in with email
            signIn: async (email, password) => {
                set({ isLoading: true, error: null });
                try {
                    const { data, error } = await supabase.auth.signInWithPassword({
                        email,
                        password,
                    });

                    if (error) {
                        // Translate common Supabase errors to Turkish
                        let turkishError = error.message;
                        if (error.message.includes('Invalid login credentials')) {
                            turkishError = 'Email veya şifre hatalı. Kayıtlı değilseniz önce kayıt olun.';
                        } else if (error.message.includes('Email not confirmed')) {
                            turkishError = 'Email onaylanmamış. Lütfen email kutunuzu kontrol edin.';
                        } else if (error.message.includes('Invalid email')) {
                            turkishError = 'Geçersiz email adresi.';
                        }
                        throw new Error(turkishError);
                    }

                    if (data.user) {
                        set({
                            user: data.user,
                            isAuthenticated: true,
                            isLoading: false
                        });
                        await get().fetchProfile(data.user.id);
                        return { success: true };
                    }
                } catch (error) {
                    console.error('Login error:', error.message);
                    set({ error: error.message, isLoading: false });
                    return { success: false, error: error.message };
                }
            },

            // Sign out
            signOut: async () => {
                try {
                    await supabase.auth.signOut();
                    set({
                        user: null,
                        profile: null,
                        isAuthenticated: false
                    });
                } catch (error) {
                    console.error('Sign out error:', error);
                }
            },

            // Fetch user profile
            fetchProfile: async (userId) => {
                try {
                    const { data, error } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', userId)
                        .single();

                    if (error) {
                        // Profile might not exist yet (auto-creation trigger may have failed)
                        if (error.code === 'PGRST116') {
                            console.log('Profile not found, creating one...');
                            // Try to create profile
                            const { user } = get();
                            if (user) {
                                const username = user.user_metadata?.username || 'user_' + userId.slice(0, 8);
                                const displayName = user.user_metadata?.display_name || 'User';

                                const { data: newProfile, error: createError } = await supabase
                                    .from('profiles')
                                    .insert({
                                        id: userId,
                                        username,
                                        display_name: displayName,
                                        email: user.email,
                                        avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
                                        level: 1,
                                        xp: 0,
                                        total_wins: 0,
                                        total_participations: 0,
                                        current_streak: 0,
                                        longest_streak: 0,
                                        arena_points: 0,
                                    })
                                    .select()
                                    .single();

                                if (!createError && newProfile) {
                                    set({ profile: newProfile });
                                    return;
                                }
                            }
                        }
                        throw error;
                    }
                    set({ profile: data });
                } catch (error) {
                    console.error('Profile fetch error:', error);
                }
            },

            // Update profile
            updateProfile: async (updates) => {
                const { user } = get();
                if (!user) return { success: false };

                set({ isLoading: true });
                try {
                    const { data, error } = await supabase
                        .from('profiles')
                        .update(updates)
                        .eq('id', user.id)
                        .select()
                        .single();

                    if (error) throw error;
                    set({ profile: data, isLoading: false });
                    return { success: true };
                } catch (error) {
                    set({ isLoading: false });
                    return { success: false, error: error.message };
                }
            },

            // Upload avatar
            uploadAvatar: async (file) => {
                const { user } = get();
                if (!user) return { success: false };

                try {
                    const fileExt = file.name.split('.').pop();
                    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
                    const filePath = `avatars/${fileName}`;

                    const { error: uploadError } = await supabase.storage
                        .from('avatars')
                        .upload(filePath, file);

                    if (uploadError) throw uploadError;

                    const { data: { publicUrl } } = supabase.storage
                        .from('avatars')
                        .getPublicUrl(filePath);

                    await get().updateProfile({ avatar_url: publicUrl });
                    return { success: true, url: publicUrl };
                } catch (error) {
                    return { success: false, error: error.message };
                }
            },

            // Add XP
            addXP: async (amount) => {
                const { profile, user } = get();
                if (!profile || !user) return;

                const newXP = profile.xp + amount;
                const newLevel = Math.floor(newXP / 1000) + 1;

                await get().updateProfile({
                    xp: newXP,
                    level: newLevel
                });
            },

            // Add participation
            addParticipation: async () => {
                const { profile } = get();
                if (!profile) return;

                await get().updateProfile({
                    total_participations: profile.total_participations + 1
                });
            },

            // Add win
            addWin: async () => {
                const { profile } = get();
                if (!profile) return;

                await get().updateProfile({
                    total_wins: profile.total_wins + 1
                });
            },

            // Update streak
            updateStreak: async () => {
                const { profile } = get();
                if (!profile) return;

                const newStreak = profile.current_streak + 1;
                const longestStreak = Math.max(newStreak, profile.longest_streak);

                await get().updateProfile({
                    current_streak: newStreak,
                    longest_streak: longestStreak
                });
            },

            // Add arena points
            addArenaPoints: async (amount) => {
                const { profile } = get();
                if (!profile) return;

                await get().updateProfile({
                    arena_points: profile.arena_points + amount
                });
            },
        }),
        {
            name: 'doit-auth-storage',
            partialize: (state) => ({
                user: state.user,
                profile: state.profile,
                isAuthenticated: state.isAuthenticated
            }),
        }
    )
);
