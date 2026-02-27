import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { UserPlus, Save, AlertTriangle, CheckCircle, Shield } from 'lucide-react';

const AccessControl = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null); // { type: 'success'|'error', text: '' }

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        role: 'motorista' // Default role
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        // Validation
        if (formData.password !== formData.confirmPassword) {
            setMessage({ type: 'error', text: 'As senhas não conferem.' });
            setLoading(false);
            return;
        }

        if (formData.password.length < 6) {
            setMessage({ type: 'error', text: 'A senha deve ter pelo menos 6 caracteres.' });
            setLoading(false);
            return;
        }

        try {
            // 1. Create User in Supabase Auth
            // WARNING: This logs the current user out and the new user in by default in client-side libs.
            // To avoid this in a real production app we'd use a cloud function (Edge Function).
            // here we warn the user.
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
            });

            if (authError) throw authError;

            if (authData.user) {
                // 2. Create Profile Entry with Role
                const { error: profileError } = await supabase
                    .from('profiles')
                    .insert([
                        {
                            id: authData.user.id,
                            email: formData.email,
                            role: formData.role
                        }
                    ]);

                if (profileError) {
                    console.error('Erro ao criar perfil:', profileError);
                    setMessage({ type: 'warning', text: 'Usuário criado, mas houve erro ao definir o perfil. Contate o suporte.' });
                } else {
                    setMessage({ type: 'success', text: `Usuário criado com sucesso! Perfil: ${formData.role.toUpperCase()}` });
                    setFormData({ email: '', password: '', confirmPassword: '', role: 'motorista' });
                }
            }
        } catch (error) {
            console.error('Erro ao criar usuário:', error);
            setMessage({ type: 'error', text: error.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">
                        Criação de <span className="text-sky-500">Acessos</span>
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">Gerencie os usuários e permissões do sistema</p>
                </div>
                <div className="p-3 bg-sky-500/10 rounded-lg text-sky-500">
                    <Shield className="w-8 h-8" />
                </div>
            </div>

            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-sm max-w-2xl mx-auto">
                <div className="mb-6 bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                        <h4 className="text-amber-500 font-bold text-sm">Atenção Admin</h4>
                        <p className="text-amber-200/80 text-xs mt-1">
                            Ao criar um novo usuário, o sistema pode desconectar sua conta atual e logar automaticamente com a nova conta criada (comportamento padrão de segurança).
                            Se isso acontecer, basta fazer logout e entrar novamente com sua conta de Admin.
                        </p>
                    </div>
                </div>

                <form onSubmit={handleCreateUser} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">E-mail Corporativo</label>
                        <input
                            type="email"
                            name="email"
                            required
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition-all placeholder:text-slate-600"
                            placeholder="nome@empresa.com"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Senha</label>
                            <input
                                type="password"
                                name="password"
                                required
                                value={formData.password}
                                onChange={handleChange}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition-all"
                                placeholder="******"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Confirmar Senha</label>
                            <input
                                type="password"
                                name="confirmPassword"
                                required
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition-all"
                                placeholder="******"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Nível de Acesso</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <label className={`cursor-pointer border rounded-lg p-4 flex items-center gap-3 transition-all ${formData.role === 'gestor' ? 'bg-sky-500/20 border-sky-500' : 'bg-slate-900 border-slate-700 hover:border-slate-600'}`}>
                                <input
                                    type="radio"
                                    name="role"
                                    value="gestor"
                                    checked={formData.role === 'gestor'}
                                    onChange={handleChange}
                                    className="hidden"
                                />
                                <div className={`p-2 rounded-full ${formData.role === 'gestor' ? 'bg-sky-500 text-white' : 'bg-slate-800 text-slate-500'}`}>
                                    <Shield className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-white font-bold text-sm">Gestor de Frota</p>
                                    <p className="text-slate-500 text-xs mt-0.5">Acesso total, exceto apagar financeiro</p>
                                </div>
                            </label>

                            <label className={`cursor-pointer border rounded-lg p-4 flex items-center gap-3 transition-all ${formData.role === 'motorista' ? 'bg-sky-500/20 border-sky-500' : 'bg-slate-900 border-slate-700 hover:border-slate-600'}`}>
                                <input
                                    type="radio"
                                    name="role"
                                    value="motorista"
                                    checked={formData.role === 'motorista'}
                                    onChange={handleChange}
                                    className="hidden"
                                />
                                <div className={`p-2 rounded-full ${formData.role === 'motorista' ? 'bg-sky-500 text-white' : 'bg-slate-800 text-slate-500'}`}>
                                    <UserPlus className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-white font-bold text-sm">Motorista de Campo</p>
                                    <p className="text-slate-500 text-xs mt-0.5">Vê/Edita somente próprios dados (24h)</p>
                                </div>
                            </label>
                        </div>
                    </div>

                    {message && (
                        <div className={`p-4 rounded-lg flex items-center gap-3 ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-500' : message.type === 'warning' ? 'bg-amber-500/10 text-amber-500' : 'bg-red-500/10 text-red-500'}`}>
                            {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                            <p className="text-sm font-medium">{message.text}</p>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 mt-4"
                    >
                        {loading ? 'Criando usuário...' : 'Criar Acesso'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AccessControl;
