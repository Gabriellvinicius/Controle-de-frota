import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) alert(error.message);
        else navigate('/');
        setLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0f1115] relative overflow-hidden p-6">
            {/* Background elements for premium feel */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-sky-600/10 blur-[150px] rounded-full"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/10 blur-[150px] rounded-full"></div>

            <div className="w-full max-w-[440px] relative z-10 animate-in fade-in zoom-in-95 duration-700">
                <div className="bg-[#1c2229] border border-white/10 rounded-[2.5rem] p-10 md:p-12 shadow-[0_64px_128px_-16px_rgba(0,0,0,0.8)] backdrop-blur-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/5 blur-[80px] -mr-16 -mt-16 group-hover:bg-sky-500/10 transition-all duration-700"></div>

                    <div className="text-center mb-12">
                        <div className="inline-block p-4 bg-sky-500/10 rounded-[1.5rem] border border-sky-500/20 mb-6 shadow-xl shadow-sky-900/10">
                            <h1 className="text-2xl font-black text-white italic tracking-tighter leading-none uppercase">
                                Gestão<span className="text-sky-500">Frota</span>
                            </h1>
                        </div>
                        <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none">
                            Bem-<span className="text-sky-500">Vindo</span>
                        </h2>
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mt-4">Acesso seguro ao console operacional</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email Institucional</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-white/5 border-white/10 rounded-2xl px-6 py-4 text-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all font-bold text-sm placeholder:text-slate-700"
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
                                className="w-full bg-white/5 border-white/10 rounded-2xl px-6 py-4 text-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all font-bold text-sm placeholder:text-slate-700"
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-5 px-6 bg-sky-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-[0_20px_40px_-10px_rgba(14,165,233,0.4)] transition-all hover:bg-sky-500 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 mt-10"
                        >
                            {loading ? 'AUTENTICANDO...' : 'ENTRAR NO SISTEMA'}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">
                            Não possui credenciais?{' '}
                            <button
                                onClick={() => navigate('/registrar')}
                                className="text-sky-500 hover:text-sky-400 transition-colors ml-1"
                            >
                                SOLICITAR REGISTRO
                            </button>
                        </p>
                    </div>

                    <div className="relative my-10">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-white/5"></div>
                        </div>
                        <div className="relative flex justify-center text-[10px]">
                            <span className="px-4 bg-[#1c2229] text-slate-600 font-black uppercase tracking-widest">Sandbox e Teste</span>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => {
                            localStorage.setItem('demo_mode', 'true');
                            window.location.reload();
                        }}
                        className="w-full py-4 px-6 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:bg-white/10 hover:text-white transition-all active:scale-[0.98]"
                    >
                        MODO DEMONSTRAÇÃO
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Login;
