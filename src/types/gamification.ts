export interface UserBadge {
  id: string;
  title: string;
  description: string;
  iconName: string;
  category: 'reporting' | 'verification' | 'cleanup' | 'consistency' | 'impact';
  progress: number;
  maxProgress: number;
  isUnlocked: boolean;
  unlockedAt?: string;
}

export interface PointTransaction {
  id: string;
  date: string;
  reason: string;
  category:
    | 'report_submission'
    | 'photo_upload'
    | 'location_accuracy'
    | 'authority_verified'
    | 'community_verify'
    | 'hotspot_identified'
    | 'cleanup_participation'
    | 'cleanup_evidence'
    | 'daily_checkin'
    | 'resolution_bonus'
    | 'challenge_reward';
  points: number;
  reportId?: string;
}

export interface WeeklyChallenge {
  id: string;
  title: string;
  description: string;
  rewardPoints: number;
  current: number;
  target: number;
  unit: string;
  isCompleted: boolean;
  isClaimed: boolean;
  daysRemaining: number;
}

export interface DailyMission {
  id: string;
  title: string;
  description: string;
  rewardPoints: number;
  isCompleted: boolean;
  actionType: 'verify_report' | 'check_area' | 'educational_tip';
  actionPrompt?: string;
  tipContent?: string;
}

export interface LeaderboardUser {
  id: string;
  name: string;
  avatarUrl?: string;
  level: number;
  levelTitle: string;
  civicPoints: number;
  reportsCount: number;
  verifiedReportsCount: number;
  streakDays: number;
  area: string;
  rank: number;
  isCurrentUser?: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  civicPoints: number;
  level: number;
  levelTitle: string;
  rankArea: number;
  rankCity: number;
  rankFriends: number;
  reportsCount: number;
  verifiedReportsCount: number;
  resolvedIssuesCount: number;
  hotspotsIdentifiedCount: number;
  cleanupsParticipatedCount: number;
  communityVerificationsCount: number;
  currentStreak: number;
  lastActiveDate: string;
  dailyReportsCount: number; // Max 5/day anti-spam
  maxDailyReports: number;
  isPublicOnLeaderboard: boolean;
  badges: UserBadge[];
  pointHistory: PointTransaction[];
  challenges: WeeklyChallenge[];
  dailyMissions: DailyMission[];
}
