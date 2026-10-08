import React, { useState } from 'react';
import { UserProfile } from '../types/gamification';
import { ApiService } from '../services/api';
import { getLevelDetails, POINT_RULES, LEVEL_TIERS } from '../utils/gamification';
import {
  Award,
  Flame,
  CheckCircle2,
  Calendar,
  ShieldCheck,
  Eye,
  Flag,
  Sparkles,
  Users,
  CalendarCheck,
  ChevronRight,
  Info,
  Clock,
  ArrowUpRight,
  TrendingUp,
  AlertCircle,
  HelpCircle,
  Target,
  Gift,
  Check,
  BookOpen,
} from 'lucide-react';

interface GamificationDashboardProps {
  profile: UserProfile;
  onRefreshProfile: () => void;
  onNavigateToTab?: (tab: string) => void;
}

export const GamificationDashboard: React.FC<GamificationDashboardProps> = ({
  profile,
  onRefreshProfile,
  onNavigateToTab,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'badges' | 'history' | 'rules'>('overview');
  const [tipModalOpen, setTipModalOpen] = useState(false);

  const levelInfo = getLevelDetails(profile.civicPoints);

  const handleClaimChallenge = (challengeId: string) => {
    ApiService.claimChallenge(challengeId);
    onRefreshProfile();
  };

  const handleCompleteMission = (missionId: string) => {
    ApiService.completeDailyMission(missionId);
    onRefreshProfile();
  };

  const getBadgeIcon = (iconName: string) => {
    switch (iconName) {
      case 'Flag':
        return <Flag className="w-5 h-5" />;
      case 'Eye':
        return <Eye className="w-5 h-5" />;
      case 'Sparkles':
        return <Sparkles className="w-5 h-5" />;
      case 'Flame':
        return <Flame className="w-5 h-5" />;
      case 'Users':
        return <Users className="w-5 h-5" />;
      case 'CheckCircle2':
        return <CheckCircle2 className="w-5 h-5" />;
      case 'CalendarCheck':
        return <CalendarCheck className="w-5 h-5" />;
      case 'ShieldCheck':
      default:
        return <ShieldCheck className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* PROFILE HEADER HERO */}
      <div className="bg-white rounded-[16px] border border-[#E2E8E4] p-6 shadow-xs relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* User Info */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={profile.avatarUrl}
                alt={profile.name}
                className="w-16 h-16 rounded-full object-cover border-2 border-[#176B45] shadow-xs"
              />
              <span className="absolute -bottom-1 -right-1 bg-[#176B45] text-white text-[10px] font-bold font-display px-1.5 py-0.5 rounded-full border-2 border-white shadow-xs">
                LVL {levelInfo.level}
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black font-display text-[#17201B] tracking-wide">{profile.name}</h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold font-display uppercase tracking-wider bg-[#E8F5EE] text-[#0E4D32] border border-[#CBE5D7]">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#176B45]" />
                  {levelInfo.title}
                </span>
              </div>
              <p className="text-xs text-[#657169] mt-0.5 tracking-wide">
                Ward 4 Citizen Reporter • Member since Sept 2026
              </p>

              {/* Badges preview row */}
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[11px] font-semibold uppercase font-display text-[#657169]">Badges:</span>
                <div className="flex items-center gap-1.5">
                  {profile.badges
                    .filter((b) => b.isUnlocked)
                    .slice(0, 4)
                    .map((b) => (
                      <span
                        key={b.id}
                        title={b.title}
                        className="w-6 h-6 rounded-full bg-[#E8F5EE] text-[#176B45] flex items-center justify-center border border-[#CBE5D7] text-xs shadow-xs"
                      >
                        {getBadgeIcon(b.iconName)}
                      </span>
                    ))}
                  {profile.badges.filter((b) => b.isUnlocked).length > 4 && (
                    <span className="text-[10px] text-[#657169] font-bold font-display">
                      +{profile.badges.filter((b) => b.isUnlocked).length - 4} MORE
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Metrics Pills */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Civic Points */}
            <div className="bg-[#F7F9F7] border border-[#E2E8E4] rounded-[12px] px-4 py-2.5 text-center min-w-[110px]">
              <span className="text-[10px] font-bold font-display text-[#657169] uppercase tracking-wider block">
                Civic Points
              </span>
              <span className="text-2xl font-black font-display text-[#176B45] tracking-tight game-score-counter">
                {profile.civicPoints.toLocaleString()}
              </span>
            </div>

            {/* Streak */}
            <div className="bg-[#F7F9F7] border border-[#E2E8E4] rounded-[12px] px-4 py-2.5 text-center min-w-[100px]">
              <span className="text-[10px] font-bold font-display text-[#657169] uppercase tracking-wider block flex items-center justify-center gap-1">
                <Flame className="w-3 h-3 text-orange-600 inline" /> Streak
              </span>
              <span className="text-2xl font-black font-display text-orange-600 tracking-tight game-score-counter">
                {profile.currentStreak} <span className="text-xs font-bold uppercase">days</span>
              </span>
            </div>

            {/* Area Rank */}
            <div className="bg-[#F7F9F7] border border-[#E2E8E4] rounded-[12px] px-4 py-2.5 text-center min-w-[100px]">
              <span className="text-[10px] font-bold font-display text-[#657169] uppercase tracking-wider block">
                Area Rank
              </span>
              <span className="text-2xl font-black font-display text-[#17201B] tracking-tight game-score-counter">
                #{profile.rankArea}
              </span>
            </div>
          </div>
        </div>

        {/* PROGRESS BAR SECTION */}
        <div className="mt-6 pt-5 border-t border-[#E2E8E4]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs mb-2">
            <div>
              <span className="font-extrabold font-display text-[#17201B] uppercase tracking-widest text-[11px]">
                LEVEL {levelInfo.level} — {levelInfo.title.toUpperCase()}
              </span>
              <span className="text-[#657169] ml-2 font-display text-[11px]">
                ({profile.civicPoints.toLocaleString()} / {levelInfo.maxPoints.toLocaleString()} PTS)
              </span>
            </div>
            <span className="font-bold font-display text-[#176B45] text-xs">
              {levelInfo.pointsNeededForNextLevel > 0
                ? `${levelInfo.pointsNeededForNextLevel.toLocaleString()} PTS TO NEXT LEVEL`
                : 'MAX LEVEL ACHIEVED!'}
            </span>
          </div>

          <div className="w-full bg-[#E2E8E4] h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-[#176B45] h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${levelInfo.progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* SUB-TABS NAVIGATION */}
      <div className="flex items-center gap-2 border-b border-[#E2E8E4] pb-2 text-xs font-semibold">
        <button
          onClick={() => setActiveSubTab('overview')}
          className={`py-2 px-3.5 rounded-[8px] transition-colors cursor-pointer font-display tracking-wide uppercase text-xs ${
            activeSubTab === 'overview'
              ? 'bg-[#176B45] text-white shadow-xs font-bold'
              : 'text-[#657169] hover:text-[#17201B] hover:bg-[#E8F5EE]/50'
          }`}
        >
          Overview & Missions
        </button>
        <button
          onClick={() => setActiveSubTab('badges')}
          className={`py-2 px-3.5 rounded-[8px] transition-colors cursor-pointer font-display tracking-wide uppercase text-xs ${
            activeSubTab === 'badges'
              ? 'bg-[#176B45] text-white shadow-xs font-bold'
              : 'text-[#657169] hover:text-[#17201B] hover:bg-[#E8F5EE]/50'
          }`}
        >
          Badges & Achievements ({profile.badges.filter((b) => b.isUnlocked).length}/{profile.badges.length})
        </button>
        <button
          onClick={() => setActiveSubTab('history')}
          className={`py-2 px-3.5 rounded-[8px] transition-colors cursor-pointer font-display tracking-wide uppercase text-xs ${
            activeSubTab === 'history'
              ? 'bg-[#176B45] text-white shadow-xs font-bold'
              : 'text-[#657169] hover:text-[#17201B] hover:bg-[#E8F5EE]/50'
          }`}
        >
          Points History
        </button>
        <button
          onClick={() => setActiveSubTab('rules')}
          className={`py-2 px-3.5 rounded-[8px] transition-colors cursor-pointer font-display tracking-wide uppercase text-xs ${
            activeSubTab === 'rules'
              ? 'bg-[#176B45] text-white shadow-xs font-bold'
              : 'text-[#657169] hover:text-[#17201B] hover:bg-[#E8F5EE]/50'
          }`}
        >
          Point Schedule & Anti-Spam
        </button>
      </div>

      {/* TAB 1: OVERVIEW & MISSIONS */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6">
          {/* CONTRIBUTION OVERVIEW (4 Stat Cards) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-[12px] border border-[#E2E8E4] shadow-xs">
              <span className="text-[11px] font-bold font-display uppercase tracking-wider text-[#657169]">Reports Submitted</span>
              <div className="text-3xl font-black font-display text-[#17201B] mt-1 game-score-counter">{profile.reportsCount}</div>
              <span className="text-[11px] text-[#657169] mt-0.5 block font-medium">
                {profile.dailyReportsCount}/5 today
              </span>
            </div>

            <div className="bg-white p-4 rounded-[12px] border border-[#E2E8E4] shadow-xs">
              <span className="text-[11px] font-bold font-display uppercase tracking-wider text-[#657169]">Verified by Authority</span>
              <div className="text-3xl font-black font-display text-[#176B45] mt-1 game-score-counter">{profile.verifiedReportsCount}</div>
              <span className="text-[11px] text-[#176B45] mt-0.5 block font-bold font-display">
                {Math.round((profile.verifiedReportsCount / Math.max(1, profile.reportsCount)) * 100)}% ACCURACY
              </span>
            </div>

            <div className="bg-white p-4 rounded-[12px] border border-[#E2E8E4] shadow-xs">
              <span className="text-[11px] font-bold font-display uppercase tracking-wider text-[#657169]">Issues Resolved</span>
              <div className="text-3xl font-black font-display text-[#0E4D32] mt-1 game-score-counter">{profile.resolvedIssuesCount}</div>
              <span className="text-[11px] text-[#657169] mt-0.5 block font-medium">
                Cleaned by crews
              </span>
            </div>

            <div className="bg-white p-4 rounded-[12px] border border-[#E2E8E4] shadow-xs">
              <span className="text-[11px] font-bold font-display uppercase tracking-wider text-[#657169]">Hotspots Identified</span>
              <div className="text-3xl font-black font-display text-[#C45511] mt-1 game-score-counter">{profile.hotspotsIdentifiedCount}</div>
              <span className="text-[11px] text-[#657169] mt-0.5 block font-medium">
                Targeted for bins
              </span>
            </div>
          </div>

          {/* TWO COLUMN GRID: TODAY'S CONTRIBUTION & WEEKLY CHALLENGES */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* TODAY'S CONTRIBUTION (Daily Missions) */}
            <div className="bg-white rounded-[16px] border border-[#E2E8E4] p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-[#176B45]" />
                    <h2 className="text-sm font-bold text-[#17201B]">Today's Contribution</h2>
                  </div>
                  <span className="text-[11px] font-semibold text-[#657169] bg-[#F7F9F7] px-2 py-0.5 rounded-[4px] border border-[#E2E8E4]">
                    Daily Reset: 00:00
                  </span>
                </div>

                <div className="space-y-3">
                  {profile.dailyMissions.map((mission) => (
                    <div
                      key={mission.id}
                      className={`p-3.5 rounded-[10px] border transition-all ${
                        mission.isCompleted
                          ? 'bg-[#E8F5EE]/40 border-[#CBE5D7]'
                          : 'bg-[#F7F9F7] border-[#E2E8E4]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-[#17201B]">
                              {mission.title}
                            </span>
                            <span className="text-[10px] font-bold font-display text-[#176B45] bg-white px-1.5 py-0.2 rounded-[4px] border border-[#E2E8E4]">
                              +{mission.rewardPoints} PTS
                            </span>
                          </div>
                          <p className="text-[11px] text-[#657169] leading-relaxed">
                            {mission.description}
                          </p>
                          {mission.actionPrompt && (
                            <p className="text-[11px] text-[#176B45] font-medium mt-1">
                              ✓ {mission.actionPrompt}
                            </p>
                          )}
                        </div>

                        <div>
                          {mission.isCompleted ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#176B45] bg-white px-2 py-1 rounded-[6px] border border-[#CBE5D7]">
                              <Check className="w-3 h-3 text-[#176B45]" /> Done
                            </span>
                          ) : mission.actionType === 'educational_tip' ? (
                            <button
                              onClick={() => setTipModalOpen(true)}
                              className="py-1 px-2.5 rounded-[6px] bg-[#176B45] hover:bg-[#0E4D32] text-white text-[11px] font-semibold cursor-pointer shadow-xs whitespace-nowrap"
                            >
                              Read Tip
                            </button>
                          ) : mission.actionType === 'verify_report' ? (
                            <button
                              onClick={() => onNavigateToTab?.('map')}
                              className="py-1 px-2.5 rounded-[6px] bg-white hover:bg-slate-50 border border-[#E2E8E4] text-[#17201B] text-[11px] font-semibold cursor-pointer whitespace-nowrap"
                            >
                              Open Map
                            </button>
                          ) : (
                            <button
                              onClick={() => handleCompleteMission(mission.id)}
                              className="py-1 px-2.5 rounded-[6px] bg-[#176B45] hover:bg-[#0E4D32] text-white text-[11px] font-semibold cursor-pointer shadow-xs whitespace-nowrap"
                            >
                              Check-in
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#E2E8E4] text-[11px] text-[#657169] flex items-center justify-between">
                <span>Complete daily missions to maintain your streak</span>
                <span className="font-semibold text-orange-600 flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-orange-600" /> {profile.currentStreak} Day Streak
                </span>
              </div>
            </div>

            {/* WEEKLY CHALLENGES */}
            <div className="bg-white rounded-[16px] border border-[#E2E8E4] p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Gift className="w-5 h-5 text-[#176B45]" />
                    <h2 className="text-sm font-bold text-[#17201B]">Weekly Challenges</h2>
                  </div>
                  <span className="text-[11px] font-semibold text-[#657169] bg-[#F7F9F7] px-2 py-0.5 rounded-[4px] border border-[#E2E8E4]">
                    3 Days Left
                  </span>
                </div>

                <div className="space-y-3">
                  {profile.challenges.map((challenge) => (
                    <div
                      key={challenge.id}
                      className="p-3.5 rounded-[10px] bg-[#F7F9F7] border border-[#E2E8E4] space-y-2"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-[#17201B]">
                              {challenge.title}
                            </span>
                            <span className="text-[10px] font-bold font-display text-[#176B45] bg-white px-1.5 py-0.2 rounded-[4px] border border-[#E2E8E4]">
                              +{challenge.rewardPoints} PTS
                            </span>
                          </div>
                          <p className="text-[11px] text-[#657169] mt-0.5">
                            {challenge.description}
                          </p>
                        </div>

                        <div>
                          {challenge.isClaimed ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold font-display text-[#657169]">
                              <Check className="w-3 h-3 text-[#176B45]" /> CLAIMED
                            </span>
                          ) : challenge.isCompleted ? (
                            <button
                              onClick={() => handleClaimChallenge(challenge.id)}
                              className="py-1 px-3 rounded-[6px] bg-[#176B45] hover:bg-[#0E4D32] text-white text-[11px] font-bold font-display cursor-pointer shadow-xs animate-pulse tracking-wide"
                            >
                              CLAIM POINTS
                            </button>
                          ) : (
                            <span className="text-[11px] font-bold font-display text-[#657169]">
                              {challenge.current}/{challenge.target} {challenge.unit}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full bg-[#E2E8E4] h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-[#176B45] h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.min(100, (challenge.current / challenge.target) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#E2E8E4] text-[11px] text-[#657169]">
                Challenges encourage genuine waste management without manufactured spam.
              </div>
            </div>
          </div>

          {/* NEIGHBORHOOD IMPACT SECTION */}
          <div className="bg-white rounded-[16px] border border-[#E2E8E4] p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-sm font-bold font-display uppercase tracking-wider text-[#17201B]">Neighborhood Civic Impact</h2>
                <p className="text-xs text-[#657169]">
                  Direct outcomes achieved in your area from verified citizen contributions
                </p>
              </div>
              <span className="text-[11px] font-bold font-display uppercase tracking-wider text-[#176B45] bg-[#E8F5EE] px-2.5 py-1 rounded-[6px] border border-[#CBE5D7]">
                Ward 4 (Central)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2">
              <div className="p-3 bg-[#F7F9F7] rounded-[10px] border border-[#E2E8E4]">
                <div className="text-xl font-black font-display text-[#17201B] game-score-counter">18 Reports</div>
                <p className="text-[11px] text-[#657169] mt-0.5 font-medium">
                  Helped alert dispatchers to waste accumulations
                </p>
              </div>

              <div className="p-3 bg-[#F7F9F7] rounded-[10px] border border-[#E2E8E4]">
                <div className="text-xl font-black font-display text-[#176B45] game-score-counter">15 Verified</div>
                <p className="text-[11px] text-[#657169] mt-0.5 font-medium">
                  Confirmed by municipal supervisors
                </p>
              </div>

              <div className="p-3 bg-[#F7F9F7] rounded-[10px] border border-[#E2E8E4]">
                <div className="text-xl font-black font-display text-[#0E4D32] game-score-counter">12 Resolved</div>
                <p className="text-[11px] text-[#657169] mt-0.5 font-medium">
                  Cleared and swept clean by sanitation teams
                </p>
              </div>

              <div className="p-3 bg-[#F7F9F7] rounded-[10px] border border-[#E2E8E4]">
                <div className="text-xl font-black font-display text-[#C45511] game-score-counter">3 Hotspots</div>
                <p className="text-[11px] text-[#657169] mt-0.5 font-medium">
                  Scheduled for permanent secondary bin capacity
                </p>
              </div>
            </div>

            <div className="mt-4 p-3 rounded-[8px] bg-[#E8F5EE]/50 border border-[#CBE5D7] text-xs text-[#0E4D32] flex items-center justify-between">
              <span>
                <strong>Transparent Accountability:</strong> We track actual waste cleaned by municipal teams rather than unverified theoretical formulas.
              </span>
              <button
                onClick={() => onNavigateToTab?.('track')}
                className="font-bold underline ml-2 cursor-pointer whitespace-nowrap text-[#176B45]"
              >
                Track My Issues →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: BADGES & ACHIEVEMENTS */}
      {activeSubTab === 'badges' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-[#17201B]">Civic Achievement Badges</h2>
              <p className="text-xs text-[#657169]">
                Earned through meaningful, verified community actions.
              </p>
            </div>
            <span className="text-xs font-semibold text-[#176B45] bg-[#E8F5EE] px-3 py-1 rounded-[6px] border border-[#CBE5D7]">
              {profile.badges.filter((b) => b.isUnlocked).length} of {profile.badges.length} Unlocked
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {profile.badges.map((badge) => (
              <div
                key={badge.id}
                className={`p-4 rounded-[12px] border transition-all ${
                  badge.isUnlocked
                    ? 'bg-white border-[#CBE5D7] shadow-xs'
                    : 'bg-[#F7F9F7]/60 border-[#E2E8E4] opacity-80'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                      badge.isUnlocked
                        ? 'bg-[#E8F5EE] text-[#176B45] border border-[#CBE5D7]'
                        : 'bg-[#E2E8E4] text-[#8D9B91]'
                    }`}
                  >
                    {getBadgeIcon(badge.iconName)}
                  </div>

                  <div className="space-y-1 flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-[#17201B]">{badge.title}</h3>
                      {badge.isUnlocked && (
                        <span className="text-[10px] font-bold text-[#176B45] bg-[#E8F5EE] px-1.5 py-0.2 rounded-[4px]">
                          Unlocked
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#657169] leading-relaxed">
                      {badge.description}
                    </p>

                    {/* Progress indicator */}
                    <div className="pt-2">
                      <div className="flex items-center justify-between text-[10px] text-[#657169] mb-1">
                        <span>Progress</span>
                        <span>
                          {badge.progress} / {badge.maxProgress}
                        </span>
                      </div>
                      <div className="w-full bg-[#E2E8E4] h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            badge.isUnlocked ? 'bg-[#176B45]' : 'bg-[#8D9B91]'
                          }`}
                          style={{
                            width: `${Math.min(100, (badge.progress / badge.maxProgress) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>

                    {badge.unlockedAt && (
                      <p className="text-[10px] text-[#8D9B91] pt-1">
                        Unlocked on {new Date(badge.unlockedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: POINTS HISTORY */}
      {activeSubTab === 'history' && (
        <div className="bg-white rounded-[16px] border border-[#E2E8E4] p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold font-display uppercase tracking-wider text-[#17201B]">Points History & Ledger</h2>
              <p className="text-xs text-[#657169]">
                Transparent record of every point awarded or confirmed.
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs font-black font-display text-[#176B45]">
                {profile.civicPoints.toLocaleString()} TOTAL CIVIC POINTS
              </span>
            </div>
          </div>

          <div className="divide-y divide-[#E2E8E4]">
            {profile.pointHistory.map((pt) => (
              <div key={pt.id} className="py-3 flex items-center justify-between gap-4 text-xs">
                <div className="space-y-0.5">
                  <div className="font-semibold text-[#17201B] flex items-center gap-2">
                    <span className="font-medium">{pt.reason}</span>
                    {pt.reportId && (
                      <span className="text-[10px] font-mono font-bold text-[#657169] bg-[#F7F9F7] px-1.5 py-0.2 rounded-[4px] border border-[#E2E8E4]">
                        {pt.reportId}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-[#657169] font-medium">{pt.date}</div>
                </div>

                <div className="text-right">
                  <span
                    className={`font-black font-display text-sm game-score-counter ${
                      pt.points > 0 ? 'text-[#176B45]' : 'text-slate-500'
                    }`}
                  >
                    +{pt.points} PTS
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: POINT SYSTEM & ANTI-SPAM */}
      {activeSubTab === 'rules' && (
        <div className="space-y-6">
          {/* Transparent Point System Guide */}
          <div className="bg-white rounded-[16px] border border-[#E2E8E4] p-5 shadow-xs space-y-4">
            <div>
              <h2 className="text-sm font-bold font-display uppercase tracking-wider text-[#17201B]">Transparent Point Schedule</h2>
              <p className="text-xs text-[#657169]">
                CleanSpot rewards genuine, actionable civic contributions that improve municipal cleanliness.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-[8px] bg-[#F7F9F7] border border-[#E2E8E4] flex items-center justify-between">
                <span>Submit a valid waste report</span>
                <span className="font-bold font-display text-[#176B45]">+{POINT_RULES.VALID_REPORT} PTS</span>
              </div>
              <div className="p-3 rounded-[8px] bg-[#F7F9F7] border border-[#E2E8E4] flex items-center justify-between">
                <span>Upload a useful, clear photo</span>
                <span className="font-bold font-display text-[#176B45]">+{POINT_RULES.USEFUL_PHOTO} PTS</span>
              </div>
              <div className="p-3 rounded-[8px] bg-[#F7F9F7] border border-[#E2E8E4] flex items-center justify-between">
                <span>Accurate geolocated pin</span>
                <span className="font-bold font-display text-[#176B45]">+{POINT_RULES.ACCURATE_LOCATION} PTS</span>
              </div>
              <div className="p-3 rounded-[8px] bg-[#F7F9F7] border border-[#E2E8E4] flex items-center justify-between">
                <span>Report verified by authority</span>
                <span className="font-bold font-display text-[#176B45]">+{POINT_RULES.AUTHORITY_VERIFIED} PTS</span>
              </div>
              <div className="p-3 rounded-[8px] bg-[#F7F9F7] border border-[#E2E8E4] flex items-center justify-between">
                <span>Help verify an existing report</span>
                <span className="font-bold font-display text-[#176B45]">+{POINT_RULES.HELP_VERIFY_REPORT} PTS</span>
              </div>
              <div className="p-3 rounded-[8px] bg-[#F7F9F7] border border-[#E2E8E4] flex items-center justify-between">
                <span>Report a recurring hotspot</span>
                <span className="font-bold font-display text-[#176B45]">+{POINT_RULES.HOTSPOT_REPORT} PTS</span>
              </div>
              <div className="p-3 rounded-[8px] bg-[#F7F9F7] border border-[#E2E8E4] flex items-center justify-between">
                <span>Participate in cleanup event</span>
                <span className="font-bold text-[#176B45]">+{POINT_RULES.CLEANUP_PARTICIPATION} points</span>
              </div>
              <div className="p-3 rounded-[8px] bg-[#F7F9F7] border border-[#E2E8E4] flex items-center justify-between">
                <span>Reported issue resolved & confirmed</span>
                <span className="font-bold text-[#176B45]">+{POINT_RULES.ISSUE_RESOLVED_BONUS} points</span>
              </div>
              <div className="p-3 rounded-[8px] bg-[#F7F9F7] border border-[#E2E8E4] flex items-center justify-between">
                <span>Daily civic participation / check-in</span>
                <span className="font-bold text-[#176B45]">+{POINT_RULES.DAILY_CHECKIN} points</span>
              </div>
              <div className="p-3 rounded-[8px] bg-[#FEF3EB] border border-[#FAD9C3] flex items-center justify-between">
                <span className="text-[#853A0B]">Duplicate or false report</span>
                <span className="font-bold text-[#C45511]">0 points (Merged)</span>
              </div>
            </div>
          </div>

          {/* Anti-Spam Policy Explainer */}
          <div className="bg-white rounded-[16px] border border-[#E2E8E4] p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#176B45]" />
              <h2 className="text-sm font-bold text-[#17201B]">Anti-Spam & Quality Assurance Rules</h2>
            </div>
            <p className="text-xs text-[#657169] leading-relaxed">
              Points are never awarded for spam or repeated photos. CleanSpot enforces strict rate-limits and verification checks:
            </p>

            <ul className="space-y-2 text-xs text-[#17201B] list-disc list-inside">
              <li>
                <strong>Daily Reporting Limit (5 per day):</strong> Keeps municipal dispatch queues actionable and prevents farming.
              </li>
              <li>
                <strong>Geospatial Proximity Match:</strong> Reports submitted within 30 meters of an active ticket with similar category are linked as duplicates with 0 points.
              </li>
              <li>
                <strong>AI Vision Quality Filter:</strong> Blurry or unusable photos are rejected before submission with guided recapture advice.
              </li>
              <li>
                <strong>Supervisor Verification Gate:</strong> The +40 authority verification bonus requires human supervisor audit before crediting.
              </li>
              <li>
                <strong>Educational Feedback:</strong> Users are never publicly shamed for duplicate tickets; reports are politely merged into the active neighborhood resolution.
              </li>
            </ul>
          </div>

          {/* LEVEL TIERS EXPLAINER */}
          <div className="bg-white rounded-[16px] border border-[#E2E8E4] p-5 shadow-xs space-y-3">
            <h2 className="text-sm font-bold text-[#17201B]">Civic Level Progression</h2>
            <div className="space-y-2 text-xs">
              {LEVEL_TIERS.map((tier) => (
                <div
                  key={tier.level}
                  className={`p-3 rounded-[8px] border flex items-center justify-between ${
                    tier.level === levelInfo.level
                      ? 'bg-[#E8F5EE] border-[#CBE5D7]'
                      : 'bg-[#F7F9F7] border-[#E2E8E4]'
                  }`}
                >
                  <div className="space-y-0.5">
                    <span className="font-bold text-[#17201B]">
                      Level {tier.level} — {tier.title}
                    </span>
                    <p className="text-[11px] text-[#657169]">{tier.description}</p>
                  </div>
                  <div className="text-right font-medium text-[#176B45]">
                    {tier.minPoints.toLocaleString()} – {tier.maxPoints.toLocaleString()} pts
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* EDUCATIONAL TIP MODAL */}
      {tipModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-[16px] border border-[#E2E8E4] shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-2 text-[#176B45]">
              <BookOpen className="w-5 h-5 text-[#176B45]" />
              <h3 className="font-bold text-[#0E4D32]">Disposing E-Waste Correctly</h3>
            </div>
            <p className="text-xs text-[#17201B] leading-relaxed">
              Lithium-ion batteries, laptop cords, cables, and small electronics should <strong>never</strong> be placed in mixed municipal bins. They pose severe fire hazards in collection trucks and contaminate compost.
            </p>
            <div className="p-3 bg-[#F7F9F7] rounded-[8px] border border-[#E2E8E4] text-xs text-[#657169]">
              <strong>Ward 4 E-Waste Hub:</strong> Located at Sector 2 Municipal Yard, open Monday through Saturday (8:00 AM – 6:00 PM). Free drop-off for all ward residents.
            </div>
            <button
              onClick={() => {
                handleCompleteMission('dm-3');
                setTipModalOpen(false);
              }}
              className="w-full py-2.5 rounded-[8px] bg-[#176B45] hover:bg-[#0E4D32] text-white text-xs font-semibold cursor-pointer shadow-xs"
            >
              Mark Tip as Completed (+10 Points)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
