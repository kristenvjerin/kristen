import React, { useState } from 'react';
import { UserProfile, LeaderboardUser } from '../types/gamification';
import {
  DEMO_LEADERBOARD_AREA,
  DEMO_LEADERBOARD_CITY,
  DEMO_LEADERBOARD_FRIENDS,
} from '../utils/gamification';
import { ApiService } from '../services/api';
import {
  Trophy,
  Medal,
  Award,
  ShieldCheck,
  Flame,
  Users,
  Eye,
  EyeOff,
  CheckCircle2,
  Info,
  MapPin,
  Sparkles,
} from 'lucide-react';

interface LeaderboardViewProps {
  profile: UserProfile;
  onRefreshProfile: () => void;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({
  profile,
  onRefreshProfile,
}) => {
  const [activeTab, setActiveTab] = useState<'area' | 'city' | 'friends'>('area');

  const handleTogglePrivacy = () => {
    ApiService.toggleLeaderboardPrivacy();
    onRefreshProfile();
  };

  const getList = (): LeaderboardUser[] => {
    let list: LeaderboardUser[] = [];
    if (activeTab === 'area') list = [...DEMO_LEADERBOARD_AREA];
    else if (activeTab === 'city') list = [...DEMO_LEADERBOARD_CITY];
    else list = [...DEMO_LEADERBOARD_FRIENDS];

    // Sync current user's live points into list
    return list.map((item) => {
      if (item.isCurrentUser) {
        return {
          ...item,
          civicPoints: profile.civicPoints,
          level: profile.level,
          levelTitle: profile.levelTitle,
          reportsCount: profile.reportsCount,
          verifiedReportsCount: profile.verifiedReportsCount,
          streakDays: profile.currentStreak,
        };
      }
      return item;
    });
  };

  const currentList = getList();
  const topThree = currentList.slice(0, 3);
  const remaining = currentList.slice(3);

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="bg-white rounded-[16px] border border-[#E2E8E4] p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-[#176B45]" />
            <h1 className="text-xl font-bold text-[#17201B]">Community Leaders</h1>
          </div>
          <p className="text-xs text-[#657169] mt-1">
            Celebrating active citizens working together to keep our streets and neighborhoods clean.
          </p>
        </div>

        {/* Privacy Toggle */}
        <div className="flex items-center gap-3 bg-[#F7F9F7] px-3.5 py-2 rounded-[10px] border border-[#E2E8E4] text-xs">
          <span className="text-[#657169] font-medium">Public visibility:</span>
          <button
            onClick={handleTogglePrivacy}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] font-semibold text-xs cursor-pointer transition-colors ${
              profile.isPublicOnLeaderboard
                ? 'bg-[#E8F5EE] text-[#0E4D32] border border-[#CBE5D7]'
                : 'bg-white text-[#657169] border border-[#E2E8E4]'
            }`}
          >
            {profile.isPublicOnLeaderboard ? (
              <>
                <Eye className="w-3.5 h-3.5 text-[#176B45]" /> Visible
              </>
            ) : (
              <>
                <EyeOff className="w-3.5 h-3.5" /> Anonymous
              </>
            )}
          </button>
        </div>
      </div>

      {/* DEMO NOTICE BANNER */}
      <div className="p-3 bg-[#F7F9F7] rounded-[10px] border border-[#E2E8E4] flex items-center justify-between text-xs text-[#657169]">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-[#176B45] shrink-0" />
          <span>
            <strong>Demo Data:</strong> Simulated community participation scores for prototype presentation. CleanSpot rewards positive civic action rather than toxic gaming.
          </span>
        </div>
      </div>

      {/* TABS (My Area, City, Friends) */}
      <div className="flex items-center gap-2 border-b border-[#E2E8E4] pb-2 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('area')}
          className={`py-2 px-4 rounded-[8px] transition-colors cursor-pointer ${
            activeTab === 'area'
              ? 'bg-[#176B45] text-white shadow-xs'
              : 'text-[#657169] hover:text-[#17201B] hover:bg-[#E8F5EE]/50'
          }`}
        >
          My Area (Ward 4 Central)
        </button>
        <button
          onClick={() => setActiveTab('city')}
          className={`py-2 px-4 rounded-[8px] transition-colors cursor-pointer ${
            activeTab === 'city'
              ? 'bg-[#176B45] text-white shadow-xs'
              : 'text-[#657169] hover:text-[#17201B] hover:bg-[#E8F5EE]/50'
          }`}
        >
          Metro City Wide
        </button>
        <button
          onClick={() => setActiveTab('friends')}
          className={`py-2 px-4 rounded-[8px] transition-colors cursor-pointer ${
            activeTab === 'friends'
              ? 'bg-[#176B45] text-white shadow-xs'
              : 'text-[#657169] hover:text-[#17201B] hover:bg-[#E8F5EE]/50'
          }`}
        >
          Friends & Neighbors
        </button>
      </div>

      {/* TOP 3 PODIUM CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {topThree.map((user, idx) => {
          const rankColors = [
            'border-amber-300 bg-amber-50/40 text-amber-900', // 1st
            'border-slate-300 bg-slate-50/50 text-slate-800', // 2nd
            'border-emerald-300 bg-emerald-50/40 text-emerald-900', // 3rd
          ];

          const badgeText = idx === 0 ? '🥇 1st Place' : idx === 1 ? '🥈 2nd Place' : '🥉 3rd Place';

          return (
            <div
              key={user.id}
              className={`p-4 rounded-[14px] border ${rankColors[idx]} shadow-xs flex flex-col justify-between relative overflow-hidden`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-extrabold font-display uppercase tracking-widest">
                    {badgeText}
                  </span>
                  <span className="text-xs font-bold font-display text-[#657169] bg-white px-2 py-0.5 rounded-[4px] border border-[#E2E8E4]">
                    LVL {user.level}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-xs"
                  />
                  <div>
                    <h3 className="text-sm font-bold font-display text-[#17201B] flex items-center gap-1.5">
                      <span>{user.name}</span>
                      {user.isCurrentUser && (
                        <span className="text-[10px] font-bold font-display bg-[#176B45] text-white px-1.5 py-0.2 rounded-full">
                          YOU
                        </span>
                      )}
                    </h3>
                    <p className="text-[11px] text-[#657169] font-medium">{user.levelTitle}</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-black/5 flex items-center justify-between text-xs">
                <div>
                  <span className="text-lg font-black font-display text-[#176B45] game-score-counter">
                    {user.civicPoints.toLocaleString()}
                  </span>{' '}
                  <span className="text-[10px] font-bold font-display text-[#657169]">PTS</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-[#657169]">
                  <span className="font-medium">{user.verifiedReportsCount} verified</span>
                  <span>•</span>
                  <span className="flex items-center gap-0.5 text-orange-600 font-bold font-display">
                    <Flame className="w-3 h-3 inline" /> {user.streakDays}D
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* FULL LEADERBOARD LIST */}
      <div className="bg-white rounded-[16px] border border-[#E2E8E4] shadow-xs overflow-hidden">
        <div className="p-4 border-b border-[#E2E8E4] bg-[#F7F9F7] flex items-center justify-between text-xs font-bold font-display uppercase tracking-wider text-[#657169]">
          <span>Rank & Citizen</span>
          <div className="flex items-center gap-8">
            <span className="hidden sm:inline">Activity</span>
            <span>Civic Points</span>
          </div>
        </div>

        <div className="divide-y divide-[#E2E8E4]">
          {currentList.map((user) => (
            <div
              key={user.id}
              className={`p-4 flex items-center justify-between gap-4 text-xs transition-colors ${
                user.isCurrentUser ? 'bg-[#E8F5EE]/40 font-medium' : 'hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="w-6 text-center font-black font-display text-[#657169] text-sm">
                  #{user.rank}
                </span>

                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="w-9 h-9 rounded-full object-cover border border-[#E2E8E4]"
                />

                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold font-display text-[#17201B]">{user.name}</span>
                    {user.isCurrentUser && (
                      <span className="text-[10px] font-bold font-display bg-[#176B45] text-white px-1.5 py-0.2 rounded-full">
                        YOU
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-[#657169] font-medium">
                    LVL {user.level} • {user.levelTitle}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-8">
                <div className="hidden sm:flex items-center gap-3 text-[11px] text-[#657169]">
                  <span>{user.reportsCount} reports</span>
                  <span>•</span>
                  <span>{user.verifiedReportsCount} verified</span>
                  <span>•</span>
                  <span className="text-orange-600 font-bold font-display flex items-center gap-0.5">
                    <Flame className="w-3 h-3 inline" /> {user.streakDays}D
                  </span>
                </div>

                <div className="text-right min-w-[80px]">
                  <span className="text-sm font-black font-display text-[#176B45] game-score-counter">
                    {user.civicPoints.toLocaleString()}
                  </span>
                  <span className="text-[10px] font-bold font-display text-[#657169] block">PTS</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
