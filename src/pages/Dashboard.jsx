import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Car, Wrench, AlertTriangle, FileText, Plus, Map, Users, Droplets } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
);

const Dashboard = () => {
    const [stats, setStats] = useState({
        cnhVencidas: 0,
        manutencaoVencida: 0,
        manutencaoProxima: 0,
        totalCombustivel: 'R$ 0',
        totalManutencao: 'R$ 0',
        totalFrota: 0,
        motoristasAtivos: 0,
        viagensMes: 0,
        loading: true
    });

    const [activities, setActivities] = useState([]);

    const [chartData, setChartData] = useState({
        maintenanceByVehicle: {
            labels: [],
            datasets: [{ label: 'Custos', data: [], backgroundColor: 'rgb(59, 130, 246)', borderRadius: 4 }]
        },
        maintenanceCauses: {
            labels: ['Batida', 'Problema na instalação', 'Ação da natureza', 'Desgaste prematuro'],
            datasets: [{ data: [0, 0, 0, 0], backgroundColor: '#0369a1', borderRadius: 4 }]
        },
        distanceByDriver: {
            labels: [],
            datasets: [{ data: [], backgroundColor: '#0369a1', borderRadius: 4 }]
        }
    });

    useEffect(() => {
        fetchStats();
        fetchChartData();
        fetchRecentActivities();

        let debounceTimeout;

        // Real-time subscriptions with debounce
        const channel = supabase
            .channel('db-changes')
            .on('postgres_changes', { event: '*', schema: 'public' }, () => {
                clearTimeout(debounceTimeout);
                debounceTimeout = setTimeout(() => {
                    fetchStats();
                    fetchChartData();
                    fetchRecentActivities();
                }, 1000); // Wait 1s after last change
            })
            .subscribe();

        return () => {
            clearTimeout(debounceTimeout);
            supabase.removeChannel(channel);
        };
    }, []);

    const fetchRecentActivities = async () => {
        try {
            const { data: v } = await supabase.from('trips').select('id, destination, created_at, driver_name, drivers(name)').order('created_at', { ascending: false }).limit(3);
            const { data: a } = await supabase.from('refuelings').select('id, value, created_at, vehicle_model, driver_name, vehicles(model), drivers(name)').order('created_at', { ascending: false }).limit(3);

            const combined = [
                ...(v || []).map(item => ({ ...item, type: 'trip', title: `Viagem: ${item.destination}`, subtitle: item.drivers?.name || item.driver_name })),
                ...(a || []).map(item => ({ ...item, type: 'fuel', title: `Abastecimento: ${Number(item.value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`, subtitle: (item.vehicles?.model || item.vehicle_model) + ' • ' + (item.drivers?.name || item.driver_name || 'N/A') }))
            ].sort((a_item, b_item) => new Date(b_item.created_at) - new Date(a_item.created_at)).slice(0, 5);

            setActivities(combined);
        } catch (error) {
            console.error('Erro ao buscar atividades:', error);
        }
    };

    const fetchChartData = async () => {
        try {
            // Maintenance by Vehicle
            const { data: maintVehData } = await supabase
                .from('maintenances')
                .select('cost, vehicle_model, vehicles(model)');

            const costsByModel = {};
            maintVehData?.forEach(m => {
                const model = m.vehicles?.model || m.vehicle_model || 'Desconhecido';
                costsByModel[model] = (costsByModel[model] || 0) + Number(m.cost);
            });

            // Maintenance Causes
            const { data: maintCausesData } = await supabase
                .from('maintenances')
                .select('type');

            const causesCount = {};
            maintCausesData?.forEach(m => {
                causesCount[m.type] = (causesCount[m.type] || 0) + 1;
            });

            // Distance by Driver
            const { data: distData } = await supabase
                .from('trips')
                .select('distance_km, driver_name, drivers(name)');

            const distByDriver = {};
            distData?.forEach(v => {
                const name = v.drivers?.name || v.driver_name || 'N/A';
                distByDriver[name] = (distByDriver[name] || 0) + Number(v.distance_km);
            });

            setChartData(prev => ({
                ...prev,
                maintenanceByVehicle: {
                    labels: Object.keys(costsByModel),
                    datasets: [{ ...prev.maintenanceByVehicle.datasets[0], data: Object.values(costsByModel) }]
                },
                maintenanceCauses: {
                    labels: Object.keys(causesCount).length > 0 ? Object.keys(causesCount) : prev.maintenanceCauses.labels,
                    datasets: [{ ...prev.maintenanceCauses.datasets[0], data: Object.keys(causesCount).length > 0 ? Object.values(causesCount) : prev.maintenanceCauses.datasets[0].data }]
                },
                distanceByDriver: {
                    labels: Object.keys(distByDriver),
                    datasets: [{ ...prev.distanceByDriver.datasets[0], data: Object.values(distByDriver) }]
                }
            }));
        } catch (error) {
            console.error('Erro ao buscar dados do gráfico:', error);
        }
    };

    // New function to fetch aggregated operating costs
    const [operatingCosts, setOperatingCosts] = useState({
        maintenance: 0,
        fuel: 0,
        tolls: 0,
        fines: 0
    });

    const fetchOperatingCosts = async () => {
        try {
            // 1. Maintenance
            const { data: maintData } = await supabase.from('maintenances').select('cost');
            const totalMaint = maintData?.reduce((acc, curr) => acc + Number(curr.cost || 0), 0) || 0;

            // 2. Fuel
            const { data: fuelData } = await supabase.from('refuelings').select('value');
            const totalFuel = fuelData?.reduce((acc, curr) => acc + Number(curr.value || 0), 0) || 0;

            // 3. Tolls
            const { data: tripsData } = await supabase.from('trips').select('tolls');
            const totalTolls = tripsData?.reduce((acc, curr) => acc + (Number(curr.tolls) || 0), 0) || 0;

            // 4. Fines (Multas)
            const { data: finesData } = await supabase.from('multas').select('valor');
            const totalFines = finesData?.reduce((acc, curr) => acc + Number(curr.valor || 0), 0) || 0;

            setOperatingCosts({
                maintenance: totalMaint,
                fuel: totalFuel,
                tolls: totalTolls,
                fines: totalFines
            });

        } catch (error) {
            console.error('Erro ao buscar custos operacionais:', error);
        }
    };

    useEffect(() => {
        fetchOperatingCosts();
    }, []);

    const fetchStats = async () => {
        try {
            // Fetch expired CNHs
            const today = new Date().toISOString().split('T')[0];
            const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

            // Expired CNHs
            const { count: cnhCount } = await supabase.from('drivers').select('*', { count: 'exact', head: true }).lt('expiration_date', today);

            // Fuel total
            const { data: fuelData } = await supabase.from('refuelings').select('value, liters');
            const fuelSum = fuelData?.reduce((acc, curr) => acc + Number(curr.value), 0) || 0;
            const litersSum = fuelData?.reduce((acc, curr) => acc + Number(curr.liters), 0) || 0;

            // Maintenance total
            const { data: maintData } = await supabase.from('maintenances').select('cost');
            const maintSum = maintData?.reduce((acc, curr) => acc + Number(curr.cost), 0) || 0;

            // Fleet stats
            const { count: fleetCount } = await supabase.from('vehicles').select('*', { count: 'exact', head: true });
            const { count: activeDrivers } = await supabase.from('drivers').select('*', { count: 'exact', head: true }).eq('status', 'ativo');
            const { count: monthlyTrips } = await supabase.from('trips').select('*', { count: 'exact', head: true }).gt('created_at', firstDayOfMonth);

            // Maintenance Alerts
            const { data: vehiclesWithMaint } = await supabase.from('vehicles').select('id, next_maintenance_date, plate, model').not('next_maintenance_date', 'is', null);
            let upcomingMaint = 0;
            let overdueMaint = 0;

            vehiclesWithMaint?.forEach(v => {
                const nextDate = new Date(v.next_maintenance_date + 'T00:00:00');
                const todayDate = new Date();
                todayDate.setHours(0, 0, 0, 0);

                const diffTime = nextDate - todayDate;
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays < 0) {
                    overdueMaint++;
                } else if (diffDays <= 7) {
                    upcomingMaint++;
                }
            });

            setStats({
                cnhVencidas: cnhCount || 0,
                manutencaoVencida: overdueMaint,
                manutencaoProxima: upcomingMaint,
                totalCombustivelValue: fuelSum,
                totalCombustivel: fuelSum.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
                totalManutencaoValue: maintSum,
                totalManutencao: maintSum.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
                totalGeral: (fuelSum + maintSum).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
                totalLitros: litersSum.toLocaleString('pt-BR', { minimumFractionDigits: 1 }) + ' L',
                totalFrota: fleetCount || 0,
                motoristasAtivos: activeDrivers || 0,
                viagensMes: monthlyTrips || 0,
                loading: false
            });
        } catch (error) {
            console.error('Erro ao buscar estatísticas do dashboard:', error);
            setStats(s => ({ ...s, loading: false }));
        }
    };

    const chartOptions = {
        indexAxis: 'y',
        responsive: true,
        plugins: {
            legend: { display: false },
        },
        scales: {
            x: {
                grid: { color: 'rgba(255, 255, 255, 0.1)' },
                ticks: { color: '#94a3b8' }
            },
            y: {
                grid: { display: false },
                ticks: { color: '#94a3b8' }
            },
        },
    };

    const exportToPDF = () => {
        const doc = new jsPDF();

        doc.setFontSize(20);
        doc.text('Relatório de Custos Operacionais', 14, 22);
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Data de Geração: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}`, 14, 30);

        doc.autoTable({
            startY: 40,
            head: [['Categoria', 'Valor (R$)']],
            body: [
                ['Combustível', operatingCosts.fuel.toLocaleString('pt-BR', { minimumFractionDigits: 2 })],
                ['Manutenção', operatingCosts.maintenance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })],
                ['Multas', operatingCosts.fines.toLocaleString('pt-BR', { minimumFractionDigits: 2 })],
                ['Pedágios', operatingCosts.tolls.toLocaleString('pt-BR', { minimumFractionDigits: 2 })],
            ],
            foot: [['Total', (operatingCosts.fuel + operatingCosts.maintenance + operatingCosts.fines + operatingCosts.tolls).toLocaleString('pt-BR', { minimumFractionDigits: 2 })]],
            theme: 'striped',
            headStyles: { fillColor: [14, 165, 233] },
            footStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255] }
        });

        doc.save('relatorio-custos.pdf');
    };

    return (
        <div className="space-y-6 pb-8">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                        Visão <span className="text-sky-500">Geral</span>
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Monitoramento de frota em tempo real</p>
                </div>
            </div>

            {/* 1. Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 px-0.5">
                {[
                    { label: 'Frota Total', value: stats.totalFrota, icon: Car, color: 'text-sky-500', bg: 'bg-sky-500/10' },
                    { label: 'Motoristas', value: stats.motoristasAtivos, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                    { label: 'Viagens / Mês', value: stats.viagensMes, icon: Map, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
                    { label: 'Alertas Ativos', value: stats.manutencaoVencida + stats.manutencaoProxima, icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-500/10' }
                ].map((item, idx) => (
                    <div key={idx} className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 transition-colors">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">{item.label}</p>
                                <h3 className="text-3xl font-bold text-slate-900 dark:text-white">{item.value}</h3>
                            </div>
                            <div className={`p-3 rounded-lg ${item.bg} ${item.color}`}>
                                <item.icon className="w-6 h-6" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* 2. Main Financial Row */}
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 md:p-8 shadow-sm transition-colors">
                <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-6">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                            Custos <span className="text-sky-500">Operacionais</span>
                        </h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Resumo consolidado de despesas mensais</p>
                    </div>
                    <div className="flex gap-4">
                        <div className="p-3 bg-slate-700 rounded-lg text-slate-300 hover:text-white transition-colors cursor-pointer">
                            <FileText className="w-5 h-5" />
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-8 mb-8">
                    {/* Top: Cards & Total */}
                    <div>
                        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                            {[
                                { label: 'Combustível', value: operatingCosts.fuel, icon: Droplets, color: 'text-sky-500' },
                                { label: 'Manutenção', value: operatingCosts.maintenance, icon: Wrench, color: 'text-blue-500' },
                                { label: 'Multas', value: operatingCosts.fines, icon: AlertTriangle, color: 'text-red-500' },
                                { label: 'Pedágios', value: operatingCosts.tolls, icon: Map, color: 'text-indigo-500' },
                                { label: 'Viagens', value: stats.viagensMes, icon: Map, color: 'text-slate-400', isCount: true }
                            ].map((item, idx) => (
                                <div key={idx} className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/50 transition-colors">
                                    <p className={`text-xs font-bold uppercase tracking-wider mb-2 ${item.color}`}>{item.label}</p>
                                    <h4 className="text-xl font-bold text-slate-900 dark:text-white">
                                        {item.isCount ? item.value : item.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </h4>
                                </div>
                            ))}
                        </div>

                        <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
                            <span className="text-slate-500 dark:text-slate-500 font-bold uppercase text-xs tracking-wider mb-1 block">Total do Período</span>
                            <div className="text-4xl font-bold text-slate-900 dark:text-white">
                                {(operatingCosts.maintenance + operatingCosts.fuel + operatingCosts.tolls + operatingCosts.fines).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </div>
                        </div>
                    </div>

                    {/* Bottom: Chart */}
                    <div className="flex items-center justify-center bg-slate-50 dark:bg-slate-900/50 rounded-xl p-6 border border-slate-200 dark:border-slate-700/50 transition-colors w-full max-w-6xl mx-auto h-[350px]">
                        <div className="w-full h-full">
                            <Bar
                                data={{
                                    labels: ['Combustível', 'Manutenção', 'Multas', 'Pedágios'],
                                    datasets: [{
                                        label: 'Valor (R$)',
                                        data: [operatingCosts.fuel, operatingCosts.maintenance, operatingCosts.fines, operatingCosts.tolls],
                                        backgroundColor: ['#0ea5e9', '#3b82f6', '#ef4444', '#6366f1'],
                                        borderRadius: 6,
                                        borderWidth: 0,
                                        barThickness: 24
                                    }]
                                }}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    indexAxis: 'x',
                                    plugins: { legend: { display: false } },
                                    scales: {
                                        x: {
                                            grid: { display: false },
                                            ticks: { color: '#94a3b8', font: { size: 10 } }
                                        },
                                        y: {
                                            grid: { color: 'rgba(255, 255, 255, 0.05)' },
                                            ticks: { color: '#94a3b8', font: { size: 10 } }
                                        }
                                    }
                                }}
                            />
                        </div>
                    </div>
                </div>

                <div className="pt-6 border-t border-slate-200 dark:border-slate-700 flex justify-end">
                    <button onClick={exportToPDF} className="w-full md:w-auto px-6 py-3 bg-sky-600 text-white font-bold uppercase tracking-wide text-xs rounded-lg hover:bg-sky-500 transition-colors flex items-center justify-center gap-3">
                        <FileText className="w-4 h-4" />
                        Exportar Relatório
                    </button>
                </div>
            </div>

            {/* 3. Activity & Distribution Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
                {/* Atividade Recente Table */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors rounded-xl p-6 shadow-sm">
                    <h3 className="text-slate-900 dark:text-white text-sm font-bold uppercase tracking-wider mb-6 flex items-center gap-3">
                        <div className="w-2 h-2 bg-sky-500 rounded-full"></div>
                        Atividade Recente
                    </h3>
                    <div className="space-y-3">
                        {activities.map((act, idx) => (
                            <div key={idx} className="flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors cursor-pointer">
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-lg ${act.type === 'trip' ? 'bg-blue-500/10 text-blue-500' : 'bg-sky-500/10 text-sky-500'}`}>
                                        {act.type === 'trip' ? <Car className="w-5 h-5" /> : <Wrench className="w-5 h-5" />}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-900 dark:text-white">{act.title}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{act.subtitle}</p>
                                    </div>
                                </div>
                                <div className="text-right hidden md:block">
                                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{new Date(act.created_at).toLocaleDateString('pt-BR')}</p>
                                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase mt-1">Concluído</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Efficiency Chart / Gauge */}
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors rounded-xl p-6 shadow-sm flex flex-col items-center justify-center">
                    <h3 className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider self-start mb-8">Eficiência Operacional</h3>
                    <div className="relative w-48 h-48">
                        <Doughnut
                            data={{
                                datasets: [{
                                    data: [85, 15],
                                    backgroundColor: ['#0ea5e9', '#1e293b'],
                                    borderWidth: 0,
                                    circumference: 360,
                                    rotation: 0,
                                    borderRadius: 4,
                                    spacing: 0
                                }]
                            }}
                            options={{
                                cutout: '80%',
                                plugins: { tooltip: { enabled: false } },
                                animation: { animateRotate: true, duration: 1000 }
                            }}
                        />
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-4xl font-bold text-slate-900 dark:text-white">85<span className="text-sky-500 text-xl">%</span></span>
                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mt-1">No Prazo</span>
                        </div>
                    </div>
                    <div className="w-full mt-8 grid grid-cols-2 gap-4">
                        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-center transition-colors">
                            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase mb-1">Total</p>
                            <p className="text-base font-bold text-slate-900 dark:text-white">24</p>
                        </div>
                        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-center transition-colors">
                            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase mb-1">Atraso</p>
                            <p className="text-base font-bold text-rose-500">02</p>
                        </div>
                    </div>
                </div>
            </div>
        </div >
    );
};

export default Dashboard;
