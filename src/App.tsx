import React, { useState, useEffect } from 'react';
import { InAppNotification, UserRole, WasteReport } from './types';
import { ApiService } from './services/api';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { CitizenView } from './components/CitizenView';
import { WorkerView } from './components/WorkerView';
import { AdminView } from './components/AdminView';
import { HackathonDemoTour } from './components/HackathonDemoTour';
import {
  Shield,
  Sparkles,
  User,
  Truck,
  Building2,
  Trash2,
  Camera,
  MapPin,
  ClipboardList,
  Home,
  AlertCircle,
  Check,
  X,
  ExternalLink,
  ShieldCheck,
  Trophy,
} from 'lucide-react';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

export function App() {
  const [currentRole, setCurrentRole] = useState<UserRole>('citizen');
  const [activeTab, setActiveTab] = useState<string>('home');
  const [reports, setReports] = useState<WasteReport[]>([]);
  const [hotspots, setHotspots] = useState(ApiService.getHotspots());
  const [zones, setZones] = useState(ApiService.getZones());
  const [workers, setWorkers] = useState(ApiService.getWorkers());
  const [auditLogs, setAuditLogs] = useState(ApiService.getAuditLogs());
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [isDemoTourOpen, setIsDemoTourOpen] = useState<boolean>(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    const id = `toast-${Date.now()}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const loadData = () => {
    setReports(ApiService.getReports());
    setHotspots(ApiService.getHotspots());
    setZones(ApiService.getZones());
    setWorkers(ApiService.getWorkers());
    setAuditLogs(ApiService.getAuditLogs());
    setNotifications(ApiService.getNotifications());
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleResetData = () => {
    if (confirm('Reset CleanSpot to fresh demonstration dataset?')) {
      ApiService.resetToDemo();
      loadData();
      showToast('info', 'CleanSpot database reset to fresh demo dataset.');
    }
  };

  const handleMarkNotifRead = (id: string) => {
    ApiService.markNotificationRead(id);
    setNotifications(ApiService.getNotifications());
  };

  const handleRoleChange = (role: UserRole) => {
    setCurrentRole(role);
    if (role === 'worker') setActiveTab('worker');
    else if (role === 'admin' || role === 'supervisor') setActiveTab('admin');
    else if (role === 'citizen' && (activeTab === 'admin' || activeTab === 'worker')) setActiveTab('report');
  };

  const analytics = ApiService.getAnalytics();

  return (
    <div className="min-h-screen bg-[#F7F9F7] text-[#17201B] font-game flex flex-col selection:bg-[#176B45] selection:text-white pb-20 md:pb-0">
      {/* Toast Notification Layer (Section 60) */}
      <div className="fixed top-20 right-4 z-50 space-y-2 pointer-events-none max-w-sm w-full">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto p-3.5 rounded-[12px] shadow-lg border text-xs font-medium flex items-center justify-between gap-3 animate-in slide-in-from-top-2 duration-150 ${
              toast.type === 'success'
                ? 'bg-[#E8F5EE] border-[#3FA66B] text-[#0E4D32]'
                : toast.type === 'error'
                ? 'bg-red-50 border-red-300 text-red-900'
                : 'bg-white border-[#E2E8E4] text-[#17201B]'
            }`}
          >
            <div className="flex items-center gap-2">
              {toast.type === 'success' && <Check className="w-4 h-4 text-[#176B45] shrink-0" />}
              {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />}
              <span>{toast.message}</span>
            </div>
            <button
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              className="text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Top Navbar */}
      <Navbar
        currentRole={currentRole}
        onRoleChange={handleRoleChange}
        onNavigateTab={(tab) => {
          setActiveTab(tab);
          if (tab === 'worker') setCurrentRole('worker');
          if (tab === 'admin') setCurrentRole('admin');
          if (tab === 'home' || tab === 'report' || tab === 'profile' || tab === 'leaderboard' || tab === 'map' || tab === 'track') {
            if (currentRole !== 'citizen') setCurrentRole('citizen');
          }
        }}
        activeNavTab={activeTab}
        onStartDemoTour={() => setIsDemoTourOpen(true)}
        onResetData={handleResetData}
        notifications={notifications}
        onMarkNotificationRead={handleMarkNotifRead}
      />

      {/* Role Context Bar & Demo Indicator */}
      <div className="bg-[#F7F9F7] border-b border-[#E2E8E4] py-1.5 px-4 text-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[#657169] font-medium">Viewing role:</span>
            {currentRole === 'citizen' && (
              <span className="font-bold text-[#0E4D32] flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-[#176B45]" /> Citizen Reporter (Kristen — Level 4 Civic Helper)
              </span>
            )}
            {currentRole === 'worker' && (
              <span className="font-bold text-blue-900 flex items-center gap-1">
                <Truck className="w-3.5 h-3.5 text-blue-700" /> Zone 1 Cleanup Team (Rajan Kumar)
              </span>
            )}
            {currentRole === 'admin' && (
              <span className="font-bold text-purple-900 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-purple-700" /> Municipal Command Center
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 text-[#657169]">
            <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-medium text-[#657169] bg-white px-2.5 py-0.5 rounded-[4px] border border-[#E2E8E4]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#176B45]"></span>
              Demo environment
            </span>
            <span className="hidden md:inline font-normal text-xs text-[#657169]">Report waste. Earn points. Improve your area.</span>
          </div>
        </div>
      </div>

      {/* Main Dynamic View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'home' && (
          <LandingPage
            reports={reports}
            analytics={analytics}
            onNavigateTab={(tab) => {
              setActiveTab(tab);
              if (tab === 'worker') setCurrentRole('worker');
              if (tab === 'admin') setCurrentRole('admin');
            }}
            onSelectReport={(r) => {
              setActiveTab('track');
            }}
            onCommunityVote={(reportId, vote) => {
              ApiService.voteCommunity(reportId, vote);
              loadData();
              showToast('success', 'Thank you! Community verification recorded (+15 Civic Points).');
            }}
          />
        )}

        {(activeTab === 'report' || activeTab === 'profile' || activeTab === 'leaderboard' || activeTab === 'map' || activeTab === 'track' || activeTab === 'how-it-works') && (
          <CitizenView
            reports={reports}
            onReportCreated={() => {
              loadData();
              showToast('success', 'Report submitted successfully! Cleanup crews alerted.');
            }}
            onRefresh={() => loadData()}
            initialTab={
              activeTab === 'profile'
                ? 'profile'
                : activeTab === 'leaderboard'
                ? 'leaderboard'
                : activeTab === 'map'
                ? 'nearby'
                : activeTab === 'track'
                ? 'my-reports'
                : 'report'
            }
          />
        )}

        {activeTab === 'worker' && (
          <WorkerView reports={reports} workers={workers} onRefresh={() => loadData()} />
        )}

        {activeTab === 'admin' && (
          <AdminView
            reports={reports}
            hotspots={hotspots}
            zones={zones}
            workers={workers}
            auditLogs={auditLogs}
            onRefresh={() => loadData()}
            currentUserRole="admin"
          />
        )}
      </main>

      {/* Guided 3-Minute Hackathon Demo Modal */}
      <HackathonDemoTour
        isOpen={isDemoTourOpen}
        onClose={() => setIsDemoTourOpen(false)}
        onSetRole={(role) => {
          handleRoleChange(role);
          if (role === 'citizen') setActiveTab('report');
          if (role === 'worker') setActiveTab('worker');
          if (role === 'admin' || role === 'supervisor') setActiveTab('admin');
        }}
      />

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E2E8E4] px-4 py-2 flex items-center justify-around shadow-lg">
        <button
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center gap-0.5 text-[10px] font-semibold cursor-pointer ${
            activeTab === 'home' ? 'text-[#176B45]' : 'text-[#657169]'
          }`}
        >
          <Home className="w-5 h-5" />
          <span>Home</span>
        </button>

        <button
          onClick={() => setActiveTab('map')}
          className={`flex flex-col items-center gap-0.5 text-[10px] font-semibold cursor-pointer ${
            activeTab === 'map' ? 'text-[#176B45]' : 'text-[#657169]'
          }`}
        >
          <MapPin className="w-5 h-5" />
          <span>Map</span>
        </button>

        {/* Central Prominent One-Thumb Report Button */}
        <button
          onClick={() => {
            setCurrentRole('citizen');
            setActiveTab('report');
          }}
          className="-mt-5 w-12 h-12 rounded-full bg-[#176B45] text-white flex items-center justify-center shadow-lg shadow-[#176B45]/40 ring-4 ring-white cursor-pointer active:scale-95 transition-transform"
          aria-label="Report Waste"
        >
          <Camera className="w-5 h-5" />
        </button>

        <button
          onClick={() => {
            setCurrentRole('citizen');
            setActiveTab('leaderboard');
          }}
          className={`flex flex-col items-center gap-0.5 text-[10px] font-semibold cursor-pointer ${
            activeTab === 'leaderboard' ? 'text-[#176B45]' : 'text-[#657169]'
          }`}
        >
          <Trophy className="w-5 h-5" />
          <span>Leaders</span>
        </button>

        <button
          onClick={() => {
            setCurrentRole('citizen');
            setActiveTab('profile');
          }}
          className={`flex flex-col items-center gap-0.5 text-[10px] font-semibold cursor-pointer ${
            activeTab === 'profile' ? 'text-[#176B45]' : 'text-[#657169]'
          }`}
        >
          <ShieldCheck className="w-5 h-5" />
          <span>Profile</span>
        </button>
      </nav>

      {/* 4-COLUMN FOOTER DESIGN (Section 126) */}
      <footer className="bg-white border-t border-[#E2E8E4] py-12 text-xs text-[#657169]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Column 1: Brand & North Star */}
            <div className="space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-[10px] bg-[#176B45] flex items-center justify-center text-white font-bold">
                  <Trash2 className="w-4 h-4" />
                </div>
                <span className="font-bold text-base text-[#17201B]">CleanSpot</span>
              </div>
              <p className="text-xs text-[#657169] leading-relaxed">
                “See it. Report it. Get it cleaned.” <br />
                Citizen-powered urban waste reporting, transparent dispatch, and chronic hotspot intelligence.
              </p>
            </div>

            {/* Column 2: Platform Links */}
            <div className="space-y-2">
              <span className="font-semibold text-xs text-[#17201B] uppercase tracking-wider block">
                Platform
              </span>
              <ul className="space-y-1.5 font-medium">
                <li>
                  <button onClick={() => setActiveTab('report')} className="hover:text-[#176B45] cursor-pointer">
                    Report Waste
                  </button>
                </li>
                <li>
                  <button onClick={() => setActiveTab('map')} className="hover:text-[#176B45] cursor-pointer">
                    Waste Map
                  </button>
                </li>
                <li>
                  <button onClick={() => setActiveTab('track')} className="hover:text-[#176B45] cursor-pointer">
                    Track Status
                  </button>
                </li>
                <li>
                  <button onClick={() => setActiveTab('admin')} className="hover:text-[#176B45] cursor-pointer">
                    Command Center
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 3: Resources */}
            <div className="space-y-2">
              <span className="font-semibold text-xs text-[#17201B] uppercase tracking-wider block">
                Resources
              </span>
              <ul className="space-y-1.5 font-medium">
                <li>
                  <button onClick={() => setActiveTab('home')} className="hover:text-[#176B45] cursor-pointer">
                    How It Works
                  </button>
                </li>
                <li>
                  <button onClick={() => setActiveTab('home')} className="hover:text-[#176B45] cursor-pointer">
                    FAQ
                  </button>
                </li>
                <li>
                  <span className="text-[#8B9690] cursor-not-allowed">Privacy Policy</span>
                </li>
                <li>
                  <span className="text-[#8B9690] cursor-not-allowed">Terms of Service</span>
                </li>
              </ul>
            </div>

            {/* Column 4: Contact & Disclaimer */}
            <div className="space-y-2">
              <span className="font-semibold text-xs text-[#17201B] uppercase tracking-wider block">
                Civic Governance
              </span>
              <p className="text-[11px] text-[#657169] leading-relaxed">
                CleanSpot is a civic reporting platform prototype. It converts citizen observations into structured, location-based waste incidents for authorized municipal teams.
              </p>
              <span className="text-[10px] text-[#8B9690] block pt-1">
                Version 2.0 • Civic Clean City Standard
              </span>
            </div>
          </div>

          <div className="pt-6 border-t border-[#E2E8E4] flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-[#8B9690]">
            <p>© 2026 CleanSpot. All rights reserved.</p>
            <p>Designed with environmental care • Inter typography • 8px grid</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
