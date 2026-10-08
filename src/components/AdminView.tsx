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
  AlertCircle,
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

  // Reject confirmation dialog state (Section 53)
  const [rejectDialogReport, setRejectDialogReport] = useState<WasteReport | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('Not a waste hazard / private property');

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

  // "Needs Attention" queue: Critical reports + old unresolved reports (Section 108-109)
  const needsAttentionReports = reports.filter(
    (r) =>
      (r.priority === 'CRITICAL' || r.severity === 'critical' || r.status === 'REOPENED') &&
      r.status !== 'RESOLVED' &&
      r.status !== 'REJECTED'
  );

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

  const handleConfirmReject = () => {
    if (!rejectDialogReport) return;
    ApiService.rejectReport(rejectDialogReport.id, 'Admin Officer', rejectReason);
    onRefresh();
    setRejectDialogReport(null);
    setSelectedIncident(null);
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
      setNlAnswer('CleanSpot Advisor: Sector 1 (Commercial) presents highest recurring volume.');
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
      {/* 1. OPERATIONAL GREETING & SUMMARY (Section 48) */}
      <div className="bg-white rounded-[24px] border border-[#E2E8E4] p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-[#17201B]">
              Good afternoon, Municipal Admin
            </h1>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#E8F5EE] text-[#0E4D32] border border-[#3FA66B]/30">
              ● Live Operations
            </span>
          </div>
          <p className="text-xs text-[#657169] mt-0.5">
            CleanSpot Command Center: {needsAttentionReports.length} urgent incidents currently require action
          </p>
        </div>

        <button
          onClick={exportCSV}
          className="touch-target px-4 py-2 bg-[#F7F9F7] hover:bg-slate-100 border border-[#E2E8E4] text-[#17201B] font-semibold text-xs rounded-[12px] flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
        >
          <FileSpreadsheet className="w-4 h-4 text-[#176B45]" />
          <span>Export Incident CSV</span>
        </button>
      </div>

      {/* 2. NEEDS ATTENTION PRIORITY QUEUE (Section 108-109) */}
      {needsAttentionReports.length > 0 && (
        <div className="bg-white rounded-[20px] border border-[#D64545]/30 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[#D64545] font-bold text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>Needs Attention ({needsAttentionReports.length} urgent issues)</span>
            </div>
            <span className="text-[11px] text-[#657169]">Critical hazards & reopened reports</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {needsAttentionReports.slice(0, 3).map((r) => {
              const cat = getCategoryInfo(r.category);
              return (
                <div
                  key={r.id}
                  onClick={() => setSelectedIncident(r)}
                  className="p-3.5 rounded-[14px] bg-[#F7F9F7] border border-[#D64545]/20 hover:border-[#D64545] cursor-pointer transition-all space-y-1.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-[#17201B]">{r.id}</span>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-red-100 text-red-800">
                      {r.status === 'REOPENED' ? 'Reopened' : r.priority}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-[#17201B] truncate">{cat.label}</p>
                  <p className="text-[11px] text-[#657169] truncate flex items-center gap-1">
                    <MapPin className="w-3 h-3 shrink-0 text-[#8B9690]" />
                    <span>{r.location.formattedAddress}</span>
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. KPI CARDS (Section 48-49) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 bg-white rounded-[18px] border border-[#E2E8E4] shadow-xs">
          <span className="text-[11px] text-[#657169] font-medium uppercase">Total Reports</span>
          <p className="text-2xl font-bold text-[#17201B] mt-1">{analytics.totalReports}</p>
          <span className="text-[10px] text-[#657169]">All recorded</span>
        </div>

        <div className="p-4 bg-white rounded-[18px] border border-[#E2E8E4] shadow-xs">
          <span className="text-[11px] text-[#E7A52B] font-medium uppercase">Pending</span>
          <p className="text-2xl font-bold text-[#E7A52B] mt-1">{analytics.pendingReports}</p>
          <span className="text-[10px] text-[#657169]">Awaiting intake</span>
        </div>

        <div className="p-4 bg-white rounded-[18px] border border-[#E2E8E4] shadow-xs">
          <span className="text-[11px] text-[#D64545] font-medium uppercase">Critical</span>
          <p className="text-2xl font-bold text-[#D64545] mt-1">{analytics.criticalReports}</p>
          <span className="text-[10px] text-[#657169]">2h SLA target</span>
        </div>

        <div className="p-4 bg-white rounded-[18px] border border-[#E2E8E4] shadow-xs">
          <span className="text-[11px] text-[#176B45] font-medium uppercase">Resolved</span>
          <p className="text-2xl font-bold text-[#176B45] mt-1">{analytics.resolvedReports}</p>
          <span className="text-[10px] text-[#3FA66B]">With photo proof</span>
        </div>

        <div className="p-4 bg-white rounded-[18px] border border-[#E2E8E4] shadow-xs">
          <span className="text-[11px] text-[#17201B] font-medium uppercase">Avg Resolution</span>
          <p className="text-2xl font-bold text-[#17201B] mt-1">{analytics.averageResolutionHours}h</p>
          <span className="text-[10px] text-[#657169]">{analytics.slaComplianceRate}% on-time</span>
        </div>

        <div className="p-4 bg-white rounded-[18px] border border-[#E2E8E4] shadow-xs">
          <span className="text-[11px] text-[#3578C7] font-medium uppercase">Active Tasks</span>
          <p className="text-2xl font-bold text-[#3578C7] mt-1">{analytics.activeCleanupTasks}</p>
          <span className="text-[10px] text-[#657169]">Crews dispatched</span>
        </div>
      </div>

      {/* 4. NAVIGATION TABS */}
      <div className="flex items-center justify-between border-b border-[#E2E8E4] pb-3 flex-wrap gap-2">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('incidents')}
            className={`touch-target px-3.5 py-1.5 rounded-[10px] text-xs font-semibold cursor-pointer ${
              activeTab === 'incidents'
                ? 'bg-[#176B45] text-white shadow-xs'
                : 'text-[#657169] hover:bg-slate-100'
            }`}
          >
            Report Queue ({reports.length})
          </button>
          <button
            onClick={() => setActiveTab('map')}
            className={`touch-target px-3.5 py-1.5 rounded-[10px] text-xs font-semibold cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'map'
                ? 'bg-[#176B45] text-white shadow-xs'
                : 'text-[#657169] hover:bg-slate-100'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Admin GIS Map</span>
          </button>
          <button
            onClick={() => setActiveTab('hotspots')}
            className={`touch-target px-3.5 py-1.5 rounded-[10px] text-xs font-semibold cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'hotspots'
                ? 'bg-[#176B45] text-white shadow-xs'
                : 'text-[#657169] hover:bg-slate-100'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-[#E7A52B]" />
            <span>Waste Hotspots ({hotspots.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`touch-target px-3.5 py-1.5 rounded-[10px] text-xs font-semibold cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'analytics'
                ? 'bg-[#176B45] text-white shadow-xs'
                : 'text-[#657169] hover:bg-slate-100'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Analytics</span>
          </button>
          <button
            onClick={() => setActiveTab('ai-assistant')}
            className={`touch-target px-3.5 py-1.5 rounded-[10px] text-xs font-semibold cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'ai-assistant'
                ? 'bg-[#176B45] text-white shadow-xs'
                : 'text-[#657169] hover:bg-slate-100'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#E8F5EE]" />
            <span>AI Query Advisor</span>
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`touch-target px-3.5 py-1.5 rounded-[10px] text-xs font-semibold cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'audit'
                ? 'bg-[#176B45] text-white shadow-xs'
                : 'text-[#657169] hover:bg-slate-100'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Audit Trail</span>
          </button>
        </div>
      </div>

      {/* TAB 1: INCIDENT TABLE (Section 50) */}
      {activeTab === 'incidents' && (
        <div className="bg-white rounded-[24px] border border-[#E2E8E4] p-5 sm:p-6 shadow-xs space-y-4">
          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
            <div className="relative">
              <Search className="w-4 h-4 text-[#8B9690] absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search ID, area, citizen…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-[10px] border border-[#E2E8E4] text-xs focus:ring-2 focus:ring-[#176B45]"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-[10px] border border-[#E2E8E4] text-xs font-medium"
            >
              <option value="ALL">All Statuses</option>
              <option value="SUBMITTED">Under Review (Submitted)</option>
              <option value="VERIFIED">Verified</option>
              <option value="ASSIGNED">Cleanup Assigned</option>
              <option value="IN_PROGRESS">Cleanup in Progress</option>
              <option value="RESOLVED_PENDING_CONFIRMATION">Resolved Pending Confirm</option>
              <option value="RESOLVED">Cleaned & Resolved</option>
              <option value="REOPENED">Reopened</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-2 rounded-[10px] border border-[#E2E8E4] text-xs font-medium"
            >
              <option value="ALL">All Priorities</option>
              <option value="CRITICAL">Critical (2h)</option>
              <option value="HIGH">High (6h)</option>
              <option value="MEDIUM">Medium (24h)</option>
              <option value="LOW">Low (72h)</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 rounded-[10px] border border-[#E2E8E4] text-xs font-medium"
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
              className="px-3 py-2 rounded-[10px] border border-[#E2E8E4] text-xs font-medium"
            >
              <option value="ALL">All Sectors</option>
              {zones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name}
                </option>
              ))}
            </select>
          </div>

          {/* Desktop Table / Responsive Mobile Cards (Section 50) */}
          <div className="overflow-x-auto rounded-[16px] border border-[#E2E8E4]">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#F7F9F7] border-b border-[#E2E8E4] text-[#657169] font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-3">Priority</th>
                  <th className="p-3">Report</th>
                  <th className="p-3">Photo</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Area</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Assigned Team</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8E4]">
                {filteredReports.map((report) => {
                  const cat = getCategoryInfo(report.category);
                  const votes =
                    (report.communityVotes?.stillThere || 0) +
                    (report.communityVotes?.worsened || 0);

                  return (
                    <tr
                      key={report.id}
                      className="hover:bg-[#F7F9F7] transition-colors cursor-pointer"
                      onClick={() => setSelectedIncident(report)}
                    >
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold uppercase text-[9px] ${
                            report.priority === 'CRITICAL'
                              ? 'bg-red-100 text-[#D64545]'
                              : report.priority === 'HIGH'
                              ? 'bg-amber-100 text-[#E7A52B]'
                              : 'bg-emerald-100 text-[#176B45]'
                          }`}
                        >
                          {report.priority}
                        </span>
                      </td>
                      <td className="p-3 font-mono font-bold text-[#17201B]">
                        {report.id}
                        {votes > 0 && (
                          <span className="flex items-center gap-1 font-game text-[10px] text-[#176B45] font-normal mt-0.5">
                            <Users className="w-3 h-3 shrink-0" />
                            <span>{votes} citizen confirmations</span>
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="w-10 h-10 rounded-[8px] overflow-hidden bg-slate-100 border border-[#E2E8E4]">
                          <img src={report.imageUrls[0]} alt="Thumb" className="w-full h-full object-cover" />
                        </div>
                      </td>
                      <td className="p-3 font-semibold text-[#17201B]">{cat.label}</td>
                      <td className="p-3 max-w-[180px]">
                        <p className="truncate text-[#657169]">{report.location.formattedAddress}</p>
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            report.status === 'RESOLVED'
                              ? 'bg-[#E8F5EE] text-[#176B45]'
                              : report.status === 'IN_PROGRESS'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {report.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="p-3 text-[#17201B] font-medium">
                        {report.assignedWorkerName || <span className="text-[#8B9690] italic">Unassigned</span>}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedIncident(report);
                          }}
                          className="px-3 py-1 bg-[#F7F9F7] hover:bg-[#E8F5EE] text-[#17201B] hover:text-[#0E4D32] rounded-[8px] font-semibold text-xs cursor-pointer border border-[#E2E8E4]"
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

      {/* TAB 2: FULL-SCREEN ADMIN GIS MAP */}
      {activeTab === 'map' && (
        <div className="bg-white rounded-[24px] border border-[#E2E8E4] p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-[#17201B]">Live Operations GIS Map</h2>
              <p className="text-xs text-[#657169]">
                Live location markers, recurring problem hotspots, and density heatmap
              </p>
            </div>

            <label className="flex items-center gap-2 text-xs font-semibold text-[#17201B] cursor-pointer bg-[#F7F9F7] px-3 py-1.5 rounded-[10px] border border-[#E2E8E4]">
              <input
                type="checkbox"
                checked={heatmapEnabled}
                onChange={(e) => setHeatmapEnabled(e.target.checked)}
                className="rounded text-[#176B45]"
              />
              <span>Heatmap concentration overlay</span>
            </label>
          </div>

          <InteractiveMap
            reports={reports}
            hotspots={hotspots}
            height="560px"
            showHeatmap={heatmapEnabled}
            onSelectReport={(r) => setSelectedIncident(r)}
          />
        </div>
      )}

      {/* TAB 3: HOTSPOTS & RECURRING PROBLEM DETECTION (Section 56, 107) */}
      {activeTab === 'hotspots' && (
        <div className="space-y-5">
          <div className="p-6 bg-[#0E4D32] text-white rounded-[20px] shadow-xs space-y-2">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-[#E7A52B]" />
              <h2 className="font-bold text-lg">Recurring Problem Detection</h2>
            </div>
            <p className="text-xs text-[#E8F5EE]/90 max-w-2xl leading-relaxed">
              When an area repeatedly receives reports after being closed, CleanSpot flags it as a <strong>Recurring Waste Hotspot</strong>. Authorities can deploy permanent infrastructure interventions rather than merely reacting to individual citizen complaints.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {hotspots.map((hs) => (
              <div
                key={hs.id}
                className="p-5 bg-white rounded-[18px] border border-[#E2E8E4] shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-[#176B45]">{hs.id}</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-red-100 text-[#D64545]">
                    Hotspot Score: {hs.score}/100
                  </span>
                </div>

                <div className="space-y-1">
                  <h3 className="font-bold text-sm text-[#17201B]">{hs.name}</h3>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#E7A52B] bg-amber-50 px-2 py-0.5 rounded-[6px] border border-amber-200">
                    <Repeat className="w-3 h-3" /> Recurring: {hs.incidentCount} reports in last 30 days
                  </span>
                </div>

                <div className="p-3 bg-[#E8F5EE] border border-[#3FA66B]/30 rounded-[12px] space-y-1 text-xs">
                  <span className="text-[10px] font-bold uppercase text-[#0E4D32] block">
                    Structural Intervention Recommended:
                  </span>
                  <p className="text-[#0E4D32] font-medium leading-relaxed">
                    {hs.recommendedIntervention}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: ANALYTICS (Section 57-58) */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-white rounded-[18px] border border-[#E2E8E4] shadow-xs">
              <span className="text-xs text-[#657169] font-medium">Total Logged</span>
              <p className="text-2xl font-bold text-[#17201B] mt-1">{analytics.totalReports}</p>
            </div>
            <div className="p-4 bg-white rounded-[18px] border border-[#E2E8E4] shadow-xs">
              <span className="text-xs text-[#657169] font-medium">Resolved Cleanup</span>
              <p className="text-2xl font-bold text-[#176B45] mt-1">{analytics.resolvedReports}</p>
            </div>
            <div className="p-4 bg-white rounded-[18px] border border-[#E2E8E4] shadow-xs">
              <span className="text-xs text-[#657169] font-medium">Avg Response</span>
              <p className="text-2xl font-bold text-[#17201B] mt-1">{analytics.averageResolutionHours}h</p>
            </div>
            <div className="p-4 bg-white rounded-[18px] border border-[#E2E8E4] shadow-xs">
              <span className="text-xs text-[#657169] font-medium">SLA Compliance</span>
              <p className="text-2xl font-bold text-[#176B45] mt-1">{analytics.slaComplianceRate}%</p>
            </div>
          </div>

          <div className="bg-white rounded-[20px] border border-[#E2E8E4] p-6 shadow-xs space-y-3">
            <h3 className="font-bold text-sm text-[#17201B]">Reports by Waste Category</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5">
              {Object.entries(analytics.categoryBreakdown).map(([catKey, count]) => {
                const info = getCategoryInfo(catKey as WasteCategory);
                return (
                  <div key={catKey} className="p-3 bg-[#F7F9F7] rounded-[12px] border border-[#E2E8E4]">
                    <span className="text-[10px] text-[#657169] font-semibold block truncate">
                      {info.label}
                    </span>
                    <p className="text-xl font-bold text-[#17201B] mt-0.5">{count}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: AI NATURAL LANGUAGE MUNICIPAL ADVISOR */}
      {activeTab === 'ai-assistant' && (
        <div className="max-w-2xl mx-auto bg-white rounded-[24px] border border-[#E2E8E4] p-6 sm:p-8 shadow-xs space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-[14px] bg-[#E8F5EE] text-[#176B45] flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#17201B]">Gemini Municipal AI Query Advisor</h3>
              <p className="text-xs text-[#657169]">
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
                className="flex-1 px-4 py-2.5 rounded-[12px] border border-[#E2E8E4] text-xs focus:ring-2 focus:ring-[#176B45]"
              />
              <button
                onClick={handleAskAI}
                disabled={isQueryingAi}
                className="px-5 py-2.5 bg-[#176B45] hover:bg-[#0E4D32] text-white text-xs font-semibold rounded-[12px] cursor-pointer disabled:opacity-50"
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
                  className="px-2.5 py-1 bg-[#F7F9F7] hover:bg-slate-100 text-[#17201B] rounded-[8px] text-[11px] cursor-pointer border border-[#E2E8E4]"
                >
                  {sample}
                </button>
              ))}
            </div>
          </div>

          {nlAnswer && (
            <div className="p-4 bg-[#E8F5EE] border border-[#3FA66B]/30 rounded-[16px] space-y-1.5">
              <span className="font-bold text-xs text-[#0E4D32] block">Advisor Telemetry Response:</span>
              <p className="text-xs text-[#176B45] leading-relaxed font-medium">{nlAnswer}</p>
            </div>
          )}
        </div>
      )}

      {/* TAB 6: AUDIT TRAIL */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-[24px] border border-[#E2E8E4] p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-[#17201B]">Security & Administrative Audit Logs</h3>
            <span className="text-xs text-[#657169]">{auditLogs.length} logged events</span>
          </div>

          <div className="overflow-x-auto rounded-[14px] border border-[#E2E8E4]">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#F7F9F7] border-b border-[#E2E8E4] text-[#657169] font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Actor</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Action</th>
                  <th className="p-3">Target Entity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8E4]">
                {auditLogs.slice(0, 20).map((log) => (
                  <tr key={log.id} className="hover:bg-[#F7F9F7]">
                    <td className="p-3 font-mono text-[11px] text-[#8B9690]">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="p-3 font-semibold text-[#17201B]">{log.actorName}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                        {log.actorRole}
                      </span>
                    </td>
                    <td className="p-3 font-mono font-bold text-[#17201B]">{log.action}</td>
                    <td className="p-3 text-[#657169]">
                      {log.entityType}: {log.entityId}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DETAILED INCIDENT INSPECTOR MODAL (Section 51-52) */}
      {selectedIncident && (
        <div className="fixed inset-0 z-50 bg-[#17201B]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] max-w-3xl w-full max-h-[92vh] overflow-y-auto p-6 sm:p-7 space-y-5 shadow-xl border border-[#E2E8E4] animate-in fade-in duration-150">
            <div className="flex items-center justify-between border-b border-[#E2E8E4] pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-mono font-bold text-base text-[#17201B]">{selectedIncident.id}</h3>
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-bold uppercase bg-[#E8F5EE] text-[#176B45]">
                    {selectedIncident.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <p className="text-xs text-[#657169]">{selectedIncident.location.formattedAddress}</p>
              </div>
              <button
                onClick={() => setSelectedIncident(null)}
                className="p-1.5 rounded-[10px] text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Photos & Priority Scoring */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="aspect-video rounded-[14px] overflow-hidden bg-slate-100 border border-[#E2E8E4]">
                <img
                  src={selectedIncident.imageUrls[0]}
                  alt="Incident"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="space-y-2 bg-[#F7F9F7] p-4 rounded-[16px] border border-[#E2E8E4] text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[#657169]">Hazard Type:</span>
                  <strong className="text-[#17201B]">
                    {getCategoryInfo(selectedIncident.category).label}
                  </strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#657169]">Priority Score:</span>
                  <span className="font-mono font-bold text-[#176B45]">
                    {selectedIncident.priorityScore}/100 ({selectedIncident.priority})
                  </span>
                </div>
                <div>
                  <span className="text-[#657169] block mb-0.5">Scoring Factors:</span>
                  <p className="text-[#17201B] font-mono text-[11px]">
                    {selectedIncident.priorityReasons?.join(', ') || 'Standard calculation'}
                  </p>
                </div>
                <div className="pt-1 border-t border-[#E2E8E4]">
                  <span className="text-[#657169] block mb-0.5">Citizen Description:</span>
                  <p className="text-[#17201B] italic">"{selectedIncident.description}"</p>
                </div>
              </div>
            </div>

            {/* DUPLICATE CANDIDATE DETECTION (<200m) */}
            {selectedIncident.candidateDuplicates && selectedIncident.candidateDuplicates.length > 0 && (
              <div className="p-4 bg-amber-50 border border-amber-300 rounded-[16px] space-y-2">
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
                      className="flex items-center justify-between bg-white p-2.5 rounded-[10px] border border-amber-200 text-xs"
                    >
                      <div>
                        <strong className="text-[#17201B]">{cand.reportId}</strong>
                        <span className="text-[#657169] ml-2">({cand.reason})</span>
                      </div>
                      <button
                        onClick={() => handleLinkDuplicate(selectedIncident.id, cand.reportId)}
                        className="px-3 py-1 bg-[#E7A52B] hover:bg-amber-600 text-slate-900 font-semibold rounded-[8px] text-[11px] cursor-pointer"
                      >
                        Group as Duplicate
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ACTION HIERARCHY (Section 52) */}
            <div className="p-4 bg-[#F7F9F7] rounded-[16px] border border-[#E2E8E4] space-y-3">
              <span className="font-bold text-[#17201B] text-xs uppercase tracking-wider block">
                Cleanup Team Assignment & Verification
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="font-semibold text-[#17201B] block mb-1">Set Priority SLA</label>
                  <select
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value as PriorityLevel)}
                    className="w-full px-3 py-2 rounded-[10px] border border-[#E2E8E4] text-xs font-semibold focus:ring-2 focus:ring-[#176B45]"
                  >
                    <option value="CRITICAL">Critical (2h SLA)</option>
                    <option value="HIGH">High (6h SLA)</option>
                    <option value="MEDIUM">Medium (24h SLA)</option>
                    <option value="LOW">Low (72h SLA)</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-[#17201B] block mb-1">Sanitation Team</label>
                  <select
                    value={assignTeam}
                    onChange={(e) => setAssignTeam(e.target.value)}
                    className="w-full px-3 py-2 rounded-[10px] border border-[#E2E8E4] text-xs font-medium"
                  >
                    <option value="Zone 1 Sanitation Team">Zone 1 Sanitation Team</option>
                    <option value="Zone 2 Street Sweeping Unit">Zone 2 Street Sweeping Unit</option>
                    <option value="Zone 3 Hydraulic Squad">Zone 3 Hydraulic Squad</option>
                    <option value="Zone 4 Residential Cleanup Team">Zone 4 Residential Cleanup Team</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-[#17201B] block mb-1">Assigned Lead</label>
                  <select
                    value={assignWorker}
                    onChange={(e) => setAssignWorker(e.target.value)}
                    className="w-full px-3 py-2 rounded-[10px] border border-[#E2E8E4] text-xs font-medium"
                  >
                    {workers.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({w.currentActiveTasks} tasks)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Action Buttons: Primary Verify, Secondary Assign, Reject (Section 52-53) */}
              <div className="flex flex-wrap justify-end gap-2 pt-2">
                <button
                  onClick={() => setRejectDialogReport(selectedIncident)}
                  className="px-3.5 py-2 border border-red-300 text-[#D64545] hover:bg-red-50 text-xs font-semibold rounded-[10px] cursor-pointer"
                >
                  Reject Report
                </button>
                <button
                  onClick={() => handleVerify(selectedIncident.id)}
                  className="px-4 py-2 bg-[#17201B] hover:bg-slate-950 text-white text-xs font-semibold rounded-[10px] cursor-pointer"
                >
                  Verify Report
                </button>
                <button
                  onClick={() => handleAssign(selectedIncident.id)}
                  className="px-5 py-2 bg-[#176B45] hover:bg-[#0E4D32] text-white text-xs font-bold rounded-[10px] shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Assign Cleanup Team</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION DIALOG FOR REJECTION (Section 53) */}
      {rejectDialogReport && (
        <div className="fixed inset-0 z-50 bg-[#17201B]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] max-w-md w-full p-6 space-y-4 shadow-xl border border-[#E2E8E4]">
            <h3 className="font-bold text-base text-[#17201B]">
              Reject Report {rejectDialogReport.id}?
            </h3>
            <p className="text-xs text-[#657169]">
              Please choose a reason before rejecting. The reporting citizen will be informed.
            </p>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#17201B]">Select Reason</label>
              <select
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full px-3 py-2 rounded-[10px] border border-[#E2E8E4] text-xs"
              >
                <option value="Not a waste hazard / private property">Not a waste hazard / private property</option>
                <option value="Duplicate image / spam submission">Duplicate image / spam submission</option>
                <option value="Incorrect location / unable to verify on site">Incorrect location / unable to verify on site</option>
                <option value="Other administrative reason">Other administrative reason</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setRejectDialogReport(null)}
                className="px-3.5 py-1.5 text-xs text-[#657169] hover:bg-slate-100 rounded-[10px] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                className="px-4 py-1.5 text-xs bg-[#D64545] hover:bg-red-700 text-white font-bold rounded-[10px] cursor-pointer"
              >
                Reject Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
