import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { ClipboardList, Plus, Camera, Check, X, AlertCircle, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Checklists = () => {
    const { isGestor } = useAuth();
    const [checklists, setChecklists] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [vehicles, setVehicles] = useState([]);
    const [drivers, setDrivers] = useState([]);

    // Edit Mode State
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);

    const [formData, setFormData] = useState({
        veiculo_id: '',
        condutor_id: '',
        km_atual: '',
        nivel_combustivel: 'Cheio',
        observacoes: '',
        fotos: [] // mock urls
    });

    const [items, setItems] = useState([
        { name: 'Limpador de para-brisa', ok: true },
        { name: 'Vidros quebrados', ok: true },
        { name: 'Vidro trincado', ok: true },
        { name: 'Freio de mão', ok: true },
        { name: 'Ar condicionado', ok: true },
        { name: 'Tapete do veículo', ok: true },
        { name: 'Lanterna traseira', ok: true },
        { name: 'Lataria', ok: true },
        { name: 'Barulho estranho', ok: true },
        { name: 'Avarias na pintura', ok: true },
        { name: 'Buzina', ok: true },
        { name: 'Cinto de segurança', ok: true },
        { name: 'Macaco', ok: true },
        { name: 'Agua do radiador', ok: true },
        { name: 'Óleo do motor', ok: true },
    ]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const { data: v } = await supabase.from('vehicles').select('id, model, plate').eq('status', 'ativo');
            const { data: d } = await supabase.from('drivers').select('id, name').eq('status', 'ativo');
            const { data: c } = await supabase.from('checklists')
                .select('*, vehicles(model, plate), drivers(name)')
                .order('created_at', { ascending: false });

            const mappedVehicles = (v || []).map(item => ({ id: item.id, modelo: item.model, placa: item.plate }));
            const mappedDrivers = (d || []).map(item => ({ id: item.id, nome: item.name }));
            const mappedChecklists = (c || []).map(item => ({
                id: item.id,
                veiculo_id: item.vehicle_id,
                condutor_id: item.driver_id,
                km_atual: item.current_km,
                nivel_combustivel: item.fuel_level,
                observacoes: item.notes,
                items: item.items || [], // Load saved items
                data: item.created_at,
                hora: item.created_at?.split('T')[1],
                veiculos: item.vehicles
                    ? { modelo: item.vehicles.model, placa: item.vehicles.plate }
                    : { modelo: item.vehicle_model, placa: item.vehicle_plate },
                condutores: item.drivers
                    ? { nome: item.drivers.name }
                    : { nome: item.driver_name }
            }));

            setVehicles(mappedVehicles);
            setDrivers(mappedDrivers);
            setChecklists(mappedChecklists);
        } catch (error) {
            console.error('Erro ao buscar dados:', error);
        }
    };

    const handleEdit = (checklist) => {
        setIsEditing(true);
        setEditId(checklist.id);
        setFormData({
            veiculo_id: checklist.veiculo_id,
            condutor_id: checklist.condutor_id,
            km_atual: checklist.km_atual,
            nivel_combustivel: checklist.nivel_combustivel,
            observacoes: checklist.observacoes || '',
            fotos: [] // photos not fully implemented in DB yet
        });

        // Load items from DB, or fallback to default if empty/null
        if (checklist.items && checklist.items.length > 0) {
            setItems(checklist.items);
        } else {
            // Reset to default if no items found in DB record
            setItems([
                { name: 'Limpador de para-brisa', ok: true },
                { name: 'Vidros quebrados', ok: true },
                { name: 'Vidro trincado', ok: true },
                { name: 'Freio de mão', ok: true },
                { name: 'Ar condicionado', ok: true },
                { name: 'Tapete do veículo', ok: true },
                { name: 'Lanterna traseira', ok: true },
                { name: 'Lataria', ok: true },
                { name: 'Barulho estranho', ok: true },
                { name: 'Avarias na pintura', ok: true },
                { name: 'Buzina', ok: true },
                { name: 'Cinto de segurança', ok: true },
                { name: 'Macaco', ok: true },
                { name: 'Agua do radiador', ok: true },
                { name: 'Óleo do motor', ok: true },
            ]);
        }
        setShowModal(true);
    };

    const handleDelete = async () => {
        if (!window.confirm('Tem certeza que deseja excluir este checklist?')) return;

        try {
            const { error } = await supabase.from('checklists').delete().eq('id', editId);
            if (error) throw error;

            setShowModal(false);
            fetchData();
            alert('CHECK-LIST excluído com sucesso!');
        } catch (error) {
            alert('Erro ao excluir: ' + error.message);
        }
    };

    const handleNew = () => {
        setIsEditing(false);
        setEditId(null);
        setFormData({
            veiculo_id: '',
            condutor_id: '',
            km_atual: '',
            nivel_combustivel: 'Cheio',
            observacoes: '',
            fotos: []
        });
        setItems([
            { name: 'Limpador de para-brisa', ok: true },
            { name: 'Vidros quebrados', ok: true },
            { name: 'Vidro trincado', ok: true },
            { name: 'Freio de mão', ok: true },
            { name: 'Ar condicionado', ok: true },
            { name: 'Tapete do veículo', ok: true },
            { name: 'Lanterna traseira', ok: true },
            { name: 'Lataria', ok: true },
            { name: 'Barulho estranho', ok: true },
            { name: 'Avarias na pintura', ok: true },
            { name: 'Buzina', ok: true },
            { name: 'Cinto de segurança', ok: true },
            { name: 'Macaco', ok: true },
            { name: 'Agua do radiador', ok: true },
            { name: 'Óleo do motor', ok: true },
        ]);
        setShowModal(true);
    };

    const handlePhotoUpload = () => {
        // Mock upload
        const newPhoto = `https://source.unsplash.com/random/800x600?car&sig=${Math.random()}`;
        setFormData(prev => ({ ...prev, fotos: [...prev.fotos, newPhoto] }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                vehicle_id: formData.veiculo_id,
                driver_id: formData.condutor_id,
                current_km: formData.km_atual,
                fuel_level: formData.nivel_combustivel,
                notes: formData.observacoes,
                items: items, // Save the items state to JSONB
                vehicle_model: vehicles.find(v => v.id === formData.veiculo_id)?.modelo,
                vehicle_plate: vehicles.find(v => v.id === formData.veiculo_id)?.placa,
                driver_name: drivers.find(d => d.id === formData.condutor_id)?.nome
            };

            if (isEditing) {
                // Update
                const { error } = await supabase.from('checklists').update(payload).eq('id', editId);
                if (error) throw error;
                alert('CHECK-LIST atualizado com sucesso!');
            } else {
                // Insert
                const { error } = await supabase.from('checklists').insert([payload]);
                if (error) throw error;
                alert('CHECK-LIST salvo com sucesso!');
            }

            setShowModal(false);
            fetchData();
        } catch (error) {
            alert('Erro ao salvar checklist: ' + error.message);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500 pb-12">
            {/* Header section with refined typography */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
                <div>
                    <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic leading-none">
                        Vistorias <span className="text-sky-500">e Check-list</span>
                    </h1>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mt-3">Monitoramento de integridade da frota</p>
                </div>
                <button
                    onClick={handleNew}
                    className="flex items-center justify-center px-8 py-4 bg-sky-600 text-white rounded-2xl hover:bg-sky-500 transition-all shadow-[0_20px_40px_-10px_rgba(14,165,233,0.4)] font-black uppercase tracking-[0.2em] text-[10px] group active:scale-95"
                >
                    <Plus className="w-5 h-5 mr-3 group-hover:rotate-90 transition-transform duration-500" />
                    NOVO CHECK-LIST
                </button>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {checklists.map((item) => (
                    <div
                        key={item.id}
                        onClick={() => handleEdit(item)}
                        className="bg-[#1c2229] border border-white/10 rounded-[2rem] p-8 shadow-2xl flex flex-col md:flex-row items-center gap-8 group hover:border-sky-500/40 transition-all duration-500 cursor-pointer relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/5 blur-[60px] -mr-16 -mt-16 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                        <div className="flex-1 w-full relative z-10">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="px-4 py-1.5 bg-white/5 border border-white/5 rounded-full">
                                    <span className="text-sky-500 text-[10px] font-black uppercase tracking-widest italic">
                                        {new Date(item.data).toLocaleDateString('pt-BR')}
                                    </span>
                                </div>
                                <span className="text-slate-600 text-[10px] font-black uppercase tracking-widest">{item.hora?.substring(0, 5)}</span>
                            </div>

                            <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic leading-tight group-hover:text-sky-500 transition-colors">
                                {item.veiculos?.modelo} <span className="text-slate-600 font-bold not-italic ml-2">{item.veiculos?.placa}</span>
                            </h3>

                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mt-3">
                                Responsável: <span className="text-slate-300 ml-1">{item.condutores?.nome || 'N/A'}</span>
                            </p>

                            <div className="mt-8 flex flex-wrap gap-6">
                                <div className="flex flex-col gap-1">
                                    <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Quilometragem</span>
                                    <div className="flex items-center gap-2">
                                        <Check className="w-4 h-4 text-sky-500" />
                                        <span className="text-white font-black italic tracking-tight">{item.km_atual} KM</span>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-1 border-l border-white/5 pl-6">
                                    <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Nível Tanque</span>
                                    <div className="flex items-center gap-2">
                                        <Check className="w-4 h-4 text-blue-500" />
                                        <span className="text-white font-black italic tracking-tight uppercase text-xs">{item.nivel_combustivel}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Status visualization */}
                        <div className="flex flex-col items-end gap-3 w-full md:w-auto relative z-10">
                            {item.items && item.items.filter(i => !i.ok).length > 0 ? (
                                <div className="flex items-center gap-3 px-6 py-3 bg-red-500/10 border border-red-500/20 rounded-2xl shadow-xl shadow-red-900/10">
                                    <AlertCircle className="w-5 h-5 text-red-500" />
                                    <span className="text-red-500 text-[10px] font-black uppercase tracking-widest">
                                        {item.items.filter(i => !i.ok).length} Avarias Encontradas
                                    </span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-3 px-6 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl shadow-xl shadow-emerald-900/10">
                                    <Check className="w-5 h-5 text-emerald-500" />
                                    <span className="text-emerald-500 text-[10px] font-black uppercase tracking-widest">
                                        Veículo 100% OK
                                    </span>
                                </div>
                            )}
                            <div className="mt-2">
                                <span className="text-[10px] text-slate-600 font-black uppercase tracking-[0.3em] group-hover:text-sky-500 transition-colors flex items-center gap-2">
                                    DETALHES DA INSPEÇÃO <Plus className="w-3 h-3" />
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
                {checklists.length === 0 && (
                    <div className="text-center py-24 bg-[#1c2229] rounded-[2.5rem] border border-dashed border-white/10 shadow-2xl">
                        <div className="p-6 bg-white/5 rounded-3xl inline-block mb-6">
                            <ClipboardList className="w-12 h-12 text-slate-600" />
                        </div>
                        <h3 className="text-xl font-black text-white italic tracking-tighter uppercase mb-2">Nenhum Check-list Registrado</h3>
                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-8">Inicie uma nova inspeção para monitorar a frota</p>
                        <button
                            onClick={handleNew}
                            className="text-sky-500 font-black uppercase tracking-[0.3em] text-[10px] hover:text-sky-400 transition-colors flex items-center gap-3 mx-auto"
                        >
                            CADASTRAR AGORA <Plus className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {/* Modal Modernizado */}
                {showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 animate-in fade-in duration-300">
                        <div className="bg-[#0f1115] border border-white/10 rounded-[2.5rem] w-full max-w-2xl shadow-[0_64px_128px_-16px_rgba(0,0,0,0.8)] p-10 animate-in zoom-in-95 slide-in-from-bottom-10 duration-500 max-h-[90vh] overflow-y-auto custom-scrollbar relative">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-sky-600/5 blur-[100px] -mr-32 -mt-32"></div>

                            <div className="flex justify-between items-center mb-10 relative z-10">
                                <div>
                                    <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">
                                        {isEditing ? 'Visualização' : 'Nova'} <span className="text-sky-500">Inspeção</span>
                                    </h2>
                                    <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.3em] mt-2">Dados detalhados do check-list diário</p>
                                </div>
                                <button onClick={() => setShowModal(false)} className="bg-white/5 p-3 rounded-2xl text-slate-500 hover:text-white transition-colors border border-white/5 shadow-xl">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Veículo Selecionado</label>
                                        <select
                                            required
                                            value={formData.veiculo_id}
                                            onChange={(e) => setFormData({ ...formData, veiculo_id: e.target.value })}
                                            className="w-full bg-white/5 border-white/10 rounded-2xl px-6 py-4 text-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all appearance-none cursor-pointer font-bold text-sm"
                                        >
                                            <option value="" className="bg-[#1c2229]">Selecione o Veículo</option>
                                            {vehicles.map(v => (
                                                <option key={v.id} value={v.id} className="bg-[#1c2229]">
                                                    {v.modelo} ({v.placa})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Condutor Responsável</label>
                                        <select
                                            required
                                            value={formData.condutor_id}
                                            onChange={(e) => setFormData({ ...formData, condutor_id: e.target.value })}
                                            className="w-full bg-white/5 border-white/10 rounded-2xl px-6 py-4 text-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all appearance-none cursor-pointer font-bold text-sm"
                                        >
                                            <option value="" className="bg-[#1c2229]">Selecione o Condutor</option>
                                            {drivers.map(d => (
                                                <option key={d.id} value={d.id} className="bg-[#1c2229]">
                                                    {d.nome}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Odômetro Atual (KM)</label>
                                        <input
                                            type="number"
                                            required
                                            value={formData.km_atual}
                                            onChange={(e) => setFormData({ ...formData, km_atual: e.target.value })}
                                            className="w-full bg-white/5 border-white/10 rounded-2xl px-6 py-4 text-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all font-bold text-sm placeholder:text-slate-700"
                                            placeholder="0"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nível de Combustível</label>
                                        <select
                                            value={formData.nivel_combustivel}
                                            onChange={(e) => setFormData({ ...formData, nivel_combustivel: e.target.value })}
                                            className="w-full bg-white/5 border-white/10 rounded-2xl px-6 py-4 text-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all appearance-none cursor-pointer font-bold text-sm"
                                        >
                                            <option className="bg-[#1c2229]">Reserva</option>
                                            <option className="bg-[#1c2229]">1/4</option>
                                            <option className="bg-[#1c2229]">1/2</option>
                                            <option className="bg-[#1c2229]">3/4</option>
                                            <option className="bg-[#1c2229]">Cheio</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="pt-8 border-t border-white/5">
                                    <h3 className="text-[10px] font-black text-slate-500 mb-6 uppercase tracking-[0.3em] ml-1">ITENS DE VERIFICAÇÃO</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {items.map((item, idx) => (
                                            <div
                                                key={idx}
                                                onClick={() => {
                                                    const newItems = [...items];
                                                    newItems[idx].ok = !newItems[idx].ok;
                                                    setItems(newItems);
                                                }}
                                                className={`cursor-pointer p-5 rounded-2xl border flex items-center justify-between transition-all duration-300 group ${item.ok
                                                    ? 'bg-emerald-500/5 border-emerald-500/10 text-emerald-500'
                                                    : 'bg-red-500/5 border-red-500/10 text-red-500 shadow-lg shadow-red-900/10 scale-[1.02]'
                                                    }`}
                                            >
                                                <span className="text-[10px] font-black uppercase tracking-widest">{item.name}</span>
                                                <div className={`p-2 rounded-lg ${item.ok ? 'bg-emerald-500/20' : 'bg-red-500/20 animate-pulse'}`}>
                                                    {item.ok ? <Check size={14} /> : <AlertCircle size={14} />}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Observações da Vistoria</label>
                                    <textarea
                                        value={formData.observacoes}
                                        onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                                        className="w-full bg-white/5 border-white/10 rounded-[2rem] px-8 py-6 text-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all font-medium text-sm placeholder:text-slate-700 h-32 resize-none"
                                        placeholder="Descreva detalhes ou avarias encontradas..."
                                    />
                                </div>

                                <div className="pt-10 flex flex-col md:flex-row gap-4">
                                    {isEditing && isGestor && (
                                        <button
                                            type="button"
                                            onClick={handleDelete}
                                            className="px-8 py-5 bg-red-500/10 text-red-500 border border-red-500/10 rounded-2xl hover:bg-red-500/20 font-black uppercase tracking-widest text-[10px] transition-all flex items-center justify-center shadow-xl shadow-red-900/5 active:scale-95"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="flex-1 px-8 py-5 bg-white/5 border border-white/5 rounded-2xl text-slate-500 hover:text-white font-black uppercase tracking-widest text-[10px] transition-all shadow-xl active:scale-95"
                                    >
                                        {(isEditing && !isGestor) ? 'FECHAR RELATÓRIO' : 'CANCELAR'}
                                    </button>
                                    {(!isEditing || isGestor) && (
                                        <button
                                            type="submit"
                                            className="flex-[2] px-8 py-5 bg-sky-600 text-white rounded-2xl hover:bg-sky-500 font-black uppercase tracking-widest text-[10px] shadow-[0_20px_40px_-10px_rgba(14,165,233,0.4)] transition-all active:scale-95"
                                        >
                                            {isEditing ? 'SALVAR ALTERAÇÕES' : 'FINALIZAR CHECK-LIST'}
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

export default Checklists;
