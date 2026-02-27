import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { Wrench, Plus, Calendar, DollarSign, Filter, X, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Maintenance = () => {
    const { isGestor } = useAuth();
    const [data, setData] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [showModal, setShowModal] = useState(false);

    // Edit Mode State
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);

    const [formData, setFormData] = useState({
        veiculo_id: '',
        tipo: 'Preventiva',
        data: new Date().toISOString().split('T')[0],
        custo: '',
        status: 'pendente',
        descricao: '',
        proxima_manutencao: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        const { data: v } = await supabase.from('vehicles').select('id, model, plate').order('model');
        const { data: m } = await supabase.from('maintenances')
            .select('*, vehicles(model, plate)')
            .order('date', { ascending: false });

        const mappedVehicles = (v || []).map(item => ({ id: item.id, modelo: item.model, placa: item.plate }));
        const mappedData = (m || []).map(item => ({
            id: item.id,
            veiculo_id: item.vehicle_id,
            tipo: item.type,
            data: item.date,
            custo: item.cost,
            status: item.status,
            descricao: item.description,
            veiculos: item.vehicles
                ? { modelo: item.vehicles.model, placa: item.vehicles.plate }
                : { modelo: item.vehicle_model, placa: item.vehicle_plate }
        }));

        setVehicles(mappedVehicles);
        setData(mappedData);
    };

    const handleEdit = (item) => {
        setIsEditing(true);
        setEditId(item.id);
        setFormData({
            veiculo_id: item.veiculo_id,
            tipo: item.tipo,
            data: item.data,
            custo: item.custo,
            status: item.status,
            descricao: item.descricao || '',
            proxima_manutencao: '' // We don't pull next maintenance date from maintenance record usually, it's on vehicle. Kept empty to avoid overwriting unless intentional.
        });
        setShowModal(true);
    };

    const handleDelete = async () => {
        if (!window.confirm('Tem certeza que deseja excluir este registro de manutenção?')) return;

        try {
            const { error } = await supabase.from('maintenances').delete().eq('id', editId);
            if (error) throw error;

            setShowModal(false);
            fetchData();
            alert('Manutenção excluída com sucesso!');
        } catch (error) {
            alert('Erro ao excluir: ' + error.message);
        }
    };

    const handleNew = () => {
        setIsEditing(false);
        setEditId(null);
        setFormData({
            veiculo_id: '',
            tipo: 'Preventiva',
            data: new Date().toISOString().split('T')[0],
            custo: '',
            status: 'pendente',
            descricao: '',
            proxima_manutencao: ''
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                vehicle_id: formData.veiculo_id,
                type: formData.tipo,
                date: formData.data,
                cost: formData.custo,
                status: formData.status,
                description: formData.descricao,
                vehicle_model: vehicles.find(v => v.id === formData.veiculo_id)?.modelo,
                vehicle_plate: vehicles.find(v => v.id === formData.veiculo_id)?.placa
            };

            if (isEditing) {
                // Update
                const { error } = await supabase.from('maintenances').update(payload).eq('id', editId);
                if (error) throw error;
                alert('Manutenção atualizada com sucesso!');
            } else {
                // Insert
                const { error } = await supabase.from('maintenances').insert([payload]);
                if (error) throw error;

                // Update Vehicle's next maintenance date if provided (only on creation usually, or intentional update)
                if (formData.proxima_manutencao) {
                    const { error: vehicleError } = await supabase
                        .from('vehicles')
                        .update({ next_maintenance_date: formData.proxima_manutencao })
                        .eq('id', formData.veiculo_id);

                    if (vehicleError) console.error('Erro ao atualizar próxima manutenção do veículo:', vehicleError);
                }
                alert('Manutenção registrada com sucesso!');
            }

            setShowModal(false);
            fetchData();
            setFormData({
                veiculo_id: '',
                tipo: 'Preventiva',
                data: new Date().toISOString().split('T')[0],
                custo: '',
                status: 'pendente',
                descricao: '',
                proxima_manutencao: ''
            });

        } catch (error) {
            alert('Erro: ' + error.message);
        }
    };

    const statusColor = (s) => s === 'em dia' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700';

    return (
        <div className="space-y-6 animate-fade-in text-white">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight italic uppercase">
                        Plano de <span className="text-sky-500">Manutenção</span>
                    </h1>
                    <p className="text-slate-400">Histórico de reparos e revisões</p>
                </div>
                {isGestor && (
                    <button
                        onClick={handleNew}
                        className="flex items-center justify-center px-4 py-2 bg-sky-600 text-white rounded-xl hover:bg-sky-700 transition shadow-lg shadow-sky-900/20 font-bold uppercase tracking-widest text-xs"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Registrar Manutenção
                    </button>
                )}
            </div>

            <div className="bg-[#1c2229] rounded-2xl shadow-xl border border-white/5 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-white/5 border-b border-white/5 text-[10px] uppercase font-black text-slate-500 tracking-widest">
                            <tr>
                                <th className="px-6 py-4">Veículo</th>
                                <th className="px-6 py-4">Tipo</th>
                                <th className="px-6 py-4">Data</th>
                                <th className="px-6 py-4">Custo</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {data.map((item) => (
                                <tr
                                    key={item.id}
                                    onClick={() => handleEdit(item)}
                                    className="hover:bg-slate-50/5 transition-colors cursor-pointer group"
                                >
                                    <td className="px-6 py-4 font-black text-white italic uppercase tracking-tight">
                                        {item.veiculos?.modelo} <span className="text-slate-400 font-normal">({item.veiculos?.placa})</span>
                                    </td>
                                    <td className="px-6 py-4 font-medium text-slate-300">{item.tipo}</td>
                                    <td className="px-6 py-4 font-mono text-slate-400">{new Date(item.data).toLocaleDateString('pt-BR')}</td>
                                    <td className="px-6 py-4 font-black text-white italic tracking-tighter">R$ {parseFloat(item.custo).toFixed(2)}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${item.status === 'concluída' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-yellow-500/10 text-yellow-500'
                                            }`}>
                                            {item.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className="text-xs text-sky-500 font-bold uppercase opacity-0 group-hover:opacity-100 transition-opacity">
                                            {isGestor ? 'Editar' : 'Visualizar'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {data.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                                        Nenhuma manutenção registrada.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                {/* Modal */}
                {showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
                        <div className="bg-[#1c2229] border border-white/10 rounded-3xl w-full max-w-lg shadow-2xl p-8 animate-in zoom-in-95 duration-200">
                            <div className="flex justify-between items-center mb-8">
                                <h2 className="text-xl font-black text-white italic uppercase tracking-tight">
                                    {isEditing ? 'Editar' : 'Nova'} <span className="text-sky-500">Manutenção</span>
                                </h2>
                                <button onClick={() => setShowModal(false)} className="bg-white/5 p-2 rounded-xl text-slate-400 hover:text-white transition-colors">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest">Veículo</label>
                                    <select
                                        required
                                        value={formData.veiculo_id}
                                        onChange={(e) => setFormData({ ...formData, veiculo_id: e.target.value })}
                                        className="w-full bg-white/5 border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all"
                                    >
                                        <option value="" className="bg-[#1c2229]">Selecione um veículo</option>
                                        {vehicles.map(v => (
                                            <option key={v.id} value={v.id} className="bg-[#1c2229]">
                                                {v.modelo} ({v.placa})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest">Tipo de Serviço</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.tipo}
                                            onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                                            className="w-full bg-white/5 border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all placeholder:text-slate-600"
                                            placeholder="Ex: Troca de óleo"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest">Custo (R$)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            required
                                            value={formData.custo}
                                            onChange={(e) => setFormData({ ...formData, custo: e.target.value })}
                                            className="w-full bg-white/5 border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all placeholder:text-slate-600"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest">Próxima Manutenção (Opcional)</label>
                                        <input
                                            type="date"
                                            value={formData.proxima_manutencao}
                                            onChange={(e) => setFormData({ ...formData, proxima_manutencao: e.target.value })}
                                            className="w-full bg-white/5 border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest">Data</label>
                                        <input
                                            type="date"
                                            required
                                            value={formData.data}
                                            onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                                            className="w-full bg-white/5 border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest">Status</label>
                                        <select
                                            value={formData.status}
                                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                            className="w-full bg-white/5 border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all"
                                        >
                                            <option value="concluída" className="bg-[#1c2229]">Concluída</option>
                                            <option value="pendente" className="bg-[#1c2229]">Pendente</option>
                                            <option value="em andamento" className="bg-[#1c2229]">Em Andamento</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest">Descrição / Observações</label>
                                    <textarea
                                        value={formData.descricao}
                                        onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                                        className="w-full bg-white/5 border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all placeholder:text-slate-600 h-24 resize-none"
                                        placeholder="Detalhes sobre a manutenção realizada..."
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
                                        className="flex-1 px-4 py-3 border border-white/10 rounded-xl text-slate-400 hover:bg-white/5 hover:text-white font-black uppercase tracking-widest text-xs transition-all"
                                    >
                                        {isGestor ? 'Cancelar' : 'Fechar'}
                                    </button>
                                    {isGestor && (
                                        <button
                                            type="submit"
                                            className="flex-1 px-4 py-3 bg-sky-600 text-white rounded-xl hover:bg-sky-700 font-black uppercase tracking-widest text-xs shadow-xl shadow-sky-900/20 transition-all"
                                        >
                                            {isEditing ? 'Atualizar' : 'Salvar'} Manutenção
                                        </button>
                                    )}
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Maintenance;
