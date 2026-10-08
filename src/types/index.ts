export type UserRole = 'citizen' | 'worker' | 'supervisor' | 'admin';

export type WasteCategory =
  | 'overflowing_bin'
  | 'illegal_dumping'
  | 'roadside_garbage'
  | 'plastic_waste'
  | 'organic_waste'
  | 'mixed_municipal_waste'
  | 'construction_debris'
  | 'e_waste'
  | 'hazardous_waste'
  | 'drain_waste'
  | 'public_litter'
  | 'other';

export interface WasteCategoryInfo {
  id: WasteCategory;
  label: string;
  icon: string;
  color: string;
  description: string;
  defaultSeverity: SeverityLevel;
}

export type SeverityLevel = 'low' | 'medium' | 'high' | 'critical';
export type PriorityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type WasteVolume = 'small' | 'medium' | 'large' | 'very_large';

export type ReportStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'VERIFIED'
  | 'REJECTED'
  | 'DUPLICATE'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'RESOLVED_PENDING_CONFIRMATION'
  | 'RESOLVED'
  | 'REOPENED'
  | 'UNABLE_TO_RESOLVE'
  | 'CANCELLED';

export interface GeoLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  formattedAddress: string;
  approximateLocation?: string;
  locality?: string;
  city?: string;
  zoneId: string;
}

export interface AIAnalysisResult {
  isWasteRelated: boolean;
  primaryCategory: WasteCategory;
  secondaryCategories: string[];
  severity: SeverityLevel;
  estimatedVolume: WasteVolume;
  context: string[];
  imageQuality: 'good' | 'blurry' | 'dark' | 'unusable';
  confidence: number;
  possibleDuplicate: boolean;
  reasoningSummary: string;
  recommendedAction: string;
  analyzedAt: string;
  isMockFallback?: boolean;
}

export interface ResolutionEvidence {
  id: string;
  reportId: string;
  type: 'BEFORE' | 'AFTER' | 'REOPEN' | 'ADDITIONAL';
  imageUrl: string;
  uploadedBy: string;
  uploadedRole: UserRole;
  uploadedAt: string;
  notes?: string;
  aiVerificationScore?: number;
  aiVerificationSummary?: string;
}

export interface StatusHistoryEntry {
  id: string;
  fromStatus: ReportStatus;
  toStatus: ReportStatus;
  changedBy: string;
  actorRole: UserRole;
  reason?: string;
  timestamp: string;
  evidenceUrl?: string;
}

export interface CommunityVotes {
  stillThere: number;
  cleaned: number;
  worsened: number;
  userVoted?: 'still_there' | 'cleaned' | 'worsened';
}

export interface WasteReport {
  id: string; // e.g. CS-2026-000184
  citizenId: string;
  citizenName: string;
  citizenEmail?: string;
  imageUrls: string[];
  category: WasteCategory;
  userCategory?: WasteCategory;
  aiCategory?: WasteCategory;
  severity: SeverityLevel;
  aiSeverity?: SeverityLevel;
  estimatedVolume?: WasteVolume;
  aiConfidence?: number;
  aiAnalysis?: AIAnalysisResult;
  description: string;
  landmark?: string;
  location: GeoLocation;
  zoneId: string;
  status: ReportStatus;
  priority: PriorityLevel;
  priorityScore: number;
  priorityReasons?: string[];
  duplicateGroupId?: string;
  linkedParentReportId?: string;
  isDuplicateOf?: string;
  candidateDuplicates?: { reportId: string; similarityScore: number; reason: string }[];
  assignedTeamId?: string;
  assignedWorkerId?: string;
  assignedWorkerName?: string;
  createdAt: string;
  updatedAt: string;
  dueAt: string;
  resolvedAt?: string;
  reopenedAt?: string;
  reopenCount?: number;
  citizenVerified?: 'YES' | 'NO' | 'PARTIAL';
  citizenFeedback?: string;
  communityVotes: CommunityVotes;
  evidence: ResolutionEvidence[];
  statusHistory: StatusHistoryEntry[];
}

export interface MunicipalZone {
  id: string;
  name: string;
  city: string;
  supervisorName: string;
  supervisorEmail: string;
  activeTeamsCount: number;
  center: { latitude: number; longitude: number };
}

export interface SanitationWorker {
  id: string;
  name: string;
  email: string;
  phone: string;
  zoneId: string;
  teamId: string;
  teamName: string;
  isAvailable: boolean;
  currentActiveTasks: number;
  completedTasksCount: number;
  avatarUrl?: string;
}

export interface Hotspot {
  id: string;
  name: string;
  zoneId: string;
  center: { latitude: number; longitude: number };
  radiusMeters: number;
  score: number; // 0 - 100
  severityLevel: SeverityLevel;
  incidentCount: number;
  recurringCategories: { category: WasteCategory; count: number }[];
  averageResolutionHours: number;
  repeatOffenseRate: number; // %
  recommendedIntervention: string;
  interventionType: 'collection_frequency' | 'bin_capacity' | 'surveillance_signage' | 'segregation_hub' | 'enforcement';
  sdgImpact: string;
  isRecurringHotspot?: boolean;
  calculatedAt: string;
}

export interface InAppNotification {
  id: string;
  title: string;
  message: string;
  reportId?: string;
  type: 'status_update' | 'critical_alert' | 'assignment' | 'community' | 'system';
  targetRole: UserRole | 'all';
  read: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  action: string;
  entityType: 'report' | 'user' | 'team' | 'zone' | 'hotspot' | 'system';
  entityId: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

export interface SLAConfig {
  criticalHours: number;
  highHours: number;
  mediumHours: number;
  lowHours: number;
}

export interface AnalyticsSummary {
  totalReports: number;
  pendingReports: number;
  criticalReports: number;
  resolvedReports: number;
  inProgressReports: number;
  averageResolutionHours: number;
  activeCleanupTasks: number;
  slaComplianceRate: number;
  hotspotsCount: number;
  categoryBreakdown: Record<WasteCategory, number>;
  zoneBreakdown: { zoneId: string; zoneName: string; reportCount: number; avgHours: number }[];
  recentActivityCount: number;
}
