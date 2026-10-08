import {
  DailyMission,
  LeaderboardUser,
  PointTransaction,
  UserBadge,
  UserProfile,
  WeeklyChallenge,
} from '../types/gamification';

export interface LevelInfo {
  level: number;
  title: string;
  minPoints: number;
  maxPoints: number;
  description: string;
}

export const LEVEL_TIERS: LevelInfo[] = [
  {
    level: 1,
    title: 'New Reporter',
    minPoints: 0,
    maxPoints: 100,
    description: 'Starting your civic journey by keeping an eye out for local waste.',
  },
  {
    level: 2,
    title: 'Waste Watcher',
    minPoints: 101,
    maxPoints: 300,
    description: 'Consistently observing and documenting municipal waste issues.',
  },
  {
    level: 3,
    title: 'CleanSpotter',
    minPoints: 301,
    maxPoints: 700,
    description: 'Active community spotter identifying critical cleanliness bottlenecks.',
  },
  {
    level: 4,
    title: 'Civic Helper',
    minPoints: 701,
    maxPoints: 1500,
    description: 'Proven contributor assisting municipal crews with reliable field data.',
  },
  {
    level: 5,
    title: 'Neighborhood Guardian',
    minPoints: 1501,
    maxPoints: 3000,
    description: 'Trusted local champion leading area cleanliness and prevention.',
  },
  {
    level: 6,
    title: 'Clean City Champion',
    minPoints: 3001,
    maxPoints: 10000,
    description: 'Top-tier civic leader transforming urban sanitation across the district.',
  },
];

export const POINT_RULES = {
  VALID_REPORT: 50,
  USEFUL_PHOTO: 20,
  ACCURATE_LOCATION: 15,
  AUTHORITY_VERIFIED: 40,
  DUPLICATE_OR_FALSE: 0,
  HELP_VERIFY_REPORT: 15,
  HOTSPOT_REPORT: 50,
  CLEANUP_PARTICIPATION: 100,
  CLEANUP_EVIDENCE: 50,
  DAILY_CHECKIN: 10,
  ISSUE_RESOLVED_BONUS: 50,
};

export function getLevelDetails(points: number): {
  level: number;
  title: string;
  minPoints: number;
  maxPoints: number;
  pointsInCurrentLevel: number;
  pointsNeededForNextLevel: number;
  progressPercent: number;
  nextLevelTitle: string;
} {
  const currentTier =
    LEVEL_TIERS.find((tier) => points >= tier.minPoints && points <= tier.maxPoints) ||
    LEVEL_TIERS[LEVEL_TIERS.length - 1];

  const nextTier =
    LEVEL_TIERS.find((tier) => tier.level === currentTier.level + 1) || currentTier;

  const pointsInCurrentLevel = points - currentTier.minPoints;
  const levelSpan = currentTier.maxPoints - currentTier.minPoints;
  const pointsNeededForNextLevel = Math.max(0, currentTier.maxPoints - points);
  const progressPercent = Math.min(
    100,
    Math.max(0, Math.round((pointsInCurrentLevel / (levelSpan || 1)) * 100))
  );

  return {
    level: currentTier.level,
    title: currentTier.title,
    minPoints: currentTier.minPoints,
    maxPoints: currentTier.maxPoints,
    pointsInCurrentLevel,
    pointsNeededForNextLevel,
    progressPercent,
    nextLevelTitle: nextTier.title,
  };
}

