import React, { useState } from 'react';
import {
  AIAnalysisResult,
  SeverityLevel,
  WasteCategory,
  WasteReport,
  WasteVolume,
} from '../types';
import { UserProfile } from '../types/gamification';
import { WASTE_CATEGORIES, getCategoryInfo } from '../utils/categories';
import { SAMPLE_PRESET_IMAGES, RESOLUTION_CLEAN_IMAGE } from '../utils/seedData';
import { ApiService } from '../services/api';
import { InteractiveMap } from './InteractiveMap';
import { GamificationDashboard } from './GamificationDashboard';
import { LeaderboardView } from './LeaderboardView';
import { PointRewardModal } from './PointRewardModal';
import {
  Camera,
  Upload,
  Sparkles,
  MapPin,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCcw,
  Check,
  X,
  Eye,
  ShieldCheck,
  Award,
  ChevronRight,
  Loader2,
  Info,
  ThumbsUp,
  Navigation,
  Copy,
  SlidersHorizontal,
  ArrowRight,
  List,
  Map as MapIcon,
  Trash2,
  Flame,
  Trophy,
  User,
  ShieldAlert,
  HelpCircle,
  TrendingUp,
} from 'lucide-react';

interface CitizenViewProps {
  reports: WasteReport[];
  onReportCreated: (newReport: WasteReport) => void;
  onRefresh: () => void;
  activeCitizenId?: string;
  activeCitizenName?: string;
  initialTab?: 'report' | 'profile' | 'nearby' | 'leaderboard' | 'my-reports';
}

