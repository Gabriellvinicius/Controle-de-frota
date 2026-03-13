import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { UserPlus, Search, Plus, X, Edit, User, Shield, AlertTriangle, CheckCircle, Loader2, Save, Trash2, Power } from 'lucide-react';

const AccessControl = () => {
    const { user, profile } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [formLoading, setFormLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [editingUser, setEditingUser] = useState(null);

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        role: 'motorista',
        name: '',
        active: true
    });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('name');

            if (error) throw error;
            setUsers(data || []);
        } catch (error) {
            console.error('Erro ao buscar usuários:', error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    const handleEdit = (u) => {
        setEditingUser(u);
        setFormData({
            email: u.email || '',
            name: u.name || u.full_name || '',
            role: u.role || 'motorista',
            active: u.active !== false, // Default to true if null/undefined
            password: '',
            confirmPassword: ''
        });
        setShowModal(true);
    };

    const handleOpenCreate = () => {
        setEditingUser(null);
        setFormData({
            email: '',
            password: '',
            confirmPassword: '',
            role: 'motorista',
            name: '',
            active: true
        });
        setShowModal(true);
    };

    const handleDelete = async (userId, userName) => {
        if (!window.confirm(`Tem certeza que deseja excluir o usuário ${userName}? Esta ação não pode ser desfeita.`)) {
            return;
        }

        try {
            setLoading(true);
            const { error } = await supabase
                .from('profiles')
                .delete()
                .eq('id', userId);

            if (error) throw error;

            fetchUsers();
        } catch (error) {
            alert('Erro ao excluir usuário: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormLoading(true);
        setMessage(null);

        try {
            if (editingUser) {
                // Update profile
                const { error } = await supabase
                    .from('profiles')
                    .update({
                        name: formData.name,
                        role: formData.role,
                        active: formData.active
                    })
                    .eq('id', editingUser.id);

                if (error) throw error;

                setMessage({
                    type: 'success',
                    text: `Usuário ${formData.name} atualizado com sucesso!`
                });
            } else {
                // Create new user (Sign Up)
                if (formData.password !== formData.confirmPassword) {
                    setMessage({ type: 'error', text: 'As senhas não conferem.' });
                    setFormLoading(false);
                    return;
                }

                const { data: authData, error: authError } = await supabase.auth.signUp({
                    email: formData.email,
                    password: formData.password,
                    options: {
                        data: {
                            role: formData.role,
                            name: formData.name,
                            active: true
                        }
                    }
                });

                if (authError) throw authError;

                setMessage({
                    type: 'success',
                    text: `Usuário ${formData.name} criado com sucesso!`
                });
            }

            setTimeout(() => {
                setShowModal(false);
                fetchUsers();
                setMessage(null);
            }, 2000);

        } catch (error) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setFormLoading(false);
        }
    };

    const filteredUsers = users.filter(u =>
        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.role?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getRoleBadge = (role) => {
        switch (role?.toLowerCase()) {
            case 'admin':
                return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
            case 'gestor':
                return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
            case 'agente':
                return 'bg-sky-500/10 text-sky-500 border-sky-500/20';
            case 'consultor':
                return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
            default:
                return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
        }
    };

    return (
        <div className="space-y-8 animate-fade-in pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-widest uppercase italic">
                        Usuários
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-[0.2em] mt-2">Gerencie acesso e permissões do sistema</p>
                </div>
                <button
                    onClick={handleOpenCreate}
                    className="flex items-center justify-center px-6 py-3 bg-sky-600 text-white rounded-xl hover:bg-sky-500 transition-all shadow-[0_10px_20px_-5px_rgba(14,165,233,0.4)] font-black uppercase tracking-widest text-[11px] group active:scale-95"
                >
                    <Plus className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform" />
                    Novo Usuário
                </button>
            </div>

            {/* Search Bar */}
            <div className="relative group max-w-xl">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-slate-500 group-focus-within:text-sky-500 transition-colors" />
                </div>
                <input
                    type="text"
                    placeholder="Buscar por Nome, Email ou Cargo..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none shadow-xl transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 font-medium"
                />
            </div>

            {/* Table Card */}
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-white/5 overflow-hidden shadow-2xl transition-all">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-white/5 border-b border-slate-100 dark:border-white/5">
                            <tr>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em]">Nome</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em]">Email</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em]">Cargo</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em]">Status</th>
                                <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em]">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-8 py-6"><div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-48"></div></td>
                                        <td className="px-8 py-6"><div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-64"></div></td>
                                        <td className="px-8 py-6"><div className="h-6 bg-slate-100 dark:bg-slate-800 rounded-full w-24"></div></td>
                                        <td className="px-8 py-6"><div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-16"></div></td>
                                        <td className="px-8 py-6"><div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-12 ml-auto"></div></td>
                                    </tr>
                                ))
                            ) : filteredUsers.length > 0 ? (
                                filteredUsers.map((u) => (
                                    <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
                                        <td className="px-8 py-6 font-bold text-slate-900 dark:text-white uppercase tracking-tight text-sm">
                                            {u.name || u.full_name || 'Sem nome'}
                                        </td>
                                        <td className="px-8 py-6 text-sm text-slate-500 dark:text-slate-400">
                                            {u.email || '-'}
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${getRoleBadge(u.role)}`}>
                                                {u.role || 'motorista'}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center w-fit gap-1.5 ${u.active !== false ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                                                <div className={`w-1 h-1 rounded-full ${u.active !== false ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                                                {u.active !== false ? 'Ativo' : 'Inativo'}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-right space-x-2">
                                            <button
                                                onClick={() => handleEdit(u)}
                                                className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-sky-500 bg-sky-500/5 px-4 py-2 rounded-xl hover:bg-sky-500/10 transition-all opacity-0 group-hover:opacity-100"
                                            >
                                                <Edit className="w-4 h-4" />
                                                Editar
                                            </button>
                                            <button
                                                onClick={() => handleDelete(u.id, u.name || u.full_name)}
                                                className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-red-500 bg-red-500/5 px-4 py-2 rounded-xl hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                                Excluir
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center">
                                            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-full mb-4">
                                                <User className="h-10 w-10 text-slate-300 dark:text-slate-600" />
                                            </div>
                                            <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-xs">Nenhum usuário encontrado</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal de Usuário */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl p-4 animate-in fade-in duration-300 overflow-y-auto">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[2.5rem] w-full max-w-xl shadow-2xl p-10 animate-in zoom-in-95 duration-300 relative">
                        <button
                            onClick={() => setShowModal(false)}
                            className="absolute top-8 right-8 p-3 bg-slate-50 dark:bg-white/5 rounded-2xl text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all shadow-xl"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        <div className="mb-8 flex justify-between items-start">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">
                                    {editingUser ? 'Editar' : 'Novo'} <span className="text-sky-500">Usuário</span>
                                </h2>
                                <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mt-2">
                                    {editingUser ? 'Atualize as informações do perfil' : 'Defina as credenciais e nível de acesso'}
                                </p>
                            </div>

                            {editingUser && (
                                <div className="flex flex-col items-end gap-2">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Status da Conta</label>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, active: !formData.active })}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition-all ${formData.active ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600' : 'bg-red-500/10 border-red-500 text-red-600'}`}
                                    >
                                        <Power className="w-4 h-4" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">{formData.active ? 'Ativa' : 'Inativa'}</span>
                                    </button>
                                </div>
                            )}
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Nome Completo</label>
                                <input
                                    type="text"
                                    name="name"
                                    required
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-2xl px-6 py-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none transition-all placeholder:text-slate-700 font-bold"
                                    placeholder="Ex: Gabriel Vinícius"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Email Corporativo</label>
                                <input
                                    type="email"
                                    name="email"
                                    required
                                    disabled={!!editingUser}
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-2xl px-6 py-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none transition-all placeholder:text-slate-700 font-bold disabled:opacity-50"
                                    placeholder="nome@empresa.com"
                                />
                            </div>

                            {!editingUser && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Senha</label>
                                        <input
                                            type="password"
                                            name="password"
                                            required={!editingUser}
                                            value={formData.password}
                                            onChange={handleChange}
                                            className="w-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-2xl px-6 py-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none transition-all font-bold"
                                            placeholder="******"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Confirmar</label>
                                        <input
                                            type="password"
                                            name="confirmPassword"
                                            required={!editingUser}
                                            value={formData.confirmPassword}
                                            onChange={handleChange}
                                            className="w-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-2xl px-6 py-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none transition-all font-bold"
                                            placeholder="******"
                                        />
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 ml-1">Cargo / Nível de Acesso</label>
                                <div className="grid grid-cols-2 gap-4">
                                    {['gestor', 'motorista', 'agente', 'consultor', 'admin'].map((role) => (
                                        <label
                                            key={role}
                                            className={`cursor-pointer border-2 rounded-2xl p-4 flex items-center gap-3 transition-all ${formData.role === role ? 'bg-sky-500/10 border-sky-500' : 'bg-slate-50 dark:bg-white/5 border-transparent hover:border-slate-200 dark:hover:border-white/10'}`}
                                        >
                                            <input type="radio" name="role" value={role} checked={formData.role === role} onChange={handleChange} className="hidden" />
                                            <div className={`p-2 rounded-lg ${formData.role === role ? 'bg-sky-500 text-white' : 'bg-white dark:bg-slate-800 text-slate-400'}`}>
                                                {role === 'gestor' || role === 'admin' ? <Shield size={16} /> : <User size={16} />}
                                            </div>
                                            <span className={`text-[10px] font-black uppercase tracking-widest ${formData.role === role ? 'text-sky-600 dark:text-white' : 'text-slate-500'}`}>
                                                {role}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {message && (
                                <div className={`p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                                    {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                                    <p className="text-[10px] font-black uppercase tracking-widest">{message.text}</p>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={formLoading}
                                className="w-full bg-sky-600 hover:bg-sky-500 text-white font-black uppercase tracking-[0.2em] text-[11px] py-5 px-4 rounded-[1.5rem] transition-all shadow-xl shadow-sky-900/40 flex items-center justify-center gap-2 group active:scale-95 disabled:opacity-50"
                            >
                                {formLoading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        {editingUser ? <Save className="w-5 h-5" /> : <UserPlus className="w-5 h-5 group-hover:scale-110 transition-transform" />}
                                        {editingUser ? 'Salvar Alterações' : 'Criar Conta de Acesso'}
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AccessControl;

