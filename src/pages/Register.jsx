import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { useNavigate } from 'react-router-dom';

const Register = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: window.location.origin
            }
        });

        if (error) {
            alert(error.message);
        } else {
            setMessage('Conta criada com sucesso! Verifique seu e-mail para confirmar o cadastro antes de entrar.');
            // Some supabase configs auto-login on signup or don't require email verification.
            // If session exists, we can navigate directly, but usually it's better to wait for verification.
            if (data?.session) {
                navigate('/');
            }
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0f1115] dark:bg-[#0f1115] relative overflow-hidden p-6 transition-colors">
            {/* Background elements for premium feel */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-sky-600/10 blur-[150px] rounded-full"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/10 blur-[150px] rounded-full"></div>

            <div className="w-full max-w-[440px] relative z-10 animate-in fade-in zoom-in-95 duration-700">
                <div className="bg-white dark:bg-[#1c2229] border border-slate-200 dark:border-white/10 rounded-[2.5rem] p-10 md:p-12 shadow-[0_64px_128px_-16px_rgba(0,0,0,0.8)] backdrop-blur-xl relative overflow-hidden group transition-colors">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/5 blur-[80px] -mr-16 -mt-16 group-hover:bg-sky-500/10 transition-all duration-700"></div>

                    <div className="text-center mb-10">
                        <div className="inline-block p-4 bg-sky-500/10 rounded-[1.5rem] border border-sky-500/20 mb-6 shadow-xl shadow-sky-900/10">
                            <h1 className="text-2xl font-black text-slate-900 dark:text-white italic tracking-tighter leading-none uppercase">
                                Gestão<span className="text-sky-500">Frota</span>
                            </h1>
                        </div>
                        <h2 className="text-3xl font-black text-slate-900 dark:text-white italic tracking-tighter uppercase leading-none">
                            Criar <span className="text-sky-500">Conta</span>
                        </h2>
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mt-4">Solicite seu acesso ao sistema</p>
                    </div>

                    {message ? (
                        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 px-6 py-4 rounded-2xl mb-6 text-sm font-bold text-center animate-in zoom-in duration-300">
                            {message}
                            <button
                                onClick={() => navigate('/login')}
                                className="block w-full mt-6 py-4 bg-sky-600 text-white rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-sky-500 transition-all"
                            >
                                IR PARA O LOGIN
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleRegister} className="space-y-6">
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email Institucional</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 rounded-2xl px-6 py-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all font-bold text-sm placeholder:text-slate-700"
                                    placeholder="seu@email.com"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Senha de Acesso</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 rounded-2xl px-6 py-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all font-bold text-sm placeholder:text-slate-700"
                                    placeholder="••••••••"
                                    required
                                    minLength={6}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-5 px-6 bg-sky-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-[0_20px_40px_-10px_rgba(14,165,233,0.4)] transition-all hover:bg-sky-500 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 mt-10"
                            >
                                {loading ? 'CRIANDO CONTA...' : 'CADASTRAR AGORA'}
                            </button>
                        </form>
                    )}

                    <div className="mt-8 text-center">
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">
                            Já possui uma conta?{' '}
                            <button
                                onClick={() => navigate('/login')}
                                className="text-sky-500 hover:text-sky-400 transition-colors ml-1"
                            >
                                FAZER LOGIN
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