export const CitizenView: React.FC<CitizenViewProps> = ({
  reports,
  onReportCreated,
  onRefresh,
  activeCitizenId = 'citizen-01',
  activeCitizenName = 'Kristen',
  initialTab = 'report',
}) => {
  const [activeTab, setActiveTab] = useState<'report' | 'profile' | 'nearby' | 'leaderboard' | 'my-reports'>(initialTab);
  const [userProfile, setUserProfile] = useState<UserProfile>(ApiService.getUserProfile());

  // 6-STEP REPORTING MISSION FLOW
  // Step 1: Mission Starter "Report Waste"
  // Step 2: "Capture the problem" (Photo)
  // Step 3: "Where did you find it?" (Location + Anti-spam proximity check)
  // Step 4: "Select Category" (Category)
  // Step 5: "Select Severity" (Severity)
  // Step 6: "Review & Submit" (Review with Points Estimate)
  const [reportStep, setReportStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [aiResult, setAiResult] = useState<AIAnalysisResult | null>(null);
  const [aiConfirmed, setAiConfirmed] = useState<boolean>(true);

  // Form fields
  const [category, setCategory] = useState<WasteCategory>('overflowing_bin');
  const [severity, setSeverity] = useState<SeverityLevel>('high');
  const [volume, setVolume] = useState<WasteVolume>('large');
  const [description, setDescription] = useState<string>('');
  const [landmark, setLandmark] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Anti-spam warning state
  const [antiSpamWarning, setAntiSpamWarning] = useState<string | null>(null);

  // Location state
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
    formattedAddress: string;
    approximateLocation: string;
    zoneId: string;
  }>({
    latitude: 13.0827,
    longitude: 80.2707,
    formattedAddress: 'Gandhi Road Commercial Sector, Metro City',
    approximateLocation: 'Near Gandhi Road (Sector 1)',
    zoneId: 'zone-central',
  });
  const [locationPermissionDenied, setLocationPermissionDenied] = useState<boolean>(false);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [locationConfirmed, setLocationConfirmed] = useState<boolean>(false);

  // Point Reward Modal State
  const [pointRewardState, setPointRewardState] = useState<{
    isOpen: boolean;
    pointsAwarded: number;
    breakdown: { base: number; photo: number; location: number; hotspot: number };
    previousTotal: number;
    newTotal: number;
    levelUp: boolean;
  }>({
    isOpen: false,
    pointsAwarded: 85,
    breakdown: { base: 50, photo: 20, location: 15, hotspot: 0 },
    previousTotal: 1240,
    newTotal: 1325,
    levelUp: false,
  });

  // Success / Tracking & Inspection state
  const [submittedReport, setSubmittedReport] = useState<WasteReport | null>(null);
  const [copiedId, setCopiedId] = useState<boolean>(false);
  const [inspectReport, setInspectReport] = useState<WasteReport | null>(null);
  const [reopenModalReport, setReopenModalReport] = useState<WasteReport | null>(null);
  const [reopenReason, setReopenReason] = useState<string>('');

  // Before/After comparison slider state (0 to 100%)
  const [compareSliderPos, setCompareSliderPos] = useState<number>(50);

  // Waste Map View toggles
  const [mapDisplayMode, setMapDisplayMode] = useState<'map' | 'list'>('map');
  const [mapSearch, setMapSearch] = useState<string>('');
  const [mapCategoryFilter, setMapCategoryFilter] = useState<string>('ALL');
  const [mapSeverityFilter, setMapSeverityFilter] = useState<string>('ALL');
  const [unresolvedOnly, setUnresolvedOnly] = useState<boolean>(false);

  // My Reports tab
  const [myReportsSubTab, setMyReportsSubTab] = useState<'all' | 'active' | 'resolved'>('all');

  const refreshProfile = () => {
    setUserProfile(ApiService.getUserProfile());
  };

  // Image Upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const b64 = reader.result as string;
      setSelectedImage(b64);
      setReportStep(3); // proceed to location
      runAiAnalysis(b64);
    };
    reader.readAsDataURL(file);
  };

  const handleSelectPreset = (url: string, presetCat?: WasteCategory | string) => {
    setSelectedImage(url);
    if (presetCat) setCategory(presetCat as WasteCategory);
    setReportStep(3); // proceed to location
    runAiAnalysis(url);
  };

  // Run AI analysis
  const runAiAnalysis = async (imgSource: string) => {
    setIsAnalyzing(true);
    try {
      const res = await ApiService.analyzeImageAI(imgSource);
      setAiResult(res);
      if (res.primaryCategory) setCategory(res.primaryCategory);
      if (res.severity) setSeverity(res.severity);
      if (res.estimatedVolume) setVolume(res.estimatedVolume);
    } catch {
      // Graceful fallback
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Browser Geolocation
  const handleGetLocation = () => {
    setIsLocating(true);
    setLocationPermissionDenied(false);

    if (!navigator.geolocation) {
      setLocationPermissionDenied(true);
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lng = Number(pos.coords.longitude.toFixed(6));
        setLocation((prev) => ({
          ...prev,
          latitude: lat,
          longitude: lng,
          formattedAddress: `Sector 4, Near Coordinate (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
          approximateLocation: `Zone Central (${lat.toFixed(2)}, ${lng.toFixed(2)})`,
        }));
        setLocationConfirmed(true);
        setIsLocating(false);

        // Run anti-spam proximity check
        const antiSpam = ApiService.checkAntiSpam(lat, lng, category);
        if (antiSpam.isDuplicate) {
          setAntiSpamWarning(antiSpam.reason || 'Similar report detected nearby. Merged with ongoing ticket.');
        } else if (antiSpam.dailyLimitReached) {
          setAntiSpamWarning(antiSpam.reason || 'Daily reporting limit of 5 reached.');
        } else {
          setAntiSpamWarning(null);
        }
      },
      () => {
        setLocationPermissionDenied(true);
        setIsLocating(false);
      },
      { timeout: 8000 }
    );
  };

  // Submit Report
  const handleSubmitReport = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      // 1. Anti-spam check
      const antiSpam = ApiService.checkAntiSpam(location.latitude, location.longitude, category);

      const newReport = ApiService.createReport({
        citizenId: activeCitizenId,
        citizenName: userProfile.name,
        citizenEmail: userProfile.email,
        imageUrls: [selectedImage || SAMPLE_PRESET_IMAGES[0].url],
        category,
        userCategory: category,
        severity,
        estimatedVolume: volume,
        aiConfidence: aiResult?.confidence || 0.91,
        aiAnalysis: aiResult || undefined,
        description: description || 'Waste accumulated along public pedestrian way.',
        landmark,
        location: {
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: 10,
          formattedAddress: location.formattedAddress,
          approximateLocation: location.approximateLocation,
          zoneId: location.zoneId,
        },
      });

      if (antiSpam.isDuplicate && antiSpam.nearbyReportId) {
        // Linked duplicate: 0 additional points
        ApiService.linkDuplicate(newReport.id, antiSpam.nearbyReportId, 'Automated Duplicate Guard');
        setSubmittedReport(newReport);
        onReportCreated(newReport);
        setIsSubmitting(false);
        setReportStep(1);
        setSelectedImage('');
        setAiResult(null);
        setDescription('');
        setLandmark('');
        refreshProfile();
        return;
      }

      // 2. Award Civic Points & trigger rewarding animation
      const previousTotal = userProfile.civicPoints;
      const isHotspot = false; // standard incident
      const rewardResult = ApiService.recordReportSubmitted(isHotspot);

      setPointRewardState({
        isOpen: true,
        pointsAwarded: rewardResult.pointsAwarded,
        breakdown: rewardResult.breakdown,
        previousTotal,
        newTotal: rewardResult.profile.civicPoints,
        levelUp: rewardResult.levelUp,
      });

      setSubmittedReport(newReport);
      onReportCreated(newReport);
      setIsSubmitting(false);
      setReportStep(1);
      setSelectedImage('');
      setAiResult(null);
      setDescription('');
      setLandmark('');
      refreshProfile();
    }, 600);
  };

  // Copy Report ID
  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  // Community confirmation vote (Awards +15 points!)
  const handleVote = (reportId: string, vote: 'still_there' | 'cleaned' | 'worsened') => {
    ApiService.voteCommunity(reportId, vote, activeCitizenId);
    onRefresh();
    refreshProfile();
    if (inspectReport && inspectReport.id === reportId) {
      setInspectReport(ApiService.getReportById(reportId) || null);
    }
  };

  // Citizen verification
  const handleCitizenVerify = (reportId: string, decision: 'YES' | 'NO') => {
    if (decision === 'YES') {
      ApiService.citizenVerifyReport(
        reportId,
        activeCitizenId,
        userProfile.name,
        'YES',
        'Verified clean by resident. Thank you!'
      );
      onRefresh();
      refreshProfile();
      setInspectReport(null);
    } else {
      const target = reports.find((r) => r.id === reportId);
      if (target) setReopenModalReport(target);
    }
  };

  const handleConfirmReopen = () => {
    if (!reopenModalReport) return;
    ApiService.citizenVerifyReport(
      reopenModalReport.id,
      activeCitizenId,
      userProfile.name,
      'NO',
      reopenReason || 'Debris was not completely removed upon resident inspection.'
    );
    setReopenModalReport(null);
    setInspectReport(null);
    setReopenReason('');
    onRefresh();
    refreshProfile();
  };

  // Filtered reports for Waste Map
  const filteredMapReports = reports.filter((r) => {
    if (unresolvedOnly && (r.status === 'RESOLVED' || r.status === 'REJECTED')) return false;
    if (mapCategoryFilter !== 'ALL' && r.category !== mapCategoryFilter) return false;
    if (mapSeverityFilter !== 'ALL' && r.severity !== mapSeverityFilter) return false;
    if (mapSearch.trim()) {
      const q = mapSearch.toLowerCase();
      const match =
        r.id.toLowerCase().includes(q) ||
        r.location.formattedAddress.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  // Personal reports
  const myReports = reports.filter((r) => r.citizenId === activeCitizenId || r.citizenName === userProfile.name);
  const filteredMyReports = myReports.filter((r) => {
    if (myReportsSubTab === 'active') return r.status !== 'RESOLVED' && r.status !== 'REJECTED';
    if (myReportsSubTab === 'resolved') return r.status === 'RESOLVED';
    return true;
  });

  // Calculate local area summary metrics for the map gamification layer
  const nearbyCount = reports.length;
  const resolvedThisWeek = reports.filter((r) => r.status === 'RESOLVED').length;
  const recurringHotspotsCount = 3;

  return (
    <div className="space-y-6">
      {/* SUB-NAVIGATION TABS (Gamified Citizen Platform) */}
      <div className="flex items-center justify-between border-b border-[#E2E8E4] pb-3 flex-wrap gap-2">
        <div className="flex flex-wrap gap-2">
          {/* Tab 1: Report Waste */}
          <button
            onClick={() => {
              setActiveTab('report');
              setReportStep(1);
            }}
            className={`touch-target px-3.5 py-2 rounded-[10px] text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'report'
                ? 'bg-[#176B45] text-white shadow-xs'
                : 'text-[#657169] hover:bg-slate-100 hover:text-[#17201B]'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Report Waste</span>
          </button>

          {/* Tab 2: Civic Profile & Impact */}
          <button
            onClick={() => setActiveTab('profile')}
            className={`touch-target px-3.5 py-2 rounded-[10px] text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'profile'
                ? 'bg-[#176B45] text-white shadow-xs'
                : 'text-[#657169] hover:bg-slate-100 hover:text-[#17201B]'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Civic Profile & Impact</span>
          </button>

          {/* Tab 3: Community Map */}
          <button
            onClick={() => setActiveTab('nearby')}
            className={`touch-target px-3.5 py-2 rounded-[10px] text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'nearby'
                ? 'bg-[#176B45] text-white shadow-xs'
                : 'text-[#657169] hover:bg-slate-100 hover:text-[#17201B]'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>Community Map ({reports.length})</span>
          </button>

          {/* Tab 4: Community Leaders */}
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`touch-target px-3.5 py-2 rounded-[10px] text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'leaderboard'
                ? 'bg-[#176B45] text-white shadow-xs'
                : 'text-[#657169] hover:bg-slate-100 hover:text-[#17201B]'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>Community Leaders</span>
          </button>

          {/* Tab 5: Track Reports */}
          <button
            onClick={() => setActiveTab('my-reports')}
            className={`touch-target px-3.5 py-2 rounded-[10px] text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'my-reports'
                ? 'bg-[#176B45] text-white shadow-xs'
                : 'text-[#657169] hover:bg-slate-100 hover:text-[#17201B]'
            }`}
          >
            <span>My Reports ({myReports.length})</span>
          </button>
        </div>

        {/* Quick User Level & Points Status in Subnav */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('profile')}
            className="flex items-center gap-2 bg-[#E8F5EE] border border-[#3FA66B]/30 px-3 py-1.5 rounded-full text-xs font-semibold text-[#176B45] hover:bg-[#D5EEDB] transition-colors cursor-pointer"
          >
            <Award className="w-3.5 h-3.5 text-[#3FA66B]" />
            <span>
              Level {userProfile.level} • {userProfile.civicPoints.toLocaleString()} pts
            </span>
          </button>
        </div>
      </div>

      {/* REWARD CELEBRATION MODAL */}
      <PointRewardModal
        isOpen={pointRewardState.isOpen}
        onClose={() => setPointRewardState((prev) => ({ ...prev, isOpen: false }))}
        pointsAwarded={pointRewardState.pointsAwarded}
        breakdown={pointRewardState.breakdown}
        previousTotal={pointRewardState.previousTotal}
        newTotal={pointRewardState.newTotal}
        levelUp={pointRewardState.levelUp}
      />

      {/* TAB 1: 6-STEP REPORTING MISSION WIZARD */}
      {activeTab === 'report' && !submittedReport && (
        <div className="max-w-2xl mx-auto bg-white rounded-[20px] border border-[#E2E8E4] p-6 sm:p-8 shadow-xs space-y-6">
          {/* Header & Mission Step Progress */}
          <div className="space-y-3 border-b border-[#E2E8E4] pb-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-bold text-lg text-[#17201B] tracking-tight">Report Waste</h2>
                <p className="text-xs text-[#657169]">
                  "You earn points when your contribution helps identify or resolve a real waste problem."
                </p>
              </div>
              <span className="text-xs font-semibold text-[#176B45] bg-[#E8F5EE] px-2.5 py-1 rounded-full border border-[#CBE5D7]">
                Step {reportStep} of 6
              </span>
            </div>

            {/* Compact 6-step indicators */}
            <div className="grid grid-cols-6 gap-1 text-[11px] font-medium text-[#657169]">
              {[
                { step: 1, label: '1. Mission' },
                { step: 2, label: '2. Photo' },
                { step: 3, label: '3. Location' },
                { step: 4, label: '4. Category' },
                { step: 5, label: '5. Severity' },
                { step: 6, label: '6. Review' },
              ].map((s) => (
                <div
                  key={s.step}
                  onClick={() => {
                    if (s.step === 1 || (selectedImage && s.step <= reportStep)) {
                      setReportStep(s.step as any);
                    }
                  }}
                  className={`py-1 text-center rounded-[6px] border transition-all truncate px-1 ${
                    reportStep === s.step
                      ? 'border-[#176B45] bg-[#E8F5EE] text-[#0E4D32] font-semibold'
                      : reportStep > s.step
                      ? 'bg-slate-100 border-slate-200 text-[#17201B] cursor-pointer'
                      : 'border-transparent text-slate-400'
                  }`}
                >
                  {s.label}
                </div>
              ))}
            </div>
          </div>

          {/* STEP 1: MISSION STARTER */}
          {reportStep === 1 && (
            <div className="space-y-5 text-center py-4">
              <div className="w-16 h-16 rounded-full bg-[#E8F5EE] text-[#176B45] flex items-center justify-center mx-auto shadow-xs border border-[#CBE5D7]">
                <Camera className="w-8 h-8" />
              </div>

              <div className="space-y-1.5 max-w-md mx-auto">
                <h3 className="text-base font-bold text-[#17201B]">
                  Mission: Spot & Document Local Waste
                </h3>
                <p className="text-xs text-[#657169] leading-relaxed">
                  Help municipal teams dispatch crews faster by capturing clear photo evidence and an accurate location pin.
                </p>
              </div>

              {/* Point Earning Potential Box */}
              <div className="bg-[#F7F9F7] rounded-[12px] border border-[#E2E8E4] p-4 text-xs max-w-md mx-auto text-left space-y-2">
                <div className="font-semibold text-[#17201B] flex items-center justify-between">
                  <span>Earn up to +85 Civic Points:</span>
                  <span className="text-[#176B45] font-bold">+85 pts</span>
                </div>
                <div className="space-y-1 text-[#657169] text-[11px]">
                  <div className="flex items-center justify-between">
                    <span>• Valid waste report:</span>
                    <span className="font-medium text-[#17201B]">+50 pts</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>• Clear photo evidence:</span>
                    <span className="font-medium text-[#17201B]">+20 pts</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>• Accurate location pin:</span>
                    <span className="font-medium text-[#17201B]">+15 pts</span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-[#E2E8E4] text-[#0E4D32]">
                    <span>• Authority verification bonus:</span>
                    <span className="font-bold">+40 pts (when verified)</span>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setReportStep(2)}
                  className="py-3 px-8 bg-[#176B45] hover:bg-[#0E4D32] text-white font-semibold text-xs sm:text-sm rounded-[10px] shadow-xs cursor-pointer inline-flex items-center gap-2"
                >
                  <Camera className="w-4 h-4" />
                  <span>Start Report Mission →</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: UPLOAD/TAKE PHOTO ("Capture the problem") */}
          {reportStep === 2 && (
            <div className="space-y-5">
              <div className="space-y-1">
                <h3 className="font-semibold text-base text-[#17201B]">Capture the problem</h3>
                <p className="text-xs text-[#657169]">
                  Take a clear photo showing the waste accumulation and surrounding landmark.
                </p>
              </div>

              {/* Upload Dropzone */}
              <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-[#3FA66B]/50 hover:border-[#176B45] rounded-[16px] bg-[#F7F9F7] hover:bg-[#E8F5EE]/40 transition-all cursor-pointer text-center group">
                <div className="w-14 h-14 rounded-[12px] bg-[#E8F5EE] text-[#176B45] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <Camera className="w-7 h-7" />
                </div>
                <span className="text-sm font-semibold text-[#17201B]">
                  Take a Photo or upload an image
                </span>
                <span className="text-xs text-[#657169] mt-1">PNG, JPG, WEBP supported (up to 10MB)</span>
                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
              </label>

              {/* Sample presets for fast testing */}
              <div className="space-y-2 pt-2">
                <span className="text-xs font-semibold text-[#17201B] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#176B45]" />
                  Or test with sample citizen photos:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {SAMPLE_PRESET_IMAGES.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleSelectPreset(preset.url, preset.category)}
                      className="p-2 rounded-[12px] border border-[#E2E8E4] hover:border-[#176B45] bg-white text-left space-y-1.5 cursor-pointer transition-all hover:shadow-xs"
                    >
                      <div className="aspect-square w-full rounded-[8px] overflow-hidden bg-slate-100">
                        <img src={preset.url} alt={preset.title} className="w-full h-full object-cover" />
                      </div>
                      <p className="font-semibold text-[11px] text-[#17201B] truncate">{preset.title}</p>
                      <span className="text-[10px] text-[#176B45] font-semibold block">Click to test</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setReportStep(1)}
                  className="px-4 py-2 text-xs font-semibold text-[#657169] hover:text-[#17201B] cursor-pointer"
                >
                  ← Back to Mission
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: SELECT LOCATION ("Where did you find it?") */}
          {reportStep === 3 && (
            <div className="space-y-5">
              <div className="space-y-1">
                <h3 className="font-semibold text-base text-[#17201B]">Where did you find it?</h3>
                <p className="text-xs text-[#657169]">
                  Provide an accurate location to help dispatch crews locate the site quickly.
                </p>
              </div>

              {/* Anti-spam warning if detected */}
              {antiSpamWarning && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-[10px] text-xs text-amber-900 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-semibold">Proximity Notice</strong>
                    <span>{antiSpamWarning}</span>
                  </div>
                </div>
              )}

              {/* Location Actions */}
              <div className="flex flex-col sm:flex-row gap-2.5">
                <button
                  type="button"
                  onClick={handleGetLocation}
                  disabled={isLocating}
                  className="touch-target flex-1 py-2.5 px-4 bg-[#176B45] hover:bg-[#0E4D32] text-white font-medium text-xs sm:text-sm rounded-[8px] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <MapPin className="w-4 h-4" />
                  <span>{isLocating ? 'Locating...' : 'Use my current location'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setLocationConfirmed(true)}
                  className="touch-target py-2.5 px-4 bg-white hover:bg-slate-50 border border-[#E2E8E4] text-[#17201B] font-medium text-xs sm:text-sm rounded-[8px] cursor-pointer"
                >
                  Place pin manually
                </button>
              </div>

              {/* Permission Denied Friendly Fallback */}
              {locationPermissionDenied && (
                <div className="p-3 bg-[#E8F5EE] border border-[#3FA66B]/40 rounded-[10px] text-xs text-[#0E4D32] space-y-1">
                  <div className="flex items-center gap-2 font-semibold">
                    <Info className="w-4 h-4 text-[#176B45]" />
                    <span>Location access unavailable.</span>
                  </div>
                  <p>You can drag the pin on the map or type a landmark address below.</p>
                </div>
              )}

              {/* Interactive Map Pin */}
              <div className="space-y-2">
                <InteractiveMap
                  height="260px"
                  isPickerMode={true}
                  pickedPosition={[location.latitude, location.longitude]}
                  onPickPosition={(lat, lng) => {
                    setLocation((prev) => ({
                      ...prev,
                      latitude: Number(lat.toFixed(6)),
                      longitude: Number(lng.toFixed(6)),
                      formattedAddress: `Street at Coordinates ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
                      approximateLocation: `Sector (${lat.toFixed(2)}, ${lng.toFixed(2)})`,
                    }));
                    setLocationConfirmed(true);
                  }}
                />
                <span className="text-[11px] text-[#657169] block">
                  Tap anywhere on the map or drag the pin to pin the exact problem location.
                </span>
              </div>

              {/* Confirmed Address Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#17201B]">
                  Confirmed Street Address / Locality
                </label>
                <input
                  type="text"
                  value={location.formattedAddress}
                  onChange={(e) => setLocation((prev) => ({ ...prev, formattedAddress: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-[10px] border border-[#E2E8E4] text-xs font-medium focus:ring-2 focus:ring-[#176B45]"
                />
              </div>

              <div className="flex justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setReportStep(2)}
                  className="px-4 py-2 text-xs font-semibold text-[#657169] hover:text-[#17201B] cursor-pointer"
                >
                  ← Back to Photo
                </button>
                <button
                  type="button"
                  onClick={() => setReportStep(4)}
                  className="px-6 py-2.5 bg-[#176B45] hover:bg-[#0E4D32] text-white text-xs font-semibold rounded-[8px] shadow-xs cursor-pointer"
                >
                  Select Category →
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: SELECT CATEGORY */}
          {reportStep === 4 && (
            <div className="space-y-5">
              <div className="space-y-1">
                <h3 className="font-semibold text-base text-[#17201B]">Select Waste Category</h3>
                <p className="text-xs text-[#657169]">
                  Classify the type of waste to route to the proper sanitation equipment.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { id: 'overflowing_bin', label: 'Overflowing Bin', desc: 'Street bin full' },
                  { id: 'illegal_dumping', label: 'Illegal Dumping', desc: 'Fly-tipping lot' },
                  { id: 'plastic_waste', label: 'Plastic Waste', desc: 'Bottles / polymers' },
                  { id: 'construction_debris', label: 'Construction Waste', desc: 'Rubble / tiles' },
                  { id: 'e_waste', label: 'E-Waste', desc: 'Cables / appliances' },
                  { id: 'organic_waste', label: 'Organic Waste', desc: 'Food / market refuse' },
                  { id: 'roadside_garbage', label: 'Roadside Waste', desc: 'Litter on footpath' },
                  { id: 'other', label: 'Other', desc: 'Mixed general waste' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id as WasteCategory)}
                    className={`p-3 rounded-[10px] border text-left transition-all cursor-pointer ${
                      category === cat.id
                        ? 'bg-[#E8F5EE] border-[#176B45] ring-2 ring-[#176B45]/20 shadow-xs'
                        : 'border-[#E2E8E4] hover:border-slate-300 bg-white'
                    }`}
                  >
                    <strong className="text-xs text-[#17201B] block truncate">{cat.label}</strong>
                    <span className="text-[10px] text-[#657169] block mt-0.5">{cat.desc}</span>
                  </button>
                ))}
              </div>

              {/* Optional details & landmarks */}
              <div className="space-y-2 pt-2 border-t border-[#E2E8E4]">
                <label className="text-xs font-semibold text-[#17201B]">
                  Nearby Landmark or Note (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Opposite Bus Stop #12, near corner bakery"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  className="w-full px-3 py-2 rounded-[8px] border border-[#E2E8E4] text-xs"
                />
              </div>

              <div className="flex justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setReportStep(3)}
                  className="px-4 py-2 text-xs font-semibold text-[#657169] hover:text-[#17201B] cursor-pointer"
                >
                  ← Back to Location
                </button>
                <button
                  type="button"
                  onClick={() => setReportStep(5)}
                  className="px-6 py-2.5 bg-[#176B45] hover:bg-[#0E4D32] text-white text-xs font-semibold rounded-[8px] shadow-xs cursor-pointer"
                >
                  Select Severity →
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: SELECT SEVERITY */}
          {reportStep === 5 && (
            <div className="space-y-5">
              <div className="space-y-1">
                <h3 className="font-semibold text-base text-[#17201B]">Select Severity</h3>
                <p className="text-xs text-[#657169]">
                  Indicate the accumulation size and urgency of response needed.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { id: 'low', label: 'Low', dot: 'bg-emerald-600', title: 'Small amount', desc: 'Isolated litter or bag' },
                  { id: 'medium', label: 'Moderate', dot: 'bg-amber-500', title: 'Moderate pile', desc: 'Noticeable heap' },
                  { id: 'high', label: 'High', dot: 'bg-orange-500', title: 'Large accumulation', desc: 'Spilling / blocking path' },
                  { id: 'critical', label: 'Critical', dot: 'bg-red-600', title: 'Severe hazard', desc: 'Major health / drainage risk' },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSeverity(s.id as SeverityLevel)}
                    className={`p-3.5 rounded-[10px] border text-left transition-colors cursor-pointer ${
                      severity === s.id
                        ? 'bg-[#E8F5EE] border-[#176B45] ring-2 ring-[#176B45]/20 shadow-xs'
                        : 'border-[#E2E8E4] hover:border-slate-300 bg-white'
                    }`}
                  >
                    <span className="text-xs font-semibold text-[#17201B] flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${s.dot}`}></span>
                      {s.label}
                    </span>
                    <strong className="text-[11px] text-[#17201B] block mt-1.5">{s.title}</strong>
                    <span className="text-[10px] text-[#657169] block leading-tight mt-0.5">{s.desc}</span>
                  </button>
                ))}
              </div>

              {/* AI suggestion indicator if available */}
              {aiResult && (
                <div className="p-3 bg-[#F7F9F7] rounded-[8px] border border-[#E2E8E4] text-xs text-[#657169] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-[#176B45]" />
                    <span>AI Vision suggestion: {aiResult.primaryCategory} • {aiResult.severity}</span>
                  </div>
                  <span className="text-[10px] text-[#176B45] font-semibold">Matched</span>
                </div>
              )}

              <div className="flex justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setReportStep(4)}
                  className="px-4 py-2 text-xs font-semibold text-[#657169] hover:text-[#17201B] cursor-pointer"
                >
                  ← Back to Category
                </button>
                <button
                  type="button"
                  onClick={() => setReportStep(6)}
                  className="px-6 py-2.5 bg-[#176B45] hover:bg-[#0E4D32] text-white text-xs font-semibold rounded-[8px] shadow-xs cursor-pointer"
                >
                  Review Report →
                </button>
              </div>
            </div>
          )}

          {/* STEP 6: REVIEW & SUBMIT */}
          {reportStep === 6 && (
            <div className="space-y-5">
              <div className="space-y-1">
                <h3 className="font-semibold text-base text-[#17201B]">Review Report Card</h3>
                <p className="text-xs text-[#657169]">
                  Confirm details before dispatching to local municipal teams.
                </p>
              </div>

              {/* Review Card */}
              <div className="p-4 bg-[#F7F9F7] rounded-[14px] border border-[#E2E8E4] space-y-3">
                {/* Photo */}
                <div className="flex items-center justify-between pb-3 border-b border-[#E2E8E4]">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-[8px] overflow-hidden bg-slate-200 shrink-0">
                      <img src={selectedImage} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <span className="text-[10px] text-[#657169] uppercase font-bold">Photo Evidence</span>
                      <strong className="text-xs text-[#17201B] block">Clear image attached</strong>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setReportStep(2)}
                    className="text-xs text-[#176B45] font-semibold hover:underline cursor-pointer"
                  >
                    Edit
                  </button>
                </div>

                {/* Location */}
                <div className="flex items-center justify-between pb-3 border-b border-[#E2E8E4] text-xs">
                  <div>
                    <span className="text-[10px] text-[#657169] uppercase font-bold">Location</span>
                    <strong className="text-[#17201B] block">{location.formattedAddress}</strong>
                    {landmark && <p className="text-[#657169] text-[11px]">Landmark: {landmark}</p>}
                  </div>
                  <button
                    type="button"
                    onClick={() => setReportStep(3)}
                    className="text-xs text-[#176B45] font-semibold hover:underline cursor-pointer"
                  >
                    Edit
                  </button>
                </div>

                {/* Category & Severity */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-[#657169] uppercase font-bold">Category</span>
                    <strong className="text-[#17201B] block">{getCategoryInfo(category).label}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#657169] uppercase font-bold">Severity</span>
                    <strong className="uppercase text-[#17201B] font-bold block">{severity}</strong>
                  </div>
                </div>
              </div>

              {/* Estimated Civic Reward Box */}
              <div className="bg-[#E8F5EE] rounded-[12px] border border-[#CBE5D7] p-3.5 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-[#0E4D32] flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-[#176B45]" />
                    Estimated Civic Points for this Report:
                  </span>
                  <span className="text-[11px] text-[#285A43] block mt-0.5">
                    +50 Valid report • +20 Useful photo • +15 Geotag accuracy
                  </span>
                </div>
                <div className="text-lg font-bold text-[#176B45]">+85 pts</div>
              </div>

              <div className="flex justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setReportStep(5)}
                  className="px-4 py-2 text-xs font-semibold text-[#657169] hover:text-[#17201B] cursor-pointer"
                >
                  ← Edit Severity
                </button>
                <button
                  type="button"
                  onClick={handleSubmitReport}
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-[#176B45] hover:bg-[#0E4D32] text-white font-semibold text-xs sm:text-sm rounded-[8px] cursor-pointer flex items-center gap-2 shadow-xs disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Validating report…</span>
                    </>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <Check className="w-4 h-4" />
                      <span>Submit Report (+85 pts)</span>
                    </div>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUCCESS SCREEN AFTER REPORT */}
      {submittedReport && (
        <div className="max-w-xl mx-auto bg-white rounded-[20px] border border-[#E2E8E4] p-6 sm:p-8 shadow-xs space-y-6 text-center animate-in fade-in duration-200">
          <div className="w-16 h-16 rounded-full bg-[#E8F5EE] text-[#176B45] flex items-center justify-center mx-auto shadow-xs border border-[#CBE5D7]">
            <Check className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h2 className="font-bold text-xl text-[#17201B]">Report Submitted</h2>
            <p className="text-xs text-[#657169]">
              Your report has been queued for municipal verification.
            </p>
          </div>

          <div className="p-4 bg-[#F7F9F7] rounded-[14px] border border-[#E2E8E4] space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[#657169]">Ticket Number:</span>
              <div className="flex items-center gap-1.5 font-mono font-bold text-[#17201B]">
                <span>{submittedReport.id}</span>
                <button
                  onClick={() => handleCopyId(submittedReport.id)}
                  className="p-1 hover:bg-slate-200 rounded cursor-pointer"
                  title="Copy ID"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            {copiedId && <span className="text-[10px] text-[#176B45] font-semibold block text-right">Copied!</span>}

            <div className="flex items-center justify-between pt-1 border-t border-[#E2E8E4]">
              <span className="text-[#657169]">Location:</span>
              <span className="font-medium text-[#17201B] truncate max-w-[240px]">
                {submittedReport.location.formattedAddress}
              </span>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-[#E2E8E4]">
              <span className="text-[#657169]">Status:</span>
              <span className="font-bold text-[#176B45] uppercase">
                {submittedReport.status}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5 justify-center">
            <button
              onClick={() => {
                setSubmittedReport(null);
                setActiveTab('my-reports');
              }}
              className="py-2.5 px-5 bg-[#176B45] hover:bg-[#0E4D32] text-white font-semibold text-xs rounded-[8px] cursor-pointer shadow-xs"
            >
              Track Report
            </button>
            <button
              onClick={() => {
                setSubmittedReport(null);
                setActiveTab('nearby');
              }}
              className="py-2.5 px-5 bg-white hover:bg-slate-50 border border-[#E2E8E4] text-[#17201B] font-semibold text-xs rounded-[8px] cursor-pointer"
            >
              View on Map
            </button>
            <button
              onClick={() => setSubmittedReport(null)}
              className="py-2.5 px-4 text-[#657169] hover:text-[#17201B] text-xs font-semibold cursor-pointer"
            >
              Report Another
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: CIVIC PROFILE & IMPACT DASHBOARD */}
      {activeTab === 'profile' && (
        <GamificationDashboard
          profile={userProfile}
          onRefreshProfile={refreshProfile}
          onNavigateToTab={(tab) => {
            if (tab === 'map') setActiveTab('nearby');
            if (tab === 'track') setActiveTab('my-reports');
            if (tab === 'report') {
              setActiveTab('report');
              setReportStep(1);
            }
          }}
        />
      )}

      {/* TAB 3: COMMUNITY LEADERS LEADERBOARD */}
      {activeTab === 'leaderboard' && (
        <LeaderboardView
          profile={userProfile}
          onRefreshProfile={refreshProfile}
        />
      )}

      {/* TAB 4: COMMUNITY MAP (WITH MAP GAMIFICATION EXPLORE LAYER) */}
      {activeTab === 'nearby' && (
        <div className="bg-white rounded-[20px] border border-[#E2E8E4] p-5 sm:p-7 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-[#17201B]">Community Waste Map</h2>
              <p className="text-xs text-[#657169]">
                Browse community reports, view recurring hotspots, and verify active issues
              </p>
            </div>

            {/* View Mode Switcher */}
            <div className="flex items-center gap-2">
              <div className="flex bg-[#F7F9F7] p-1 rounded-[8px] border border-[#E2E8E4]">
                <button
                  onClick={() => setMapDisplayMode('map')}
                  className={`px-3 py-1 rounded-[6px] text-xs font-semibold flex items-center gap-1 cursor-pointer ${
                    mapDisplayMode === 'map' ? 'bg-white text-[#176B45] shadow-xs' : 'text-[#657169]'
                  }`}
                >
                  <MapIcon className="w-3.5 h-3.5" />
                  <span>Map</span>
                </button>
                <button
                  onClick={() => setMapDisplayMode('list')}
                  className={`px-3 py-1 rounded-[6px] text-xs font-semibold flex items-center gap-1 cursor-pointer ${
                    mapDisplayMode === 'list' ? 'bg-white text-[#176B45] shadow-xs' : 'text-[#657169]'
                  }`}
                >
                  <List className="w-3.5 h-3.5" />
                  <span>List</span>
                </button>
              </div>
            </div>
          </div>

          {/* MAP GAMIFICATION: "EXPLORE YOUR AREA" SUMMARY LAYER (Section 14) */}
          <div className="p-3.5 bg-[#F7F9F7] rounded-[12px] border border-[#E2E8E4] flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[#17201B] flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#176B45]" />
                Explore Ward 4:
              </span>
              <span className="text-[#657169]">{nearbyCount} reported issues near you</span>
              <span className="text-slate-300">•</span>
              <span className="text-[#176B45] font-semibold">{resolvedThisWeek} issues resolved this week</span>
              <span className="text-slate-300">•</span>
              <span className="text-[#C45511] font-semibold">{recurringHotspotsCount} recurring hotspots</span>
            </div>

            <div className="text-[11px] text-[#657169] bg-white px-2.5 py-1 rounded-[6px] border border-[#E2E8E4]">
              Earn <strong>+15 Civic Points</strong> for verifying issues
            </div>
          </div>

          {/* Filter Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-xs">
            <input
              type="text"
              placeholder="Search an area, street, or landmark…"
              value={mapSearch}
              onChange={(e) => setMapSearch(e.target.value)}
              className="px-3 py-2 rounded-[8px] border border-[#E2E8E4] focus:ring-2 focus:ring-[#176B45]"
            />

            <select
              value={mapCategoryFilter}
              onChange={(e) => setMapCategoryFilter(e.target.value)}
              className="px-3 py-2 rounded-[8px] border border-[#E2E8E4] font-medium"
            >
              <option value="ALL">All Categories</option>
              {WASTE_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>

            <select
              value={mapSeverityFilter}
              onChange={(e) => setMapSeverityFilter(e.target.value)}
              className="px-3 py-2 rounded-[8px] border border-[#E2E8E4] font-medium"
            >
              <option value="ALL">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            <label className="flex items-center gap-2 font-semibold text-[#17201B] cursor-pointer bg-[#F7F9F7] px-3 py-2 rounded-[8px] border border-[#E2E8E4]">
              <input
                type="checkbox"
                checked={unresolvedOnly}
                onChange={(e) => setUnresolvedOnly(e.target.checked)}
                className="rounded text-[#176B45] focus:ring-[#176B45]"
              />
              <span className="truncate">Unresolved only</span>
            </label>
          </div>

          {/* MAP DISPLAY MODE */}
          {mapDisplayMode === 'map' && (
            <InteractiveMap
              reports={filteredMapReports}
              height="520px"
              onSelectReport={(r) => setInspectReport(r)}
              onCommunityVote={handleVote}
            />
          )}

          {/* ACCESSIBLE LIST MODE */}
          {mapDisplayMode === 'list' && (
            <div className="divide-y divide-[#E2E8E4] max-h-[550px] overflow-y-auto">
              {filteredMapReports.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#657169]">
                  No reports match the current filters.
                </div>
              ) : (
                filteredMapReports.map((report) => {
                  const catInfo = getCategoryInfo(report.category);
                  return (
                    <div
                      key={report.id}
                      className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between gap-4 cursor-pointer text-xs"
                      onClick={() => setInspectReport(report)}
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={report.imageUrls[0]}
                          alt="Incident"
                          className="w-12 h-12 rounded-[8px] object-cover shrink-0 bg-slate-100"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#17201B]">{report.id}</span>
                            <span className="font-semibold text-[#657169]">• {catInfo.label}</span>
                          </div>
                          <p className="text-[11px] text-[#657169] line-clamp-1">
                            {report.location.formattedAddress}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span
                          className={`px-2 py-0.5 rounded-[4px] text-[10px] font-bold uppercase ${
                            report.status === 'RESOLVED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {report.status.replace(/_/g, ' ')}
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: MY REPORTS & TRACKING (LIFECYCLE + CIVIC REWARD HISTORY) */}
      {activeTab === 'my-reports' && (
        <div className="bg-white rounded-[20px] border border-[#E2E8E4] p-5 sm:p-7 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-[#17201B]">My Submitted Reports</h2>
              <p className="text-xs text-[#657169]">
                Track the status and civic points earned across each report lifecycle.
              </p>
            </div>

            <div className="flex bg-[#F7F9F7] p-1 rounded-[8px] border border-[#E2E8E4] text-xs font-semibold">
              <button
                onClick={() => setMyReportsSubTab('all')}
                className={`px-3 py-1 rounded-[6px] cursor-pointer ${
                  myReportsSubTab === 'all' ? 'bg-white text-[#176B45] shadow-xs' : 'text-[#657169]'
                }`}
              >
                All ({myReports.length})
              </button>
              <button
                onClick={() => setMyReportsSubTab('active')}
                className={`px-3 py-1 rounded-[6px] cursor-pointer ${
                  myReportsSubTab === 'active' ? 'bg-white text-[#176B45] shadow-xs' : 'text-[#657169]'
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setMyReportsSubTab('resolved')}
                className={`px-3 py-1 rounded-[6px] cursor-pointer ${
                  myReportsSubTab === 'resolved' ? 'bg-white text-[#176B45] shadow-xs' : 'text-[#657169]'
                }`}
              >
                Resolved
              </button>
            </div>
          </div>

          {/* REPORT LIFECYCLE EXPLAINER */}
          <div className="p-3 bg-[#F7F9F7] rounded-[10px] border border-[#E2E8E4] text-xs text-[#657169]">
            <strong className="text-[#17201B] block mb-1">Civic Report Lifecycle:</strong>
            <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
              <span className="font-semibold text-[#176B45]">Submitted (+85 pts)</span>
              <span>→</span>
              <span>Under Review</span>
              <span>→</span>
              <span className="font-semibold text-[#176B45]">Verified (+40 pts)</span>
              <span>→</span>
              <span>Assigned</span>
              <span>→</span>
              <span>Cleanup Started</span>
              <span>→</span>
              <span className="font-semibold text-[#176B45]">Resolved (+50 pts)</span>
              <span>→</span>
              <span>Closed</span>
            </div>
          </div>

          {/* List of personal reports */}
          <div className="divide-y divide-[#E2E8E4]">
            {filteredMyReports.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#657169]">
                No reports submitted yet in this category.
              </div>
            ) : (
              filteredMyReports.map((report) => (
                <div
                  key={report.id}
                  onClick={() => setInspectReport(report)}
                  className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between gap-4 cursor-pointer text-xs"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={report.imageUrls[0]}
                      alt="Thumbnail"
                      className="w-12 h-12 rounded-[8px] object-cover shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#17201B]">{report.id}</span>
                        <span className="font-medium text-[#657169]">• {getCategoryInfo(report.category).label}</span>
                      </div>
                      <p className="text-[11px] text-[#657169] line-clamp-1">{report.location.formattedAddress}</p>
                      <span className="text-[10px] text-[#8D9B91]">
                        Reported on {new Date(report.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-right">
                    <div>
                      <span
                        className={`px-2 py-0.5 rounded-[4px] text-[10px] font-bold uppercase inline-block ${
                          report.status === 'RESOLVED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {report.status.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[10px] text-[#176B45] font-semibold block mt-1">
                        {report.status === 'RESOLVED' ? '+175 pts total' : '+85 pts earned'}
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* INSPECT REPORT MODAL (WITH COMMUNITY VERIFICATION ACTION) */}
      {inspectReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-[20px] border border-[#E2E8E4] shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8E4]">
              <div>
                <span className="text-xs font-mono font-bold text-[#176B45]">{inspectReport.id}</span>
                <h3 className="text-base font-bold text-[#17201B]">
                  {getCategoryInfo(inspectReport.category).label}
                </h3>
              </div>
              <button
                onClick={() => setInspectReport(null)}
                className="p-1 hover:bg-slate-100 rounded-[6px] text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Photo preview */}
            <div className="aspect-video w-full rounded-[12px] overflow-hidden bg-slate-100 relative">
              <img
                src={inspectReport.imageUrls[0]}
                alt="Evidence"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Details */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#657169]">Approximate Location:</span>
                <span className="font-semibold text-[#17201B]">
                  {inspectReport.location.formattedAddress}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#657169]">Status:</span>
                <span className="font-bold text-[#176B45] uppercase">
                  {inspectReport.status.replace(/_/g, ' ')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#657169]">Severity:</span>
                <span className="font-bold uppercase text-[#17201B]">{inspectReport.severity}</span>
              </div>
            </div>

            {/* COMMUNITY VERIFICATION SECTION (+15 Points) */}
            <div className="p-3.5 bg-[#F7F9F7] rounded-[12px] border border-[#E2E8E4] space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <strong className="text-[#17201B] flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#176B45]" />
                  Help Verify This Report
                </strong>
                <span className="text-[10px] font-bold text-[#176B45] bg-white px-2 py-0.5 rounded border border-[#CBE5D7]">
                  +15 Civic Points
                </span>
              </div>
              <p className="text-[11px] text-[#657169]">
                Are you near this location? Provide a community confirmation signal:
              </p>

              <div className="grid grid-cols-3 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleVote(inspectReport.id, 'still_there')}
                  className="py-1.5 px-2 bg-white hover:bg-slate-50 border border-[#E2E8E4] rounded-[6px] text-xs font-semibold text-[#17201B] cursor-pointer flex items-center justify-center gap-1"
                >
                  <ThumbsUp className="w-3 h-3 text-[#176B45]" /> Still There
                </button>
                <button
                  type="button"
                  onClick={() => handleVote(inspectReport.id, 'worsened')}
                  className="py-1.5 px-2 bg-white hover:bg-slate-50 border border-[#E2E8E4] rounded-[6px] text-xs font-semibold text-orange-700 cursor-pointer flex items-center justify-center gap-1"
                >
                  <AlertTriangle className="w-3 h-3" /> Worsened
                </button>
                <button
                  type="button"
                  onClick={() => handleVote(inspectReport.id, 'cleaned')}
                  className="py-1.5 px-2 bg-white hover:bg-slate-50 border border-[#E2E8E4] rounded-[6px] text-xs font-semibold text-[#176B45] cursor-pointer flex items-center justify-center gap-1"
                >
                  <Check className="w-3 h-3" /> Cleaned
                </button>
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={() => setInspectReport(null)}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-[#17201B] font-semibold text-xs rounded-[8px] cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
