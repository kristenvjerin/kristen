import React, { useState } from 'react';
import { InAppNotification, UserRole } from '../types';
import {
  Sparkles,
  RotateCcw,
  Bell,
  Menu,
  X,
  MapPin,
  Camera,
  Layers,
  ShieldCheck,
  Check,
  Building2,
  User,
  Truck,
  Trash2,
} from 'lucide-react';

interface NavbarProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  onNavigateTab: (tab: string) => void;
  activeNavTab: string;
  onStartDemoTour: () => void;
  onResetData: () => void;
  notifications: InAppNotification[];
  onMarkNotificationRead: (id: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  onRoleChange,
  onNavigateTab,
  activeNavTab,
  onStartDemoTour,
  onResetData,
  notifications,
  onMarkNotificationRead,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);

  const unreadNotifs = notifications.filter((n) => !n.read);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-emerald-900/10 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          {/* Logo & Branding */}
          <div
            onClick={() => onNavigateTab('home')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-700 via-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-700/25 group-hover:scale-105 transition-transform">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-2xl text-slate-900 tracking-tight">
                  CleanSpot
                </span>
                <span className="hidden sm:inline-flex text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                  Civic-Tech
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium -mt-0.5">
                See it. Report it. Clean it.
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
            <button
              onClick={() => onNavigateTab('home')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeNavTab === 'home'
                  ? 'text-emerald-800 bg-emerald-50'
                  : 'text-slate-600 hover:text-slate-950 hover:bg-slate-50'
              }`}
            >
              Home
            </button>
            <button
              onClick={() => onNavigateTab('report')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeNavTab === 'report'
                  ? 'text-emerald-800 bg-emerald-50'
                  : 'text-slate-600 hover:text-slate-950 hover:bg-slate-50'
              }`}
            >
              <Camera className="w-3.5 h-3.5 text-emerald-600" />
              Report Waste
            </button>
            <button
              onClick={() => onNavigateTab('map')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeNavTab === 'map'
                  ? 'text-emerald-800 bg-emerald-50'
                  : 'text-slate-600 hover:text-slate-950 hover:bg-slate-50'
              }`}
            >
              <MapPin className="w-3.5 h-3.5 text-teal-600" />
              Waste Map
            </button>
            <button
              onClick={() => onNavigateTab('how-it-works')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeNavTab === 'how-it-works'
                  ? 'text-emerald-800 bg-emerald-50'
                  : 'text-slate-600 hover:text-slate-950 hover:bg-slate-50'
              }`}
            >
              How It Works
            </button>
            <button
              onClick={() => onNavigateTab('track')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeNavTab === 'track'
                  ? 'text-emerald-800 bg-emerald-50'
                  : 'text-slate-600 hover:text-slate-950 hover:bg-slate-50'
              }`}
            >
              Track Status
            </button>
            <button
              onClick={() => onNavigateTab('admin')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeNavTab === 'admin'
                  ? 'text-emerald-900 bg-emerald-100/70 font-bold'
                  : 'text-slate-600 hover:text-slate-950 hover:bg-slate-50'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-slate-700" />
              Command Center
            </button>
          </nav>

          {/* Right Controls: Role Switcher, Notifications, Demo CTA */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Guided Tour Button */}
            <button
              onClick={onStartDemoTour}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-800 hover:to-teal-800 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
              title="Launch Guided 3-Minute Hackathon Demo"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Guided Demo</span>
            </button>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadNotifs.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-600 rounded-full ring-2 ring-white"></span>
                )}
              </button>

              {/* Notification Popover */}
              {notifDropdownOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 z-50 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
                    <span className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                      CleanSpot Notifications
                    </span>
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                      {unreadNotifs.length} new
                    </span>
                  </div>

                  <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-4">No notifications yet</p>
                    ) : (
                      notifications.slice(0, 5).map((n) => (
                        <div
                          key={n.id}
                          onClick={() => onMarkNotificationRead(n.id)}
                          className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-colors ${
                            n.read
                              ? 'bg-slate-50/60 border-slate-100 text-slate-600'
                              : 'bg-emerald-50/70 border-emerald-200 text-emerald-950 font-medium'
                          }`}
                        >
                          <div className="flex items-center justify-between font-bold text-[11px] mb-0.5">
                            <span>{n.title}</span>
                            <span className="text-[10px] text-slate-400 font-normal">
                              {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 leading-relaxed">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Role Switcher Pill Bar */}
            <div className="hidden md:flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
              <button
                onClick={() => {
                  onRoleChange('citizen');
                  onNavigateTab('report');
                }}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                  currentRole === 'citizen'
                    ? 'bg-white text-emerald-900 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Citizen</span>
              </button>

              <button
                onClick={() => {
                  onRoleChange('worker');
                  onNavigateTab('worker');
                }}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                  currentRole === 'worker'
                    ? 'bg-white text-blue-900 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Truck className="w-3.5 h-3.5" />
                <span>Field Team</span>
              </button>

              <button
                onClick={() => {
                  onRoleChange('admin');
                  onNavigateTab('admin');
                }}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                  currentRole === 'admin' || currentRole === 'supervisor'
                    ? 'bg-white text-purple-900 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Authority</span>
              </button>
            </div>

            {/* Reset Demo Data */}
            <button
              onClick={onResetData}
              className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              title="Reset to fresh demo data"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Primary Action Button */}
            <button
              onClick={() => onNavigateTab('report')}
              className="hidden sm:flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
            >
              <Camera className="w-4 h-4" />
              <span>Report Waste</span>
            </button>

            {/* Mobile Hamburger Menu */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-xl"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-slate-100 space-y-2 animate-in slide-in-from-top-2 duration-150">
            <button
              onClick={() => {
                onNavigateTab('home');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Home
            </button>
            <button
              onClick={() => {
                onNavigateTab('report');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-xl text-sm font-semibold text-emerald-800 bg-emerald-50 flex items-center gap-2"
            >
              <Camera className="w-4 h-4" /> Report Waste (Under 30s)
            </button>
            <button
              onClick={() => {
                onNavigateTab('map');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
            >
              <MapPin className="w-4 h-4" /> Waste Map
            </button>
            <button
              onClick={() => {
                onNavigateTab('track');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Track My Report
            </button>
            <button
              onClick={() => {
                onNavigateTab('how-it-works');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              How It Works
            </button>
            <button
              onClick={() => {
                onNavigateTab('admin');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
            >
              <Building2 className="w-4 h-4" /> Command Center (Admin)
            </button>

            {/* Mobile Role Switcher */}
            <div className="pt-2 border-t border-slate-100 flex gap-2">
              <button
                onClick={() => {
                  onRoleChange('citizen');
                  setMobileMenuOpen(false);
                }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold ${
                  currentRole === 'citizen' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                Citizen
              </button>
              <button
                onClick={() => {
                  onRoleChange('worker');
                  setMobileMenuOpen(false);
                }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold ${
                  currentRole === 'worker' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                Field Team
              </button>
              <button
                onClick={() => {
                  onRoleChange('admin');
                  setMobileMenuOpen(false);
                }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold ${
                  currentRole === 'admin' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                Admin
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
