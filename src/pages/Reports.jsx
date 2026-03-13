import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import jsPDF from 'jspdf';
import { FileText, Download, Filter, XCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Reports = () => {
    const { isGestor } = useAuth();
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({
        veiculo_id: '',
        data_inicio: '',
        data_fim: ''
    });

    useEffect(() => {
        supabase.from('vehicles').select('id, model, plate').then(({ data }) => {
            const mapped = (data || []).map(v => ({ id: v.id, modelo: v.model, placa: v.plate }));
            setVehicles(mapped);
        });
    }, []);

    if (!isGestor) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                <div className="bg-red-500/10 p-6 rounded-3xl border border-red-500/20 mb-6 group hover:scale-110 transition-transform duration-500">
                    <XCircle className="w-16 h-16 text-red-500 mx-auto" />
                </div>
                <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">
                    Acesso <span className="text-red-500">Restrito</span>
                </h2>
                <p className="text-slate-500 mt-2 max-w-sm mx-auto">Esta área é exclusiva para gestores. Se você acredita que deveria ter acesso, entre em contato com o administrador.</p>
            </div>
        );
    }

    const generatePDF = async () => {
        setLoading(true);
        try {
            const doc = new jsPDF();

            // Header
            doc.setFontSize(20);
            doc.setTextColor(40, 40, 40);
            doc.text('Relatório de Frota', 20, 20);

            doc.setFontSize(10);
            doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 20, 30);

            let yPos = 40;

            // Logic to fetch data based on filters
            let query = supabase.from('maintenances').select('*, vehicles(model, plate)');

            if (filters.veiculo_id) query = query.eq('vehicle_id', filters.veiculo_id);
            if (filters.data_inicio) query = query.gte('date', filters.data_inicio);
            if (filters.data_fim) query = query.lte('date', filters.data_fim);

            const { data: maintenances } = await query;

            if (maintenances && maintenances.length > 0) {
                doc.setFontSize(14);
                doc.text('Histórico de Manutenções', 20, yPos);
                yPos += 10;

                doc.setFontSize(10);
                maintenances.forEach((m) => {
                    const line = `${new Date(m.date).toLocaleDateString('pt-BR')} - ${m.vehicles?.model} (${m.vehicles?.plate}) - ${m.type} - R$ ${m.cost}`;
                    if (yPos > 280) {
                        doc.addPage();
                        yPos = 20;
                    }
                    doc.text(line, 20, yPos);
                    yPos += 7;
                });
                yPos += 10;
            }

            doc.save('relatorio-frota.pdf');
        } catch (error) {
            alert('Erro ao gerar PDF: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in text-slate-900 dark:text-white">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight italic uppercase">
                        Relatórios da <span className="text-sky-500">Frota</span>
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400">Exportação de dados e indicadores</p>
                </div>
            </div>

            <div className="bg-white dark:bg-[#1c2229] p-8 rounded-3xl shadow-2xl border border-slate-200 dark:border-white/10 max-w-2xl animate-in zoom-in-95 duration-200">
                <div className="flex items-center gap-4 mb-8">
                    <div className="bg-sky-500/10 p-3 rounded-2xl">
                        <Filter className="w-6 h-6 text-sky-500" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight italic">
                            Filtros de <span className="text-sky-500">Exportação</span>
                        </h2>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Personalize seu relatório</p>
                    </div>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest">Veículo (Opcional)</label>
                        <select
                            className="w-full bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all"
                            value={filters.veiculo_id}
                            onChange={e => setFilters({ ...filters, veiculo_id: e.target.value })}
                        >
                            <option value="" className="bg-white dark:bg-[#1c2229]">Todos os veículos</option>
                            {vehicles.map(v => (
                                <option key={v.id} value={v.id} className="bg-white dark:bg-[#1c2229]">
                                    {v.modelo} ({v.placa})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest">Data Início</label>
                            <input
                                type="date"
                                className="w-full bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all"
                                value={filters.data_inicio}
                                onChange={e => setFilters({ ...filters, data_inicio: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest">Data Fim</label>
                            <input
                                type="date"
                                className="w-full bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all"
                                value={filters.data_fim}
                                onChange={e => setFilters({ ...filters, data_fim: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="pt-4">
                        <button
                            onClick={generatePDF}
                            disabled={loading}
                            className="w-full py-4 bg-sky-600 text-white font-black uppercase tracking-widest text-xs rounded-xl hover:bg-sky-700 shadow-xl shadow-sky-900/20 transition-all flex items-center justify-center group"
                        >
                            {loading ? (
                                <span className="flex items-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-slate-900 dark:text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Gerando PDF...
                                </span>
                            ) : (
                                <>
                                    <Download className="w-5 h-5 mr-3 group-hover:translate-y-0.5 transition-transform" />
                                    Gerar Relatório PDF
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Reports;
