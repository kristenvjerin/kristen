import React from 'react';
import { AnalyticsSummary, WasteReport } from '../types';
import { getCategoryInfo } from '../utils/categories';
import {
  Camera,
  MapPin,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  Clock,
  ThumbsUp,
  AlertTriangle,
  Flame,
  Check,
  Award,
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
  return (
    <div className="space-y-16 pb-12">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-emerald-950 via-slate-900 to-slate-950 p-6 sm:p-12 text-white shadow-xl border border-emerald-900/30">
        <div className="relative z-10 max-w-3xl space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>AI-Assisted Civic Waste Reporting Platform</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            See Waste. <br />
            Report It. <br />
            <span className="text-emerald-400">Get It Cleaned.</span>
          </h1>

          <p className="text-sm sm:text-base text-emerald-100/80 max-w-xl leading-relaxed">
            Help make your neighborhood cleaner by reporting overflowing bins, illegal dumping, and public waste in seconds. AI categorizes the hazard, and authorities track it to verified resolution.
          </p>

          {/* Action CTAs */}
          <div className="pt-2 flex flex-wrap items-center gap-3 sm:gap-4">
            <button
              onClick={() => onNavigateTab('report')}
              className="px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm rounded-2xl shadow-lg shadow-emerald-500/25 transition-all flex items-center gap-2 cursor-pointer hover:scale-102"
            >
              <Camera className="w-5 h-5 text-slate-950" />
              <span>Report Waste (Under 30s)</span>
            </button>

            <button
              onClick={() => onNavigateTab('map')}
              className="px-5 py-3.5 bg-white/10 hover:bg-white/15 border border-white/20 text-white font-bold text-sm rounded-2xl transition-all flex items-center gap-2 cursor-pointer hover:scale-102"
            >
              <MapPin className="w-4 h-4 text-emerald-300" />
              <span>Explore Waste Map</span>
            </button>
          </div>

          {/* Trust Statement */}
          <div className="pt-4 flex items-center gap-2 text-xs text-emerald-200/70 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Every report includes GPS location, photo evidence, and anti-false closure verification.</span>
          </div>
        </div>

        {/* Ambient Map Silhouette / Visual card */}
        <div className="hidden lg:block absolute right-8 top-12 bottom-12 w-96 rounded-2xl bg-white/5 border border-white/10 p-5 backdrop-blur-md shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
            <span className="text-xs font-bold text-emerald-300">Live Incident Stream</span>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-mono">
              GPS Verified
            </span>
          </div>

          <div className="space-y-3">
            {reports.slice(0, 3).map((r) => {
              const catInfo = getCategoryInfo(r.category);
              return (
                <div
                  key={r.id}
                  onClick={() => onSelectReport(r)}
                  className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 cursor-pointer transition-all space-y-1.5"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-white">{r.id}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                        r.status === 'RESOLVED'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}
                    >
                      {r.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-emerald-100 truncate">{catInfo.label}</p>
                  <p className="text-[10px] text-slate-400 truncate">📍 {r.location.formattedAddress}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* VALUE PROPOSITION (3 Feature Cards) */}
      <section className="space-y-4">
        <div className="text-center max-w-xl mx-auto space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Why CleanSpot Works
          </span>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Designed for Citizens. Built for Municipal Action.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-3">
          <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <Camera className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-slate-900 text-base">Report in Seconds</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Upload a photograph and pinpoint the location on an interactive map. Gemini Multimodal AI classifies the waste and estimates severity automatically.
            </p>
          </div>

          <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs hover:border-teal-300 hover:shadow-md transition-all space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
              <MapPin className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-slate-900 text-base">Map the Problem</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Explore public waste reports across your city. Nearby citizens can confirm if the garbage is still there, preventing duplicate work and verifying urgency.
            </p>
          </div>

          <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs hover:border-blue-300 hover:shadow-md transition-all space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-slate-900 text-base">Track the Solution</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Follow your report from assignment to resolution. Review side-by-side Before/After evidence photos uploaded by cleanup crews before marking it closed.
            </p>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section className="bg-slate-900 text-white rounded-3xl p-6 sm:p-10 space-y-8 shadow-lg">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-800">
            Lifecycle Workflow
          </span>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">How CleanSpot Works</h2>
          <p className="text-xs text-slate-400">
            A transparent closed-loop from citizen discovery to verified municipal remediation
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
            <span className="font-mono text-2xl font-black text-emerald-400">01</span>
            <h4 className="font-bold text-sm text-white">Spot</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Encounter overflowing bins, illegal fly-tipping, or chokes.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
            <span className="font-mono text-2xl font-black text-emerald-400">02</span>
            <h4 className="font-bold text-sm text-white">Report</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Upload photo, let AI classify hazard, confirm pin in under 30s.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
            <span className="font-mono text-2xl font-black text-emerald-400">03</span>
            <h4 className="font-bold text-sm text-white">Verify</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Authorities review report, group duplicates, and assign SLA priority.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
            <span className="font-mono text-2xl font-black text-emerald-400">04</span>
            <h4 className="font-bold text-sm text-white">Clean</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Sanitation teams clear the site and upload proof photos.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
            <span className="font-mono text-2xl font-black text-emerald-400">05</span>
            <h4 className="font-bold text-sm text-white">Resolve</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Citizens audit Before/After photos to guarantee true closure.
            </p>
          </div>
        </div>
      </section>

      {/* DYNAMIC IMPACT SECTION */}
      <section className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Civic Impact Snapshot
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                Live Data
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Real-time operational statistics powered by citizen reports and municipal response
            </p>
          </div>

          <button
            onClick={() => onNavigateTab('track')}
            className="text-xs text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1 cursor-pointer"
          >
            Track Existing Report <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100">
            <span className="text-xs font-semibold text-emerald-800">Total Reports</span>
            <p className="text-3xl font-black text-slate-900 mt-1">{analytics.totalReports}</p>
            <span className="text-[11px] text-emerald-700 font-medium">Logged & geocoded</span>
          </div>

          <div className="p-4 rounded-2xl bg-teal-50/60 border border-teal-100">
            <span className="text-xs font-semibold text-teal-800">Issues Resolved</span>
            <p className="text-3xl font-black text-emerald-600 mt-1">{analytics.resolvedReports}</p>
            <span className="text-[11px] text-teal-700 font-medium">Verified clean</span>
          </div>

          <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100">
            <span className="text-xs font-semibold text-purple-800">Active Hotspots</span>
            <p className="text-3xl font-black text-purple-600 mt-1">{analytics.hotspotsCount}</p>
            <span className="text-[11px] text-purple-700 font-medium">Under preventive care</span>
          </div>

          <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100">
            <span className="text-xs font-semibold text-blue-800">Avg Resolution Time</span>
            <p className="text-3xl font-black text-slate-900 mt-1">{analytics.averageResolutionHours}h</p>
            <span className="text-[11px] text-blue-700 font-medium">92% within SLA target</span>
          </div>
        </div>
      </section>

      {/* RECENT COMMUNITY INCIDENTS WITH CONFIRMATION BUTTONS */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-slate-900 text-lg">Active Reports in Your Community</h3>
            <p className="text-xs text-slate-500">
              Confirm whether the garbage is still present to help authorities prioritize cleanup
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('map')}
            className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer"
          >
            View Full Map <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {reports.slice(0, 3).map((r) => {
            const catInfo = getCategoryInfo(r.category);
            const votes = r.communityVotes || { stillThere: 0, cleaned: 0, worsened: 0 };

            return (
              <div
                key={r.id}
                className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs hover:border-emerald-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="aspect-video w-full bg-slate-100 relative">
                    <img
                      src={r.imageUrls[0]}
                      alt={catInfo.label}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 left-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          r.severity === 'critical'
                            ? 'bg-red-600 text-white'
                            : r.severity === 'high'
                            ? 'bg-orange-500 text-white'
                            : 'bg-amber-500 text-white'
                        }`}
                      >
                        {r.severity}
                      </span>
                    </div>
                    <div className="absolute top-3 right-3">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-900/80 text-white backdrop-blur-xs">
                        {r.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-bold text-slate-900">{r.id}</span>
                      <span className="text-[11px] text-slate-400">
                        {new Date(r.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm">{catInfo.label}</h4>
                    <p className="text-xs text-slate-600 line-clamp-2">{r.description}</p>
                    <p className="text-[11px] text-slate-500">📍 {r.location.formattedAddress}</p>
                  </div>
                </div>

                {/* Community Confirmation Section */}
                <div className="p-4 pt-2 border-t border-slate-100 bg-slate-50/50 space-y-2">
                  <span className="text-[11px] font-bold text-slate-700 block">
                    Is this waste still here?
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onCommunityVote(r.id, 'still_there')}
                      className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                        votes.userVoted === 'still_there'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>Still There ({votes.stillThere})</span>
                    </button>
                    <button
                      onClick={() => onCommunityVote(r.id, 'cleaned')}
                      className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                        votes.userVoted === 'cleaned'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Cleaned ({votes.cleaned})</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