export const INITIAL_BADGES: UserBadge[] = [
  {
    id: 'badge-first-report',
    title: 'First Report',
    description: 'Submitted your first verified waste report.',
    iconName: 'Flag',
    category: 'reporting',
    progress: 1,
    maxProgress: 1,
    isUnlocked: true,
    unlockedAt: '2026-09-12T10:30:00Z',
  },
  {
    id: 'badge-waste-watcher',
    title: 'Waste Watcher',
    description: 'Submitted 5 verified reports.',
    iconName: 'Eye',
    category: 'reporting',
    progress: 5,
    maxProgress: 5,
    isUnlocked: true,
    unlockedAt: '2026-09-20T14:15:00Z',
  },
  {
    id: 'badge-cleanspotter',
    title: 'CleanSpotter',
    description: 'Helped identify 10 waste problems.',
    iconName: 'Sparkles',
    category: 'reporting',
    progress: 10,
    maxProgress: 10,
    isUnlocked: true,
    unlockedAt: '2026-09-29T16:45:00Z',
  },
  {
    id: 'badge-hotspot-hunter',
    title: 'Hotspot Hunter',
    description: 'Identified a recurring waste location.',
    iconName: 'Flame',
    category: 'impact',
    progress: 3,
    maxProgress: 3,
    isUnlocked: true,
    unlockedAt: '2026-10-04T11:20:00Z',
  },
  {
    id: 'badge-community-helper',
    title: 'Community Helper',
    description: 'Helped verify 10 community reports.',
    iconName: 'Users',
    category: 'verification',
    progress: 9,
    maxProgress: 10,
    isUnlocked: false,
  },
  {
    id: 'badge-cleanup-champion',
    title: 'Cleanup Champion',
    description: 'Participated in 5 cleanup activities.',
    iconName: 'CheckCircle2',
    category: 'cleanup',
    progress: 2,
    maxProgress: 5,
    isUnlocked: false,
  },
  {
    id: 'badge-consistent-contributor',
    title: 'Consistent Contributor',
    description: 'Contributed on 7 different days.',
    iconName: 'CalendarCheck',
    category: 'consistency',
    progress: 6,
    maxProgress: 7,
    isUnlocked: false,
  },
  {
    id: 'badge-neighborhood-guardian',
    title: 'Neighborhood Guardian',
    description: 'Made significant verified contributions to your area.',
    iconName: 'ShieldCheck',
    category: 'impact',
    progress: 15,
    maxProgress: 20,
    isUnlocked: true,
    unlockedAt: '2026-10-07T09:10:00Z',
  },
];

export const INITIAL_POINT_HISTORY: PointTransaction[] = [
  {
    id: 'pt-1',
    date: 'Today, 11:24 AM',
    reason: 'Daily civic check-in',
    category: 'daily_checkin',
    points: 10,
  },
  {
    id: 'pt-2',
    date: 'Oct 8, 2026',
    reason: 'Report verified by authority (CS-2026-000184)',
    category: 'authority_verified',
    points: 40,
    reportId: 'CS-2026-000184',
  },
  {
    id: 'pt-3',
    date: 'Oct 7, 2026',
    reason: 'Recurring hotspot identified at Market Gate 4',
    category: 'hotspot_identified',
    points: 50,
  },
  {
    id: 'pt-4',
    date: 'Oct 6, 2026',
    reason: 'Cleanup participation & verified resolution',
    category: 'cleanup_participation',
    points: 100,
  },
  {
    id: 'pt-5',
    date: 'Oct 5, 2026',
    reason: 'Helped verify community report (Sector 3 Bin)',
    category: 'community_verify',
    points: 15,
  },
  {
    id: 'pt-6',
    date: 'Oct 4, 2026',
    reason: 'High-accuracy photo contribution',
    category: 'photo_upload',
    points: 20,
  },
  {
    id: 'pt-7',
    date: 'Oct 3, 2026',
    reason: 'Valid waste report submitted (Plastic Waste in Canal)',
    category: 'report_submission',
    points: 50,
  },
];

export const INITIAL_CHALLENGES: WeeklyChallenge[] = [
  {
    id: 'chal-1',
    title: 'Report 3 genuine waste problems this week',
    description: 'Document real-world waste issues to assist dispatchers.',
    rewardPoints: 100,
    current: 2,
    target: 3,
    unit: 'reports',
    isCompleted: false,
    isClaimed: false,
    daysRemaining: 3,
  },
  {
    id: 'chal-2',
    title: 'Help identify a recurring hotspot',
    description: 'Flag areas where waste accumulates repeatedly.',
    rewardPoints: 150,
    current: 1,
    target: 1,
    unit: 'hotspots',
    isCompleted: true,
    isClaimed: false,
    daysRemaining: 3,
  },
  {
    id: 'chal-3',
    title: 'Participate in a cleanup activity',
    description: 'Verify field resolution or assist a local clean-up event.',
    rewardPoints: 200,
    current: 1,
    target: 1,
    unit: 'activity',
    isCompleted: true,
    isClaimed: true,
    daysRemaining: 3,
  },
];

