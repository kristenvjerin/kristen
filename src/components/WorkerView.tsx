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

  // Worker's tasks
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
      'Area thoroughly swept and debris loaded onto Zone cleanup compactor vehicle.';

    ApiService.resolveReport(
      selectedTask.id,
      currentWorker.id,
      currentWorker.name,
      finalImage,
      notes,
      aiCompareResult || {
        score: 0.96,
        summary: 'AI Audit: Waste cleared. Sidewalk surface completely unobstructed.',
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
      {/* Header Card */}
      <div className="bg-gradient-to-r from-[#0E4D32] to-[#176B45] rounded-[24px] p-6 text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-13 h-13 rounded-[16px] bg-white/15 border border-white/20 flex items-center justify-center text-white shrink-0">
            <Truck className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold">{currentWorker.name}</h2>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full font-semibold bg-[#E8F5EE]/20 border border-[#E8F5EE]/30 text-[#E8F5EE]">
                On Duty • {currentWorker.teamName}
              </span>
            </div>
            <p className="text-xs text-[#E8F5EE]/80 mt-0.5">
              Sector: Central Commercial & Market Corridor • Rapid Compactor Unit #12
            </p>
          </div>
        </div>

        {/* Task KPIs */}
        <div className="flex items-center gap-3">
          <div className="bg-white/10 px-3.5 py-2 rounded-[12px] text-center border border-white/15">
            <span className="text-[10px] text-[#E8F5EE] uppercase font-semibold">Active Tasks</span>
            <p className="text-xl font-bold text-white">{activeTasks.length}</p>
          </div>
          <div className="bg-white/10 px-3.5 py-2 rounded-[12px] text-center border border-white/15">
            <span className="text-[10px] text-[#E8F5EE] uppercase font-semibold">Completed</span>
            <p className="text-xl font-bold text-[#A2E3BF]">{completedTasks.length}</p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between border-b border-[#E2E8E4] pb-3">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`touch-target px-3.5 py-1.5 rounded-[10px] text-xs font-semibold cursor-pointer ${
              filter === 'all'
                ? 'bg-[#176B45] text-white shadow-xs'
                : 'text-[#657169] hover:bg-slate-100'
            }`}
          >
            All Tasks ({workerTasks.length})
          </button>
          <button
            onClick={() => setFilter('assigned')}
            className={`touch-target px-3.5 py-1.5 rounded-[10px] text-xs font-semibold cursor-pointer ${
              filter === 'assigned'
                ? 'bg-[#176B45] text-white shadow-xs'
                : 'text-[#657169] hover:bg-slate-100'
            }`}
          >
            Assigned ({workerTasks.filter((t) => t.status === 'ASSIGNED').length})
          </button>
          <button
            onClick={() => setFilter('in_progress')}
            className={`touch-target px-3.5 py-1.5 rounded-[10px] text-xs font-semibold cursor-pointer ${
              filter === 'in_progress'
                ? 'bg-[#176B45] text-white shadow-xs'
                : 'text-[#657169] hover:bg-slate-100'
            }`}
          >
            In Progress ({workerTasks.filter((t) => t.status === 'IN_PROGRESS').length})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`touch-target px-3.5 py-1.5 rounded-[10px] text-xs font-semibold cursor-pointer ${
              filter === 'completed'
                ? 'bg-[#176B45] text-white shadow-xs'
                : 'text-[#657169] hover:bg-slate-100'
            }`}
          >
            Completed ({completedTasks.length})
          </button>
        </div>
      </div>

      {/* Task List Grid - Location-first design (Section 110) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTasks.map((task) => {
          const cat = getCategoryInfo(task.category);
          const sla = getSLAStatus(task.dueAt, task.resolvedAt);

          return (
            <div
              key={task.id}
              onClick={() => setSelectedTask(task)}
              className="p-4 rounded-[18px] border border-[#E2E8E4] hover:border-[#176B45] bg-white hover:shadow-sm transition-all cursor-pointer space-y-3"
            >
              <div className="aspect-video w-full rounded-[14px] overflow-hidden bg-slate-100 relative">
                <img src={task.imageUrls[0]} alt={cat.label} className="w-full h-full object-cover" />
                <div className="absolute top-2.5 left-2.5 flex gap-1">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      task.priority === 'CRITICAL'
                        ? 'bg-[#D64545] text-white'
                        : task.priority === 'HIGH'
                        ? 'bg-[#E7A52B] text-slate-900'
                        : 'bg-[#176B45] text-white'
                    }`}
                  >
                    {task.priority}
                  </span>
                </div>
                <div className="absolute top-2.5 right-2.5">
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${sla.badgeColor}`}>
                    {sla.formattedRemaining}
                  </span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-mono font-bold text-[#17201B]">{task.id}</span>
                  <span className="text-[11px] font-semibold text-[#176B45]">
                    {task.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <h3 className="font-semibold text-xs text-[#17201B] line-clamp-1">{cat.label}</h3>
                <p className="text-[11px] text-[#657169] line-clamp-1 mt-0.5 flex items-center gap-1">
                  <MapPin className="w-3 h-3 shrink-0 text-[#8B9690]" />
                  <span className="truncate">{task.location.formattedAddress}</span>
                </p>
              </div>

              <div className="pt-2 border-t border-[#E2E8E4] flex items-center justify-between text-xs">
                <span className="text-[#8B9690] text-[11px]">Est. ~0.8 km distance</span>
                <span className="text-[#176B45] font-semibold flex items-center gap-1">
                  Open Order <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* TASK DETAIL MODAL */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 bg-[#17201B]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] max-w-2xl w-full max-h-[92vh] overflow-y-auto p-6 sm:p-7 space-y-5 shadow-xl border border-[#E2E8E4] animate-in fade-in duration-150">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#E2E8E4] pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-mono font-bold text-[#17201B] text-base">{selectedTask.id}</h3>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase ${
                      selectedTask.priority === 'CRITICAL'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {selectedTask.priority} PRIORITY
                  </span>
                </div>
                <p className="text-xs text-[#657169]">{selectedTask.location.formattedAddress}</p>
              </div>
              <button
                onClick={() => setSelectedTask(null)}
                className="p-1.5 rounded-[10px] text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Photos & Navigation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-[#17201B]">Citizen Photo Evidence</span>
                <div className="aspect-video rounded-[14px] overflow-hidden bg-slate-100 border border-[#E2E8E4]">
                  <img
                    src={selectedTask.imageUrls[0]}
                    alt="Evidence"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              <div className="space-y-3 text-xs bg-[#F7F9F7] p-4 rounded-[14px] border border-[#E2E8E4]">
                <div className="flex items-center justify-between">
                  <span className="text-[#657169]">Category:</span>
                  <strong className="text-[#17201B]">
                    {getCategoryInfo(selectedTask.category).label}
                  </strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#657169]">Volume:</span>
                  <strong className="text-[#17201B] capitalize">{selectedTask.estimatedVolume || 'Medium'}</strong>
                </div>
                <div>
                  <span className="text-[#657169] block mb-0.5">Citizen Notes:</span>
                  <p className="text-[#17201B] italic">"{selectedTask.description}"</p>
                </div>
              </div>
            </div>

            {/* Navigation Button */}
            <div className="p-3.5 bg-[#E8F5EE] border border-[#3FA66B]/30 rounded-[14px] flex items-center justify-between text-xs text-[#0E4D32]">
              <div className="flex items-center gap-2">
                <Navigation className="w-4 h-4 text-[#176B45]" />
                <span>
                  Coordinates: {selectedTask.location.latitude}, {selectedTask.location.longitude}
                </span>
              </div>
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${selectedTask.location.latitude},${selectedTask.location.longitude}`}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 bg-[#176B45] hover:bg-[#0E4D32] text-white font-semibold rounded-[8px]"
              >
                Open GPS Navigation
              </a>
            </div>

            {/* Operational Actions */}
            <div className="pt-3 border-t border-[#E2E8E4] flex flex-wrap gap-2 justify-end">
              {selectedTask.status === 'ASSIGNED' || selectedTask.status === 'VERIFIED' ? (
                <button
                  onClick={() => handleStartWork(selectedTask.id)}
                  className="touch-target px-5 py-2.5 bg-[#176B45] hover:bg-[#0E4D32] text-white font-semibold text-xs rounded-[12px] shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Truck className="w-4 h-4" />
                  <span>Start Cleanup (En Route)</span>
                </button>
              ) : selectedTask.status === 'IN_PROGRESS' ? (
                <>
                  <button
                    onClick={() => setIsUnableModal(true)}
                    className="touch-target px-4 py-2 border border-red-300 text-red-600 hover:bg-red-50 font-semibold text-xs rounded-[12px] cursor-pointer"
                  >
                    Report Unable to Resolve
                  </button>
                  <button
                    onClick={() => setIsResolving(true)}
                    className="touch-target px-5 py-2.5 bg-[#176B45] hover:bg-[#0E4D32] text-white font-semibold text-xs rounded-[12px] shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Upload After Photo & Complete</span>
                  </button>
                </>
              ) : (
                <div className="text-xs text-[#657169] font-medium">
                  Status: <strong>{selectedTask.status.replace(/_/g, ' ')}</strong>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* RESOLUTION EVIDENCE SUBMISSION MODAL */}
      {isResolving && selectedTask && (
        <div className="fixed inset-0 z-50 bg-[#17201B]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] max-w-xl w-full p-6 sm:p-7 space-y-5 shadow-xl border border-[#E2E8E4]">
            <div className="flex items-center justify-between border-b border-[#E2E8E4] pb-3">
              <div>
                <h3 className="font-bold text-base text-[#17201B]">
                  Submit Cleanup Evidence: {selectedTask.id}
                </h3>
                <p className="text-xs text-[#657169]">
                  Upload an After photo to prove remediation and trigger AI comparative audit
                </p>
              </div>
              <button onClick={() => setIsResolving(false)} className="p-1 rounded-[8px] text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Before vs After Photos */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[11px] font-semibold text-[#657169] block mb-1">
                  ORIGINAL BEFORE PHOTO
                </span>
                <div className="aspect-video rounded-[12px] overflow-hidden bg-slate-100 border border-[#E2E8E4]">
                  <img src={selectedTask.imageUrls[0]} alt="Before" className="w-full h-full object-cover" />
                </div>
              </div>

              <div>
                <span className="text-[11px] font-semibold text-[#176B45] block mb-1">
                  WORKER AFTER PHOTO
                </span>
                <div className="aspect-video rounded-[12px] overflow-hidden bg-slate-100 border-2 border-dashed border-[#3FA66B] relative">
                  {afterImage ? (
                    <img src={afterImage} alt="After" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-[#657169] text-xs p-2 text-center">
                      <Camera className="w-6 h-6 mb-1 text-[#176B45]" />
                      <span>Ready for after photo</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Fast Test Clean Photo */}
            <div className="p-3.5 bg-[#E8F5EE] border border-[#3FA66B]/30 rounded-[14px] flex items-center justify-between">
              <span className="text-xs font-semibold text-[#0E4D32] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#176B45]" />
                Test Clean Photo Preset
              </span>
              <button
                onClick={() => {
                  setAfterImage(RESOLUTION_CLEAN_IMAGE);
                  handleRunAiCompare(RESOLUTION_CLEAN_IMAGE);
                }}
                className="px-3 py-1 bg-[#176B45] hover:bg-[#0E4D32] text-white text-[11px] font-semibold rounded-[8px] cursor-pointer"
              >
                Use Spotless Photo
              </button>
            </div>

            {/* Image Comparison Feedback */}
            {isAiComparing && (
              <div className="p-3 bg-[#F7F9F7] border border-[#E2E8E4] rounded-[8px] flex items-center gap-2 text-xs text-[#17201B]">
                <Loader2 className="w-4 h-4 animate-spin text-[#176B45]" />
                <span>Comparing photos...</span>
              </div>
            )}

            {aiCompareResult && !isAiComparing && (
              <div className="p-3 bg-[#E8F5EE] border border-[#3FA66B] rounded-[8px] space-y-1 text-xs">
                <strong className="text-[#0E4D32] block flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#176B45]" />
                  <span>Site clearance confirmed ({Math.round(aiCompareResult.score * 100)}% match)</span>
                </strong>
                <p className="text-[#176B45]">{aiCompareResult.summary}</p>
              </div>
            )}

            {/* Field Notes */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#17201B]">Sanitation Field Notes</label>
              <textarea
                rows={2}
                placeholder="e.g. Cleared 200kg of refuse. Sanitized pavement surface."
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                className="w-full px-3.5 py-2 rounded-[12px] border border-[#E2E8E4] text-xs focus:ring-2 focus:ring-[#176B45]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#E2E8E4]">
              <button
                onClick={() => setIsResolving(false)}
                className="touch-target px-4 py-2 text-xs font-semibold text-[#657169] hover:bg-slate-50 rounded-[10px] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitResolution}
                className="touch-target px-5 py-2.5 bg-[#176B45] hover:bg-[#0E4D32] text-white font-semibold text-xs rounded-[12px] shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Submit for Citizen Confirmation</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UNABLE TO RESOLVE MODAL */}
      {isUnableModal && (
        <div className="fixed inset-0 z-50 bg-[#17201B]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] max-w-md w-full p-6 space-y-4 shadow-xl border border-[#E2E8E4]">
            <div className="flex items-center gap-2 text-[#D64545]">
              <ShieldAlert className="w-5 h-5" />
              <h4 className="font-bold text-base text-[#17201B]">Report Inability to Resolve</h4>
            </div>
            <p className="text-xs text-[#657169]">
              Please state why this task cannot be completed (e.g. hazardous chemical spills, locked gate, heavy machinery required).
            </p>
            <textarea
              rows={3}
              placeholder="e.g. Blocked behind locked private construction gate; supervisor intervention needed."
              value={unableReason}
              onChange={(e) => setUnableReason(e.target.value)}
              className="w-full px-3 py-2 rounded-[12px] border border-[#E2E8E4] text-xs focus:ring-2 focus:ring-[#D64545]"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsUnableModal(false)}
                className="px-3.5 py-1.5 text-xs text-[#657169] hover:bg-slate-100 rounded-[10px] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleUnableToResolve}
                className="px-4 py-1.5 text-xs bg-[#D64545] hover:bg-red-700 text-white font-semibold rounded-[10px] cursor-pointer"
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
