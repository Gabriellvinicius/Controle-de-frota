import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { Plus, Search, Car, AlertCircle, Filter, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Vehicles = () => {
    const { isGestor } = useAuth();
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [filter, setFilter] = useState('all');

    // Edit Mode State
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);

    const [formData, setFormData] = useState({
        placa: '',
        marca: '',
        modelo: '',
        ano: new Date().getFullYear(),
        tipo: 'Carro',
        status: 'ativo',
        proxima_manutencao: ''
    });

    useEffect(() => {
        fetchVehicles();
    }, []);

    const fetchVehicles = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('vehicles')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            // Map DB (English) -> State (Portuguese)
            const mappedData = (data || []).map(v => ({
                id: v.id,
                placa: v.plate,
                marca: v.brand,
                modelo: v.model,
                ano: v.year,
                tipo: v.type,
                status: v.status,
                proxima_manutencao: v.next_maintenance_date
            }));
            setVehicles(mappedData);
        } catch (error) {
            console.error('Erro ao buscar veículos:', error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (vehicle) => {
        setIsEditing(true);
        setEditId(vehicle.id);
        setFormData({
            placa: vehicle.placa,
            marca: vehicle.marca,
            modelo: vehicle.modelo,
            ano: vehicle.ano,
            tipo: vehicle.tipo,
            status: vehicle.status,
            proxima_manutencao: vehicle.proxima_manutencao || ''
        });
        setShowModal(true);
    };

    const handleDelete = async () => {
        if (!window.confirm('Tem certeza que deseja excluir este veículo? Esta ação não pode ser desfeita.')) return;

        try {
            const { error } = await supabase.from('vehicles').delete().eq('id', editId);
            if (error) throw error;

            setShowModal(false);
            fetchVehicles();
            alert('Veículo excluído com sucesso!');
        } catch (error) {
            alert('Erro ao excluir: ' + error.message);
        }
    };

    const handleNew = () => {
        setIsEditing(false);
        setEditId(null);
        setFormData({
            placa: '',
            marca: '',
            modelo: '',
            ano: new Date().getFullYear(),
            tipo: 'Carro',
            status: 'ativo',
            proxima_manutencao: ''
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                plate: formData.placa,
                brand: formData.marca,
                model: formData.modelo,
                year: formData.ano,
                type: formData.tipo,
                status: formData.status,
                next_maintenance_date: formData.proxima_manutencao || null
            };

            if (isEditing) {
                // Update
                const { error } = await supabase.from('vehicles').update(payload).eq('id', editId);
                if (error) throw error;
                alert('Veículo atualizado com sucesso!');
            } else {
                // Insert
                const { error } = await supabase.from('vehicles').insert([payload]);
                if (error) throw error;
                alert('Veículo cadastrado com sucesso!');
            }

            setShowModal(false);
            fetchVehicles();
            setFormData({
                placa: '',
                marca: '',
                modelo: '',
                ano: new Date().getFullYear(),
                tipo: 'Carro',
                status: 'ativo',
                proxima_manutencao: ''
            });
        } catch (error) {
            alert('Erro ao salvar veículo: ' + error.message);
        }
    };

    const filteredVehicles = vehicles.filter((v) =>
        filter === 'all' ? true : v.status === filter
    );

    const getStatusColor = (status) => {
        switch (status) {
            case 'ativo': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]';
            case 'manutenção': return 'bg-sky-500/10 text-sky-500 border-sky-500/20 shadow-[0_0_15px_rgba(14,165,233,0.1)]';
            case 'inativo': return 'bg-red-500/10 text-red-500 border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.1)]';
            default: return 'bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-white/10';
        }
    };

    return (
        <div className="space-y-6 animate-fade-in text-slate-900 dark:text-white">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight italic uppercase">
                        Gestão de <span className="text-sky-500">Veículos</span>
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400">Gerencie todos os veículos da empresa</p>
                </div>
                {isGestor && (
                    <button
                        onClick={handleNew}
                        className="flex items-center justify-center px-4 py-2 bg-sky-600 text-white rounded-xl hover:bg-sky-700 transition shadow-lg shadow-sky-900/20 font-bold uppercase tracking-widest text-xs"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Novo Veículo
                    </button>
                )}
            </div>

            {/* Filters & Stats */}
            <div className="flex flex-wrap gap-2 pb-2">
                {['all', 'ativo', 'manutenção', 'inativo'].map((s) => (
                    <button
                        key={s}
                        onClick={() => setFilter(s)}
                        className={`px-4 py-2 rounded-xl text-sm font-bold capitalize transition-all ${filter === s
                            ? 'bg-sky-600 text-white shadow-lg shadow-sky-900/20'
                            : 'bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-200 dark:border-white/5'
                            }`}
                    >
                        {s === 'all' ? 'Todos' : s}
                    </button>
                ))}
            </div>

            {/* Grid */}
            {loading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600 mx-auto"></div>
                    <p className="mt-4 text-slate-500">Carregando frota...</p>
                </div>
            ) : vehicles.length === 0 ? (

                <div className="text-center py-12 bg-white dark:bg-[#1c2229] rounded-2xl border border-dashed border-slate-200 dark:border-white/10">
                    <Car className="w-16 h-16 text-slate-400 dark:text-slate-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-500 dark:text-slate-400">Nenhum veículo cadastrado</h3>
                    <p className="text-slate-500 mb-6">Comece adicionando o primeiro veículo da frota.</p>
                    <button
                        onClick={handleNew}
                        className="text-sky-500 font-medium hover:underline"
                    >
                        Cadastrar agora
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredVehicles.map((vehicle) => (
                        <div
                            key={vehicle.id}
                            onClick={() => handleEdit(vehicle)}
                            className="bg-white dark:bg-[#1c2229] rounded-2xl p-6 shadow-xl border border-slate-200 dark:border-white/5 group hover:border-sky-500/30 transition-all duration-300 cursor-pointer relative"
                        >
                            <div className="flex justify-between items-start mb-6">
                                <div className="p-3 bg-slate-50 dark:bg-white/5 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                                    <Car className="w-6 h-6 text-sky-500" />
                                </div>
                                <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider border ${getStatusColor(vehicle.status)}`}>
                                    {vehicle.status}
                                </span>
                            </div>
                            <h3 className="text-xl font-black text-slate-900 dark:text-white">{vehicle.modelo}</h3>
                            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 flex items-center font-medium uppercase tracking-tighter opacity-80">
                                {vehicle.marca} <span className="mx-2 text-sky-500/50">•</span> {vehicle.ano}
                            </p>

                            <div className="space-y-3 border-t border-slate-200 dark:border-white/5 pt-6">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Placa</span>
                                    <span className="font-mono font-bold text-slate-900 dark:text-white bg-slate-50 dark:bg-white/5 px-2 py-1 rounded-lg border border-slate-200 dark:border-white/10 uppercase">{vehicle.placa}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Tipo</span>
                                    <span className="font-bold text-slate-700 dark:text-slate-300">{vehicle.tipo}</span>
                                </div>
                                {vehicle.proxima_manutencao && (
                                    <div className="flex justify-between items-center text-sm pt-2">
                                        <span className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Próx. Revisão</span>
                                        {(() => {
                                            const today = new Date();
                                            today.setHours(0, 0, 0, 0);
                                            const nextDate = new Date(vehicle.proxima_manutencao + 'T00:00:00'); // Ensure TZ correctness
                                            const diffTime = nextDate - today;
                                            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                                            let badgeStyle = "text-slate-700 dark:text-slate-300";
                                            let icon = null;

                                            if (diffDays < 0) {
                                                badgeStyle = "text-red-500 animate-pulse font-black";
                                                icon = <AlertCircle className="w-4 h-4 mr-1 inline" />;
                                            } else if (diffDays <= 7) {
                                                badgeStyle = "text-yellow-500 font-black";
                                                icon = <AlertCircle className="w-4 h-4 mr-1 inline" />;
                                            }

                                            return (
                                                <span className={`flex items-center ${badgeStyle}`}>
                                                    {icon}
                                                    {new Date(vehicle.proxima_manutencao).toLocaleDateString('pt-BR')}
                                                </span>
                                            );
                                        })()}
                                    </div>
                                )}
                            </div>
                            <div className="mt-4 pt-2 text-right border-t border-slate-200 dark:border-white/5">
                                <span className="text-[10px] text-sky-500 font-bold uppercase tracking-widest group-hover:underline">
                                    {isGestor ? 'Editar' : 'Visualizar'}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 dark:bg-black/70 backdrop-blur-md p-4">
                    <div className="bg-white dark:bg-[#1c2229] border border-slate-200 dark:border-white/10 rounded-3xl w-full max-w-lg shadow-2xl p-8 animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-xl font-black text-slate-900 dark:text-white italic uppercase tracking-tight">
                                {isEditing ? 'Editar' : 'Novo'} <span className="text-sky-500">Veículo</span>
                            </h2>
                            <button onClick={() => setShowModal(false)} className="bg-slate-50 dark:bg-white/5 p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest">Placa</label>
                                    <input
                                        type="text"
                                        required
                                        readOnly={!isGestor}
                                        maxLength={7}
                                        value={formData.placa}
                                        onChange={(e) => setFormData({ ...formData, placa: e.target.value.toUpperCase() })}
                                        className={`w-full bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 font-mono uppercase ${!isGestor ? 'opacity-70 cursor-not-allowed' : ''}`}
                                        placeholder="ABC1D23"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest">Ano</label>
                                    <input
                                        type="number"
                                        required
                                        readOnly={!isGestor}
                                        value={formData.ano}
                                        onChange={(e) => setFormData({ ...formData, ano: e.target.value })}
                                        className={`w-full bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 ${!isGestor ? 'opacity-70 cursor-not-allowed' : ''}`}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest">Marca</label>
                                <input
                                    type="text"
                                    required
                                    readOnly={!isGestor}
                                    value={formData.marca}
                                    onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
                                    className={`w-full bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 ${!isGestor ? 'opacity-70 cursor-not-allowed' : ''}`}
                                    placeholder="Ex: Fiat"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest">Modelo</label>
                                <input
                                    type="text"
                                    required
                                    readOnly={!isGestor}
                                    value={formData.modelo}
                                    onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
                                    className={`w-full bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 ${!isGestor ? 'opacity-70 cursor-not-allowed' : ''}`}
                                    placeholder="Ex: Uno Vivace"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest">Tipo</label>
                                    <select
                                        disabled={!isGestor}
                                        value={formData.tipo}
                                        onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                                        className={`w-full bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all ${!isGestor ? 'opacity-70 cursor-not-allowed' : ''}`}
                                    >
                                        <option className="bg-white dark:bg-[#1c2229]">Carro</option>
                                        <option className="bg-white dark:bg-[#1c2229]">Moto</option>
                                        <option className="bg-white dark:bg-[#1c2229]">Caminhão</option>
                                        <option className="bg-white dark:bg-[#1c2229]">Utilitário</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest">Status</label>
                                    <select
                                        disabled={!isGestor}
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                        className={`w-full bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all ${!isGestor ? 'opacity-70 cursor-not-allowed' : ''}`}
                                    >
                                        <option value="ativo" className="bg-white dark:bg-[#1c2229]">Ativo</option>
                                        <option value="manutenção" className="bg-white dark:bg-[#1c2229]">Manutenção</option>
                                        <option value="inativo" className="bg-white dark:bg-[#1c2229]">Inativo</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest">Próxima Manutenção (Opcional)</label>
                                <input
                                    type="date"
                                    readOnly={!isGestor}
                                    value={formData.proxima_manutencao || ''}
                                    onChange={(e) => setFormData({ ...formData, proxima_manutencao: e.target.value })}
                                    className={`w-full bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all ${!isGestor ? 'opacity-70 cursor-not-allowed' : ''}`}
                                />
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
                                    className="flex-1 px-4 py-3 border border-slate-200 dark:border-white/10 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white font-black uppercase tracking-widest text-xs transition-all"
                                >
                                    {isGestor ? 'Cancelar' : 'Fechar'}
                                </button>
                                {isGestor && (
                                    <button
                                        type="submit"
                                        className="flex-1 px-4 py-3 bg-sky-600 text-white rounded-xl hover:bg-sky-700 font-black uppercase tracking-widest text-xs shadow-xl shadow-sky-900/20 transition-all"
                                    >
                                        {isEditing ? 'Atualizar' : 'Salvar'} Veículo
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

export default Vehicles;
