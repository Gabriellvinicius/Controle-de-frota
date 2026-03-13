import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { Plus, Search, Map, Calendar, Users, Navigation, Download, X, AlertCircle, Trash2, MapPin, Loader2 } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useAuth } from '../contexts/AuthContext';

const Trips = () => {
    const { isGestor } = useAuth();
    const [trips, setTrips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [vehicles, setVehicles] = useState([]);
    const [drivers, setDrivers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    // Edit Mode State
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);

    const [formData, setFormData] = useState({
        veiculo_id: '',
        condutor_id: '',
        origem: '',
        destino: '',
        distancia_km: '',
        qtd_pessoas: 1,
        qtd_pedagios: 0,
        duracao_dias: 1,
        data_inicio: new Date().toISOString().split('T')[0],
        data_retorno: new Date().toISOString().split('T')[0],
        motivo: ''
    });
    const [isCalculating, setIsCalculating] = useState(false);
    const [routeOptions, setRouteOptions] = useState([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const { data: v } = await supabase.from('vehicles').select('id, model, plate, status').eq('status', 'ativo');
            const { data: d } = await supabase.from('drivers').select('id, name').eq('status', 'ativo');
            const { data: t, error } = await supabase
                .from('trips')
                .select('*, vehicles(model, plate), drivers(name)')
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Map English DB to Portuguese State
            const mappedVehicles = (v || []).map(item => ({ id: item.id, modelo: item.model, placa: item.plate }));
            const mappedDrivers = (d || []).map(item => ({ id: item.id, nome: item.name }));
            const mappedTrips = (t || []).map(item => ({
                id: item.id,
                veiculo_id: item.vehicle_id,
                condutor_id: item.driver_id,
                origem: item.origin,
                destino: item.destination,
                distancia_km: item.distance_km,
                qtd_pessoas: item.passengers,
                qtd_pedagios: item.tolls,
                duracao_dias: item.days,
                data_inicio: item.departure_date,
                data_retorno: item.return_date || item.departure_date,
                motivo: item.reason,
                veiculos: item.vehicles
                    ? { modelo: item.vehicles.model, placa: item.vehicles.plate }
                    : { modelo: item.vehicle_model, placa: item.vehicle_plate },
                condutores: item.drivers
                    ? { nome: item.drivers.name }
                    : { nome: item.driver_name }
            }));

            setVehicles(mappedVehicles);
            setDrivers(mappedDrivers);
            setTrips(mappedTrips);
        } catch (error) {
            console.error('Erro ao buscar viagens:', error.message);
        } finally {
            setLoading(false);
        }
    };

    const calculateDistance = async () => {
        if (!formData.origem || !formData.destino) {
            alert('Por favor, preencha origem e destino.');
            return;
        }

        try {
            setIsCalculating(true);
            setRouteOptions([]);

            // 1. Geocode Origin
            const originRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(formData.origem)}&limit=1`);
            const originData = await originRes.json();

            // 2. Geocode Destination (added small delay for rate limits)
            await new Promise(r => setTimeout(r, 600));
            const destRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(formData.destino)}&limit=1`);
            const destData = await destRes.json();

            if (originData.length === 0 || destData.length === 0) {
                alert('Não foi possível localizar um dos endereços.');
                return;
            }

            const lon1 = originData[0].lon;
            const lat1 = originData[0].lat;
            const lon2 = destData[0].lon;
            const lat2 = destData[0].lat;

            // 3. Get Route from OSRM (added steps=true for toll and detail calculation)
            const routeRes = await fetch(`https://router.project-osrm.org/route/v1/driving/${lon1},${lat1};${lon2},${lat2}?overview=false&alternatives=true&steps=true`);
            const routeData = await routeRes.json();

            if (routeData.code !== 'Ok') {
                alert('Erro ao calcular rota.');
                return;
            }

            const options = routeData.routes.map((r, index) => ({
                id: index,
                distance: Math.round(r.distance / 1000),
                duration: Math.round(r.duration / 60),
                name: r.legs[0].summary || `Rota ${index + 1}`
            }));

            // setRouteOptions(options); // Removed to avoid rendering without steps/tolls

            // Fetch tolls for each route (parallel)
            const routesWithTolls = await Promise.all(options.map(async (opt) => {
                const route = routeData.routes[opt.id];
                // Get bounds for Overpass
                let minLat = Infinity, maxLat = -Infinity, minLon = Infinity, maxLon = -Infinity;
                route.legs[0].steps?.forEach(s => {
                    const lat = s.maneuver.location[1];
                    const lon = s.maneuver.location[0];
                    minLat = Math.min(minLat, lat);
                    maxLat = Math.max(maxLat, lat);
                    minLon = Math.min(minLon, lon);
                    maxLon = Math.max(maxLon, lon);
                });

                try {
                    // Small buffer for bbox
                    const buffer = 0.01;
                    const overpassUrl = `https://overpass-api.de/api/interpreter?data=[out:json];node["barrier"="toll_booth"](${minLat - buffer},${minLon - buffer},${maxLat + buffer},${maxLon + buffer});out;`;
                    const opRes = await fetch(overpassUrl);
                    const opData = await opRes.json();

                    // Heuristic: only keep tolls near the route
                    const routePoints = (route.legs[0]?.steps || []).map(s => s.maneuver.location);
                    const nearbyTolls = (opData.elements || []).filter(toll => {
                        return routePoints.some(pt => {
                            const dist = Math.sqrt(Math.pow(toll.lat - pt[1], 2) + Math.pow(toll.lon - pt[0], 2));
                            return dist < 0.002; // Approx 200m
                        });
                    });

                    // Deduplicate toll plazas (booths within 300m of each other)
                    const uniquePlazas = [];
                    nearbyTolls.forEach(toll => {
                        const isDuplicate = uniquePlazas.some(p => {
                            const dist = Math.sqrt(Math.pow(p.lat - toll.lat, 2) + Math.pow(p.lon - toll.lon, 2));
                            return dist < 0.003;
                        });
                        if (!isDuplicate) uniquePlazas.push(toll);
                    });

                    // Estimate cost
                    let totalTollCost = 0;
                    uniquePlazas.forEach(p => {
                        const charge = p.tags?.charge || "";
                        const match = charge.match(/([0-9.]+)\s*BRL/);
                        if (match) totalTollCost += parseFloat(match[1]);
                        else totalTollCost += 10; // Fallback estimate
                    });

                    return {
                        ...opt,
                        tolls: uniquePlazas.length,
                        tollCost: totalTollCost,
                        steps: (route.legs[0]?.steps || []).map(s => ({
                            instruction: `${s.maneuver.type === 'depart' ? 'Partida' : s.maneuver.modifier || ''} em ${s.name || 'via local'}`,
                            distance: (s.distance / 1000).toFixed(1)
                        })).filter(s => s.instruction.length > 5)
                    };
                } catch (e) {
                    console.error("Erro no Overpass:", e);
                    return { ...opt, tolls: 0, tollCost: 0, steps: [] };
                }
            }));

            setRouteOptions(routesWithTolls);

            // Do not auto-select if we want to show details

        } catch (error) {
            console.error('Erro ao calcular rota:', error);
            alert('Erro de conexão ao calcular rota.');
        } finally {
            setIsCalculating(false);
        }
    };

    const handleEdit = (trip) => {
        setIsEditing(true);
        setEditId(trip.id);
        setFormData({
            veiculo_id: trip.veiculo_id,
            condutor_id: trip.condutor_id,
            origem: trip.origem,
            destino: trip.destino,
            distancia_km: trip.distancia_km,
            qtd_pessoas: trip.qtd_pessoas,
            qtd_pedagios: trip.qtd_pedagios,
            duracao_dias: trip.duracao_dias,
            data_inicio: trip.data_inicio,
            data_retorno: trip.data_retorno || trip.data_inicio,
            motivo: trip.motivo || ''
        });
        setShowModal(true);
    };

    const handleDelete = async () => {
        if (!window.confirm('Tem certeza que deseja excluir esta viagem? Esta ação não pode ser desfeita.')) return;

        try {
            const { error } = await supabase.from('trips').delete().eq('id', editId);
            if (error) throw error;

            setShowModal(false);
            fetchData();
            alert('Viagem excluída com sucesso!');
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
            origem: '',
            destino: '',
            distancia_km: '',
            qtd_pessoas: 1,
            qtd_pedagios: 0,
            duracao_dias: 1,
            data_inicio: new Date().toISOString().split('T')[0],
            data_retorno: new Date().toISOString().split('T')[0],
            motivo: ''
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Map Portuguese State to English DB
            const payload = {
                vehicle_id: formData.veiculo_id,
                driver_id: formData.condutor_id,
                origin: formData.origem,
                destination: formData.destino,
                distance_km: formData.distancia_km,
                passengers: formData.qtd_pessoas,
                tolls: formData.qtd_pedagios,
                // duracao_dias: formData.duracao_dias, // Assuming logic recalculates or triggers elsewhere, but kept simple here
                departure_date: formData.data_inicio,
                return_date: formData.data_retorno,
                reason: formData.motivo,
                vehicle_model: vehicles.find(v => v.id === formData.veiculo_id)?.modelo,
                vehicle_plate: vehicles.find(v => v.id === formData.veiculo_id)?.placa,
                driver_name: drivers.find(d => d.id === formData.condutor_id)?.nome
            };

            if (isEditing) {
                // Update
                const { error } = await supabase.from('trips').update(payload).eq('id', editId);
                if (error) throw error;
                alert('Viagem atualizada com sucesso!');
            } else {
                // Insert
                const { error } = await supabase.from('trips').insert([payload]);
                if (error) throw error;
                alert('Viagem cadastrada com sucesso!');
            }

            setShowModal(false);
            fetchData();
            setFormData({
                veiculo_id: '',
                condutor_id: '',
                origem: '',
                destino: '',
                distancia_km: '',
                qtd_pessoas: 1,
                qtd_pedagios: 0,
                duracao_dias: 1,
                data_inicio: new Date().toISOString().split('T')[0],
                motivo: ''
            });
        } catch (error) {
            alert('Erro ao salvar viagem: ' + error.message);
        }
    };

    const exportPDF = () => {
        const doc = new jsPDF();

        doc.setFontSize(18);
        doc.text('Planilha de Viagens', 14, 20);
        doc.setFontSize(10);
        doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 28);

        const tableColumn = ["Saída", "Retorno", "Destino", "Veículo", "Motorista", "Motivo", "KM", "Pessoas", "Pedágios"];
        const tableRows = [];

        trips.forEach(trip => {
            const tripData = [
                new Date(trip.data_inicio).toLocaleDateString('pt-BR'),
                trip.data_retorno ? new Date(trip.data_retorno).toLocaleDateString('pt-BR') : '-',
                trip.destino,
                `${trip.veiculos?.modelo} (${trip.veiculos?.placa})`,
                trip.condutores?.nome || 'N/A',
                trip.motivo || '-',
                trip.distancia_km,
                trip.qtd_pessoas,
                trip.qtd_pedagios
            ];
            tableRows.push(tripData);
        });

        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 35,
            theme: 'grid',
            headStyles: { fillColor: [3, 105, 161] },
        });

        doc.save(`viagens_${new Date().getTime()}.pdf`);
    };

    const filteredTrips = trips.filter(t =>
        t.destino.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.condutores?.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.veiculos?.placa?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight italic uppercase">
                        Planilha de <span className="text-sky-500">Viagem</span>
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400">Controle de rotas e logística da frota</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={exportPDF}
                        className="flex items-center justify-center px-4 py-2 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white rounded-xl hover:bg-slate-200 dark:hover:bg-white/10 transition border border-slate-200 dark:border-white/10 text-xs font-bold uppercase tracking-widest"
                    >
                        <Download className="w-5 h-5 mr-2" />
                        PDF
                    </button>
                    {isGestor && (
                        <button
                            onClick={handleNew}
                            className="flex items-center justify-center px-4 py-2 bg-sky-600 text-white rounded-xl hover:bg-sky-700 transition shadow-lg shadow-sky-900/20 font-bold uppercase tracking-widest text-xs"
                        >
                            <Plus className="w-5 h-5 mr-2" />
                            Nova Viagem
                        </button>
                    )}
                </div>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-5 h-5" />
                <input
                    type="text"
                    placeholder="Buscar por destino, motorista ou placa..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:ring-sky-500 focus:border-sky-500 shadow-sm"
                />
            </div>

            {/* List */}
            {loading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500 mx-auto"></div>
                </div>
            ) : trips.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-[#1c2229] rounded-2xl border border-dashed border-slate-200 dark:border-white/10">
                    <Map className="w-16 h-16 text-slate-400 dark:text-slate-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-500 dark:text-slate-400">Nenhuma viagem registrada</h3>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {filteredTrips.map((trip) => (
                        <div
                            key={trip.id}
                            onClick={() => handleEdit(trip)}
                            className="bg-white dark:bg-[#1c2229] rounded-2xl p-6 shadow-xl border border-slate-200 dark:border-white/5 group hover:border-sky-500/30 transition-all duration-300 cursor-pointer relative"
                        >
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="flex items-center gap-1.5 bg-sky-500/10 text-sky-500 px-3 py-1 rounded-full text-xs font-black uppercase">
                                            <Calendar className="w-3 h-3" />
                                            {new Date(trip.data_inicio).toLocaleDateString('pt-BR')}
                                            {trip.data_retorno && trip.data_retorno !== trip.data_inicio && (
                                                <>
                                                    <span className="opacity-50 mx-0.5">-</span>
                                                    {new Date(trip.data_retorno).toLocaleDateString('pt-BR')}
                                                </>
                                            )}
                                        </div>
                                        <span className="text-slate-500 text-xs font-bold uppercase tracking-widest">{trip.duracao_dias} dias</span>
                                    </div>
                                    <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{trip.destino}</h3>
                                    {trip.motivo && (
                                        <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mt-1 mb-2">
                                            Motivo: <span className="text-slate-900 dark:text-slate-200 font-black">{trip.motivo}</span>
                                        </p>
                                    )}
                                    <div className="flex flex-wrap gap-4 mt-3">
                                        <div className="flex items-center text-sm text-slate-500 dark:text-slate-400">
                                            <Navigation className="w-4 h-4 mr-1 text-sky-500" />
                                            {trip.veiculos?.modelo} ({trip.veiculos?.placa})
                                        </div>
                                        <div className="flex items-center text-sm text-slate-500 dark:text-slate-400">
                                            <Users className="w-4 h-4 mr-1 text-sky-500" />
                                            {trip.condutores?.nome || 'N/A'}
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:text-right border-t md:border-t-0 md:border-l border-slate-200 dark:border-white/5 pt-4 md:pt-0 md:pl-6">
                                    <div>
                                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Distância</div>
                                        <div className="text-lg font-black text-slate-900 dark:text-white">{trip.distancia_km} KM</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Pessoas</div>
                                        <div className="text-lg font-black text-slate-900 dark:text-white">{trip.qtd_pessoas}</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Pedágios</div>
                                        <div className="text-lg font-black text-slate-900 dark:text-white">{trip.qtd_pedagios}</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</div>
                                        {new Date(trip.data_inicio + 'T00:00:00') > new Date() ? (
                                            <div className="text-xs font-black text-amber-500 uppercase flex items-center gap-1">
                                                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></div>
                                                Prevista
                                            </div>
                                        ) : (
                                            <div className="text-xs font-black text-green-500 uppercase flex items-center gap-1">
                                                <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                                                Concluída
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="mt-4 pt-2 text-right border-t border-slate-200 dark:border-white/5">
                                <span className="text-[10px] text-sky-500 font-bold uppercase tracking-widest group-hover:underline">
                                    {isGestor ? 'Clique para editar' : 'Clique para visualizar'}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-lg p-4 overflow-y-auto pt-10 pb-10">
                    <div className={`flex flex-col lg:flex-row gap-8 w-full ${routeOptions.length > 0 ? 'max-w-6xl' : 'max-w-2xl'} items-stretch justify-center transition-all duration-300`}>
                        {/* CARD DO FORMULÁRIO */}
                        <div className="bg-white dark:bg-[#1c2229] border border-slate-200 dark:border-white/10 rounded-[2.5rem] w-full lg:max-w-2xl shadow-2xl p-8 md:p-10 animate-in zoom-in-95 duration-300 flex flex-col will-change-transform">
                            <div className="flex justify-between items-center mb-8">
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white italic uppercase tracking-tight">
                                    {isEditing ? 'Editar' : 'Registrar'} <span className="text-sky-500">Viagem</span>
                                </h2>
                                <button onClick={() => setShowModal(false)} className="bg-slate-50 dark:bg-white/5 p-3 rounded-2xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-red-500/20 transition-all duration-300">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest">Motorista</label>
                                        <select
                                            required
                                            value={formData.condutor_id}
                                            onChange={(e) => setFormData({ ...formData, condutor_id: e.target.value })}
                                            className="w-full bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all text-sm"
                                        >
                                            <option value="" className="bg-white dark:bg-[#1c2229]">Selecione um motorista</option>
                                            {drivers.map(d => (
                                                <option key={d.id} value={d.id} className="bg-white dark:bg-[#1c2229]">{d.nome}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-500 mb-1 uppercase tracking-widest">Veículo</label>
                                        <select
                                            required
                                            value={formData.veiculo_id}
                                            onChange={(e) => setFormData({ ...formData, veiculo_id: e.target.value })}
                                            className="w-full bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all text-sm"
                                        >
                                            <option value="" className="bg-white dark:bg-[#1c2229]">Selecione um veículo</option>
                                            {vehicles.map(v => (
                                                <option key={v.id} value={v.id} className="bg-white dark:bg-[#1c2229]">{v.modelo} ({v.placa})</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest">Origem</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.origem}
                                            onChange={(e) => setFormData({ ...formData, origem: e.target.value })}
                                            className="w-full bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 text-sm"
                                            placeholder="Cidade de origem"
                                        />
                                    </div>
                                    <div className="relative">
                                        <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest">Destino</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                required
                                                value={formData.destino}
                                                onChange={(e) => setFormData({ ...formData, destino: e.target.value })}
                                                className="flex-1 bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 text-sm"
                                                placeholder="Cidade de destino"
                                            />
                                            <button
                                                type="button"
                                                onClick={calculateDistance}
                                                disabled={isCalculating}
                                                className="bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 group shrink-0"
                                                title="Calcular KM automaticamente"
                                            >
                                                {isCalculating ? (
                                                    <Loader2 className="w-4 h-4 animate-spin text-slate-900 dark:text-white" />
                                                ) : (
                                                    <Navigation className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                                )}
                                                <span className="hidden md:inline font-bold text-xs uppercase">Calcular</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                    <div className="col-span-1">
                                        <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest">Saída</label>
                                        <input
                                            type="date"
                                            required
                                            value={formData.data_inicio}
                                            onChange={(e) => setFormData({ ...formData, data_inicio: e.target.value })}
                                            className="w-full bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all text-sm"
                                        />
                                    </div>
                                    <div className="col-span-1">
                                        <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest">Retorno</label>
                                        <input
                                            type="date"
                                            value={formData.data_retorno}
                                            onChange={(e) => setFormData({ ...formData, data_retorno: e.target.value })}
                                            className="w-full bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest">KM</label>
                                        <input
                                            type="number"
                                            required
                                            value={formData.distancia_km}
                                            onChange={(e) => setFormData({ ...formData, distancia_km: e.target.value })}
                                            className="w-full bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest">Passag.</label>
                                        <input
                                            type="number"
                                            value={formData.qtd_pessoas}
                                            onChange={(e) => setFormData({ ...formData, qtd_pessoas: e.target.value })}
                                            className="w-full bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest">Pedágio</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={formData.qtd_pedagios}
                                            onChange={(e) => setFormData({ ...formData, qtd_pedagios: e.target.value })}
                                            className="w-full bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 text-sm"
                                            placeholder="0,00"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest">Motivo da Viagem</label>
                                    <textarea
                                        value={formData.motivo}
                                        onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
                                        className="w-full bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 resize-none h-16 md:h-20 text-sm"
                                        placeholder="Descreva o motivo da viagem..."
                                    ></textarea>
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
                                        className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white font-black uppercase tracking-widest text-xs transition-all"
                                    >
                                        {isGestor ? 'Cancelar' : 'Fechar'}
                                    </button>
                                    {isGestor && (
                                        <button
                                            type="submit"
                                            className="flex-1 px-4 py-4 bg-sky-600 text-white rounded-2xl hover:bg-sky-500 font-black uppercase tracking-widest text-sm shadow-xl shadow-sky-900/30 transition-all active:scale-95"
                                        >
                                            {isEditing ? 'Confirmar' : 'Salvar'} Viagem
                                        </button>
                                    )}
                                </div>
                            </form>
                        </div>

                        {/* CARD DE SUGESTÕES DE ROTA (SEPARADO) */}
                        {(routeOptions.length > 0 || isCalculating) && (
                            <div className="w-full lg:w-[340px] shrink-0 bg-white dark:bg-[#1c2229] border border-slate-200 dark:border-white/10 rounded-[2.5rem] shadow-2xl flex flex-col animate-in slide-in-from-right-12 fade-in duration-300 h-auto will-change-transform">
                                <div className="p-6 border-b border-slate-200 dark:border-white/5 bg-sky-500/5 rounded-t-[2.5rem] flex items-center justify-between">
                                    <p className="text-xs font-black text-sky-500 uppercase tracking-[0.2em] flex items-center gap-3">
                                        <div className="p-2 bg-sky-500/10 rounded-xl">
                                            <Map className="w-5 h-5" />
                                        </div>
                                        {isCalculating ? 'Calculando...' : 'Rotas'}
                                    </p>
                                    {!isCalculating && (
                                        <button onClick={() => setRouteOptions([])} className="text-slate-500 hover:text-slate-900 dark:hover:text-white p-1 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-all">
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>

                                <div className="flex-1 overflow-y-auto custom-scrollbar p-2 max-h-[calc(100vh-200px)]">
                                    {isCalculating ? (
                                        <div className="p-6 space-y-6 animate-pulse">
                                            {[1, 2].map(i => (
                                                <div key={i} className="space-y-4">
                                                    <div className="h-4 bg-slate-50 dark:bg-white/5 rounded-full w-3/4"></div>
                                                    <div className="flex gap-2">
                                                        <div className="h-3 bg-slate-50 dark:bg-white/5 rounded-full w-1/4"></div>
                                                        <div className="h-3 bg-slate-50 dark:bg-white/5 rounded-full w-1/4"></div>
                                                    </div>
                                                    <div className="h-16 bg-slate-50 dark:bg-white/5 rounded-2xl w-full"></div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        routeOptions.map((opt) => (
                                            <button
                                                key={opt.id}
                                                type="button"
                                                onClick={() => {
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        distancia_km: opt.distance,
                                                        qtd_pedagios: opt.tollCost > 0 ? opt.tollCost : prev.qtd_pedagios
                                                    }));
                                                    setRouteOptions([]);
                                                }}
                                                className="w-full text-left p-6 hover:bg-sky-500/10 rounded-3xl transition-all border border-transparent hover:border-sky-500/20 group mb-2"
                                            >
                                                <div className="flex justify-between items-start mb-3">
                                                    <div className="flex-1">
                                                        <p className="text-base font-black text-slate-900 dark:text-white group-hover:text-sky-400 transition-colors uppercase leading-tight tracking-tight">{opt.name}</p>
                                                        <div className="flex flex-wrap gap-2 mt-3">
                                                            <span className="bg-sky-500/10 text-sky-400 px-3 py-1 rounded-full text-[10px] font-black uppercase border border-sky-500/10">
                                                                {opt.distance} KM
                                                            </span>
                                                            <span className="bg-slate-500/10 text-slate-500 dark:text-slate-400 px-3 py-1 rounded-full text-[10px] font-black uppercase border border-slate-200 dark:border-white/5">
                                                                {Math.floor(opt.duration / 60)}h {opt.duration % 60}m
                                                            </span>
                                                            {opt.tolls > 0 && (
                                                                <span className="bg-amber-500/10 text-amber-500 px-3 py-1 rounded-full text-[10px] font-black uppercase border border-amber-500/20">
                                                                    {opt.tolls} Pedágios
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="text-right ml-4">
                                                        {opt.tollCost > 0 && (
                                                            <p className="text-lg font-black text-amber-500 tracking-tighter">
                                                                R$ {opt.tollCost.toFixed(2)}
                                                            </p>
                                                        )}
                                                        <p className="text-[10px] text-sky-500 font-black uppercase mt-2 opacity-0 group-hover:opacity-100 transition-all">Selecionar</p>
                                                    </div>
                                                </div>

                                                <div className="mt-4 bg-slate-50 dark:bg-black/30 rounded-2xl p-4 space-y-3">
                                                    {opt.steps?.slice(0, 4).map((s, idx) => (
                                                        <div key={idx} className="flex gap-3 text-[11px] text-slate-500 dark:text-slate-400 leading-normal items-start">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-sky-500/50 mt-1.5 shrink-0 shadow-[0_0_8px_rgba(14,165,233,0.5)]" />
                                                            <span>{s.instruction} <span className="text-slate-400 dark:text-slate-600 font-bold ml-1">{s.distance}km</span></span>
                                                        </div>
                                                    ))}
                                                    {opt.steps?.length > 4 && (
                                                        <p className="text-[10px] text-sky-500/70 font-black italic ml-4 uppercase tracking-[0.1em]">+ {opt.steps.length - 4} etapas no caminho</p>
                                                    )}
                                                </div>
                                            </button>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Trips;
