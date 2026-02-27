import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import styles from "../styles/Dashboard.module.css";
import {
  Calendar,
  CheckCircle,
  AlertCircle,
  FileDown,
  Filter,
  RotateCcw,
} from "lucide-react";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { format } from "date-fns";

export default function Dashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    missed: 0,
  });
  const [statusData, setStatusData] = useState([]);
  const [agentData, setAgentData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    city: "",
    neighborhood: "",
    agentId: "",
    status: "",
  });

  // Filter Options
  const [options, setOptions] = useState({
    cities: [],
    neighborhoods: [],
    agents: [],
  });

  useEffect(() => {
    fetchFilterOptions();
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [filters]); // Re-fetch when filters change

  const fetchFilterOptions = async () => {
    try {
      // Fetch Agents
      const { data: agents } = await supabase
        .from("profiles")
        .select("id, full_name")
        .order("full_name");

      // Fetch Cities and Neighborhoods from visits (distinct)
      const { data: visits } = await supabase
        .from("visits")
        .select("city, neighborhood");

      const uniqueCities = [
        ...new Set(visits?.map((v) => v.city).filter(Boolean)),
      ].sort();
      const uniqueNeighborhoods = [
        ...new Set(visits?.map((v) => v.neighborhood).filter(Boolean)),
      ].sort();

      setOptions({
        cities: uniqueCities || [],
        neighborhoods: uniqueNeighborhoods || [],
        agents: agents || [],
      });
    } catch (error) {
      console.error("Error fetching options:", error);
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      let query = supabase.from("visits").select(`
          id, 
          status, 
          created_at,
          date_effective,
          city,
          neighborhood,
          address_block,
          address_lot,
          agent_id,
          profiles:agent_id (full_name)
        `);

      // Apply Filters
      if (filters.startDate)
        query = query.gte("date_effective", filters.startDate);
      if (filters.endDate) query = query.lte("date_effective", filters.endDate);
      if (filters.city) query = query.eq("city", filters.city);
      if (filters.neighborhood)
        query = query.eq("neighborhood", filters.neighborhood);
      if (filters.agentId) query = query.eq("agent_id", filters.agentId);
      if (filters.status) query = query.eq("status", filters.status);

      const { data: visits, error } = await query;

      if (error) throw error;

      // Calculate Stats
      const total = visits.length;
      const completed = visits.filter(
        (v) => v.status === "Vistoria Finalizada"
      ).length;
      const missed = visits.filter(
        (v) =>
          v.status === "Vistoria em aberto" ||
          v.status === "Vistoria Improdutiva"
      ).length;

      setStats({ total, completed, missed });

      // Chart Data: Status (Pie)
      const statusCounts = visits.reduce((acc, visit) => {
        acc[visit.status] = (acc[visit.status] || 0) + 1;
        return acc;
      }, {});

      const pieData = Object.keys(statusCounts).map((status) => ({
        name: status,
        value: statusCounts[status],
      }));
      setStatusData(pieData);

      // Chart Data: Agent (Bar)
      const agentCounts = visits.reduce((acc, visit) => {
        const agentName = visit.profiles?.full_name || "Desconhecido";
        acc[agentName] = (acc[agentName] || 0) + 1;
        return acc;
      }, {});

      const barData = Object.keys(agentCounts).map((agent) => ({
        name: agent,
        visits: agentCounts[agent],
      }));
      setAgentData(barData);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();

    // Header
    // Note: Assuming logo loads, otherwise it might be blank.
    // In production, better to use base64 string for reliability.
    try {
      const img = new Image();
      img.src = logo;
      // Dimensions: Width ~47 (39 * 1.2), Height ~13 (15 * 0.85)
      doc.addImage(img, "PNG", 14, 10, 47, 13);
    } catch (e) {
      console.warn("Logo not loaded for PDF");
    }

    doc.setFontSize(18);
    // Center Title. Page width is typically 210mm (A4).
    // We can use doc.internal.pageSize.getWidth() / 2 or align: 'center'
    const pageWidth = doc.internal.pageSize.getWidth();
    doc.text("Relatório de Vistorias", pageWidth / 2, 20, { align: "center" });

    doc.setFontSize(10);
    doc.text(
      `Gerado em: ${new Date().toLocaleDateString()} às ${new Date().toLocaleTimeString()}`,
      pageWidth / 2,
      26,
      { align: "center" }
    );

    // Filters Header
    doc.setDrawColor(200);
    doc.line(14, 32, 196, 32);

    let filterText = "Filtros Aplicados: ";
    if (filters.startDate || filters.endDate)
      filterText += `Período: ${filters.startDate || "Inicio"} até ${
        filters.endDate || "Hoje"
      } | `;
    if (filters.city) filterText += `Cidade: ${filters.city} | `;
    if (filters.neighborhood)
      filterText += `Bairro: ${filters.neighborhood} | `;
    if (filters.agentId) {
      const agentName = "N/A";
      filterText += `Agente: ${agentName} | `;
    }
    if (filters.status) filterText += `Status: ${filters.status}`;

    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(filterText, 14, 38);

    // Summary Stats
    doc.setTextColor(0);
    doc.setFontSize(11);
    doc.text(
      `Resumo: Total: ${stats.total} | Finalizadas: ${stats.completed} | Em Aberto: ${stats.missed}`,
      14,
      46
    );

    // Table
    // We need to fetch the data again to list it, or just use the stats.
    // The user asked for "Listagem" in the plan confirmation, but the implementation plan text said "Tabela com o resumo".
    // I will list the visits. Since I have 'visits' only inside fetchDashboardData scope, I should probably save it to state or refetch.
    // For simplicity/performance, I'll assume we want the aggregated stats + charts primarily, but let me check user request carefully:
    // "relatório PDF, deve conter... Título, Faixa de tempo, Cidade e Estado, Agente... assim como Relatórios basico do que está sendo filtrado"
    // It implies a list. I'll fetch the current filtered list for the PDF.

    exportPDFContent(doc);
  };

  const exportPDFContent = async (doc) => {
    // Re-run query to get data for table
    let query = supabase.from("visits").select(`
        created_at, date_effective, status, city, neighborhood, address_block, address_lot,
        profiles:agent_id(full_name)
      `);
    if (filters.startDate)
      query = query.gte("date_effective", filters.startDate);
    if (filters.endDate) query = query.lte("date_effective", filters.endDate);
    if (filters.city) query = query.eq("city", filters.city);
    if (filters.neighborhood)
      query = query.eq("neighborhood", filters.neighborhood);
    if (filters.agentId) query = query.eq("agent_id", filters.agentId);
    if (filters.status) query = query.eq("status", filters.status);

    const { data: visits } = await query;

    const tableData = visits.map((v) => [
      v.date_effective ? format(new Date(v.date_effective), "dd/MM/yyyy") : "-",
      v.city,
      v.neighborhood,
      `Q: ${v.address_block} L: ${v.address_lot}`,
      v.status,
      v.profiles?.full_name || "-",
    ]);

    doc.autoTable({
      startY: 55,
      head: [["Data", "Cidade", "Bairro", "Endereço", "Status", "Agente"]],
      body: tableData,
      theme: "grid",
      headStyles: { fillColor: [79, 70, 229] },
      styles: { fontSize: 8 },
    });

    doc.save("relatorio_vistorias.pdf");
  };

  const COLORS = ["#3b82f6", "#10b981", "#fbbf24", "#ef4444", "#8b5cf6"];

  if (loading && !stats.total) {
    // access loading initial only
    // return <div className="p-8 text-white">Carregando dados...</div>;
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Dashboard</h1>
          <p className={styles.subtitle}>
            Visão geral e indicadores de performance
          </p>
        </div>
      </header>

      {/* Filters Bar */}
      <div className={styles.filtersBar}>
        {/* Row 1: Date Period, Agent, Export */}
        <div className={styles.filterRow}>
          <div className={styles.filterGroup} style={{ flex: "2 1 300px" }}>
            <label>Período (Data Efetiva)</label>
            <div className={styles.dateGroupWithAction}>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) =>
                  setFilters({ ...filters, startDate: e.target.value })
                }
                placeholder="De"
              />
              <span className="text-gray-500">-</span>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) =>
                  setFilters({ ...filters, endDate: e.target.value })
                }
                placeholder="Até"
              />
              <button
                className={styles.iconBtn}
                onClick={() =>
                  setFilters({ ...filters, startDate: "", endDate: "" })
                }
                title="Limpar Datas"
              >
                <RotateCcw size={16} />
              </button>
            </div>
          </div>

          <button onClick={handleExportPDF} className={styles.exportBtn}>
            <FileDown size={18} />
            Exportar PDF
          </button>
        </div>

        {/* Row 2: Agent, City, Neighborhood */}
        <div className={styles.filterRow}>
          <div className={styles.filterGroup}>
            <label>Agente</label>
            <select
              value={filters.agentId}
              onChange={(e) =>
                setFilters({ ...filters, agentId: e.target.value })
              }
            >
              <option value="">Todos</option>
              {options.agents.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.full_name}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label>Cidade</label>
            <select
              value={filters.city}
              onChange={(e) => setFilters({ ...filters, city: e.target.value })}
            >
              <option value="">Todas</option>
              {options.cities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label>Bairro</label>
            <select
              value={filters.neighborhood}
              onChange={(e) =>
                setFilters({ ...filters, neighborhood: e.target.value })
              }
            >
              <option value="">Todos</option>
              {options.neighborhoods.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label>Status</label>
            <select
              value={filters.status}
              onChange={(e) =>
                setFilters({ ...filters, status: e.target.value })
              }
            >
              <option value="">Todos</option>
              <option value="Agendar Vistoria">Agendar Vistoria</option>
              <option value="Vistoria Agendada">Vistoria Agendada</option>
              <option value="Vistoria Finalizada">Vistoria Finalizada</option>
              <option value="Vistoria em aberto">Vistoria em aberto</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className={styles.grid}>
        <div
          className={`${styles.card} glass-panel`}
          style={{ borderLeft: "4px solid #3b82f6" }}
        >
          <div className={styles.cardHeader}>
            <span className="text-gray-400">Total Vistorias</span>
            <Calendar className="text-blue-500" />
          </div>
          <p className={styles.cardValue}>{stats.total}</p>
        </div>

        {/* Removed Scheduled KPI as requested */}

        <div
          className={`${styles.card} glass-panel`}
          style={{ borderLeft: "4px solid #10b981" }}
        >
          <div className={styles.cardHeader}>
            <span className="text-gray-400">Finalizadas</span>
            <CheckCircle className="text-emerald-500" />
          </div>
          <p className={styles.cardValue}>{stats.completed}</p>
        </div>

        <div
          className={`${styles.card} glass-panel`}
          style={{ borderLeft: "4px solid #ef4444" }}
        >
          <div className={styles.cardHeader}>
            <span className="text-gray-400">Em Aberto</span>
            <AlertCircle className="text-red-500" />
          </div>
          <p className={styles.cardValue}>{stats.missed}</p>
        </div>
      </div>

      {/* Charts */}
      <div className={styles.chartsGrid}>
        {/* Pie Chart */}
        <div className={`${styles.chartCard} glass-panel`}>
          <h3>Status das Vistorias</h3>
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "none",
                    borderRadius: "8px",
                  }}
                  itemStyle={{ color: "#f8fafc" }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart */}
        <div className={`${styles.chartCard} glass-panel`}>
          <h3>Vistorias por Agente</h3>
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={agentData}>
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  cursor={{ fill: "rgba(255,255,255,0.05)" }}
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "none",
                    borderRadius: "8px",
                  }}
                  itemStyle={{ color: "#f8fafc" }}
                />
                <Bar dataKey="visits" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