export const INITIAL_DAILY_MISSIONS: DailyMission[] = [
  {
    id: 'dm-1',
    title: 'Check your area for an existing waste problem',
    description: 'Inspect your block or local bus stop on your morning commute.',
    rewardPoints: 10,
    isCompleted: true,
    actionType: 'check_area',
    actionPrompt: 'Block inspected: 0 overflowing bins spotted this morning.',
  },
  {
    id: 'dm-2',
    title: 'Help verify a nearby report',
    description: 'Provide a citizen confirmation signal for an unverified report.',
    rewardPoints: 15,
    isCompleted: false,
    actionType: 'verify_report',
    actionPrompt: 'Review nearby reports on the Community Map.',
  },
  {
    id: 'dm-3',
    title: 'Learn how to dispose of e-waste correctly',
    description: 'Read the 30-second municipal guide on battery and electronics drop-off.',
    rewardPoints: 10,
    isCompleted: false,
    actionType: 'educational_tip',
    tipContent:
      'Lithium batteries and electronics should never go into mixed bins. Drop them off at Designated Ward Hubs or schedule an e-waste doorstep pickup on the 1st Saturday of each month.',
  },
];

export const DEMO_USER_PROFILE: UserProfile = {
  id: 'user-kristen',
  name: 'Kristen',
  email: 'kristen.civic@example.com',
  avatarUrl:
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
  civicPoints: 1240,
  level: 4,
  levelTitle: 'Civic Helper',
  rankArea: 3,
  rankCity: 8,
  rankFriends: 2,
  reportsCount: 18,
  verifiedReportsCount: 15,
  resolvedIssuesCount: 12,
  hotspotsIdentifiedCount: 3,
  cleanupsParticipatedCount: 2,
  communityVerificationsCount: 9,
  currentStreak: 6,
  lastActiveDate: '2026-10-09T08:00:00Z',
  dailyReportsCount: 2,
  maxDailyReports: 5,
  isPublicOnLeaderboard: true,
  badges: INITIAL_BADGES,
  pointHistory: INITIAL_POINT_HISTORY,
  challenges: INITIAL_CHALLENGES,
  dailyMissions: INITIAL_DAILY_MISSIONS,
};

export const DEMO_LEADERBOARD_AREA: LeaderboardUser[] = [
  {
    id: 'user-arun',
    name: 'Arun M.',
    avatarUrl:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80',
    level: 5,
    levelTitle: 'Neighborhood Guardian',
    civicPoints: 2450,
    reportsCount: 34,
    verifiedReportsCount: 31,
    streakDays: 14,
    area: 'Ward 4 (Central)',
    rank: 1,
  },
  {
    id: 'user-priya',
    name: 'Priya K.',
    avatarUrl:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80',
    level: 5,
    levelTitle: 'Neighborhood Guardian',
    civicPoints: 2210,
    reportsCount: 29,
    verifiedReportsCount: 27,
    streakDays: 11,
    area: 'Ward 4 (Central)',
    rank: 2,
  },
  {
    id: 'user-kristen',
    name: 'Kristen (You)',
    avatarUrl:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
    level: 4,
    levelTitle: 'Civic Helper',
    civicPoints: 1240,
    reportsCount: 18,
    verifiedReportsCount: 15,
    streakDays: 6,
    area: 'Ward 4 (Central)',
    rank: 3,
    isCurrentUser: true,
  },
  {
    id: 'user-rahul',
    name: 'Rahul S.',
    avatarUrl:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80',
    level: 4,
    levelTitle: 'Civic Helper',
    civicPoints: 1110,
    reportsCount: 16,
    verifiedReportsCount: 14,
    streakDays: 4,
    area: 'Ward 4 (Central)',
    rank: 4,
  },
  {
    id: 'user-sofia',
    name: 'Sofia M.',
    avatarUrl:
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=256&q=80',
    level: 4,
    levelTitle: 'Civic Helper',
    civicPoints: 980,
    reportsCount: 14,
    verifiedReportsCount: 12,
    streakDays: 5,
    area: 'Ward 4 (Central)',
    rank: 5,
  },
  {
    id: 'user-david',
    name: 'David K.',
    avatarUrl:
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=256&q=80',
    level: 4,
    levelTitle: 'Civic Helper',
    civicPoints: 820,
    reportsCount: 11,
    verifiedReportsCount: 10,
    streakDays: 3,
    area: 'Ward 4 (Central)',
    rank: 6,
  },
  {
    id: 'user-ananya',
    name: 'Ananya R.',
    avatarUrl:
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=256&q=80',
    level: 3,
    levelTitle: 'CleanSpotter',
    civicPoints: 640,
    reportsCount: 9,
    verifiedReportsCount: 8,
    streakDays: 2,
    area: 'Ward 4 (Central)',
    rank: 7,
  },
];

