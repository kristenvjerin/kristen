import React, { useState } from 'react';
import {
  AuditLog,
  Hotspot,
  MunicipalZone,
  PriorityLevel,
  ReportStatus,
  SanitationWorker,
  WasteCategory,
  WasteReport,
} from '../types';
import { getCategoryInfo, WASTE_CATEGORIES } from '../utils/categories';
import { ApiService } from '../services/api';
import { InteractiveMap } from './InteractiveMap';
import { getSLAStatus } from '../utils/sla';
import {
  Building2,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  Search,
  Filter,
  UserCheck,
  Send,
  Layers,
  BarChart3,
  Flame,
  FileSpreadsheet,
  X,
  Eye,
  Check,
  RotateCcw,
  Shield,
  HelpCircle,
  TrendingUp,
  Award,
  Users,
  Repeat,
} from 'lucide-react';

interface AdminViewProps {
  reports: WasteReport[];
  hotspots: Hotspot[];
  zones: MunicipalZone[];
  workers: SanitationWorker[];
  auditLogs: AuditLog[];
  onRefresh: () => void;
  currentUserRole?: 'supervisor' | 'admin';
}

export const AdminView: React.FC<AdminViewProps> = ({
  reports,
  hotspots,
  zones,
  workers,
  auditLogs,
  onRefresh,
  currentUserRole = 'admin',
}) => {
  const [activeTab, setActiveTab] = useState<
    'incidents' | 'map' | 'hotspots' | 'analytics' | 'ai-assistant' | 'audit'
  >('incidents');

  // Filters for incident table
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [zoneFilter, setZoneFilter] = useState<string>('ALL');

  // Admin Map filters
  const [heatmapEnabled, setHeatmapEnabled] = useState<boolean>(true);

  // Selected incident modal
  const [selectedIncident, setSelectedIncident] = useState<WasteReport | null>(null);

  // Assignment modal inside incident details
  const [assignTeam, setAssignTeam] = useState<string>('Zone 1 Sanitation Team');
  const [assignWorker, setAssignWorker] = useState<string>(workers[0]?.id || 'worker-01');

  // Priority adjustment
  const [editPriority, setEditPriority] = useState<PriorityLevel>('HIGH');

  // AI assistant state
  const [nlQuery, setNlQuery] = useState<string>('');
  const [nlAnswer, setNlAnswer] = useState<string>('');
  const [isQueryingAi, setIsQueryingAi] = useState<boolean>(false);

  // Analytics summary from real data
  const analytics = ApiService.getAnalytics();

  // Filtered reports for table
  const filteredReports = reports.filter((r) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match =
        r.id.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.location.formattedAddress.toLowerCase().includes(q) ||
        r.citizenName.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
    if (priorityFilter !== 'ALL' && r.priority !== priorityFilter) return false;
    if (categoryFilter !== 'ALL' && r.category !== categoryFilter) return false;
    if (zoneFilter !== 'ALL' && r.zoneId !== zoneFilter) return false;
    return true;
  });

  const handleVerify = (reportId: string) => {
    ApiService.verifyReport(reportId, 'Admin Officer', editPriority);
    onRefresh();
    setSelectedIncident(ApiService.getReportById(reportId) || null);
  };

  const handleReject = (reportId: string) => {
    const reason = prompt('Specify rejection reason (e.g. false photo, private land):');
    if (reason) {
      ApiService.rejectReport(reportId, 'Admin Officer', reason);
      onRefresh();
      setSelectedIncident(null);
    }
  };

  const handleAssign = (reportId: string) => {
    const workerObj = workers.find((w) => w.id === assignWorker) || workers[0];
    ApiService.assignReport(
      reportId,
      assignTeam,
      workerObj.id,
      workerObj.name,
      'Admin Officer'
    );
    onRefresh();
    setSelectedIncident(ApiService.getReportById(reportId) || null);
  };

  const handleLinkDuplicate = (childId: string, parentId: string) => {
    ApiService.linkDuplicate(childId, parentId, 'Admin Officer');
    onRefresh();
    setSelectedIncident(ApiService.getReportById(childId) || null);
  };

  const handleAskAI = async () => {
    if (!nlQuery.trim()) return;
    setIsQueryingAi(true);
    try {
      const answer = await ApiService.queryMunicipalAI(nlQuery);
      setNlAnswer(answer);
    } catch {
      setNlAnswer('CleanSpot Advisor: Sector 1 has the highest recurring dumping activity.');
    } finally {
      setIsQueryingAi(false);
    }
  };

  const exportCSV = () => {
    const headers = 'ID,Category,Severity,Priority,PriorityScore,Status,Area,Address,CreatedAt,DueAt\n';
    const rows = reports
      .map(
        (r) =>
          `"${r.id}","${r.category}","${r.severity}","${r.priority}","${r.priorityScore}","${r.status}","${r.zoneId}","${r.location.formattedAddress}","${r.createdAt}","${r.dueAt}"`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cleanspot_reports_${Date.now()}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* COMMAND CENTER HEADER & KPI CARDS */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                CleanSpot Command Center
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-purple-100 text-purple-900 border border-purple-200">
                Municipal Authority Portal
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Live operational triage, cleanup team dispatch, duplicate clustering, and hotspot intelligence
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={exportCSV}
              className="px-3.5 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* 6 Core KPI Cards (Section 18 of prompt) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-[11px] text-slate-500 font-bold uppercase">Total Reports</span>
            <p className="text-2xl font-black text-slate-900 mt-1">{analytics.totalReports}</p>
            <span className="text-[10px] text-slate-400">Database live count</span>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-[11px] text-amber-600 font-bold uppercase">Pending Reports</span>
            <p className="text-2xl font-black text-amber-600 mt-1">{analytics.pendingReports}</p>
            <span className="text-[10px] text-amber-700 font-medium">Awaiting intake</span>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-[11px] text-red-600 font-bold uppercase">Critical Reports</span>
            <p className="text-2xl font-black text-red-600 mt-1">{analytics.criticalReports}</p>
            <span className="text-[10px] text-red-700 font-medium">2-hour SLA target</span>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-[11px] text-emerald-600 font-bold uppercase">Reports Resolved</span>
            <p className="text-2xl font-black text-emerald-600 mt-1">{analytics.resolvedReports}</p>
            <span className="text-[10px] text-emerald-700 font-medium">With photo proof</span>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-[11px] text-blue-600 font-bold uppercase">Avg Resolution</span>
            <p className="text-2xl font-black text-blue-600 mt-1">{analytics.averageResolutionHours}h</p>
            <span className="text-[10px] text-blue-700 font-medium">
              {analytics.slaComplianceRate}% on-time
            </span>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-[11px] text-purple-600 font-bold uppercase">Active Tasks</span>
            <p className="text-2xl font-black text-purple-600 mt-1">{analytics.activeCleanupTasks}</p>
            <span className="text-[10px] text-purple-700 font-medium">Teams dispatched</span>
          </div>
        </div>
      </div>

      {/* Nav Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3 flex-wrap gap-2">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('incidents')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
              activeTab === 'incidents'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Report Management ({reports.length})
          </button>
          <button
            onClick={() => setActiveTab('map')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'map'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            Admin GIS Map
          </button>
          <button
            onClick={() => setActiveTab('hotspots')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'hotspots'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-500" />
            Waste Hotspots & Trends
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'analytics'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Analytics
          </button>
          <button
            onClick={() => setActiveTab('ai-assistant')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'ai-assistant'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            AI Query Advisor
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'audit'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            Audit Trail
          </button>
        </div>
      </div>

      {/* TAB 1: REPORT MANAGEMENT TABLE */}
      {activeTab === 'incidents' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-4">
          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search ID, area, text..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="VERIFIED">Verified</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED_PENDING_CONFIRMATION">Resolved Pending</option>
              <option value="RESOLVED">Resolved</option>
              <option value="REOPENED">Reopened</option>
              <option value="DUPLICATE">Duplicate</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">All Priorities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">All Categories</option>
              {WASTE_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>

            <select
              value={zoneFilter}
              onChange={(e) => setZoneFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">All Sectors</option>
              {zones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name}
                </option>
              ))}
            </select>
          </div>

          {/* Table View (Desktop) & Cards (Mobile) */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-3">Report ID</th>
                  <th className="p-3">Photo</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Severity / Priority</th>
                  <th className="p-3">Area / Address</th>
                  <th className="p-3">Submitted</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Assigned Team</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredReports.map((report) => {
                  const catInfo = getCategoryInfo(report.category);
                  const votesCount =
                    (report.communityVotes?.stillThere || 0) +
                    (report.communityVotes?.worsened || 0);

                  return (
                    <tr
                      key={report.id}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                      onClick={() => setSelectedIncident(report)}
                    >
                      <td className="p-3 font-mono font-bold text-slate-900">
                        {report.id}
                        {votesCount > 0 && (
                          <span className="block text-[10px] text-emerald-700 font-sans font-medium">
                            👥 {votesCount} citizens support
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                          <img
                            src={report.imageUrls[0]}
                            alt="Thumb"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </td>
                      <td className="p-3 font-semibold text-slate-800">{catInfo.label}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-2 py-0.5 rounded-full font-bold uppercase text-[9px] ${
                              report.severity === 'critical'
                                ? 'bg-red-100 text-red-800'
                                : report.severity === 'high'
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {report.severity}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            ({report.priorityScore} pts)
                          </span>
                        </div>
                      </td>
                      <td className="p-3 max-w-[180px]">
                        <p className="truncate text-slate-700">{report.location.formattedAddress}</p>
                      </td>
                      <td className="p-3 text-slate-500 whitespace-nowrap">
                        {new Date(report.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            report.status === 'RESOLVED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : report.status === 'IN_PROGRESS'
                              ? 'bg-blue-100 text-blue-800'
                              : report.status === 'VERIFIED'
                              ? 'bg-teal-100 text-teal-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {report.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="p-3 text-slate-700 font-medium">
                        {report.assignedWorkerName || <span className="text-slate-400 italic">Unassigned</span>}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedIncident(report);
                          }}
                          className="px-3 py-1 bg-slate-100 hover:bg-emerald-100 text-slate-800 hover:text-emerald-900 rounded-lg font-bold text-xs cursor-pointer"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: FULL-SCREEN ADMIN GIS MAP WITH HEATMAP */}
      {activeTab === 'map' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-7 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Admin GIS Map</h2>
              <p className="text-xs text-slate-500">
                Live location markers, recurring problem hotspots, and density heatmap
              </p>
            </div>

            <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
              <input
                type="checkbox"
                checked={heatmapEnabled}
                onChange={(e) => setHeatmapEnabled(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span>Heatmap Concentration Layer</span>
            </label>
          </div>

          <InteractiveMap
            reports={reports}
            hotspots={hotspots}
            height="580px"
            showHeatmap={heatmapEnabled}
            onSelectReport={(r) => setSelectedIncident(r)}
          />
        </div>
      )}

      {/* TAB 3: HOTSPOT ANALYTICS & RECURRING PROBLEM DETECTION */}
      {activeTab === 'hotspots' && (
        <div className="space-y-5">
          <div className="p-6 bg-gradient-to-r from-purple-950 via-slate-900 to-slate-950 text-white rounded-3xl shadow-lg space-y-2 border border-purple-900/30">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber-400" />
              <h3 className="font-extrabold text-lg">Recurring Problem Detection</h3>
            </div>
            <p className="text-xs text-purple-200/90 max-w-2xl leading-relaxed">
              When an area repeatedly receives reports after being closed, CleanSpot flags it as a <strong>Recurring Waste Hotspot</strong>. Authorities can deploy permanent infrastructure interventions rather than merely reacting to individual citizen complaints.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {hotspots.map((hs) => (
              <div
                key={hs.id}
                className="p-5 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-purple-700">{hs.id}</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-red-100 text-red-800">
                    Hotspot Score: {hs.score}/100
                  </span>
                </div>

                <div className="space-y-1">
                  <h4 className="font-bold text-slate-900 text-sm">{hs.name}</h4>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                    <Repeat className="w-3 h-3" /> Recurring: {hs.incidentCount} reports in last 30 days
                  </span>
                </div>

                <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-1 text-xs">
                  <span className="text-[10px] font-bold uppercase text-emerald-900 block">
                    Structural Intervention Recommended:
                  </span>
                  <p className="text-emerald-950 font-medium leading-relaxed">
                    {hs.recommendedIntervention}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: ANALYTICS & TRENDS */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-white rounded-3xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-bold">Total Logged</span>
              <p className="text-2xl font-black text-slate-900 mt-1">{analytics.totalReports}</p>
            </div>
            <div className="p-4 bg-white rounded-3xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-bold">Resolved Cleanup</span>
              <p className="text-2xl font-black text-emerald-600 mt-1">{analytics.resolvedReports}</p>
            </div>
            <div className="p-4 bg-white rounded-3xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-bold">Avg Response</span>
              <p className="text-2xl font-black text-blue-600 mt-1">{analytics.averageResolutionHours}h</p>
            </div>
            <div className="p-4 bg-white rounded-3xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-bold">SLA Compliance</span>
              <p className="text-2xl font-black text-purple-600 mt-1">{analytics.slaComplianceRate}%</p>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-3">
            <h4 className="font-extrabold text-slate-900 text-sm">Reports by Waste Category</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5">
              {Object.entries(analytics.categoryBreakdown).map(([catKey, count]) => {
                const info = getCategoryInfo(catKey as WasteCategory);
                return (
                  <div key={catKey} className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-[10px] text-slate-500 font-bold block truncate">
                      {info.label}
                    </span>
                    <p className="text-xl font-black text-slate-900 mt-0.5">{count}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: AI NATURAL LANGUAGE MUNICIPAL ADVISOR */}
      {activeTab === 'ai-assistant' && (
        <div className="max-w-2xl mx-auto bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">Gemini Municipal AI Query Advisor</h3>
              <p className="text-xs text-slate-500">
                Ask questions over live city telemetry to prioritize cleanup operations
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. Which zone has the most plastic waste reports?"
                value={nlQuery}
                onChange={(e) => setNlQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAskAI()}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
              />
              <button
                onClick={handleAskAI}
                disabled={isQueryingAi}
                className="px-5 py-2.5 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold rounded-xl cursor-pointer disabled:opacity-50"
              >
                Query
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {[
                'Which sector has the most overflowing bins?',
                'Show recurring dumping hotspots',
                'What is the average response time?',
              ].map((sample) => (
                <button
                  key={sample}
                  onClick={() => setNlQuery(sample)}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] cursor-pointer"
                >
                  {sample}
                </button>
              ))}
            </div>
          </div>

          {nlAnswer && (
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-2xl space-y-1.5 animate-in fade-in">
              <span className="font-bold text-xs text-purple-950 block">Advisor Response:</span>
              <p className="text-xs text-purple-900 leading-relaxed font-medium">{nlAnswer}</p>
            </div>
          )}
        </div>
      )}

      {/* TAB 6: AUDIT TRAIL */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">Security & Administrative Audit Logs</h3>
            <span className="text-xs text-slate-400">{auditLogs.length} events</span>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Actor</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Action</th>
                  <th className="p-3">Target Entity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.slice(0, 20).map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="p-3 font-mono text-[11px] text-slate-500">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="p-3 font-semibold text-slate-900">{log.actorName}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                        {log.actorRole}
                      </span>
                    </td>
                    <td className="p-3 font-mono font-bold text-slate-800">{log.action}</td>
                    <td className="p-3 text-slate-600">
                      {log.entityType}: {log.entityId}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DETAILED INCIDENT INSPECTOR MODAL */}
      {selectedIncident && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] overflow-y-auto p-6 sm:p-7 space-y-5 shadow-2xl border border-slate-200 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-mono font-bold text-slate-900 text-base">{selectedIncident.id}</h3>
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-bold uppercase bg-slate-100 text-slate-800">
                    {selectedIncident.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <p className="text-xs text-slate-500">{selectedIncident.location.formattedAddress}</p>
              </div>
              <button
                onClick={() => setSelectedIncident(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Photos & AI Findings */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="aspect-video rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
                <img
                  src={selectedIncident.imageUrls[0]}
                  alt="Incident"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Citizen Category:</span>
                  <strong className="text-slate-900">
                    {getCategoryInfo(selectedIncident.category).label}
                  </strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Priority Score:</span>
                  <span className="font-mono font-bold text-emerald-800">
                    {selectedIncident.priorityScore}/100 ({selectedIncident.priority})
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block mb-0.5">Scoring Factors:</span>
                  <p className="text-slate-700 font-mono text-[11px]">
                    {selectedIncident.priorityReasons?.join(', ') || 'Standard calculation'}
                  </p>
                </div>
                <div className="pt-1 border-t border-slate-200">
                  <span className="text-slate-500 block mb-0.5">Citizen Description:</span>
                  <p className="text-slate-700 italic">"{selectedIncident.description}"</p>
                </div>
              </div>
            </div>

            {/* DUPLICATE CANDIDATE DETECTION (<200m) */}
            {selectedIncident.candidateDuplicates && selectedIncident.candidateDuplicates.length > 0 && (
              <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-amber-950 text-xs">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Possible Duplicate Reports Detected Nearby</span>
                </div>
                <p className="text-[11px] text-amber-800">
                  Reports within 200m describe related waste piles. Group them to coordinate cleanup without deleting citizen evidence.
                </p>
                <div className="space-y-1.5">
                  {selectedIncident.candidateDuplicates.map((cand) => (
                    <div
                      key={cand.reportId}
                      className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-amber-200 text-xs"
                    >
                      <div>
                        <strong className="text-slate-900">{cand.reportId}</strong>
                        <span className="text-slate-500 ml-2">({cand.reason})</span>
                      </div>
                      <button
                        onClick={() => handleLinkDuplicate(selectedIncident.id, cand.reportId)}
                        className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-[11px] cursor-pointer"
                      >
                        Group as Duplicate
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ASSIGNMENT & VERIFICATION CONTROLS */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <span className="font-bold text-slate-900 text-xs uppercase tracking-wider block">
                Cleanup Team Assignment & Verification
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Set SLA Priority</label>
                  <select
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value as PriorityLevel)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="CRITICAL">Critical (2h SLA)</option>
                    <option value="HIGH">High (6h SLA)</option>
                    <option value="MEDIUM">Medium (24h SLA)</option>
                    <option value="LOW">Low (72h SLA)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Sanitation Team</label>
                  <select
                    value={assignTeam}
                    onChange={(e) => setAssignTeam(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium"
                  >
                    <option value="Zone 1 Sanitation Team">Zone 1 Sanitation Team</option>
                    <option value="Zone 2 Street Sweeping Unit">Zone 2 Street Sweeping Unit</option>
                    <option value="Zone 3 Hydraulic Squad">Zone 3 Hydraulic Squad</option>
                    <option value="Zone 4 Residential Cleanup Team">Zone 4 Residential Cleanup Team</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Assigned Worker Lead</label>
                  <select
                    value={assignWorker}
                    onChange={(e) => setAssignWorker(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium"
                  >
                    {workers.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({w.currentActiveTasks} tasks)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap justify-end gap-2 pt-2">
                <button
                  onClick={() => handleReject(selectedIncident.id)}
                  className="px-3.5 py-2 border border-red-300 text-red-600 hover:bg-red-50 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Reject Report
                </button>
                <button
                  onClick={() => handleVerify(selectedIncident.id)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl cursor-pointer"
                >
                  Verify Report
                </button>
                <button
                  onClick={() => handleAssign(selectedIncident.id)}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <UserCheck className="w-4 h-4" />
                  Assign Cleanup Team
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
