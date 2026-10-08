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
} from 'lucide-react';

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
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col selection:bg-emerald-600 selection:text-white pb-16 md:pb-0">
      {/* Top Navbar */}
      <Navbar
        currentRole={currentRole}
        onRoleChange={handleRoleChange}
        onNavigateTab={(tab) => {
          setActiveTab(tab);
          if (tab === 'worker') setCurrentRole('worker');
          if (tab === 'admin') setCurrentRole('admin');
          if (tab === 'home' || tab === 'report' || tab === 'map' || tab === 'track') {
            if (currentRole !== 'citizen') setCurrentRole('citizen');
          }
        }}
        activeNavTab={activeTab}
        onStartDemoTour={() => setIsDemoTourOpen(true)}
        onResetData={handleResetData}
        notifications={notifications}
        onMarkNotificationRead={handleMarkNotifRead}
      />

      {/* Role Context & Demo Mode Banner */}
      <div className="bg-slate-100/90 border-b border-slate-200 py-1.5 px-4 text-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">Viewing as:</span>
            {currentRole === 'citizen' && (
              <span className="font-bold text-emerald-900 flex items-center gap-1">
                <User className="w-3.5 h-3.5" /> Citizen Reporter (Maya Sharma)
              </span>
            )}
            {currentRole === 'worker' && (
              <span className="font-bold text-blue-900 flex items-center gap-1">
                <Truck className="w-3.5 h-3.5" /> Zone 1 Field Team (Rajan Kumar)
              </span>
            )}
            {currentRole === 'admin' && (
              <span className="font-bold text-purple-900 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5" /> Municipal Authority (Command Center)
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 text-slate-500">
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
              Demo Mode Active
            </span>
            <span className="hidden md:inline">“See it. Report it. Clean it.”</span>
          </div>
        </div>
      </div>

      {/* Main Dynamic View Content */}
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
            }}
          />
        )}

        {(activeTab === 'report' || activeTab === 'map' || activeTab === 'track' || activeTab === 'how-it-works') && (
          <CitizenView
            reports={reports}
            onReportCreated={() => loadData()}
            onRefresh={() => loadData()}
            initialTab={
              activeTab === 'map'
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

      {/* MOBILE BOTTOM NAVIGATION BAR (Section 36 of prompt) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-2 flex items-center justify-around shadow-lg">
        <button
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center gap-0.5 text-[10px] font-bold ${
            activeTab === 'home' ? 'text-emerald-700' : 'text-slate-500'
          }`}
        >
          <Home className="w-5 h-5" />
          <span>Home</span>
        </button>

        <button
          onClick={() => setActiveTab('map')}
          className={`flex flex-col items-center gap-0.5 text-[10px] font-bold ${
            activeTab === 'map' ? 'text-emerald-700' : 'text-slate-500'
          }`}
        >
          <MapPin className="w-5 h-5" />
          <span>Map</span>
        </button>

        {/* Central Prominent Report Button */}
        <button
          onClick={() => {
            setCurrentRole('citizen');
            setActiveTab('report');
          }}
          className="-mt-5 w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/40 ring-4 ring-white cursor-pointer"
        >
          <Camera className="w-6 h-6" />
        </button>

        <button
          onClick={() => setActiveTab('track')}
          className={`flex flex-col items-center gap-0.5 text-[10px] font-bold ${
            activeTab === 'track' ? 'text-emerald-700' : 'text-slate-500'
          }`}
        >
          <ClipboardList className="w-5 h-5" />
          <span>My Reports</span>
        </button>

        <button
          onClick={() => {
            setCurrentRole('admin');
            setActiveTab('admin');
          }}
          className={`flex flex-col items-center gap-0.5 text-[10px] font-bold ${
            activeTab === 'admin' ? 'text-purple-700' : 'text-slate-500'
          }`}
        >
          <Building2 className="w-5 h-5" />
          <span>Admin</span>
        </button>
      </nav>

      {/* Municipal Footer (Section 53 of prompt) */}
      <footer className="bg-white border-t border-slate-200 py-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold">
                <Trash2 className="w-4 h-4" />
              </div>
              <div>
                <span className="font-extrabold text-slate-900 text-sm">CleanSpot</span>
                <span className="text-slate-400 ml-1.5">• Building cleaner communities through citizen-powered reporting.</span>
              </div>
            </div>

            <div className="flex items-center gap-4 font-semibold text-slate-600">
              <button onClick={() => setActiveTab('home')} className="hover:text-emerald-700 cursor-pointer">
                Home
              </button>
              <button onClick={() => setActiveTab('report')} className="hover:text-emerald-700 cursor-pointer">
                Report Waste
              </button>
              <button onClick={() => setActiveTab('map')} className="hover:text-emerald-700 cursor-pointer">
                Waste Map
              </button>
              <button onClick={() => setActiveTab('admin')} className="hover:text-emerald-700 cursor-pointer">
                Command Center
              </button>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 border-t border-slate-100 pt-3 text-center sm:text-left">
            Disclaimer: CleanSpot is a civic reporting platform prototype. It does not represent an official government authority unless explicitly deployed and authorized by one.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
