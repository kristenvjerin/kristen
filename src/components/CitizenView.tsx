import React, { useState } from 'react';
import {
  AIAnalysisResult,
  SeverityLevel,
  WasteCategory,
  WasteReport,
  WasteVolume,
} from '../types';
import { WASTE_CATEGORIES, getCategoryInfo } from '../utils/categories';
import { SAMPLE_PRESET_IMAGES } from '../utils/seedData';
import { ApiService } from '../services/api';
import { InteractiveMap } from './InteractiveMap';
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
  SlidersHorizontal,
  Navigation,
  FileCheck,
  Trash2,
} from 'lucide-react';

interface CitizenViewProps {
  reports: WasteReport[];
  onReportCreated: (newReport: WasteReport) => void;
  onRefresh: () => void;
  activeCitizenId?: string;
  activeCitizenName?: string;
  initialTab?: 'report' | 'my-reports' | 'nearby';
}

export const CitizenView: React.FC<CitizenViewProps> = ({
  reports,
  onReportCreated,
  onRefresh,
  activeCitizenId = 'citizen-01',
  activeCitizenName = 'Maya Sharma',
  initialTab = 'report',
}) => {
  const [activeTab, setActiveTab] = useState<'report' | 'my-reports' | 'nearby'>(initialTab);

  // Wizard state for Report Waste
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [aiResult, setAiResult] = useState<AIAnalysisResult | null>(null);

  // Form fields
  const [category, setCategory] = useState<WasteCategory>('overflowing_bin');
  const [severity, setSeverity] = useState<SeverityLevel>('high');
  const [volume, setVolume] = useState<WasteVolume>('large');
  const [description, setDescription] = useState<string>('');
  const [landmark, setLandmark] = useState<string>('');
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
    approximateLocation: 'Gandhi Road (Sector 1)',
    zoneId: 'zone-central',
  });

  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);

  // Submission result & Inspection modal
  const [submittedReport, setSubmittedReport] = useState<WasteReport | null>(null);
  const [inspectReport, setInspectReport] = useState<WasteReport | null>(null);
  const [reopenModalReport, setReopenModalReport] = useState<WasteReport | null>(null);
  const [reopenReason, setReopenReason] = useState<string>('');

  // Map Filter state for "Waste Map" tab
  const [mapStatusFilter, setMapStatusFilter] = useState<string>('ALL');
  const [mapSeverityFilter, setMapSeverityFilter] = useState<string>('ALL');
  const [mapCategoryFilter, setMapCategoryFilter] = useState<string>('ALL');
  const [unresolvedOnly, setUnresolvedOnly] = useState<boolean>(false);

  // Tracking search
  const [searchTrackingId, setSearchTrackingId] = useState<string>('');

  // Personal reports
  const myReports = reports.filter((r) => r.citizenId === activeCitizenId);
  const resolvedCount = myReports.filter((r) => r.status === 'RESOLVED').length;

  // Handle Preset selection
  const handleSelectPreset = (presetUrl: string, defaultCat: string) => {
    setSelectedImage(presetUrl);
    setCategory(defaultCat as WasteCategory);
    setStep(2);
    runAIAnalysis(presetUrl);
  };

  // Handle File Upload & Validation
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.match(/^image\/(jpeg|jpg|png|webp)$/)) {
        alert('Please upload a valid image file (JPG, PNG, or WEBP).');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        alert('Image exceeds 10MB limit. Please upload a smaller image.');
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        setSelectedImage(base64);
        setStep(2);
        runAIAnalysis(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  // Run Gemini Multimodal AI
  const runAIAnalysis = async (img: string) => {
    setIsAnalyzing(true);
    try {
      const result = await ApiService.analyzeImageAI(img);
      setAiResult(result);
      if (result.primaryCategory) setCategory(result.primaryCategory);
      if (result.severity) setSeverity(result.severity);
      if (result.estimatedVolume) setVolume(result.estimatedVolume);
      if (result.reasoningSummary) setDescription(result.reasoningSummary);
    } catch (err) {
      console.warn('AI analysis failed:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Browser Geolocation API
  const handleGetLocation = () => {
    setIsLocating(true);
    setLocationError(null);
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser. Please select location on the map.');
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lng = Number(pos.coords.longitude.toFixed(6));
        setLocation({
          latitude: lat,
          longitude: lng,
          formattedAddress: `Street at GPS Coordinates ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
          approximateLocation: `Near Municipal Sector (${lat.toFixed(2)}, ${lng.toFixed(2)})`,
          zoneId: 'zone-central',
        });
      },
      (err) => {
        setIsLocating(false);
        setLocationError(
          'Location access is turned off. You can place the pin manually on the map below.'
        );
      },
      { timeout: 8000 }
    );
  };

  // Submit report
  const handleSubmitReport = () => {
    const newReport = ApiService.createReport({
      citizenId: activeCitizenId,
      citizenName: activeCitizenName,
      citizenEmail: 'maya.sharma@example.com',
      imageUrls: [selectedImage || SAMPLE_PRESET_IMAGES[0].url],
      category,
      userCategory: category,
      severity,
      estimatedVolume: volume,
      aiConfidence: aiResult?.confidence || 0.89,
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

    setSubmittedReport(newReport);
    onReportCreated(newReport);
    setStep(1);
    setSelectedImage('');
    setAiResult(null);
    setDescription('');
    setLandmark('');
  };

  // Community confirmation vote
  const handleVote = (reportId: string, vote: 'still_there' | 'cleaned' | 'worsened') => {
    ApiService.voteCommunity(reportId, vote, activeCitizenId);
    onRefresh();
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
        activeCitizenName,
        'YES',
        'Verified clean. Thank you!'
      );
      onRefresh();
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
      activeCitizenName,
      'NO',
      reopenReason || 'Debris was not completely removed upon inspection.'
    );
    setReopenModalReport(null);
    setInspectReport(null);
    setReopenReason('');
    onRefresh();
  };

  // Filtered reports for Waste Map
  const filteredMapReports = reports.filter((r) => {
    if (unresolvedOnly && (r.status === 'RESOLVED' || r.status === 'REJECTED')) return false;
    if (mapStatusFilter !== 'ALL' && r.status !== mapStatusFilter) return false;
    if (mapSeverityFilter !== 'ALL' && r.severity !== mapSeverityFilter) return false;
    if (mapCategoryFilter !== 'ALL' && r.category !== mapCategoryFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Sub-Navigation Pill Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3 flex-wrap gap-2">
        <div className="flex gap-2">
          <button
            onClick={() => {
              setActiveTab('report');
              setStep(1);
            }}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'report'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Camera className="w-4 h-4" />
            Report Waste (Under 30s)
          </button>
          <button
            onClick={() => setActiveTab('nearby')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'nearby'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <MapPin className="w-4 h-4" />
            Waste Map ({reports.length})
          </button>
          <button
            onClick={() => setActiveTab('my-reports')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'my-reports'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Track My Reports ({myReports.length})
          </button>
        </div>

        {/* Citizen badge */}
        <div className="hidden sm:flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full text-xs font-semibold text-emerald-800">
          <Award className="w-4 h-4 text-emerald-600" />
          <span>Active Reporter • {resolvedCount * 20 + 40} Civic Pts</span>
        </div>
      </div>

      {/* SUBMISSION CONFIRMATION BANNER */}
      {submittedReport && (
        <div className="p-5 bg-emerald-50 border border-emerald-300 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm animate-in fade-in duration-300">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-extrabold text-slate-900 text-base">Report Submitted Successfully!</h4>
                <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-emerald-200 text-emerald-950 font-black">
                  {submittedReport.id}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Target SLA: {submittedReport.priority} Priority • Thank you for keeping your community clean!
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setInspectReport(submittedReport);
                setSubmittedReport(null);
                setActiveTab('my-reports');
              }}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
            >
              Track Report
            </button>
            <button
              onClick={() => setSubmittedReport(null)}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold rounded-xl cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* TAB 1: 4-STEP FAST REPORT WIZARD */}
      {activeTab === 'report' && (
        <div className="max-w-2xl mx-auto bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          {/* Progress Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="font-extrabold text-slate-900 text-xl tracking-tight">Report Waste</h2>
              <p className="text-xs text-slate-500">Fast 30-second reporting flow with AI assistance</p>
            </div>
            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Step {step} of 4
            </span>
          </div>

          {/* STEP 1: ADD PHOTO */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="space-y-1">
                <h3 className="font-bold text-slate-900 text-sm">What did you find?</h3>
                <p className="text-xs text-slate-500">
                  Upload an image of the waste or take a photo on your device.
                </p>
              </div>

              {/* Upload Dropzone */}
              <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-emerald-300 hover:border-emerald-500 rounded-3xl bg-emerald-50/20 hover:bg-emerald-50/40 transition-all cursor-pointer text-center group">
                <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <Camera className="w-7 h-7" />
                </div>
                <span className="text-sm font-bold text-slate-800">Take Photo or Upload Image</span>
                <span className="text-xs text-slate-500 mt-1">Supports JPG, PNG, WEBP up to 10MB</span>
                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
              </label>

              {/* Instant Test Presets for Evaluators */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Or click a realistic sample photo to test instantly:</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {SAMPLE_PRESET_IMAGES.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => handleSelectPreset(preset.url, preset.category)}
                      className="group p-2 rounded-2xl border border-slate-200 hover:border-emerald-500 bg-white hover:shadow-xs transition-all text-left space-y-1.5 cursor-pointer"
                    >
                      <div className="aspect-square w-full rounded-xl overflow-hidden bg-slate-100">
                        <img
                          src={preset.url}
                          alt={preset.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                      <p className="font-bold text-[11px] text-slate-800 line-clamp-1">{preset.title}</p>
                      <span className="text-[10px] text-emerald-700 font-semibold block">Click to test</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: AI ANALYSIS & CATEGORY CONFIRMATION */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="aspect-video w-full rounded-2xl overflow-hidden bg-slate-100 relative shadow-inner">
                <img src={selectedImage} alt="Uploaded" className="w-full h-full object-cover" />
                {isAnalyzing && (
                  <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs flex flex-col items-center justify-center text-white space-y-2">
                    <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
                    <span className="font-bold text-xs tracking-wide">
                      Gemini Multimodal AI Analyzing Hazard...
                    </span>
                    <span className="text-[10px] text-slate-300">
                      Detecting waste category, volume, and public health risk
                    </span>
                  </div>
                )}
              </div>

              {/* AI-Assisted Suggestion Card */}
              {aiResult && !isAnalyzing && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                      AI-Assisted Suggestion (Editable)
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-950 text-[10px] font-extrabold">
                      {Math.round(aiResult.confidence * 100)}% Confidence
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 italic">"{aiResult.reasoningSummary}"</p>
                </div>
              )}

              {/* Waste Category Selection (10 items) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 block">Select Waste Category</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {WASTE_CATEGORIES.slice(0, 9).map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        category === cat.id
                          ? 'bg-emerald-50 border-emerald-600 ring-2 ring-emerald-500/20'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <strong className="text-xs text-slate-900 block truncate">{cat.label}</strong>
                      <span className="text-[10px] text-slate-500 line-clamp-1">{cat.description}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Severity Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 block">How serious is the issue?</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'low', label: '🟢 Low', desc: 'Small amount of waste' },
                    { id: 'medium', label: '🟡 Medium', desc: 'Visible accumulation' },
                    { id: 'high', label: '🟠 High', desc: 'Large pile / blocking area' },
                    { id: 'critical', label: '🔴 Critical', desc: 'Hazardous / severe obstruction' },
                  ].map((sev) => (
                    <button
                      key={sev.id}
                      type="button"
                      onClick={() => setSeverity(sev.id as SeverityLevel)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        severity === sev.id
                          ? 'bg-emerald-50 border-emerald-600 ring-2 ring-emerald-500/20'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <strong className="text-xs text-slate-900 block">{sev.label}</strong>
                      <span className="text-[10px] text-slate-500 block leading-tight">{sev.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Navigation */}
              <div className="flex justify-between pt-2">
                <button
                  onClick={() => setStep(1)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50 cursor-pointer"
                >
                  Change Photo
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={isAnalyzing}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer disabled:opacity-50"
                >
                  Confirm & Pin Location →
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: LOCATION CAPTURE */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Where is the waste?</h3>
                  <p className="text-xs text-slate-500">
                    Use browser GPS or click on the map to place the incident pin
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleGetLocation}
                  disabled={isLocating}
                  className="px-3 py-1.5 text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>{isLocating ? 'Locating...' : 'Use My Current Location'}</span>
                </button>
              </div>

              {locationError && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>{locationError}</span>
                </div>
              )}

              {/* Interactive Map Pin Picker */}
              <InteractiveMap
                height="280px"
                isPickerMode={true}
                pickedPosition={[location.latitude, location.longitude]}
                onPickPosition={(lat, lng) => {
                  setLocation((prev) => ({
                    ...prev,
                    latitude: Number(lat.toFixed(6)),
                    longitude: Number(lng.toFixed(6)),
                    formattedAddress: `Street at Coordinates ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
                    approximateLocation: `Municipal Sector (${lat.toFixed(2)}, ${lng.toFixed(2)})`,
                  }));
                }}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Human-Readable Address</label>
                  <input
                    type="text"
                    value={location.formattedAddress}
                    onChange={(e) => setLocation((prev) => ({ ...prev, formattedAddress: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Landmark / Access Guide</label>
                  <input
                    type="text"
                    placeholder="e.g. Near Metro Station Gate 2"
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="flex justify-between pt-2">
                <button
                  onClick={() => setStep(2)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50 cursor-pointer"
                >
                  ← Back to Details
                </button>
                <button
                  onClick={() => setStep(4)}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
                >
                  Review Summary →
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: CONFIRMATION CARD & SUBMIT */}
          {step === 4 && (
            <div className="space-y-5">
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                <h4 className="font-bold text-slate-900 text-sm border-b border-slate-200 pb-2">
                  Review Report Card
                </h4>

                <div className="flex gap-4">
                  <div className="w-24 h-24 rounded-2xl overflow-hidden bg-slate-200 shrink-0">
                    <img src={selectedImage} alt="Thumbnail" className="w-full h-full object-cover" />
                  </div>
                  <div className="space-y-1 text-xs">
                    <div>
                      <span className="text-slate-400">Category: </span>
                      <strong className="text-slate-900">{getCategoryInfo(category).label}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400">Severity: </span>
                      <span className="font-bold uppercase text-red-600">{severity}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Location: </span>
                      <span className="text-slate-700 font-medium">{location.formattedAddress}</span>
                    </div>
                    {landmark && (
                      <div>
                        <span className="text-slate-400">Landmark: </span>
                        <span className="text-slate-700">{landmark}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-bold text-slate-700">Anything else we should know?</label>
                    <span className="text-[10px] text-slate-400">{description.length}/300</span>
                  </div>
                  <textarea
                    rows={2}
                    maxLength={300}
                    placeholder="e.g. Garbage has been here for 2 days and is blocking the footpath."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="flex justify-between pt-2">
                <button
                  onClick={() => setStep(3)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50 cursor-pointer"
                >
                  ← Edit Location
                </button>
                <button
                  onClick={handleSubmitReport}
                  className="px-7 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs rounded-2xl shadow-md cursor-pointer flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>Submit Report (Get ID)</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: EXPLORE WASTE MAP */}
      {activeTab === 'nearby' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-7 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Explore Waste Map</h2>
              <p className="text-xs text-slate-500">
                Explore active community waste markers and vote on current status
              </p>
            </div>

            {/* Unresolved Only Toggle */}
            <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
              <input
                type="checkbox"
                checked={unresolvedOnly}
                onChange={(e) => setUnresolvedOnly(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span>Show Only Unresolved Reports</span>
            </label>
          </div>

          {/* Filter Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
            <select
              value={mapStatusFilter}
              onChange={(e) => setMapStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 font-semibold focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="VERIFIED">Verified</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
            </select>

            <select
              value={mapSeverityFilter}
              onChange={(e) => setMapSeverityFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 font-semibold focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">All Severities</option>
              <option value="critical">🔴 Critical</option>
              <option value="high">🟠 High</option>
              <option value="medium">🟡 Medium</option>
              <option value="low">🟢 Low</option>
            </select>

            <select
              value={mapCategoryFilter}
              onChange={(e) => setMapCategoryFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 font-semibold focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">All Waste Types</option>
              {WASTE_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <InteractiveMap
            reports={filteredMapReports}
            height="520px"
            onSelectReport={(r) => setInspectReport(r)}
            onCommunityVote={handleVote}
          />
        </div>
      )}

      {/* TAB 3: TRACK MY REPORTS */}
      {activeTab === 'my-reports' && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Track My Reports ({myReports.length})
              </h2>
              <p className="text-xs text-slate-500">Live lifecycle tracking from dispatch to closure</p>
            </div>

            {/* Quick Search by Report ID */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Search ID (e.g. CS-2026-000181)"
                value={searchTrackingId}
                onChange={(e) => setSearchTrackingId(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-mono"
              />
              <button
                onClick={() => {
                  const found = reports.find(
                    (r) => r.id.toLowerCase() === searchTrackingId.trim().toLowerCase()
                  );
                  if (found) setInspectReport(found);
                  else alert('Report ID not found');
                }}
                className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold"
              >
                Find
              </button>
            </div>
          </div>

          {myReports.length === 0 ? (
            <div className="p-10 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
              <Trash2 className="w-8 h-8 text-slate-300 mx-auto" />
              <h4 className="font-bold text-slate-800 text-sm">You haven't reported anything yet</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Spotted an overflowing public bin or fly-tipping? Help keep your community clean in under 30 seconds!
              </p>
              <button
                onClick={() => {
                  setActiveTab('report');
                  setStep(1);
                }}
                className="px-5 py-2.5 bg-emerald-600 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Report First Issue
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myReports.map((report) => {
                const catInfo = getCategoryInfo(report.category);
                const isPendingConfirmation = report.status === 'RESOLVED_PENDING_CONFIRMATION';

                return (
                  <div
                    key={report.id}
                    className={`p-4 rounded-3xl border bg-white shadow-xs space-y-3 transition-all ${
                      isPendingConfirmation
                        ? 'border-amber-400 ring-2 ring-amber-400/20'
                        : 'border-slate-200 hover:border-emerald-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-100 shrink-0">
                          <img
                            src={report.imageUrls[0]}
                            alt={catInfo.label}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs text-slate-900">{report.id}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-extrabold uppercase bg-slate-100 text-slate-700">
                              {report.priority}
                            </span>
                          </div>
                          <h4 className="font-bold text-xs text-slate-800 line-clamp-1">{catInfo.label}</h4>
                          <span className="text-[11px] text-slate-400">
                            {new Date(report.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          report.status === 'RESOLVED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : isPendingConfirmation
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : report.status === 'IN_PROGRESS'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-slate-100 text-slate-800'
                        }`}
                      >
                        {report.status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2">{report.description}</p>

                    {/* Pending Citizen Confirmation Banner */}
                    {isPendingConfirmation && (
                      <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 space-y-2">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                          <span>Sanitation crew completed work! Confirm resolution:</span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleCitizenVerify(report.id, 'YES')}
                            className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center justify-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Yes, Verified Clean
                          </button>
                          <button
                            onClick={() => handleCitizenVerify(report.id, 'NO')}
                            className="flex-1 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center justify-center gap-1"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            No, Still Present
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                      <span className="text-slate-500 text-[11px] truncate max-w-[200px]">
                        📍 {report.location.formattedAddress}
                      </span>
                      <button
                        onClick={() => setInspectReport(report)}
                        className="text-emerald-700 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Inspect Details
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* DETAIL MODAL: TIMELINE, BEFORE/AFTER PROOF */}
      {inspectReport && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto p-6 sm:p-7 space-y-5 shadow-2xl border border-slate-200 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-mono font-bold text-slate-900 text-base">{inspectReport.id}</h3>
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-bold uppercase bg-emerald-100 text-emerald-900">
                    {inspectReport.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <p className="text-xs text-slate-500">{inspectReport.location.formattedAddress}</p>
              </div>
              <button
                onClick={() => setInspectReport(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Before vs After Visual Proof Comparison */}
            {inspectReport.evidence.length > 0 && (
              <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  Remediation Photographic Evidence
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[11px] font-bold text-slate-500 block mb-1">
                      BEFORE (Citizen Evidence)
                    </span>
                    <div className="aspect-video rounded-xl overflow-hidden bg-slate-200">
                      <img
                        src={inspectReport.imageUrls[0]}
                        alt="Before"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>

                  {inspectReport.evidence.find((e) => e.type === 'AFTER') ? (
                    <div>
                      <span className="text-[11px] font-bold text-emerald-700 block mb-1">
                        AFTER (Cleanup Crew)
                      </span>
                      <div className="aspect-video rounded-xl overflow-hidden bg-slate-200">
                        <img
                          src={inspectReport.evidence.find((e) => e.type === 'AFTER')?.imageUrl}
                          alt="After"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="aspect-video rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center text-center p-3 text-slate-400 text-xs">
                      Cleanup in progress... After photo will appear here.
                    </div>
                  )}
                </div>

                {inspectReport.evidence.find((e) => e.type === 'AFTER')?.aiVerificationSummary && (
                  <div className="p-2.5 bg-emerald-100/70 rounded-xl text-xs text-emerald-950 font-medium">
                    <span className="font-bold">AI Clearance Check: </span>
                    {inspectReport.evidence.find((e) => e.type === 'AFTER')?.aiVerificationSummary}
                  </div>
                )}
              </div>
            )}

            {/* Full Status Timeline */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                Report Status Timeline
              </span>
              <div className="space-y-3 pl-2 border-l-2 border-emerald-500">
                {inspectReport.statusHistory.map((sh, idx) => (
                  <div key={idx} className="relative pl-4 space-y-0.5">
                    <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-600 ring-4 ring-white" />
                    <div className="flex items-center gap-2 text-xs">
                      <strong className="text-slate-900">{sh.toStatus.replace(/_/g, ' ')}</strong>
                      <span className="text-[10px] text-slate-400">
                        {new Date(sh.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      By {sh.changedBy} ({sh.actorRole}): {sh.reason || 'Status milestone updated'}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Verification action inside modal */}
            {inspectReport.status === 'RESOLVED_PENDING_CONFIRMATION' && (
              <div className="pt-3 border-t border-slate-100 flex gap-3">
                <button
                  onClick={() => handleCitizenVerify(inspectReport.id, 'YES')}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
                >
                  Confirm Resolved (100% Fixed)
                </button>
                <button
                  onClick={() => handleCitizenVerify(inspectReport.id, 'NO')}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
                >
                  Issue Still Present (Reopen)
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* REOPEN MODAL */}
      {reopenModalReport && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <h4 className="font-extrabold text-slate-900 text-base">Reopen Report {reopenModalReport.id}</h4>
            <p className="text-xs text-slate-600">
              Please specify why this issue remains unresolved so sanitation supervisors can re-dispatch crews.
            </p>
            <textarea
              rows={3}
              placeholder="e.g. Worker cleared plastic bags but left sharp debris and rubble behind."
              value={reopenReason}
              onChange={(e) => setReopenReason(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setReopenModalReport(null)}
                className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReopen}
                className="px-4 py-1.5 text-xs bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl cursor-pointer"
              >
                Submit Reopen Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
