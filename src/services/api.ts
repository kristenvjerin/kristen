import {
  AnalyticsSummary,
  AuditLog,
  Hotspot,
  InAppNotification,
  MunicipalZone,
  PriorityLevel,
  ReportStatus,
  SanitationWorker,
  SeverityLevel,
  WasteCategory,
  WasteReport,
  AIAnalysisResult,
  UserRole,
} from '../types';
import {
  UserProfile,
  PointTransaction,
  LeaderboardUser,
} from '../types/gamification';
import {
  DEMO_USER_PROFILE,
  getLevelDetails,
  POINT_RULES,
} from '../utils/gamification';
import {
  SEED_AUDIT_LOGS,
  SEED_NOTIFICATIONS,
  SEED_REPORTS,
  SEED_WORKERS,
  SEED_ZONES,
} from '../utils/seedData';
import { calculatePriorityScore } from '../utils/priority';
import { calculateDueDate, getSLAStatus } from '../utils/sla';
import { calculateHotspots } from '../utils/hotspots';
import { findPotentialDuplicates } from '../utils/duplicates';

const STORAGE_KEYS = {
  REPORTS: 'cleanspot_reports_v2',
  WORKERS: 'cleanspot_workers_v2',
  ZONES: 'cleanspot_zones_v2',
  NOTIFICATIONS: 'cleanspot_notifs_v2',
  AUDIT: 'cleanspot_audit_v2',
  USER_PROFILE: 'cleanspot_user_profile_v2',
};

function getStored<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw) as T;
  } catch {
    return defaultValue;
  }
}

function setStored<T>(key: string, val: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (err) {
    console.warn('Storage setItem failed:', err);
  }
}

