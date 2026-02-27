import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { Plus, Search, Users, AlertTriangle, CheckCircle, XCircle, X, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Drivers = () => {
    const { isGestor } = useAuth();
    const [drivers, setDrivers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Edit Mode State
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);

    const [formData, setFormData] = useState({
        nome: '',
        cpf: '',
        categoria_cnh: 'B',
        validade_cnh: '',
        status: 'ativo'
    });

    useEffect(() => {
        fetchDrivers();
    }, []);

    const fetchDrivers = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('drivers')
                .select('*')
                .order('name', { ascending: true });

            if (error) throw error;
            // Map DB (English) -> State (Portuguese)
            const mappedData = (data || []).map(d => ({
                id: d.id,
                nome: d.name,
                cpf: d.license_number || d.cpf,
                categoria_cnh: d.category,
                validade_cnh: d.expiration_date,
                status: d.status
            }));
            setDrivers(mappedData);
        } catch (error) {
            console.error('Erro ao buscar motoristas:', error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (driver) => {
        setIsEditing(true);
        setEditId(driver.id);
        setFormData({
            nome: driver.nome,
            cpf: driver.cpf,
            categoria_cnh: driver.categoria_cnh,
            validade_cnh: driver.validade_cnh,
            status: driver.status
        });
        setShowModal(true);
    };

    const handleDelete = async () => {
        if (!window.confirm('Tem certeza que deseja excluir este motorista? Esta ação não pode ser desfeita.')) return;

        try {
            const { error } = await supabase.from('drivers').delete().eq('id', editId);
            if (error) throw error;

            setShowModal(false);
            fetchDrivers();
            alert('Motorista excluído com sucesso!');
        } catch (error) {
            alert('Erro ao excluir: ' + error.message);
        }
    };

    const handleNew = () => {
        setIsEditing(false);
        setEditId(null);
        setFormData({
            nome: '',
            cpf: '',
            categoria_cnh: 'B',
            validade_cnh: '',
            status: 'ativo'
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                name: formData.nome,
                license_number: formData.cpf,
                category: formData.categoria_cnh,
                expiration_date: formData.validade_cnh,
                status: formData.status
            };

            if (isEditing) {
                // Update
                const { error } = await supabase.from('drivers').update(payload).eq('id', editId);
                if (error) throw error;
                alert('Motorista atualizado com sucesso!');
            } else {
                // Insert
                const { error } = await supabase.from('drivers').insert([payload]);
                if (error) throw error;
                alert('Motorista cadastrado com sucesso!');
            }

            setShowModal(false);
            fetchDrivers();
            setFormData({
                nome: '',
                cpf: '',
                categoria_cnh: 'B',
                validade_cnh: '',
                status: 'ativo'
            });
        } catch (error) {
            alert('Erro ao salvar motorista: ' + error.message);
        }
    };

    const calculateCNHStatus = (validadeDate) => {
        if (!validadeDate) return { label: 'Inválida', color: 'bg-gray-100 text-gray-700' };

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const validade = new Date(validadeDate + 'T00:00:00');

        const diffTime = validade - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return { label: 'Vencida', color: 'bg-red-100 text-red-700 border-red-200' };
        if (diffDays <= 30) return { label: 'A vencer', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' };
        return { label: 'Válida', color: 'bg-green-100 text-green-700 border-green-200' };
    };

    const filteredDrivers = drivers.filter(d =>
        d.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.cpf.includes(searchTerm)
    );

    return (
        <div className="space-y-6 animate-fade-in text-white">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight italic uppercase">
                        CADASTRO DE <span className="text-sky-500">MOTORISTAS</span>
                    </h1>
                    <p className="text-slate-400">Gerencie condutores e validade de CNH</p>
                </div>
                {isGestor && (
                    <button
                        onClick={handleNew}
                        className="flex items-center justify-center px-4 py-2 bg-sky-600 text-white rounded-xl hover:bg-sky-700 transition shadow-lg shadow-sky-900/20 font-bold uppercase tracking-widest text-[10px]"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        NOVO CONDUTOR
                    </button>
                )}
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-5 h-5" />
                <input
                    type="text"
                    placeholder="Buscar por nome ou CPF..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border-white/10 text-white focus:ring-sky-500 focus:border-sky-500 shadow-sm outline-none"
                />
            </div>

            {/* List */}
            {loading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600 mx-auto"></div>
                </div>
            ) : drivers.length === 0 ? (

                <div className="text-center py-12 bg-[#1c2229] rounded-2xl border border-dashed border-white/10">
                    <Users className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-400">Nenhum condutor cadastrado</h3>
                    <button
                        onClick={handleNew}
                        className="text-sky-500 font-medium hover:underline mt-4"
                    >
                        Cadastrar agora
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredDrivers.map((driver) => {
                        const statusCNH = calculateCNHStatus(driver.validade_cnh);
                        return (
                            <div
                                key={driver.id}
                                onClick={() => handleEdit(driver)}
                                className="bg-[#1c2229] rounded-2xl p-6 shadow-xl border border-white/5 group hover:border-sky-500/30 transition-all duration-300 cursor-pointer relative"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center">
                                        <div className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center text-sky-500 font-black text-xl mr-4 group-hover:scale-110 transition-transform">
                                            {driver.nome.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black text-white uppercase tracking-tight">{driver.nome}</h3>
                                            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">{driver.categoria_cnh}</p>
                                        </div>
                                    </div>
                                    <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${driver.status === 'ativo' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-gray-500/10 text-gray-500 border-gray-500/20'}`}>
                                        {driver.status}
                                    </div>
                                </div>

                                <div className="bg-white/5 rounded-xl p-4 mt-2 border border-white/5">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Validade CNH</span>
                                        <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase ${statusCNH.color.replace('bg-', 'bg-').replace('text-', 'text-')}`}>
                                            {statusCNH.label}
                                        </span>
                                    </div>
                                    <div className="text-white font-black text-xl italic tracking-tighter">
                                        {new Date(driver.validade_cnh).toLocaleDateString('pt-BR')}
                                    </div>
                                </div>

                                <div className="mt-4 pt-4 border-t border-white/5 flex justify-between text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                                    <span>CPF: {driver.cpf}</span>
                                    <span className="text-sky-500 group-hover:underline">{isGestor ? 'Clique para editar' : 'Clique para visualizar'}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
                    <div className="bg-[#1c2229] border border-white/10 rounded-3xl w-full max-w-lg shadow-2xl p-8 animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-xl font-black text-white italic uppercase tracking-tight">
                                {isEditing ? 'Editar' : 'Novo'} <span className="text-sky-500">Condutor</span>
                            </h2>
                            <button onClick={() => setShowModal(false)} className="bg-white/5 p-2 rounded-xl text-slate-400 hover:text-white transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest">Nome Completo</label>
                                <input
                                    type="text"
                                    required
                                    readOnly={!isGestor}
                                    value={formData.nome}
                                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                                    className={`w-full bg-white/5 border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all placeholder:text-slate-600 ${!isGestor ? 'opacity-70 cursor-not-allowed' : ''}`}
                                    placeholder="Ex: Gabriel Silva"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest">CPF</label>
                                    <input
                                        type="text"
                                        required
                                        readOnly={!isGestor}
                                        value={formData.cpf}
                                        onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                                        className={`w-full bg-white/5 border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all placeholder:text-slate-600 ${!isGestor ? 'opacity-70 cursor-not-allowed' : ''}`}
                                        placeholder="000.000.000-00"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest">Categoria CNH</label>
                                    <select
                                        disabled={!isGestor}
                                        value={formData.categoria_cnh}
                                        onChange={(e) => setFormData({ ...formData, categoria_cnh: e.target.value })}
                                        className={`w-full bg-white/5 border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all ${!isGestor ? 'opacity-70 cursor-not-allowed' : ''}`}
                                    >
                                        <option className="bg-[#1c2229]">A</option>
                                        <option className="bg-[#1c2229]">B</option>
                                        <option className="bg-[#1c2229]">C</option>
                                        <option className="bg-[#1c2229]">D</option>
                                        <option className="bg-[#1c2229]">E</option>
                                        <option className="bg-[#1c2229]">AB</option>
                                        <option className="bg-[#1c2229]">AD</option>
                                        <option className="bg-[#1c2229]">AE</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest">Validade CNH</label>
                                <input
                                    type="date"
                                    required
                                    readOnly={!isGestor}
                                    value={formData.validade_cnh}
                                    onChange={(e) => setFormData({ ...formData, validade_cnh: e.target.value })}
                                    className={`w-full bg-white/5 border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all ${!isGestor ? 'opacity-70 cursor-not-allowed' : ''}`}
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest">Status</label>
                                <select
                                    disabled={!isGestor}
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    className={`w-full bg-white/5 border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all ${!isGestor ? 'opacity-70 cursor-not-allowed' : ''}`}
                                >
                                    <option value="ativo" className="bg-[#1c2229]">Ativo</option>
                                    <option value="inativo" className="bg-[#1c2229]">Inativo</option>
                                </select>
                            </div>

                            <div className="pt-4 flex gap-4">
                                {isEditing && isGestor && (
                                    <button
                                        type="button"
                                        onClick={handleDelete}
                                        className="px-4 py-3 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl hover:bg-red-500/20 font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-4 py-3 border border-white/10 rounded-xl text-slate-400 hover:bg-white/5 hover:text-white font-black uppercase tracking-widest text-xs transition-all"
                                >
                                    {isGestor ? 'Cancelar' : 'Fechar'}
                                </button>
                                {isGestor && (
                                    <button
                                        type="submit"
                                        className="flex-1 px-4 py-3 bg-sky-600 text-white rounded-xl hover:bg-sky-700 font-black uppercase tracking-widest text-xs shadow-xl shadow-sky-900/20 transition-all"
                                    >
                                        {isEditing ? 'Atualizar' : 'Salvar'} Motorista
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Drivers;
