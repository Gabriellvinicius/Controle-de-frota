import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { Fuel, Plus, Droplets, TrendingUp, X, Trash2, Users } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const FuelPage = () => {
    const { isGestor } = useAuth();
    const [data, setData] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);
    const [formData, setFormData] = useState({
        veiculo_id: '',
        condutor_id: '',
        data: new Date().toISOString().split('T')[0],
        litros: '',
        valor: '',
        km: ''
    });
    const [drivers, setDrivers] = useState([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        const { data: v } = await supabase.from('vehicles').select('id, model, plate').order('model');
        const { data: d } = await supabase.from('drivers').select('id, name').order('name');
        const { data: a } = await supabase.from('refuelings')
            .select('*, vehicles(model, plate), drivers(name)')
            .order('date', { ascending: false });

        const mappedVehicles = (v || []).map(item => ({ id: item.id, modelo: item.model, placa: item.plate }));
        const mappedDrivers = (d || []).map(item => ({ id: item.id, nome: item.name }));
        const mappedData = (a || []).map(item => ({
            id: item.id,
            veiculo_id: item.vehicle_id,
            condutor_id: item.condutor_id,
            data: item.date,
            litros: item.liters,
            valor: item.value,
            km: item.km,
            veiculos: item.vehicles
                ? { modelo: item.vehicles.model, placa: item.vehicles.plate }
                : { modelo: item.vehicle_model, placa: item.vehicle_plate },
            condutores: item.drivers
                ? { nome: item.drivers.name }
                : { nome: item.driver_name }
        }));

        setVehicles(mappedVehicles);
        setDrivers(mappedDrivers);
        setData(mappedData);
    };

    const handleEdit = (item) => {
        setIsEditing(true);
        setEditId(item.id);
        setFormData({
            veiculo_id: item.veiculo_id,
            condutor_id: item.condutor_id,
            data: item.data,
            litros: item.litros,
            valor: item.valor,
            km: item.km
        });
        setShowModal(true);
    };

    const handleNew = () => {
        setIsEditing(false);
        setEditId(null);
        setFormData({
            veiculo_id: '',
            condutor_id: '',
            data: new Date().toISOString().split('T')[0],
            litros: '',
            valor: '',
            km: ''
        });
        setShowModal(true);
    };

    const handleDelete = async () => {
        if (!window.confirm('Tem certeza que deseja excluir este registro de abastecimento?')) return;

        try {
            const { error } = await supabase.from('refuelings').delete().eq('id', editId);
            if (error) throw error;

            setShowModal(false);
            fetchData();
            alert('Registro excluído com sucesso!');
        } catch (error) {
            alert('Erro ao excluir: ' + error.message);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                vehicle_id: formData.veiculo_id,
                condutor_id: formData.condutor_id,
                date: formData.data,
                liters: formData.litros,
                value: formData.valor,
                km: formData.km,
                vehicle_model: vehicles.find(v => v.id === formData.veiculo_id)?.modelo,
                vehicle_plate: vehicles.find(v => v.id === formData.veiculo_id)?.placa,
                driver_name: drivers.find(d => d.id === formData.condutor_id)?.nome
            };

            if (isEditing) {
                const { error } = await supabase.from('refuelings').update(payload).eq('id', editId);
                if (error) throw error;
                alert('Abastecimento atualizado!');
            } else {
                const { error } = await supabase.from('refuelings').insert([payload]);
                if (error) throw error;
                alert('Abastecimento registrado!');
            }
            setShowModal(false);
            fetchData();
        } catch (error) {
            alert('Erro: ' + error.message);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in text-slate-900 dark:text-white">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight italic uppercase">
                        Registro de <span className="text-sky-500">Abastecimento</span>
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400">Controle de combustível e consumo</p>
                </div>
                <button
                    onClick={handleNew}
                    className="flex items-center justify-center px-4 py-2 bg-sky-600 text-white rounded-xl hover:bg-sky-700 transition shadow-lg shadow-sky-900/20 font-bold uppercase tracking-widest text-xs"
                >
                    <Plus className="w-5 h-5 mr-2" />
                    Novo Abastecimento
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {data.map((item) => (
                    <div
                        key={item.id}
                        onClick={() => handleEdit(item)}
                        className="bg-white dark:bg-[#1c2229] p-6 rounded-2xl shadow-xl border border-slate-200 dark:border-white/5 flex items-center justify-between group hover:border-sky-500/30 transition-all duration-300 cursor-pointer"
                    >
                        <div>
                            <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight italic">
                                {item.veiculos?.modelo} <span className="text-slate-500 text-xs font-bold not-italic">({item.veiculos?.placa})</span>
                            </h3>
                            <p className="text-slate-500 text-[10px] font-black mt-1 uppercase tracking-widest">{new Date(item.data).toLocaleDateString('pt-BR')}</p>
                            <div className="mt-4 flex flex-wrap gap-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                                <span className="flex items-center">
                                    <Users className="w-3 h-3 mr-1 text-sky-500" /> {item.condutores?.nome || item.driver_name || 'N/A'}
                                </span>
                                <span className="flex items-center"><Droplets className="w-3 h-3 mr-1 text-sky-500" /> {item.litros} L</span>
                                <span className="flex items-center"><TrendingUp className="w-3 h-3 mr-1 text-sky-500" /> {item.km} KM</span>
                                <span className="text-sky-500 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                                    {isGestor ? 'Editar' : 'Ver'}
                                </span>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="block text-2xl font-black text-slate-900 dark:text-white italic tracking-tighter group-hover:text-sky-500 transition-colors">R$ {parseFloat(item.valor).toFixed(2)}</span>
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Total</span>
                        </div>
                    </div>
                ))}
                {data.length === 0 && (
                    <div className="col-span-full py-12 text-center text-slate-500 bg-white dark:bg-[#1c2229] rounded-2xl border border-dashed border-slate-200 dark:border-white/10">
                        Nenhum abastecimento registrado.
                    </div>
                )}
                {/* Modal */}
                {showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 dark:bg-black/70 backdrop-blur-md p-4">
                        <div className="bg-white dark:bg-[#1c2229] border border-slate-200 dark:border-white/10 rounded-3xl w-full max-w-lg shadow-2xl p-8 animate-in zoom-in-95 duration-200">
                            <div className="flex justify-between items-center mb-8">
                                <h2 className="text-xl font-black text-slate-900 dark:text-white italic uppercase tracking-tight">
                                    {isEditing ? 'Editar' : 'Novo'} <span className="text-sky-500">Abastecimento</span>
                                </h2>
                                <button onClick={() => setShowModal(false)} className="bg-slate-50 dark:bg-white/5 p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
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
                                        className="w-full bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all"
                                    >
                                        <option value="" className="bg-white dark:bg-[#1c2229]">Selecione um veículo</option>
                                        {vehicles.map(v => (
                                            <option key={v.id} value={v.id} className="bg-white dark:bg-[#1c2229] whitespace-pre">
                                                {v.modelo} ({v.placa})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest">Motorista</label>
                                    <select
                                        required
                                        value={formData.condutor_id}
                                        onChange={(e) => setFormData({ ...formData, condutor_id: e.target.value })}
                                        className="w-full bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all"
                                    >
                                        <option value="" className="bg-white dark:bg-[#1c2229]">Selecione um motorista</option>
                                        {drivers.map(d => (
                                            <option key={d.id} value={d.id} className="bg-white dark:bg-[#1c2229]">
                                                {d.nome}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest">Data</label>
                                        <input
                                            type="date"
                                            required
                                            value={formData.data}
                                            onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                                            className="w-full bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest">Valor Total (R$)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            required
                                            value={formData.valor}
                                            onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                                            className="w-full bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all"
                                            placeholder="0,00"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest">Litros</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            required
                                            value={formData.litros}
                                            onChange={(e) => setFormData({ ...formData, litros: e.target.value })}
                                            className="w-full bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all"
                                            placeholder="0,00"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest">KM Atual</label>
                                        <input
                                            type="number"
                                            required
                                            value={formData.km}
                                            onChange={(e) => setFormData({ ...formData, km: e.target.value })}
                                            className="w-full bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all"
                                            placeholder="0"
                                        />
                                    </div>
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
                                            {isEditing ? 'Atualizar' : 'Salvar'} Registro
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

export default FuelPage;