export const DEMO_LEADERBOARD_CITY: LeaderboardUser[] = [
  {
    id: 'user-tariq',
    name: 'Tariq N.',
    avatarUrl:
      'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=256&q=80',
    level: 6,
    levelTitle: 'Clean City Champion',
    civicPoints: 3420,
    reportsCount: 52,
    verifiedReportsCount: 49,
    streakDays: 28,
    area: 'Zone 2 North',
    rank: 1,
  },
  {
    id: 'user-elena',
    name: 'Elena V.',
    avatarUrl:
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&q=80',
    level: 5,
    levelTitle: 'Neighborhood Guardian',
    civicPoints: 2890,
    reportsCount: 41,
    verifiedReportsCount: 39,
    streakDays: 19,
    area: 'Zone 3 Harbour',
    rank: 2,
  },
  {
    id: 'user-arun',
    name: 'Arun M.',
    avatarUrl:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80',
    level: 5,
    levelTitle: 'Neighborhood Guardian',
    civicPoints: 2450,
    reportsCount: 34,
    verifiedReportsCount: 31,
    streakDays: 14,
    area: 'Ward 4 Central',
    rank: 3,
  },
  {
    id: 'user-priya',
    name: 'Priya K.',
    avatarUrl:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80',
    level: 5,
    levelTitle: 'Neighborhood Guardian',
    civicPoints: 2210,
    reportsCount: 29,
    verifiedReportsCount: 27,
    streakDays: 11,
    area: 'Ward 4 Central',
    rank: 4,
  },
  {
    id: 'user-kristen',
    name: 'Kristen (You)',
    avatarUrl:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
    level: 4,
    levelTitle: 'Civic Helper',
    civicPoints: 1240,
    reportsCount: 18,
    verifiedReportsCount: 15,
    streakDays: 6,
    area: 'Ward 4 Central',
    rank: 8,
    isCurrentUser: true,
  },
];

export const DEMO_LEADERBOARD_FRIENDS: LeaderboardUser[] = [
  {
    id: 'user-priya',
    name: 'Priya K.',
    avatarUrl:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80',
    level: 5,
    levelTitle: 'Neighborhood Guardian',
    civicPoints: 2210,
    reportsCount: 29,
    verifiedReportsCount: 27,
    streakDays: 11,
    area: 'Ward 4 Central',
    rank: 1,
  },
  {
    id: 'user-kristen',
    name: 'Kristen (You)',
    avatarUrl:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
    level: 4,
    levelTitle: 'Civic Helper',
    civicPoints: 1240,
    reportsCount: 18,
    verifiedReportsCount: 15,
    streakDays: 6,
    area: 'Ward 4 Central',
    rank: 2,
    isCurrentUser: true,
  },
  {
    id: 'user-rahul',
    name: 'Rahul S.',
    avatarUrl:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80',
    level: 4,
    levelTitle: 'Civic Helper',
    civicPoints: 1110,
    reportsCount: 16,
    verifiedReportsCount: 14,
    streakDays: 4,
    area: 'Ward 4 Central',
    rank: 3,
  },
  {
    id: 'user-sofia',
    name: 'Sofia M.',
    avatarUrl:
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=256&q=80',
    level: 4,
    levelTitle: 'Civic Helper',
    civicPoints: 980,
    reportsCount: 14,
    verifiedReportsCount: 12,
    streakDays: 5,
    area: 'Ward 4 Central',
    rank: 4,
  },
];
