import React, { useState } from 'react';
import { AnalyticsSummary, WasteReport } from '../types';
import { getCategoryInfo } from '../utils/categories';
import {
  Camera,
  MapPin,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Check,
  ChevronDown,
  ChevronUp,
  Users,
  AlertTriangle,
} from 'lucide-react';

interface LandingPageProps {
  reports: WasteReport[];
  analytics: AnalyticsSummary;
  onNavigateTab: (tab: string) => void;
  onSelectReport: (report: WasteReport) => void;
  onCommunityVote: (reportId: string, vote: 'still_there' | 'cleaned' | 'worsened') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  reports,
  analytics,
  onNavigateTab,
  onSelectReport,
  onCommunityVote,
}) => {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [votedFeedbackId, setVotedFeedbackId] = useState<string | null>(null);

  const faqs = [
    {
      q: 'What happens after I submit a waste report?',
      a: 'Your report enters the municipal intake queue. The location is verified, image analysis suggests hazard category and severity, and a supervisor assigns a cleanup team. Once cleared, the team uploads a photo showing the cleared site.',
    },
    {
      q: 'How is my location used and is my exact address private?',
      a: 'GPS coordinates are used solely to direct sanitation crews to the site. On the public community map, locations are approximated (for example, "Near Gandhi Road") to preserve privacy.',
    },
    {
      q: 'Can I report waste without creating an account?',
      a: 'Yes. CleanSpot does not require registration. You receive a tracking code (such as CS-2026-000184) to follow progress at any time.',
    },
    {
      q: 'How are reports verified and prioritized?',
      a: 'Reports are prioritized based on hazard severity, public obstruction, blocked drainage, elapsed time, and confirmations from nearby residents.',
    },
    {
      q: 'How do cleanup teams receive and complete tasks?',
      a: 'Sanitation crews receive work orders with coordinates, photo evidence, and location notes. After cleanup, they submit a photo of the cleared area before marking the task resolved.',
    },
    {
      q: 'What are recurring waste hotspots?',
      a: 'Locations with repeated dumping complaints are flagged as hotspots so municipal planners can consider preventive infrastructure, such as additional bins or scheduled collections.',
    },
  ];

  const handleVoteWithFeedback = (
    reportId: string,
    vote: 'still_there' | 'cleaned' | 'worsened'
  ) => {
    onCommunityVote(reportId, vote);
    setVotedFeedbackId(reportId);
    setTimeout(() => setVotedFeedbackId(null), 3000);
  };

  return (
    <div className="space-y-12 pb-12">
      {/* 1. HERO SECTION — Calm, Human, Restrained Civic Presentation */}
      <section className="bg-white rounded-[14px] border border-[#E2E8E4] p-6 sm:p-10 lg:p-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#176B45]">
              Gamified Civic Cleanliness Platform
            </span>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#17201B] leading-tight">
              Report waste. Earn points. Improve your area.
            </h1>

            <p className="text-sm sm:text-base text-[#657169] leading-relaxed max-w-xl">
              Turn everyday civic contributions into verified real-world impact. Capture waste, earn Civic Points, unlock achievement badges, and help municipal crews keep your neighborhood clean.
            </p>

            {/* Core Idea Mission Strip */}
            <div className="p-3 bg-[#F7F9F7] rounded-[10px] border border-[#E2E8E4] text-[11px] font-medium text-[#17201B] flex flex-wrap items-center gap-1.5 leading-snug">
              <span className="font-bold text-[#176B45]">Mission:</span>
              <span>See Waste</span>
              <span className="text-slate-300">→</span>
              <span>Take Photo</span>
              <span className="text-slate-300">→</span>
              <span>Report Location</span>
              <span className="text-slate-300">→</span>
              <span>Verify</span>
              <span className="text-slate-300">→</span>
              <span className="font-bold text-[#176B45]">Earn Points (+85)</span>
              <span className="text-slate-300">→</span>
              <span>Track Cleanup</span>
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={() => onNavigateTab('report')}
                className="touch-target px-5 py-2.5 bg-[#176B45] hover:bg-[#0E4D32] text-white font-semibold text-sm rounded-[8px] transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <Camera className="w-4 h-4" />
                <span>Report waste & earn points</span>
              </button>

              <button
                onClick={() => onNavigateTab('profile')}
                className="touch-target px-5 py-2.5 bg-[#E8F5EE] hover:bg-[#D5EEDB] text-[#0E4D32] border border-[#CBE5D7] font-semibold text-sm rounded-[8px] transition-colors flex items-center gap-2 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-[#176B45]" />
                <span>View civic score</span>
              </button>

              <button
                onClick={() => onNavigateTab('map')}
                className="touch-target px-5 py-2.5 bg-[#F7F9F7] hover:bg-slate-100 border border-[#E2E8E4] text-[#17201B] font-semibold text-sm rounded-[8px] transition-colors flex items-center gap-2 cursor-pointer"
              >
                <MapPin className="w-4 h-4 text-[#176B45]" />
                <span>Community map</span>
              </button>
            </div>

            <div className="pt-1 flex items-center gap-2 text-xs text-[#8B9690]">
              <ShieldCheck className="w-4 h-4 text-[#176B45] shrink-0" />
              <span>Location coordinates and photo evidence included with each report.</span>
            </div>
          </div>

          {/* Product Preview Card */}
          <div className="lg:col-span-5 bg-[#F7F9F7] rounded-[12px] border border-[#E2E8E4] p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#E2E8E4] text-xs">
              <span className="font-semibold text-[#17201B]">Recent reports in area</span>
              <button
                onClick={() => onNavigateTab('map')}
                className="text-[#176B45] font-medium hover:text-[#0E4D32] flex items-center gap-1 cursor-pointer"
              >
                View all <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-2">
              {reports.slice(0, 3).map((r) => {
                const cat = getCategoryInfo(r.category);
                return (
                  <div
                    key={r.id}
                    onClick={() => onSelectReport(r)}
                    className="p-3 rounded-[8px] bg-white border border-[#E2E8E4] hover:border-slate-300 cursor-pointer transition-colors space-y-1"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-bold text-[#17201B]">{r.id}</span>
                      <span
                        className={`px-2 py-0.5 rounded-[4px] text-[10px] font-semibold uppercase ${
                          r.status === 'RESOLVED'
                            ? 'bg-[#E8F5EE] text-[#0E4D32]'
                            : 'bg-amber-50 text-amber-800'
                        }`}
                      >
                        {r.status.replace(/_/g, ' ').toLowerCase()}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-[#17201B] truncate">{cat.label}</p>
                    <p className="text-[11px] text-[#657169] truncate flex items-center gap-1">
                      <MapPin className="w-3 h-3 shrink-0 text-[#8B9690]" />
                      <span>{r.location.approximateLocation || r.location.formattedAddress}</span>
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* 2. REAL METRICS HIERARCHY — Restrained, Factual Context */}
      <section className="bg-white rounded-[14px] border border-[#E2E8E4] p-6 sm:p-8 space-y-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-[#17201B]">
            Activity summary
          </h2>
          <p className="text-xs text-[#657169]">
            Current operational counts across municipal wards
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-1">
          <div className="p-4 rounded-[10px] bg-[#F7F9F7] border border-[#E2E8E4]">
            <span className="text-xs font-medium text-[#657169] block">Total reports</span>
            <p className="text-2xl sm:text-3xl font-bold text-[#17201B] mt-1">{analytics.totalReports}</p>
            <span className="text-[11px] text-[#657169] block mt-0.5">Recorded in database</span>
          </div>

          <div className="p-4 rounded-[10px] bg-[#F7F9F7] border border-[#E2E8E4]">
            <span className="text-xs font-medium text-[#657169] block">Resolved</span>
            <p className="text-2xl sm:text-3xl font-bold text-[#176B45] mt-1">{analytics.resolvedReports}</p>
            <span className="text-[11px] text-[#657169] block mt-0.5">Verified with photo</span>
          </div>

          <div className="p-4 rounded-[10px] bg-[#F7F9F7] border border-[#E2E8E4]">
            <span className="text-xs font-medium text-[#657169] block">Average response time</span>
            <p className="text-2xl sm:text-3xl font-bold text-[#17201B] mt-1">{analytics.averageResolutionHours}h</p>
            <span className="text-[11px] text-[#657169] block mt-0.5">{analytics.slaComplianceRate}% within target</span>
          </div>

          <div className="p-4 rounded-[10px] bg-[#F7F9F7] border border-[#E2E8E4]">
            <span className="text-xs font-medium text-[#657169] block">Active hotspots</span>
            <p className="text-2xl sm:text-3xl font-bold text-[#D64545] mt-1">{analytics.hotspotsCount}</p>
            <span className="text-[11px] text-[#657169] block mt-0.5">Locations under review</span>
          </div>
        </div>
      </section>

      {/* 3. HOW IT WORKS — Conventional 5-step operational flow */}
      <section id="how-it-works" className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-[#17201B]">
            How it works
          </h2>
          <p className="text-xs sm:text-sm text-[#657169]">
            From citizen report to field cleanup and closure
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="p-4 rounded-[12px] bg-white border border-[#E2E8E4] space-y-1.5">
            <span className="font-mono text-lg font-bold text-[#176B45]">01</span>
            <h3 className="font-semibold text-sm text-[#17201B]">Spot</h3>
            <p className="text-xs text-[#657169] leading-relaxed">
              Notice overflowing bins, roadside trash, plastic debris, or blocked drains.
            </p>
          </div>

          <div className="p-4 rounded-[12px] bg-white border border-[#E2E8E4] space-y-1.5">
            <span className="font-mono text-lg font-bold text-[#176B45]">02</span>
            <h3 className="font-semibold text-sm text-[#17201B]">Report</h3>
            <p className="text-xs text-[#657169] leading-relaxed">
              Take a photo, mark the location on the map, and submit the report.
            </p>
          </div>

          <div className="p-4 rounded-[12px] bg-white border border-[#E2E8E4] space-y-1.5">
            <span className="font-mono text-lg font-bold text-[#176B45]">03</span>
            <h3 className="font-semibold text-sm text-[#17201B]">Triage</h3>
            <p className="text-xs text-[#657169] leading-relaxed">
              Supervisors review the report, check for duplicates, and set priority.
            </p>
          </div>

          <div className="p-4 rounded-[12px] bg-white border border-[#E2E8E4] space-y-1.5">
            <span className="font-mono text-lg font-bold text-[#176B45]">04</span>
            <h3 className="font-semibold text-sm text-[#17201B]">Clean</h3>
            <p className="text-xs text-[#657169] leading-relaxed">
              Sanitation crews clear the site and take a completion photo.
            </p>
          </div>

          <div className="p-4 rounded-[12px] bg-white border border-[#E2E8E4] space-y-1.5">
            <span className="font-mono text-lg font-bold text-[#176B45]">05</span>
            <h3 className="font-semibold text-sm text-[#17201B]">Resolve</h3>
            <p className="text-xs text-[#657169] leading-relaxed">
              Citizens inspect the photo evidence and confirm the location is clean.
            </p>
          </div>
        </div>
      </section>

      {/* 4. RECENT REPORTS & COMMUNITY CONFIRMATION */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-bold text-[#17201B]">
              Community reports
            </h2>
            <p className="text-xs text-[#657169]">
              Confirm whether reported waste is still present to help dispatch crews
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('map')}
            className="text-xs font-semibold text-[#176B45] hover:text-[#0E4D32] flex items-center gap-1 cursor-pointer self-start sm:self-auto"
          >
            Explore waste map <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Feedback alert banner */}
        {votedFeedbackId && (
          <div className="p-3 bg-[#E8F5EE] border border-[#3FA66B] rounded-[8px] text-xs text-[#0E4D32] flex items-center gap-2">
            <Check className="w-4 h-4 text-[#176B45]" />
            <span>Thank you. Your confirmation helps prioritize cleanup.</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {reports.slice(0, 3).map((r) => {
            const cat = getCategoryInfo(r.category);
            const votes = r.communityVotes || { stillThere: 0, cleaned: 0, worsened: 0 };

            return (
              <div
                key={r.id}
                className="bg-white rounded-[12px] border border-[#E2E8E4] overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <div className="aspect-video w-full bg-[#F7F9F7] relative">
                    <img
                      src={r.imageUrls[0]}
                      alt={cat.label}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2.5 left-2.5">
                      <span
                        className={`px-2 py-0.5 rounded-[4px] text-[10px] font-bold uppercase ${
                          r.severity === 'critical'
                            ? 'bg-[#D64545] text-white'
                            : r.severity === 'high'
                            ? 'bg-[#E7A52B] text-slate-900'
                            : 'bg-[#176B45] text-white'
                        }`}
                      >
                        {r.severity}
                      </span>
                    </div>
                    <div className="absolute top-2.5 right-2.5">
                      <span className="px-2 py-0.5 rounded-[4px] text-[10px] font-medium bg-[#17201B]/80 text-white">
                        {r.status.replace(/_/g, ' ').toLowerCase()}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-bold text-[#17201B]">{r.id}</span>
                      <span className="text-[11px] text-[#8B9690]">
                        {new Date(r.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 className="font-semibold text-sm text-[#17201B]">{cat.label}</h3>
                    <p className="text-xs text-[#657169] line-clamp-2">{r.description}</p>
                    <p className="text-[11px] text-[#657169] flex items-center gap-1">
                      <MapPin className="w-3 h-3 shrink-0 text-[#8B9690]" />
                      <span className="truncate">{r.location.approximateLocation || r.location.formattedAddress}</span>
                    </p>
                  </div>
                </div>

                {/* Community confirmation buttons */}
                <div className="p-3 border-t border-[#E2E8E4] bg-[#F7F9F7] space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-[#17201B]">
                    <span className="font-medium">Is this waste still present?</span>
                    {(votes.stillThere > 0 || votes.worsened > 0) && (
                      <span className="text-[#176B45] flex items-center gap-1 font-medium">
                        <Users className="w-3 h-3" />
                        {votes.stillThere + votes.worsened} confirmations
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleVoteWithFeedback(r.id, 'still_there')}
                      className={`flex-1 py-1.5 px-2 rounded-[6px] text-xs font-medium transition-colors flex items-center justify-center gap-1 cursor-pointer ${
                        votes.userVoted === 'still_there'
                          ? 'bg-[#176B45] text-white'
                          : 'bg-white border border-[#E2E8E4] text-[#17201B] hover:bg-slate-50'
                      }`}
                    >
                      <span>Still there ({votes.stillThere})</span>
                    </button>
                    <button
                      onClick={() => handleVoteWithFeedback(r.id, 'cleaned')}
                      className={`flex-1 py-1.5 px-2 rounded-[6px] text-xs font-medium transition-colors flex items-center justify-center gap-1 cursor-pointer ${
                        votes.userVoted === 'cleaned'
                          ? 'bg-[#176B45] text-white'
                          : 'bg-white border border-[#E2E8E4] text-[#17201B] hover:bg-slate-50'
                      }`}
                    >
                      <span>Cleaned ({votes.cleaned})</span>
                    </button>
                    <button
                      onClick={() => handleVoteWithFeedback(r.id, 'worsened')}
                      className={`py-1.5 px-2 rounded-[6px] text-xs font-medium transition-colors flex items-center justify-center gap-1 cursor-pointer ${
                        votes.userVoted === 'worsened'
                          ? 'bg-[#D64545] text-white'
                          : 'bg-white border border-[#E2E8E4] text-[#D64545] hover:bg-red-50'
                      }`}
                      title="Situation has worsened"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Worse</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. FREQUENTLY ASKED QUESTIONS */}
      <section className="bg-white rounded-[14px] border border-[#E2E8E4] p-6 sm:p-8 space-y-4">
        <div>
          <h2 className="text-xl font-bold text-[#17201B]">Frequently asked questions</h2>
          <p className="text-xs text-[#657169]">
            Common questions regarding reporting, privacy, and cleanup
          </p>
        </div>

        <div className="divide-y divide-[#E2E8E4]">
          {faqs.map((faq, idx) => (
            <div key={idx} className="py-3.5">
              <button
                onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                className="w-full flex items-center justify-between text-left font-medium text-sm sm:text-base text-[#17201B] hover:text-[#176B45] cursor-pointer"
              >
                <span>{faq.q}</span>
                {openFaqIndex === idx ? (
                  <ChevronUp className="w-4 h-4 text-[#176B45] shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-[#8B9690] shrink-0" />
                )}
              </button>
              {openFaqIndex === idx && (
                <p className="pt-2 text-xs sm:text-sm text-[#657169] leading-relaxed">
                  {faq.a}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 6. CALL TO ACTION — Restrained */}
      <section className="rounded-[12px] bg-[#176B45] p-6 sm:p-8 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center sm:text-left">
          <h2 className="text-xl font-bold tracking-tight">
            Report waste in your neighborhood
          </h2>
          <p className="text-xs sm:text-sm text-[#E8F5EE]/90">
            Submit a photo and location to notify municipal cleanup teams.
          </p>
        </div>
        <button
          onClick={() => onNavigateTab('report')}
          className="touch-target px-5 py-2.5 bg-white hover:bg-slate-50 text-[#0E4D32] font-semibold text-sm rounded-[8px] transition-colors flex items-center gap-2 cursor-pointer shrink-0"
        >
          <Camera className="w-4 h-4 text-[#176B45]" />
          <span>Report waste</span>
        </button>
      </section>
    </div>
  );
};
