import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabase';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchProfile = async (userId) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) {
                console.warn('Erro ao buscar perfil:', error.message);
                // Fallback for demo mode or missing profile
                if (localStorage.getItem('demo_mode') === 'true') {
                    setProfile({ role: 'gestor' });
                } else {
                    setProfile({ role: 'gestor' });
                }
            } else {
                setProfile(data);
            }
        } catch (err) {
            console.error('Erro inesperado ao buscar perfil:', err);
        }
    };

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                setUser(session.user);
                fetchProfile(session.user.id);
            } else if (localStorage.getItem('demo_mode') === 'true') {
                setUser({ email: 'demo@teste.com', id: 'demo' });
                setProfile({ role: 'gestor' });
            }
            setLoading(false);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session) {
                setUser(session.user);
                fetchProfile(session.user.id);
            } else if (localStorage.getItem('demo_mode') === 'true') {
                setUser({ email: 'demo@teste.com', id: 'demo' });
                setProfile({ role: 'gestor' });
            } else {
                setUser(null);
                setProfile(null);
            }
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const value = {
        user,
        profile,
        loading,
        isAdmin: profile?.role === 'admin',
        isGestor: profile?.role === 'gestor' || profile?.role === 'admin', // Admin also has Gestor permissions usually
        isMotorista: profile?.role === 'motorista',
        role: profile?.role,
        signOut: () => {
            localStorage.removeItem('demo_mode');
            return supabase.auth.signOut();
        }
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
