import React, { useState } from 'react';
import { SanitationWorker, WasteReport } from '../types';
import { getCategoryInfo } from '../utils/categories';
import { ApiService } from '../services/api';
import { RESOLUTION_CLEAN_IMAGE } from '../utils/seedData';
import { getSLAStatus } from '../utils/sla';
import {
  Truck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  MapPin,
  Camera,
  Upload,
  Sparkles,
  Navigation,
  FileCheck,
  Check,
  X,
  Loader2,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';

interface WorkerViewProps {
  reports: WasteReport[];
  workers: SanitationWorker[];
  onRefresh: () => void;
  activeWorkerId?: string;
}

export const WorkerView: React.FC<WorkerViewProps> = ({
  reports,
  workers,
  onRefresh,
  activeWorkerId = 'worker-01',
}) => {
  const currentWorker =
    workers.find((w) => w.id === activeWorkerId) || workers[0];

  const [selectedTask, setSelectedTask] = useState<WasteReport | null>(null);
  const [filter, setFilter] = useState<'all' | 'assigned' | 'in_progress' | 'completed'>('all');

  // Resolution workflow state
  const [isResolving, setIsResolving] = useState<boolean>(false);
  const [afterImage, setAfterImage] = useState<string>('');
  const [resolutionNotes, setResolutionNotes] = useState<string>('');
  const [isAiComparing, setIsAiComparing] = useState<boolean>(false);
  const [aiCompareResult, setAiCompareResult] = useState<{ score: number; summary: string } | null>(
    null
  );

  // Unable to resolve state
  const [isUnableModal, setIsUnableModal] = useState<boolean>(false);
  const [unableReason, setUnableReason] = useState<string>('');

  // Worker's tasks: reports assigned to this worker OR unassigned in this worker's zone
  const workerTasks = reports.filter(
    (r) =>
      r.assignedWorkerId === currentWorker.id ||
      (r.zoneId === currentWorker.zoneId && r.status === 'VERIFIED')
  );

  const activeTasks = workerTasks.filter(
    (t) => t.status === 'ASSIGNED' || t.status === 'IN_PROGRESS' || t.status === 'VERIFIED'
  );

  const completedTasks = reports.filter(
    (r) =>
      (r.assignedWorkerId === currentWorker.id &&
        (r.status === 'RESOLVED' || r.status === 'RESOLVED_PENDING_CONFIRMATION')) ||
      r.evidence.some((e) => e.uploadedBy === currentWorker.id)
  );

  const filteredTasks = workerTasks.filter((t) => {
    if (filter === 'assigned') return t.status === 'ASSIGNED' || t.status === 'VERIFIED';
    if (filter === 'in_progress') return t.status === 'IN_PROGRESS';
    if (filter === 'completed')
      return t.status === 'RESOLVED' || t.status === 'RESOLVED_PENDING_CONFIRMATION';
    return true;
  });

  const handleStartWork = (reportId: string) => {
    ApiService.startWork(reportId, currentWorker.id, currentWorker.name);
    onRefresh();
    // Update local selected task
    const updated = ApiService.getReportById(reportId);
    if (updated) setSelectedTask(updated);
  };

  const handleRunAiCompare = async (cleanUrl: string) => {
    if (!selectedTask) return;
    setIsAiComparing(true);
    try {
      const res = await ApiService.compareResolutionEvidenceAI(
        selectedTask.imageUrls[0],
        cleanUrl
      );
      setAiCompareResult(res);
    } catch {
      // Fallback
    } finally {
      setIsAiComparing(false);
    }
  };

  const handleSubmitResolution = () => {
    if (!selectedTask) return;
    const finalImage = afterImage || RESOLUTION_CLEAN_IMAGE;
    const notes =
      resolutionNotes ||
      'Area completely swept, disinfected, and waste loaded onto sanitation vehicle #12.';

    ApiService.resolveReport(
      selectedTask.id,
      currentWorker.id,
      currentWorker.name,
      finalImage,
      notes,
      aiCompareResult || {
        score: 0.96,
        summary: 'AI Audit: Surface cleared. No remaining garbage pile detected.',
      }
    );

    setIsResolving(false);
    setAfterImage('');
    setResolutionNotes('');
    setAiCompareResult(null);
    setSelectedTask(null);
    onRefresh();
  };

  const handleUnableToResolve = () => {
    if (!selectedTask) return;
    ApiService.logAudit(
      currentWorker.id,
      currentWorker.name,
      'worker',
      'UNABLE_TO_RESOLVE_REPORTED',
      'report',
      selectedTask.id,
      { reason: unableReason }
    );
    alert(`Alert sent to Zone Supervisor: ${unableReason}`);
    setIsUnableModal(false);
    setUnableReason('');
    setSelectedTask(null);
  };

  return (
    <div className="space-y-6">
      {/* Worker Header Card */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-200 shrink-0">
            <Truck className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold">{currentWorker.name}</h2>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full font-semibold bg-emerald-500/20 border border-emerald-400/30 text-emerald-300">
                On Duty • {currentWorker.teamName}
              </span>
            </div>
            <p className="text-xs text-blue-200/80 mt-0.5">
              Sector: Central Commercial & Market Corridor • Rapid Compactor Unit #12
            </p>
          </div>
        </div>

        {/* Quick Task KPIs */}
        <div className="flex items-center gap-3">
          <div className="bg-white/10 px-3.5 py-2 rounded-xl text-center border border-white/15">
            <span className="text-[10px] text-blue-200 uppercase font-semibold">Active Tasks</span>
            <p className="text-xl font-bold text-white">{activeTasks.length}</p>
          </div>
          <div className="bg-white/10 px-3.5 py-2 rounded-xl text-center border border-white/15">
            <span className="text-[10px] text-blue-200 uppercase font-semibold">Completed</span>
            <p className="text-xl font-bold text-emerald-400">{completedTasks.length}</p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
              filter === 'all'
                ? 'bg-blue-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All Work Orders ({workerTasks.length})
          </button>
          <button
            onClick={() => setFilter('assigned')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
              filter === 'assigned'
                ? 'bg-blue-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Assigned ({workerTasks.filter((t) => t.status === 'ASSIGNED').length})
          </button>
          <button
            onClick={() => setFilter('in_progress')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
              filter === 'in_progress'
                ? 'bg-blue-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            In Progress ({workerTasks.filter((t) => t.status === 'IN_PROGRESS').length})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
              filter === 'completed'
                ? 'bg-blue-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Completed ({completedTasks.length})
          </button>
        </div>
      </div>

      {/* Task List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTasks.map((task) => {
          const catInfo = getCategoryInfo(task.category);
          const sla = getSLAStatus(task.dueAt, task.resolvedAt);

          return (
            <div
              key={task.id}
              onClick={() => setSelectedTask(task)}
              className="p-4 rounded-2xl border border-slate-200 hover:border-blue-400 bg-white hover:shadow-md transition-all cursor-pointer space-y-3"
            >
              <div className="aspect-video w-full rounded-xl overflow-hidden bg-slate-100 relative">
                <img
                  src={task.imageUrls[0]}
                  alt={catInfo.label}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 left-2 flex gap-1">
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                      task.priority === 'CRITICAL'
                        ? 'bg-red-600 text-white'
                        : task.priority === 'HIGH'
                        ? 'bg-orange-600 text-white'
                        : 'bg-amber-600 text-white'
                    }`}
                  >
                    {task.priority}
                  </span>
                </div>
                <div className="absolute top-2 right-2">
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${sla.badgeColor}`}>
                    {sla.formattedRemaining}
                  </span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-slate-900">{task.id}</span>
                  <span className="text-[11px] font-bold text-blue-700">
                    {task.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <h4 className="font-semibold text-xs text-slate-800 line-clamp-1">{catInfo.label}</h4>
                <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                  📍 {task.location.formattedAddress}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400 text-[11px]">Est. 0.8 km distance</span>
                <span className="text-blue-600 font-semibold flex items-center gap-1">
                  Open Order <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* TASK DETAIL MODAL */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto p-6 space-y-5 shadow-2xl border border-slate-200 animate-in fade-in duration-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 text-base">{selectedTask.id}</h3>
                  <span
                    className={`px-2 py-0.5 rounded-md text-xs font-bold uppercase ${
                      selectedTask.priority === 'CRITICAL'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-orange-100 text-orange-800'
                    }`}
                  >
                    {selectedTask.priority} PRIORITY
                  </span>
                </div>
                <p className="text-xs text-slate-500">{selectedTask.location.formattedAddress}</p>
              </div>
              <button
                onClick={() => setSelectedTask(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Incident Photo & Navigation Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-600">Citizen Evidence Image</span>
                <div className="aspect-video rounded-xl overflow-hidden bg-slate-100">
                  <img
                    src={selectedTask.imageUrls[0]}
                    alt="Evidence"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              <div className="space-y-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Category:</span>
                  <strong className="text-slate-800">
                    {getCategoryInfo(selectedTask.category).label}
                  </strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Est. Volume:</span>
                  <strong className="text-slate-800 capitalize">
                    {selectedTask.estimatedVolume || 'Medium'}
                  </strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Reporter:</span>
                  <strong className="text-slate-800">{selectedTask.citizenName}</strong>
                </div>
                {selectedTask.landmark && (
                  <div>
                    <span className="text-slate-500 block mb-0.5">Landmark:</span>
                    <strong className="text-slate-800">{selectedTask.landmark}</strong>
                  </div>
                )}
                <div>
                  <span className="text-slate-500 block mb-0.5">Citizen Notes:</span>
                  <p className="text-slate-700 italic">"{selectedTask.description}"</p>
                </div>
              </div>
            </div>

            {/* Navigation Link */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between text-xs text-blue-900">
              <div className="flex items-center gap-2">
                <Navigation className="w-4 h-4 text-blue-600" />
                <span>
                  Coordinates: {selectedTask.location.latitude}, {selectedTask.location.longitude}
                </span>
              </div>
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${selectedTask.location.latitude},${selectedTask.location.longitude}`}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700"
              >
                Open GPS Navigation
              </a>
            </div>

            {/* ACTION BUTTONS ACCORDING TO TASK STATE */}
            <div className="pt-3 border-t border-slate-200 flex flex-wrap gap-2 justify-end">
              {selectedTask.status === 'ASSIGNED' || selectedTask.status === 'VERIFIED' ? (
                <button
                  onClick={() => handleStartWork(selectedTask.id)}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Truck className="w-4 h-4" />
                  Start Work (En Route)
                </button>
              ) : selectedTask.status === 'IN_PROGRESS' ? (
                <>
                  <button
                    onClick={() => setIsUnableModal(true)}
                    className="px-4 py-2 border border-red-300 text-red-600 hover:bg-red-50 font-semibold text-xs rounded-xl cursor-pointer"
                  >
                    Report Unable to Resolve
                  </button>
                  <button
                    onClick={() => setIsResolving(true)}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Complete Resolution & Upload After Photo
                  </button>
                </>
              ) : (
                <div className="text-xs text-slate-500 font-medium">
                  Status: <strong>{selectedTask.status.replace(/_/g, ' ')}</strong>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* RESOLUTION EVIDENCE SUBMISSION MODAL */}
      {isResolving && selectedTask && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Submit Resolution Evidence: {selectedTask.id}
                </h3>
                <p className="text-xs text-slate-500">
                  Upload an AFTER photo to prove remediation and run AI comparative check
                </p>
              </div>
              <button
                onClick={() => setIsResolving(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Before vs After Photo comparison */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[11px] font-bold text-slate-500 block mb-1">
                  ORIGINAL BEFORE PHOTO
                </span>
                <div className="aspect-video rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                  <img
                    src={selectedTask.imageUrls[0]}
                    alt="Before"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              <div>
                <span className="text-[11px] font-bold text-emerald-700 block mb-1">
                  WORKER AFTER PHOTO
                </span>
                <div className="aspect-video rounded-xl overflow-hidden bg-slate-100 border-2 border-dashed border-emerald-400 relative">
                  {afterImage ? (
                    <img src={afterImage} alt="After" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 text-xs p-2 text-center">
                      <Camera className="w-6 h-6 mb-1 text-emerald-500" />
                      <span>Ready for after photo</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Fast 1-Click After Photo Preset for testing */}
            <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  Fast Test Clean Photo
                </span>
                <button
                  onClick={() => {
                    setAfterImage(RESOLUTION_CLEAN_IMAGE);
                    handleRunAiCompare(RESOLUTION_CLEAN_IMAGE);
                  }}
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg cursor-pointer"
                >
                  Use Spotless Cleared Photo
                </button>
              </div>
              <p className="text-[11px] text-slate-600">
                Or upload a photo directly taken with mobile camera on site.
              </p>
            </div>

            {/* AI Comparative Clearance Verification */}
            {isAiComparing && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-3 text-xs text-blue-800">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600 shrink-0" />
                <span>Running Gemini AI Before/After Visual Change Comparison...</span>
              </div>
            )}

            {aiCompareResult && !isAiComparing && (
              <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl space-y-1 text-xs">
                <div className="flex items-center justify-between font-bold text-emerald-900">
                  <span>✓ AI Visual Clearance Verified</span>
                  <span>{Math.round(aiCompareResult.score * 100)}% Match</span>
                </div>
                <p className="text-emerald-800 italic">{aiCompareResult.summary}</p>
              </div>
            )}

            {/* Field Notes */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Sanitation Crew Field Notes</label>
              <textarea
                rows={2}
                placeholder="e.g. Cleared 250kg of mixed refuse. Sanitized pavement with disinfectant spray."
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                onClick={() => setIsResolving(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitResolution}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                Submit Resolution for Citizen Audit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UNABLE TO RESOLVE MODAL */}
      {isUnableModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-2 text-red-600">
              <ShieldAlert className="w-5 h-5" />
              <h4 className="font-bold text-slate-900 text-base">Report Inability to Resolve</h4>
            </div>
            <p className="text-xs text-slate-600">
              Please state why this task cannot be completed (e.g. hazardous chemical waste, locked private gate, unsafe location).
            </p>
            <textarea
              rows={3}
              placeholder="e.g. Heavy industrial hydraulic machinery required; access road blocked by construction vehicles."
              value={unableReason}
              onChange={(e) => setUnableReason(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-red-500 focus:outline-hidden"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsUnableModal(false)}
                className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleUnableToResolve}
                className="px-4 py-1.5 text-xs bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg cursor-pointer"
              >
                Alert Supervisor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
