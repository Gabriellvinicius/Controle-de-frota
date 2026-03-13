import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { Plus, Search, FileText, DollarSign, Calendar, Car, User, Trash2, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

const Fines = () => {
    const [fines, setFines] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [drivers, setDrivers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const [formData, setFormData] = useState({
        veiculo_id: '',
        condutor_id: '',
        valor: '',
        data: new Date().toISOString().split('T')[0],
        descricao: '',
        status: 'pendente'
    });

    const [error, setError] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);
            // Changed: 'veiculos' -> 'vehicles', 'condutores' -> 'drivers'
            // Changed columns: 'placa' -> 'plate', 'nome' -> 'name'
            const [finesRes, vehiclesRes, driversRes] = await Promise.all([
                supabase.from('multas').select('*, vehicles(plate, model), drivers(name)').order('data', { ascending: false }),
                supabase.from('vehicles').select('id, plate, model').eq('status', 'ativo'),
                supabase.from('drivers').select('id, name').eq('status', 'ativo')
            ]);

            if (finesRes.error) throw new Error('Erro ao buscar multas: ' + finesRes.error.message);
            if (vehiclesRes.error) throw new Error('Erro ao buscar veículos: ' + vehiclesRes.error.message);
            if (driversRes.error) throw new Error('Erro ao buscar condutores: ' + driversRes.error.message);

            setFines(finesRes.data || []);
            // Map DB English -> State Portuguese for Dropdowns
            setVehicles((vehiclesRes.data || []).map(v => ({ id: v.id, placa: v.plate, modelo: v.model })));
            setDrivers((driversRes.data || []).map(d => ({ id: d.id, nome: d.name })));
        } catch (error) {
            console.error('Erro ao buscar dados:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const { error } = await supabase.from('multas').insert([formData]);
            if (error) throw error;

            setShowModal(false);
            setFormData({
                veiculo_id: '',
                condutor_id: '',
                valor: '',
                data: new Date().toISOString().split('T')[0],
                descricao: '',
                status: 'pendente'
            });
            fetchData();
            alert('Multa registrada com sucesso!');
        } catch (error) {
            alert('Erro ao registrar multa: ' + error.message);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Tem certeza que deseja excluir esta multa?')) return;
        try {
            const { error } = await supabase.from('multas').delete().eq('id', id);
            if (error) throw error;
            fetchData();
        } catch (error) {
            alert('Erro ao excluir: ' + error.message);
        }
    };

    const toggleStatus = async (fine) => {
        try {
            const newStatus = fine.status === 'pendente' ? 'pago' : 'pendente';
            const { error } = await supabase.from('multas').update({ status: newStatus }).eq('id', fine.id);
            if (error) throw error;
            fetchData();
        } catch (error) {
            console.error('Erro ao atualizar status:', error);
        }
    };

    const filteredFines = fines.filter(f =>
        f.vehicles?.plate?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.drivers?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                        Gestão de <span className="text-sky-500">Multas</span>
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Controle de infrações e custos</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center justify-center px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition font-bold text-sm uppercase tracking-wide"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Nova Multa
                </button>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-5 h-5" />
                <input
                    type="text"
                    placeholder="Buscar por placa ou motorista..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none shadow-sm transition-colors"
                />
            </div>

            {/* Error Alert */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-xl flex items-center gap-3">
                    <AlertTriangle className="w-6 h-6 shrink-0" />
                    <div>
                        <h3 className="font-bold">Erro ao carregar dados</h3>
                        <p className="text-sm opacity-90">{error}</p>
                    </div>
                </div>
            )}

            {/* List */}
            {loading ? (
                <div className="text-center py-12 text-red-500 font-bold text-xl">
                    CARREGANDO DADOS... (Processando)
                </div>
            ) : filteredFines.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 transition-colors">
                    <FileText className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-500 dark:text-slate-400">Nenhuma multa registrada</h3>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredFines.map((fine) => (
                        <div key={fine.id} className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700 hover:border-sky-500/30 transition-all shadow-sm group">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-red-500/10 rounded-lg text-red-500">
                                        <FileText className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 dark:text-white text-lg">
                                            {Number(fine.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                        </h3>
                                        <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">
                                            {new Date(fine.data).toLocaleDateString('pt-BR')}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => toggleStatus(fine)}
                                    className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-colors ${fine.status === 'pago'
                                        ? 'bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20'
                                        : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20 hover:bg-yellow-500/20'
                                        }`}
                                >
                                    {fine.status}
                                </button>
                            </div>

                            <div className="space-y-3 mb-4">
                                <div className="flex items-center text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg transition-colors">
                                    <Car className="w-4 h-4 mr-3 text-slate-400 dark:text-slate-500" />
                                    <span className="font-medium">{fine.vehicles?.model}</span>
                                    <span className="mx-2 text-slate-300 dark:text-slate-600">•</span>
                                    <span className="text-slate-500 dark:text-slate-400">{fine.vehicles?.plate}</span>
                                </div>
                                <div className="flex items-center text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg transition-colors">
                                    <User className="w-4 h-4 mr-3 text-slate-400 dark:text-slate-500" />
                                    <span className="font-medium">{fine.drivers?.name}</span>
                                </div>
                            </div>

                            {fine.descricao && (
                                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 italic">"{fine.descricao}"</p>
                            )}

                            <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-end">
                                <button
                                    onClick={() => handleDelete(fine.id)}
                                    className="p-2 text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10"
                                    title="Excluir"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 dark:bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl p-6 transition-colors">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Nova Multa</h2>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Veículo</label>
                                    <select
                                        required
                                        value={formData.veiculo_id}
                                        onChange={(e) => setFormData({ ...formData, veiculo_id: e.target.value })}
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none transition-colors"
                                    >
                                        <option value="">Selecione...</option>
                                        {vehicles.map(v => (
                                            <option key={v.id} value={v.id}>{v.modelo} - {v.placa}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Condutor</label>
                                    <select
                                        required
                                        value={formData.condutor_id}
                                        onChange={(e) => setFormData({ ...formData, condutor_id: e.target.value })}
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none transition-colors"
                                    >
                                        <option value="">Selecione...</option>
                                        {drivers.map(d => (
                                            <option key={d.id} value={d.id}>{d.nome}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Valor</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        value={formData.valor}
                                        onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none transition-colors"
                                        placeholder="0,00"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Data</label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.data}
                                        onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none transition-colors"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Descrição / Infração</label>
                                <textarea
                                    rows="3"
                                    value={formData.descricao}
                                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none transition-colors"
                                    placeholder="Ex: Excesso de velocidade..."
                                ></textarea>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 font-bold text-sm transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 font-bold text-sm shadow-lg shadow-sky-900/20"
                                >
                                    Salvar Multa
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Fines;