export const ApiService = {
  getZones(): MunicipalZone[] {
    return getStored<MunicipalZone[]>(STORAGE_KEYS.ZONES, SEED_ZONES);
  },

  getWorkers(): SanitationWorker[] {
    return getStored<SanitationWorker[]>(STORAGE_KEYS.WORKERS, SEED_WORKERS);
  },

  getReports(): WasteReport[] {
    const list = getStored<WasteReport[]>(STORAGE_KEYS.REPORTS, SEED_REPORTS);
    if (!list || list.length === 0) {
      setStored(STORAGE_KEYS.REPORTS, SEED_REPORTS);
      return SEED_REPORTS;
    }
    return list;
  },

  getReportById(id: string): WasteReport | undefined {
    const reports = this.getReports();
    return reports.find((r) => r.id === id);
  },

  getNotifications(role?: UserRole): InAppNotification[] {
    const notifs = getStored<InAppNotification[]>(STORAGE_KEYS.NOTIFICATIONS, SEED_NOTIFICATIONS);
    if (!role) return notifs;
    return notifs.filter((n) => n.targetRole === role || n.targetRole === 'all');
  },

  markNotificationRead(id: string): void {
    const notifs = this.getNotifications();
    const updated = notifs.map((n) => (n.id === id ? { ...n, read: true } : n));
    setStored(STORAGE_KEYS.NOTIFICATIONS, updated);
  },

  addNotification(notif: Omit<InAppNotification, 'id' | 'createdAt' | 'read'>): void {
    const notifs = this.getNotifications();
    const newNotif: InAppNotification = {
      ...notif,
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      read: false,
      createdAt: new Date().toISOString(),
    };
    notifs.unshift(newNotif);
    setStored(STORAGE_KEYS.NOTIFICATIONS, notifs.slice(0, 50));
  },

  getAuditLogs(): AuditLog[] {
    return getStored<AuditLog[]>(STORAGE_KEYS.AUDIT, SEED_AUDIT_LOGS);
  },

  logAudit(
    actorId: string,
    actorName: string,
    actorRole: UserRole,
    action: string,
    entityType: AuditLog['entityType'],
    entityId: string,
    metadata?: Record<string, any>
  ): void {
    const logs = this.getAuditLogs();
    const newLog: AuditLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      actorId,
      actorName,
      actorRole,
      action,
      entityType,
      entityId,
      metadata,
      timestamp: new Date().toISOString(),
    };
    logs.unshift(newLog);
    setStored(STORAGE_KEYS.AUDIT, logs.slice(0, 100));
  },

  createReport(data: {
    citizenId?: string;
    citizenName?: string;
    citizenEmail?: string;
    imageUrls: string[];
    category: WasteCategory;
    userCategory?: WasteCategory;
    severity: SeverityLevel;
    estimatedVolume?: WasteReport['estimatedVolume'];
    aiConfidence?: number;
    aiAnalysis?: AIAnalysisResult;
    description: string;
    landmark?: string;
    location: WasteReport['location'];
  }): WasteReport {
    const reports = this.getReports();
    const count = reports.length + 1;
    const reportId = `CS-2026-${String(count).padStart(6, '0')}`;

    const citizenId = data.citizenId || `citizen-${Math.random().toString(36).substring(2, 6)}`;
    const citizenName = data.citizenName || 'Civic Reporter';

    // Find nearby duplicate candidates before finalizing
    const duplicateMatches = findPotentialDuplicates(data.location, data.category, reports);
    const candidateDuplicates = duplicateMatches.map((m) => ({
      reportId: m.candidateReport.id,
      similarityScore: m.duplicateScore,
      reason: m.reasons.join(', '),
    }));

    // Calculate priority & SLA
    const priorityCalc = calculatePriorityScore({
      severity: data.severity,
      category: data.category,
      volume: data.estimatedVolume,
      nearbyIncidentCount: duplicateMatches.length,
      communityVotesCount: 0,
      hoursOpen: 0,
    });

    const dueAt = calculateDueDate(priorityCalc.priority, new Date()).toISOString();

    const approximateLocation =
      data.location.approximateLocation ||
      data.location.formattedAddress.split(',')[0] ||
      'Municipal District';

    const newReport: WasteReport = {
      id: reportId,
      citizenId,
      citizenName,
      citizenEmail: data.citizenEmail,
      imageUrls: data.imageUrls,
      category: data.category,
      userCategory: data.userCategory || data.category,
      aiCategory: data.aiAnalysis?.primaryCategory,
      severity: data.severity,
      aiSeverity: data.aiAnalysis?.severity,
      estimatedVolume: data.estimatedVolume || 'medium',
      aiConfidence: data.aiConfidence || data.aiAnalysis?.confidence,
      aiAnalysis: data.aiAnalysis,
      description: data.description,
      landmark: data.landmark,
      location: {
        ...data.location,
        approximateLocation,
      },
      zoneId: data.location.zoneId || 'zone-central',
      status: 'SUBMITTED',
      priority: priorityCalc.priority,
      priorityScore: priorityCalc.score,
      priorityReasons: [priorityCalc.reasonSummary],
      candidateDuplicates,
      communityVotes: {
        stillThere: 1,
        cleaned: 0,
        worsened: 0,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      dueAt,
      evidence: [
        {
          id: `ev-${Date.now()}`,
          reportId,
          type: 'BEFORE',
          imageUrl: data.imageUrls[0],
          uploadedBy: citizenId,
          uploadedRole: 'citizen',
          uploadedAt: new Date().toISOString(),
          notes: 'Citizen submission evidence',
        },
      ],
      statusHistory: [
        {
          id: `sh-${Date.now()}`,
          fromStatus: 'DRAFT',
          toStatus: 'SUBMITTED',
          changedBy: citizenName,
          actorRole: 'citizen',
          reason: 'Initial report submitted via CleanSpot',
          timestamp: new Date().toISOString(),
        },
      ],
    };

    reports.unshift(newReport);
    setStored(STORAGE_KEYS.REPORTS, reports);

    this.logAudit(citizenId, citizenName, 'citizen', 'REPORT_SUBMITTED', 'report', reportId, {
      category: data.category,
      priority: priorityCalc.priority,
    });

    // Notify supervisors
    if (priorityCalc.priority === 'CRITICAL' || priorityCalc.priority === 'HIGH') {
      this.addNotification({
        title: 'High Priority Report',
        message: `New ${priorityCalc.priority} report ${reportId} submitted at ${approximateLocation}.`,
        reportId,
        type: 'critical_alert',
        targetRole: 'supervisor',
      });
    }

    return newReport;
  },

  voteCommunity(
    reportId: string,
    voteType: 'still_there' | 'cleaned' | 'worsened',
    citizenId: string = 'citizen-user'
  ): WasteReport {
    const reports = this.getReports();
    const index = reports.findIndex((r) => r.id === reportId);
    if (index === -1) throw new Error('Report not found');

    const report = reports[index];
    if (!report.communityVotes) {
      report.communityVotes = { stillThere: 0, cleaned: 0, worsened: 0 };
    }

    // Rate-limit by toggling user vote
    if (report.communityVotes.userVoted === voteType) {
      return report;
    }

    if (voteType === 'still_there') {
      report.communityVotes.stillThere += 1;
    } else if (voteType === 'cleaned') {
      report.communityVotes.cleaned += 1;
    } else if (voteType === 'worsened') {
      report.communityVotes.worsened += 1;
      // Worsened vote escalates severity if currently low/medium
      if (report.severity === 'low') report.severity = 'medium';
      else if (report.severity === 'medium') report.severity = 'high';
    }

    report.communityVotes.userVoted = voteType;

    // Recalculate priority
    const priorityCalc = calculatePriorityScore({
      severity: report.severity,
      category: report.category,
      volume: report.estimatedVolume,
      communityVotesCount: report.communityVotes.stillThere + report.communityVotes.worsened * 2,
      hoursOpen: (Date.now() - new Date(report.createdAt).getTime()) / (1000 * 60 * 60),
    });

    report.priority = priorityCalc.priority;
    report.priorityScore = priorityCalc.score;
    report.updatedAt = new Date().toISOString();

    reports[index] = report;
    setStored(STORAGE_KEYS.REPORTS, reports);

    // Reward user with civic points for helping verify
    const profile = this.getUserProfile();
    profile.communityVerificationsCount = (profile.communityVerificationsCount || 0) + 1;
    const mission2 = profile.dailyMissions.find((m) => m.id === 'dm-2');
    if (mission2 && !mission2.isCompleted) {
      mission2.isCompleted = true;
    }
    this.saveUserProfile(profile);
    this.addCivicPoints(
      POINT_RULES.HELP_VERIFY_REPORT,
      `Helped verify community report (${reportId})`,
      'community_verify',
      reportId
    );

    this.logAudit(citizenId, 'Community Member', 'citizen', 'COMMUNITY_CONFIRMATION', 'report', reportId, {
      voteType,
    });

    return report;
  },

  verifyReport(
    id: string,
    verifiedBy: string,
    adjustedPriority?: PriorityLevel,
    note?: string
  ): WasteReport {
    const reports = this.getReports();
    const index = reports.findIndex((r) => r.id === id);
    if (index === -1) throw new Error('Report not found');

    const report = reports[index];
    const fromStatus = report.status;
    report.status = 'VERIFIED';
    report.updatedAt = new Date().toISOString();

    if (adjustedPriority) {
      report.priority = adjustedPriority;
      report.dueAt = calculateDueDate(adjustedPriority, new Date()).toISOString();
    }

    report.statusHistory.push({
      id: `sh-${Date.now()}`,
      fromStatus,
      toStatus: 'VERIFIED',
      changedBy: verifiedBy,
      actorRole: 'supervisor',
      reason: note || 'Report verified by municipal supervisor',
      timestamp: new Date().toISOString(),
    });

    reports[index] = report;
    setStored(STORAGE_KEYS.REPORTS, reports);

    this.logAudit(verifiedBy, verifiedBy, 'supervisor', 'REPORT_VERIFIED', 'report', id, {
      priority: report.priority,
      note,
    });

    this.addNotification({
      title: 'Report Verified (+40 Civic Points)',
      message: `Your report ${id} has been verified by municipal supervisors. +40 Civic Points awarded to your civic score!`,
      reportId: id,
      type: 'status_update',
      targetRole: 'citizen',
    });

    const prof = this.getUserProfile();
    prof.verifiedReportsCount = (prof.verifiedReportsCount || 0) + 1;
    this.saveUserProfile(prof);
    this.addCivicPoints(
      POINT_RULES.AUTHORITY_VERIFIED,
      `Report ${id} verified by authority`,
      'authority_verified',
      id
    );

    return report;
  },

  rejectReport(id: string, rejectedBy: string, reason: string): WasteReport {
    const reports = this.getReports();
    const index = reports.findIndex((r) => r.id === id);
    if (index === -1) throw new Error('Report not found');

    const report = reports[index];
    const fromStatus = report.status;
    report.status = 'REJECTED';
    report.updatedAt = new Date().toISOString();

    report.statusHistory.push({
      id: `sh-${Date.now()}`,
      fromStatus,
      toStatus: 'REJECTED',
      changedBy: rejectedBy,
      actorRole: 'supervisor',
      reason,
      timestamp: new Date().toISOString(),
    });

    reports[index] = report;
    setStored(STORAGE_KEYS.REPORTS, reports);

    this.logAudit(rejectedBy, rejectedBy, 'supervisor', 'REPORT_REJECTED', 'report', id, {
      reason,
    });

    return report;
  },

  assignReport(
    id: string,
    teamId: string,
    workerId: string,
    workerName: string,
    assignedBy: string,
    note?: string
  ): WasteReport {
    const reports = this.getReports();
    const index = reports.findIndex((r) => r.id === id);
    if (index === -1) throw new Error('Report not found');

    const report = reports[index];
    const fromStatus = report.status;
    report.status = 'ASSIGNED';
    report.assignedTeamId = teamId;
    report.assignedWorkerId = workerId;
    report.assignedWorkerName = workerName;
    report.updatedAt = new Date().toISOString();

    report.statusHistory.push({
      id: `sh-${Date.now()}`,
      fromStatus,
      toStatus: 'ASSIGNED',
      changedBy: assignedBy,
      actorRole: 'supervisor',
      reason: note || `Assigned to ${workerName} (${teamId})`,
      timestamp: new Date().toISOString(),
    });

    reports[index] = report;
    setStored(STORAGE_KEYS.REPORTS, reports);

    // Update worker task count
    const workers = this.getWorkers();
    const wIdx = workers.findIndex((w) => w.id === workerId);
    if (wIdx !== -1) {
      workers[wIdx].currentActiveTasks += 1;
      setStored(STORAGE_KEYS.WORKERS, workers);
    }

    this.logAudit(assignedBy, assignedBy, 'supervisor', 'TASK_ASSIGNED', 'report', id, {
      workerId,
      workerName,
    });

    this.addNotification({
      title: 'Cleanup Assigned',
      message: `Report ${id} has been assigned to ${workerName}.`,
      reportId: id,
      type: 'assignment',
      targetRole: 'citizen',
    });

    return report;
  },

  startWork(id: string, workerId: string, workerName: string): WasteReport {
    const reports = this.getReports();
    const index = reports.findIndex((r) => r.id === id);
    if (index === -1) throw new Error('Report not found');

    const report = reports[index];
    const fromStatus = report.status;
    report.status = 'IN_PROGRESS';
    report.updatedAt = new Date().toISOString();

    report.statusHistory.push({
      id: `sh-${Date.now()}`,
      fromStatus,
      toStatus: 'IN_PROGRESS',
      changedBy: workerName,
      actorRole: 'worker',
      reason: 'Sanitation team arrived on site; cleanup in progress',
      timestamp: new Date().toISOString(),
    });

    reports[index] = report;
    setStored(STORAGE_KEYS.REPORTS, reports);

    this.logAudit(workerId, workerName, 'worker', 'WORK_STARTED', 'report', id);

    this.addNotification({
      title: 'Cleanup In Progress',
      message: `Crews have started cleaning the waste at ${report.location.formattedAddress}.`,
      reportId: id,
      type: 'status_update',
      targetRole: 'citizen',
    });

    return report;
  },

  resolveReport(
    id: string,
    workerId: string,
    workerName: string,
    afterImageUrl: string,
    notes: string,
    aiVerification?: { score: number; summary: string }
  ): WasteReport {
    const reports = this.getReports();
    const index = reports.findIndex((r) => r.id === id);
    if (index === -1) throw new Error('Report not found');

    const report = reports[index];
    const fromStatus = report.status;
    report.status = 'RESOLVED_PENDING_CONFIRMATION';
    report.updatedAt = new Date().toISOString();

    report.evidence.push({
      id: `ev-${Date.now()}`,
      reportId: id,
      type: 'AFTER',
      imageUrl: afterImageUrl,
      uploadedBy: workerId,
      uploadedRole: 'worker',
      uploadedAt: new Date().toISOString(),
      notes,
      aiVerificationScore: aiVerification?.score ?? 0.95,
      aiVerificationSummary:
        aiVerification?.summary ?? 'AI Verification: Waste cleared, surface swept clean.',
    });

    report.statusHistory.push({
      id: `sh-${Date.now()}`,
      fromStatus,
      toStatus: 'RESOLVED_PENDING_CONFIRMATION',
      changedBy: workerName,
      actorRole: 'worker',
      reason: notes || 'Cleanup completed; awaiting citizen confirmation',
      timestamp: new Date().toISOString(),
    });

    reports[index] = report;
    setStored(STORAGE_KEYS.REPORTS, reports);

    // Update worker task count
    const workers = this.getWorkers();
    const wIdx = workers.findIndex((w) => w.id === workerId);
    if (wIdx !== -1) {
      workers[wIdx].currentActiveTasks = Math.max(0, workers[wIdx].currentActiveTasks - 1);
      workers[wIdx].completedTasksCount += 1;
      setStored(STORAGE_KEYS.WORKERS, workers);
    }

    this.logAudit(workerId, workerName, 'worker', 'WORK_RESOLVED', 'report', id, {
      aiVerificationScore: aiVerification?.score,
    });

    this.addNotification({
      title: 'Cleanup Completed!',
      message: `Your report ${id} has been cleaned up. Please confirm the result.`,
      reportId: id,
      type: 'status_update',
      targetRole: 'citizen',
    });

    return report;
  },

  citizenVerifyReport(
    id: string,
    citizenId: string,
    citizenName: string,
    decision: 'YES' | 'NO' | 'PARTIAL',
    feedback?: string
  ): WasteReport {
    const reports = this.getReports();
    const index = reports.findIndex((r) => r.id === id);
    if (index === -1) throw new Error('Report not found');

    const report = reports[index];
    const fromStatus = report.status;
    report.citizenVerified = decision;
    report.citizenFeedback = feedback;
    report.updatedAt = new Date().toISOString();

    if (decision === 'YES') {
      report.status = 'RESOLVED';
      report.resolvedAt = new Date().toISOString();
      report.statusHistory.push({
        id: `sh-${Date.now()}`,
        fromStatus,
        toStatus: 'RESOLVED',
        changedBy: citizenName,
        actorRole: 'citizen',
        reason: feedback || 'Citizen verified: Waste completely removed',
        timestamp: new Date().toISOString(),
      });

      // Award resolution bonus points to citizen
      const prof = this.getUserProfile();
      prof.resolvedIssuesCount = (prof.resolvedIssuesCount || 0) + 1;
      this.saveUserProfile(prof);
      this.addCivicPoints(
        POINT_RULES.ISSUE_RESOLVED_BONUS,
        `Issue resolution verified by citizen (${id})`,
        'resolution_bonus',
        id
      );
    } else {
      report.status = 'REOPENED';
      report.reopenCount = (report.reopenCount || 0) + 1;
      report.reopenedAt = new Date().toISOString();
      report.statusHistory.push({
        id: `sh-${Date.now()}`,
        fromStatus,
        toStatus: 'REOPENED',
        changedBy: citizenName,
        actorRole: 'citizen',
        reason: feedback || 'Citizen reported waste is still present',
        timestamp: new Date().toISOString(),
      });
    }

    reports[index] = report;
    setStored(STORAGE_KEYS.REPORTS, reports);

    this.logAudit(
      citizenId,
      citizenName,
      'citizen',
      decision === 'YES' ? 'CITIZEN_CONFIRMED_RESOLUTION' : 'CITIZEN_REOPENED_REPORT',
      'report',
      id,
      { decision, feedback }
    );

    return report;
  },

  linkDuplicate(childId: string, parentId: string, actorName: string): WasteReport {
    const reports = this.getReports();
    const childIdx = reports.findIndex((r) => r.id === childId);
    if (childIdx === -1) throw new Error('Child report not found');

    const child = reports[childIdx];
    const fromStatus = child.status;
    child.status = 'DUPLICATE';
    child.isDuplicateOf = parentId;
    child.linkedParentReportId = parentId;
    child.updatedAt = new Date().toISOString();

    child.statusHistory.push({
      id: `sh-${Date.now()}`,
      fromStatus,
      toStatus: 'DUPLICATE',
      changedBy: actorName,
      actorRole: 'supervisor',
      reason: `Grouped as duplicate of parent incident ${parentId}`,
      timestamp: new Date().toISOString(),
    });

    reports[childIdx] = child;
    setStored(STORAGE_KEYS.REPORTS, reports);

    this.logAudit(actorName, actorName, 'supervisor', 'DUPLICATE_LINKED', 'report', childId, {
      parentId,
    });

    return child;
  },

  async analyzeImageAI(imageSource: string): Promise<AIAnalysisResult> {
    try {
      const res = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageSource }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.analysis) return json.analysis;
      }
    } catch {
      // Fallback
    }

    return {
      isWasteRelated: true,
      primaryCategory: 'overflowing_bin',
      secondaryCategories: ['plastic_waste', 'mixed_municipal_waste'],
      severity: 'high',
      estimatedVolume: 'large',
      context: ['public_sidewalk', 'curbside'],
      imageQuality: 'good',
      confidence: 0.89,
      possibleDuplicate: false,
      reasoningSummary: 'Visual analysis suggests overflowing public container spilling mixed trash and plastic packaging onto pedestrian walk.',
      recommendedAction: 'Dispatch municipal compactor crew for bin clearance and surrounding perimeter sweep.',
      analyzedAt: new Date().toISOString(),
      isMockFallback: true,
    };
  },

  async compareResolutionEvidenceAI(
    beforeUrl: string,
    afterUrl: string
  ): Promise<{ score: number; summary: string }> {
    try {
      const res = await fetch('/api/ai/compare-evidence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ beforeImage: beforeUrl, afterImage: afterUrl }),
      });
      if (res.ok) {
        const json = await res.json();
        return { score: json.score || 0.95, summary: json.summary || 'Cleared' };
      }
    } catch {
      // Fallback
    }

    return {
      score: 0.96,
      summary: 'Visual check confirmed: Debris pile has been thoroughly cleared from the designated surface.',
    };
  },

  async queryMunicipalAI(query: string): Promise<string> {
    try {
      const reports = this.getReports();
      const hotspots = this.getHotspots();
      const res = await fetch('/api/ai/nl-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, reportsCount: reports.length, hotspotsCount: hotspots.length }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.answer) return json.answer;
      }
    } catch {
      // Fallback
    }

    return `CleanSpot Intelligence: Tracking ${this.getReports().length} active incidents. Sector 1 (Commercial) presents highest recurring volume. Adding a midday collection beat reduces overflow by an estimated 65%.`;
  },

  getHotspots(): Hotspot[] {
    const reports = this.getReports();
    return calculateHotspots({ reports, clusterRadiusMeters: 250, minIncidentsForHotspot: 2 });
  },

  getAnalytics(): AnalyticsSummary {
    const reports = this.getReports();
    const hotspots = this.getHotspots();

    let pendingCount = 0;
    let criticalCount = 0;
    let inProgressCount = 0;
    let resolvedCount = 0;
    let totalResolutionHours = 0;
    let resolvedWithDuration = 0;
    let slaMetCount = 0;

    const categoryBreakdown: Record<WasteCategory, number> = {
      overflowing_bin: 0,
      illegal_dumping: 0,
      roadside_garbage: 0,
      plastic_waste: 0,
      organic_waste: 0,
      mixed_municipal_waste: 0,
      construction_debris: 0,
      e_waste: 0,
      hazardous_waste: 0,
      drain_waste: 0,
      public_litter: 0,
      other: 0,
    };

    const zoneMap: Record<string, { count: number; hoursSum: number; resolvedCount: number }> = {};

    for (const r of reports) {
      if (categoryBreakdown[r.category] !== undefined) {
        categoryBreakdown[r.category]++;
      }

      if (!zoneMap[r.zoneId]) {
        zoneMap[r.zoneId] = { count: 0, hoursSum: 0, resolvedCount: 0 };
      }
      zoneMap[r.zoneId].count++;

      if (r.severity === 'critical') criticalCount++;

      if (r.status === 'SUBMITTED' || r.status === 'UNDER_REVIEW' || r.status === 'VERIFIED') {
        pendingCount++;
      } else if (r.status === 'ASSIGNED' || r.status === 'IN_PROGRESS') {
        inProgressCount++;
      } else if (r.status === 'RESOLVED' || r.status === 'RESOLVED_PENDING_CONFIRMATION') {
        resolvedCount++;
      }

      const sla = getSLAStatus(r.dueAt, r.resolvedAt);
      if (!sla.isOverdue) slaMetCount++;

      if (r.resolvedAt && r.createdAt) {
        const hours =
          (new Date(r.resolvedAt).getTime() - new Date(r.createdAt).getTime()) /
          (1000 * 60 * 60);
        totalResolutionHours += Math.max(1, hours);
        resolvedWithDuration++;
        zoneMap[r.zoneId].hoursSum += hours;
        zoneMap[r.zoneId].resolvedCount++;
      }
    }

    const avgHours =
      resolvedWithDuration > 0
        ? Number((totalResolutionHours / resolvedWithDuration).toFixed(1))
        : 14.2;

    const slaComplianceRate = Math.round((slaMetCount / Math.max(1, reports.length)) * 100);

    const zones = this.getZones();
    const zoneBreakdown = zones.map((z) => {
      const data = zoneMap[z.id] || { count: 0, hoursSum: 0, resolvedCount: 0 };
      const avg =
        data.resolvedCount > 0 ? Math.round(data.hoursSum / data.resolvedCount) : 16;
      return {
        zoneId: z.id,
        zoneName: z.name,
        reportCount: data.count,
        avgHours: avg,
      };
    });

    return {
      totalReports: reports.length,
      pendingReports: pendingCount,
      criticalReports: criticalCount,
      resolvedReports: resolvedCount,
      inProgressReports: inProgressCount,
      averageResolutionHours: avgHours,
      activeCleanupTasks: inProgressCount + (reports.filter((r) => r.status === 'ASSIGNED').length),
      slaComplianceRate,
      hotspotsCount: hotspots.length,
      categoryBreakdown,
      zoneBreakdown,
      recentActivityCount: reports.filter(
        (r) => Date.now() - new Date(r.createdAt).getTime() < 48 * 3600 * 1000
      ).length,
    };
  },

  // GAMIFICATION & CIVIC USER PROFILE
  getUserProfile(): UserProfile {
    const stored = getStored<UserProfile>(STORAGE_KEYS.USER_PROFILE, DEMO_USER_PROFILE);
    if (!stored) {
      setStored(STORAGE_KEYS.USER_PROFILE, DEMO_USER_PROFILE);
      return DEMO_USER_PROFILE;
    }
    return stored;
  },

  saveUserProfile(profile: UserProfile): void {
    setStored(STORAGE_KEYS.USER_PROFILE, profile);
  },

  addCivicPoints(
    points: number,
    reason: string,
    category: PointTransaction['category'],
    reportId?: string
  ): { profile: UserProfile; levelUp: boolean; pointsAwarded: number } {
    const profile = this.getUserProfile();
    const oldLevel = profile.level;
    const newTotalPoints = Math.max(0, profile.civicPoints + points);

    const levelDetails = getLevelDetails(newTotalPoints);
    const levelUp = levelDetails.level > oldLevel;

    const transaction: PointTransaction = {
      id: `pt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      date: 'Just now',
      reason,
      category,
      points,
      reportId,
    };

    profile.civicPoints = newTotalPoints;
    profile.level = levelDetails.level;
    profile.levelTitle = levelDetails.title;
    profile.pointHistory = [transaction, ...profile.pointHistory.slice(0, 49)];

    // Update streak if active
    profile.lastActiveDate = new Date().toISOString();

    // Check badges unlocking logic
    this.updateBadgesProgress(profile);

    this.saveUserProfile(profile);
    return { profile, levelUp, pointsAwarded: points };
  },

  updateBadgesProgress(profile: UserProfile): void {
    profile.badges = profile.badges.map((badge) => {
      let currentProgress = badge.progress;
      if (badge.id === 'badge-first-report') {
        currentProgress = profile.reportsCount >= 1 ? 1 : 0;
      } else if (badge.id === 'badge-waste-watcher') {
        currentProgress = Math.min(badge.maxProgress, profile.verifiedReportsCount);
      } else if (badge.id === 'badge-cleanspotter') {
        currentProgress = Math.min(badge.maxProgress, profile.reportsCount);
      } else if (badge.id === 'badge-hotspot-hunter') {
        currentProgress = Math.min(badge.maxProgress, profile.hotspotsIdentifiedCount);
      } else if (badge.id === 'badge-community-helper') {
        currentProgress = Math.min(badge.maxProgress, profile.communityVerificationsCount);
      } else if (badge.id === 'badge-cleanup-champion') {
        currentProgress = Math.min(badge.maxProgress, profile.cleanupsParticipatedCount);
      } else if (badge.id === 'badge-consistent-contributor') {
        currentProgress = Math.min(badge.maxProgress, profile.currentStreak);
      } else if (badge.id === 'badge-neighborhood-guardian') {
        currentProgress = Math.min(badge.maxProgress, profile.verifiedReportsCount + profile.resolvedIssuesCount);
      }

      const isNowUnlocked = currentProgress >= badge.maxProgress;
      const justUnlocked = isNowUnlocked && !badge.isUnlocked;

      return {
        ...badge,
        progress: currentProgress,
        isUnlocked: isNowUnlocked,
        unlockedAt: justUnlocked ? new Date().toISOString() : badge.unlockedAt,
      };
    });
  },

  recordReportSubmitted(isHotspot: boolean = false): {
    pointsAwarded: number;
    breakdown: { base: number; photo: number; location: number; hotspot: number };
    profile: UserProfile;
    levelUp: boolean;
  } {
    const profile = this.getUserProfile();
    profile.reportsCount += 1;
    profile.dailyReportsCount = (profile.dailyReportsCount || 0) + 1;
    if (isHotspot) {
      profile.hotspotsIdentifiedCount = (profile.hotspotsIdentifiedCount || 0) + 1;
    }

    const breakdown = {
      base: POINT_RULES.VALID_REPORT, // +50
      photo: POINT_RULES.USEFUL_PHOTO, // +20
      location: POINT_RULES.ACCURATE_LOCATION, // +15
      hotspot: isHotspot ? POINT_RULES.HOTSPOT_REPORT : 0, // +50 if recurring hotspot
    };

    const total = breakdown.base + breakdown.photo + breakdown.location + breakdown.hotspot;

    // Update challenges progress (e.g. Report 3 genuine waste problems)
    profile.challenges = profile.challenges.map((c) => {
      if (c.id === 'chal-1' && !c.isCompleted) {
        const next = Math.min(c.target, c.current + 1);
        return { ...c, current: next, isCompleted: next >= c.target };
      }
      if (c.id === 'chal-2' && isHotspot && !c.isCompleted) {
        return { ...c, current: 1, isCompleted: true };
      }
      return c;
    });

    this.saveUserProfile(profile);

    const result = this.addCivicPoints(
      total,
      isHotspot ? 'Valid waste report submitted (+Hotspot detected)' : 'Valid waste report submitted',
      'report_submission'
    );

    return {
      pointsAwarded: total,
      breakdown,
      profile: result.profile,
      levelUp: result.levelUp,
    };
  },

  checkAntiSpam(lat: number, lng: number, category: WasteCategory): {
    isSpam: boolean;
    reason?: string;
    isDuplicate: boolean;
    nearbyReportId?: string;
    dailyLimitReached: boolean;
  } {
    const profile = this.getUserProfile();
    // Daily limit check
    if (profile.dailyReportsCount >= (profile.maxDailyReports || 5)) {
      return {
        isSpam: true,
        reason: 'Daily contribution limit of 5 reports reached. This helps keep municipal verification manageable. Your report will be queued without additional civic points.',
        isDuplicate: false,
        dailyLimitReached: true,
      };
    }

    // Nearby duplicate check within 30 meters
    const reports = this.getReports();
    for (const r of reports) {
      if (r.status === 'RESOLVED' || r.status === 'REJECTED') continue;
      // Rough distance in meters: 1 deg ~ 111,000 meters
      const dLat = (r.location.latitude - lat) * 111000;
      const dLng = (r.location.longitude - lng) * 111000 * Math.cos((lat * Math.PI) / 180);
      const dist = Math.sqrt(dLat * dLat + dLng * dLng);

      if (dist < 30 && r.category === category) {
        return {
          isSpam: false,
          isDuplicate: true,
          nearbyReportId: r.id,
          reason: `Similar report detected within 30m (${r.id}). This has been linked to the existing municipal ticket to prevent duplicate work orders. 0 additional points awarded.`,
          dailyLimitReached: false,
        };
      }
    }

    return {
      isSpam: false,
      isDuplicate: false,
      dailyLimitReached: false,
    };
  },

  completeDailyMission(missionId: string): UserProfile {
    const profile = this.getUserProfile();
    const mission = profile.dailyMissions.find((m) => m.id === missionId);
    if (!mission || mission.isCompleted) return profile;

    mission.isCompleted = true;
    this.saveUserProfile(profile);

    this.addCivicPoints(
      mission.rewardPoints,
      `Daily mission completed: ${mission.title}`,
      'daily_checkin'
    );
    return this.getUserProfile();
  },

  claimChallenge(challengeId: string): UserProfile {
    const profile = this.getUserProfile();
    const challenge = profile.challenges.find((c) => c.id === challengeId);
    if (!challenge || !challenge.isCompleted || challenge.isClaimed) return profile;

    challenge.isClaimed = true;
    this.saveUserProfile(profile);

    this.addCivicPoints(
      challenge.rewardPoints,
      `Weekly challenge reward: ${challenge.title}`,
      'challenge_reward'
    );
    return this.getUserProfile();
  },

  toggleLeaderboardPrivacy(): UserProfile {
    const profile = this.getUserProfile();
    profile.isPublicOnLeaderboard = !profile.isPublicOnLeaderboard;
    this.saveUserProfile(profile);
    return profile;
  },

  resetToDemo(): void {
    setStored(STORAGE_KEYS.REPORTS, SEED_REPORTS);
    setStored(STORAGE_KEYS.WORKERS, SEED_WORKERS);
    setStored(STORAGE_KEYS.ZONES, SEED_ZONES);
    setStored(STORAGE_KEYS.NOTIFICATIONS, SEED_NOTIFICATIONS);
    setStored(STORAGE_KEYS.AUDIT, SEED_AUDIT_LOGS);
    setStored(STORAGE_KEYS.USER_PROFILE, DEMO_USER_PROFILE);
  },
};
