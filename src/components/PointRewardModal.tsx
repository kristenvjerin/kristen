import React, { useEffect, useState } from 'react';
import { CheckCircle2, Award, ArrowRight, ShieldCheck, Sparkles, MapPin, Camera } from 'lucide-react';
import { getLevelDetails } from '../utils/gamification';

interface PointRewardModalProps {
  isOpen: boolean;
  onClose: () => void;
  pointsAwarded: number;
  breakdown: {
    base: number;
    photo: number;
    location: number;
    hotspot: number;
  };
  previousTotal: number;
  newTotal: number;
  levelUp: boolean;
}

export const PointRewardModal: React.FC<PointRewardModalProps> = ({
  isOpen,
  onClose,
  pointsAwarded,
  breakdown,
  previousTotal,
  newTotal,
  levelUp,
}) => {
  const [displayPoints, setDisplayPoints] = useState(previousTotal);
  const [showBreakdown, setShowBreakdown] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    setDisplayPoints(previousTotal);
    setShowBreakdown(false);

    // Number count-up animation over 900ms
    const startTime = Date.now();
    const duration = 900;
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(1, elapsed / duration);
      // Ease out quadratic
      const ease = 1 - (1 - progress) * (1 - progress);
      const current = Math.round(previousTotal + (newTotal - previousTotal) * ease);
      setDisplayPoints(current);

      if (progress >= 1) {
        clearInterval(interval);
        setDisplayPoints(newTotal);
        setShowBreakdown(true);
      }
    }, 25);

    return () => clearInterval(interval);
  }, [isOpen, previousTotal, newTotal]);

  if (!isOpen) return null;

  const currentLevel = getLevelDetails(newTotal);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-[16px] border border-[#E2E8E4] shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Subtle Civic Header */}
        <div className="bg-[#E8F5EE] border-b border-[#CBE5D7] p-5 text-center relative">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white text-[#176B45] shadow-xs mb-2.5">
            <CheckCircle2 className="w-6 h-6 text-[#176B45]" />
          </div>
          <h3 className="text-lg font-bold font-display tracking-wide text-[#0E4D32]">Report Submitted</h3>
          <p className="text-xs text-[#285A43] mt-0.5">
            Your civic contribution has been recorded for municipal verification
          </p>

          {levelUp && (
            <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#176B45] text-white text-xs font-semibold shadow-xs">
              <Award className="w-3.5 h-3.5" />
              <span className="font-display tracking-wide">LEVEL UP! REACHED {currentLevel.title.toUpperCase()}</span>
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4">
          {/* Main Points Pill with Count-up */}
          <div className="bg-[#F7F9F7] rounded-[12px] p-4 text-center border border-[#E2E8E4]">
            <span className="text-[11px] font-semibold font-display uppercase tracking-widest text-[#657169]">
              Civic Contribution Awarded
            </span>
            <div className="text-3xl sm:text-4xl font-black font-display text-[#176B45] mt-1 tracking-tight game-score-counter">
              +{pointsAwarded} <span className="text-sm font-bold text-[#0E4D32] tracking-normal">Civic Points</span>
            </div>

            {/* Previous to New Count */}
            <div className="mt-2 text-xs font-medium text-[#657169] flex items-center justify-center gap-2">
              <span className="font-display">{previousTotal.toLocaleString()}</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#8D9B91]" />
              <span className="font-bold font-display text-[#176B45] bg-white px-2 py-0.5 rounded-[6px] border border-[#E2E8E4] game-score-counter">
                {displayPoints.toLocaleString()} total pts
              </span>
            </div>
          </div>

          {/* Breakdown items */}
          <div className="space-y-1.5 text-xs">
            <div className="text-[11px] font-semibold font-display uppercase tracking-wider text-[#657169] mb-1">
              Points Breakdown:
            </div>

            <div className="flex items-center justify-between py-1.5 px-2.5 rounded-[8px] bg-[#F7F9F7] border border-[#E2E8E4]">
              <span className="flex items-center gap-2 text-[#17201B]">
                <ShieldCheck className="w-3.5 h-3.5 text-[#176B45]" />
                <span className="font-medium">Valid Waste Report</span>
              </span>
              <span className="font-bold font-display text-[#176B45]">+{breakdown.base} pts</span>
            </div>

            <div className="flex items-center justify-between py-1.5 px-2.5 rounded-[8px] bg-[#F7F9F7] border border-[#E2E8E4]">
              <span className="flex items-center gap-2 text-[#17201B]">
                <Camera className="w-3.5 h-3.5 text-[#176B45]" />
                <span className="font-medium">Clear Photographic Evidence</span>
              </span>
              <span className="font-bold font-display text-[#176B45]">+{breakdown.photo} pts</span>
            </div>

            <div className="flex items-center justify-between py-1.5 px-2.5 rounded-[8px] bg-[#F7F9F7] border border-[#E2E8E4]">
              <span className="flex items-center gap-2 text-[#17201B]">
                <MapPin className="w-3.5 h-3.5 text-[#176B45]" />
                <span className="font-medium">Geotagged Location Accuracy</span>
              </span>
              <span className="font-bold font-display text-[#176B45]">+{breakdown.location} pts</span>
            </div>

            {breakdown.hotspot > 0 && (
              <div className="flex items-center justify-between py-1.5 px-2.5 rounded-[8px] bg-[#FEF3EB] border border-[#FAD9C3]">
                <span className="flex items-center gap-2 text-[#853A0B]">
                  <Sparkles className="w-3.5 h-3.5 text-[#C45511]" />
                  <span className="font-medium">Recurring Hotspot Identified</span>
                </span>
                <span className="font-bold font-display text-[#C45511]">+{breakdown.hotspot} pts</span>
              </div>
            )}
          </div>

          {/* Level Progress Bar */}
          <div className="p-3 bg-[#F7F9F7] rounded-[10px] border border-[#E2E8E4]">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-bold text-[#17201B]">
                Level {currentLevel.level} • {currentLevel.title}
              </span>
              <span className="text-[#657169]">
                {currentLevel.pointsNeededForNextLevel > 0
                  ? `${currentLevel.pointsNeededForNextLevel} pts to next level`
                  : 'Max level reached'}
              </span>
            </div>
            <div className="w-full bg-[#E2E8E4] h-2 rounded-full overflow-hidden">
              <div
                className="bg-[#176B45] h-full rounded-full transition-all duration-500 ease-out"
                style={{ width: `${currentLevel.progressPercent}%` }}
              />
            </div>
          </div>

          {/* Civic Notice */}
          <p className="text-[11px] text-[#657169] text-center leading-relaxed">
            Points are confirmed upon municipal supervisor review (+40 bonus upon verification).
          </p>

          {/* Action Button */}
          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-[8px] bg-[#176B45] hover:bg-[#0E4D32] text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs"
          >
            Continue to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};
