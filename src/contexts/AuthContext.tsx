import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/firebase/firebaseClient';
import { authService } from '../services/firebase/authService';
import { usersService } from '../services/firebase/usersService';
import { UserProfile } from '../types/user';

/**
 * Tipo "User" minimalista que reemplaza el de Firebase Auth.
 * Mantiene los campos usados por componentes legacy (uid, email, displayName, photoURL).
 */
export interface AppUser {
    uid: string;
    id: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
}

interface AuthContextType {
    user: AppUser | null;
    userProfile: UserProfile | null;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    userProfile: null,
    loading: true,
});

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);

const mapSupabaseUser = (sUser: any): AppUser => ({
    uid: sUser.id,
    id: sUser.id,
    email: sUser.email ?? null,
    displayName: sUser.user_metadata?.display_name ?? sUser.user_metadata?.full_name ?? null,
    photoURL: sUser.user_metadata?.avatar_url ?? sUser.user_metadata?.photoURL ?? null,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<AppUser | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // 1. Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            const currentUser = session?.user ? mapSupabaseUser(session.user) : null;
            setUser(currentUser);
            setLoading(false);
            if (currentUser) loadUserProfile(currentUser);
        });

        // 2. Listen to auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            // Supabase fires PASSWORD_RECOVERY when user clicks a reset link.
            // Redirect to the reset form before setting any session state.
            if (event === 'PASSWORD_RECOVERY') {
                window.location.replace('/reset-password');
                return;
            }

            // TOKEN_REFRESHED fires every time the tab regains focus / Supabase rotates
            // the JWT. The user identity is unchanged — calling setUser/setLoading on
            // every refresh forces the whole app tree to re-render and visibly "reloads"
            // the StrategyHub (project state, role views) for no reason.
            // We deliberately ignore it: the new access_token is already in supabase-js,
            // and any subsequent API call will pick it up automatically.
            if (event === 'TOKEN_REFRESHED') return;

            const currentUser = session?.user ? mapSupabaseUser(session.user) : null;

            // INITIAL_SESSION fires once at boot. The bootstrap getSession() above
            // already handled it — re-applying it here would just thrash state.
            // We only act on real identity transitions: SIGNED_IN, SIGNED_OUT, USER_UPDATED.
            if (event === 'INITIAL_SESSION') return;

            // Skip no-op updates: if the same user is still signed in, don't trigger
            // a tree-wide re-render. We compare by uid which is stable across token rotations.
            let userIdentityChanged = false;
            setUser(prevUser => {
                const sameUser = prevUser && currentUser && prevUser.uid === currentUser.uid;
                if (sameUser && event !== 'USER_UPDATED') return prevUser;
                userIdentityChanged = true;
                return currentUser;
            });

            setLoading(false);
            if (currentUser) {
                // Only reload the profile when the user actually changed or was updated.
                // Without this guard, every visibility change would re-fetch the profile
                // and cascade re-renders into StrategyHub/ResultsWorkspace.
                if (userIdentityChanged || event === 'USER_UPDATED') {
                    loadUserProfile(currentUser);
                }
            } else {
                setUserProfile(null);
                sessionStorage.removeItem('pilot_upx');
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const loadUserProfile = async (currentUser: AppUser) => {
        const uid = currentUser.uid;
        const email = currentUser.email || '';

        try {
            const [profile] = await Promise.all([
                authService.getUserProfile(uid).catch(() => null),
                email
                    ? (async () => {
                          try {
                              await usersService.ensureUserDocumentExists(
                                  uid,
                                  email,
                                  currentUser.displayName,
                                  currentUser.photoURL,
                              );
                          } catch (e) {
                              console.warn('[AuthContext] ensure error (non-fatal):', e);
                          }
                      })()
                    : Promise.resolve(),
            ]);

            if (profile) {
                setUserProfile(profile as UserProfile);
                try {
                    sessionStorage.setItem(
                        'pilot_upx',
                        JSON.stringify({
                            uid: (profile as any).uid,
                            rol: (profile as any).rol,
                            subscriptionPlan: (profile as any).subscriptionPlan,
                            trial_completed: (profile as any).trial_completed,
                            trial_count: (profile as any).trial_count,
                            squad_roles: (profile as any).squad_roles,
                        }),
                    );
                } catch {}
            } else {
                // Race condition: retry once after 2.5s
                setTimeout(() => {
                    authService
                        .getUserProfile(uid)
                        .then((p) => {
                            if (p) {
                                setUserProfile(p as UserProfile);
                                try {
                                    sessionStorage.setItem(
                                        'pilot_upx',
                                        JSON.stringify({
                                            uid: (p as any).uid,
                                            rol: (p as any).rol,
                                            subscriptionPlan: (p as any).subscriptionPlan,
                                            trial_completed: (p as any).trial_completed,
                                            trial_count: (p as any).trial_count,
                                            squad_roles: (p as any).squad_roles,
                                        }),
                                    );
                                } catch {}
                            } else {
                                setUserProfile(null);
                            }
                        })
                        .catch(() => setUserProfile(null));
                }, 2500);
            }
        } catch (e) {
            console.warn('[AuthContext] Profile loading error:', e);
            setUserProfile(null);
        }
    };

    return (
        <AuthContext.Provider value={{ user, userProfile, loading }}>{children}</AuthContext.Provider>
    );
};
