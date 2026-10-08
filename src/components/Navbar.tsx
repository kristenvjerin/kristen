import React, { useState, useEffect } from 'react';
import { InAppNotification, UserRole } from '../types';
import { ApiService } from '../services/api';
import {
  RotateCcw,
  Bell,
  Menu,
  X,
  MapPin,
  Camera,
  Building2,
  User,
  Truck,
  Trash2,
  HelpCircle,
  Award,
  Trophy,
  ShieldCheck,
  Gamepad2,
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
  const [fontDropdownOpen, setFontDropdownOpen] = useState(false);
  const [gameFont, setGameFont] = useState<string>(() => {
    return localStorage.getItem('cleanspot_game_font') || 'hud';
  });

  useEffect(() => {
    const saved = localStorage.getItem('cleanspot_game_font') || 'hud';
    document.body.setAttribute('data-game-font', saved);
  }, []);

  const changeGameFont = (fontKey: string) => {
    setGameFont(fontKey);
    localStorage.setItem('cleanspot_game_font', fontKey);
    document.body.setAttribute('data-game-font', fontKey);
    setFontDropdownOpen(false);
  };

  const profile = ApiService.getUserProfile();
  const unreadNotifs = notifications.filter((n) => !n.read);

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-[#E2E8E4]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Wordmark */}
          <div
            onClick={() => onNavigateTab('home')}
            className="flex items-center gap-2.5 cursor-pointer"
          >
            <div className="w-9 h-9 rounded-[8px] bg-[#176B45] flex items-center justify-center text-white shadow-xs">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <span className="font-display font-black text-lg sm:text-xl text-[#17201B] tracking-wider block leading-tight">
                CleanSpot
              </span>
              <p className="text-[11px] text-[#657169] hidden sm:block tracking-wide">
                Report waste. Earn points. Improve your area.
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            <button
              onClick={() => onNavigateTab('home')}
              className={`px-3 py-1.5 rounded-[6px] text-xs font-medium transition-colors cursor-pointer ${
                activeNavTab === 'home'
                  ? 'text-[#176B45] bg-[#E8F5EE] font-semibold'
                  : 'text-[#657169] hover:text-[#17201B] hover:bg-slate-50'
              }`}
            >
              Home
            </button>
            <button
              onClick={() => onNavigateTab('report')}
              className={`px-3 py-1.5 rounded-[6px] text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeNavTab === 'report'
                  ? 'text-[#176B45] bg-[#E8F5EE] font-semibold'
                  : 'text-[#657169] hover:text-[#17201B] hover:bg-slate-50'
              }`}
            >
              <Camera className="w-3.5 h-3.5 text-[#176B45]" />
              <span>Report waste</span>
            </button>
            <button
              onClick={() => onNavigateTab('profile')}
              className={`px-3 py-1.5 rounded-[6px] text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeNavTab === 'profile'
                  ? 'text-[#176B45] bg-[#E8F5EE] font-semibold'
                  : 'text-[#657169] hover:text-[#17201B] hover:bg-slate-50'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#176B45]" />
              <span>Civic profile</span>
            </button>
            <button
              onClick={() => onNavigateTab('leaderboard')}
              className={`px-3 py-1.5 rounded-[6px] text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeNavTab === 'leaderboard'
                  ? 'text-[#176B45] bg-[#E8F5EE] font-semibold'
                  : 'text-[#657169] hover:text-[#17201B] hover:bg-slate-50'
              }`}
            >
              <Trophy className="w-3.5 h-3.5 text-[#176B45]" />
              <span>Leaders</span>
            </button>
            <button
              onClick={() => onNavigateTab('map')}
              className={`px-3 py-1.5 rounded-[6px] text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeNavTab === 'map'
                  ? 'text-[#176B45] bg-[#E8F5EE] font-semibold'
                  : 'text-[#657169] hover:text-[#17201B] hover:bg-slate-50'
              }`}
            >
              <MapPin className="w-3.5 h-3.5 text-[#176B45]" />
              <span>Waste map</span>
            </button>
            <button
              onClick={() => onNavigateTab('admin')}
              className={`px-3 py-1.5 rounded-[6px] text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeNavTab === 'admin'
                  ? 'text-[#176B45] bg-[#E8F5EE] font-semibold'
                  : 'text-[#657169] hover:text-[#17201B] hover:bg-slate-50'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-slate-700" />
              <span>Command center</span>
            </button>
          </nav>

          {/* Right Controls: Civic Points Badge, Tour, Notifications, Role */}
          <div className="flex items-center gap-2">
            {/* Live Civic Points Badge */}
            <button
              onClick={() => onNavigateTab('profile')}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] bg-[#E8F5EE] hover:bg-[#D6EFE0] text-[#0E4D32] border border-[#CBE5D7] text-xs font-bold transition-colors cursor-pointer"
              title="Your Civic Points & Level"
            >
              <Award className="w-3.5 h-3.5 text-[#176B45]" />
              <span className="font-display tracking-wide font-extrabold">LVL {profile.level} • {profile.civicPoints.toLocaleString()} PTS</span>
            </button>

            {/* Game Font Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setFontDropdownOpen(!fontDropdownOpen)}
                className="touch-target flex items-center gap-1.5 px-2.5 py-1.5 rounded-[6px] bg-[#F7F9F7] hover:bg-[#E8F5EE] border border-[#E2E8E4] text-[#17201B] text-xs font-semibold transition-colors cursor-pointer"
                title="Select Game Font Style"
              >
                <Gamepad2 className="w-3.5 h-3.5 text-[#176B45]" />
                <span className="hidden xl:inline uppercase font-display text-[10px] tracking-wider text-[#176B45]">
                  {gameFont === 'hud' ? 'HUD' : gameFont === 'tactical' ? 'Tactical' : gameFont === 'arcade' ? 'Arcade' : 'Orbit'}
                </span>
              </button>

              {fontDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-[12px] shadow-xl border border-[#E2E8E4] p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#657169] border-b border-[#E2E8E4] mb-1 font-display">
                    Game Font Style
                  </div>
                  <button
                    onClick={() => changeGameFont('hud')}
                    className={`w-full text-left px-2.5 py-2 rounded-[6px] text-xs font-semibold flex items-center justify-between cursor-pointer transition-colors ${
                      gameFont === 'hud' ? 'bg-[#E8F5EE] text-[#0E4D32]' : 'hover:bg-slate-50 text-[#17201B]'
                    }`}
                  >
                    <div className="font-['Rajdhani'] font-bold text-sm">🎮 Modern HUD</div>
                    <span className="text-[10px] text-[#657169]">Rajdhani</span>
                  </button>
                  <button
                    onClick={() => changeGameFont('tactical')}
                    className={`w-full text-left px-2.5 py-2 rounded-[6px] text-xs font-semibold flex items-center justify-between cursor-pointer transition-colors ${
                      gameFont === 'tactical' ? 'bg-[#E8F5EE] text-[#0E4D32]' : 'hover:bg-slate-50 text-[#17201B]'
                    }`}
                  >
                    <div className="font-['Chakra_Petch'] font-bold text-xs">🎯 Tactical Ops</div>
                    <span className="text-[10px] text-[#657169]">Chakra</span>
                  </button>
                  <button
                    onClick={() => changeGameFont('arcade')}
                    className={`w-full text-left px-2.5 py-2 rounded-[6px] text-xs font-semibold flex items-center justify-between cursor-pointer transition-colors ${
                      gameFont === 'arcade' ? 'bg-[#E8F5EE] text-[#0E4D32]' : 'hover:bg-slate-50 text-[#17201B]'
                    }`}
                  >
                    <div className="font-['Silkscreen'] text-[10px]">👾 Retro Arcade</div>
                    <span className="text-[10px] text-[#657169]">8-Bit</span>
                  </button>
                  <button
                    onClick={() => changeGameFont('orbitron')}
                    className={`w-full text-left px-2.5 py-2 rounded-[6px] text-xs font-semibold flex items-center justify-between cursor-pointer transition-colors ${
                      gameFont === 'orbitron' ? 'bg-[#E8F5EE] text-[#0E4D32]' : 'hover:bg-slate-50 text-[#17201B]'
                    }`}
                  >
                    <div className="font-['Orbitron'] text-xs font-bold">🚀 Cyber Orbit</div>
                    <span className="text-[10px] text-[#657169]">Orbitron</span>
                  </button>
                </div>
              )}
            </div>

            {/* Demo Walkthrough Button */}
            <button
              onClick={onStartDemoTour}
              className="touch-target flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] bg-[#F7F9F7] hover:bg-slate-100 border border-[#E2E8E4] text-[#17201B] text-xs font-medium transition-colors cursor-pointer"
              title="Overview of platform workflows"
            >
              <HelpCircle className="w-3.5 h-3.5 text-[#176B45]" />
              <span className="hidden sm:inline">Tour</span>
            </button>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                className="relative p-2 text-[#657169] hover:text-[#17201B] hover:bg-slate-100 rounded-[6px] transition-colors cursor-pointer"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadNotifs.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#D64545] rounded-full"></span>
                )}
              </button>

              {/* Notification Popover */}
              {notifDropdownOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-[10px] shadow-lg border border-[#E2E8E4] p-3.5 z-50">
                  <div className="flex items-center justify-between border-b border-[#E2E8E4] pb-2 mb-2.5">
                    <span className="font-semibold text-xs text-[#17201B]">
                      Notifications
                    </span>
                    <span className="text-[11px] font-medium text-[#176B45] bg-[#E8F5EE] px-2 py-0.5 rounded-[4px]">
                      {unreadNotifs.length} new
                    </span>
                  </div>

                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-[#8B9690] text-center py-4">No notifications yet</p>
                    ) : (
                      notifications.slice(0, 5).map((n) => (
                        <div
                          key={n.id}
                          onClick={() => onMarkNotificationRead(n.id)}
                          className={`p-2.5 rounded-[8px] border text-xs cursor-pointer transition-colors ${
                            n.read
                              ? 'bg-[#F7F9F7] border-[#E2E8E4] text-[#657169]'
                              : 'bg-[#E8F5EE] border-[#3FA66B]/30 text-[#0E4D32]'
                          }`}
                        >
                          <div className="flex items-center justify-between font-semibold text-[11px] mb-0.5">
                            <span>{n.title}</span>
                            <span className="text-[10px] text-[#8B9690] font-normal">
                              {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#657169] leading-relaxed">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Role Switcher */}
            <div className="hidden md:flex items-center bg-[#F7F9F7] p-0.5 rounded-[8px] border border-[#E2E8E4] text-xs">
              <button
                onClick={() => {
                  onRoleChange('citizen');
                  onNavigateTab('report');
                }}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-[6px] font-medium transition-colors cursor-pointer ${
                  currentRole === 'citizen'
                    ? 'bg-white text-[#176B45] font-semibold shadow-xs'
                    : 'text-[#657169] hover:text-[#17201B]'
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
                className={`flex items-center gap-1 px-2.5 py-1 rounded-[6px] font-medium transition-colors cursor-pointer ${
                  currentRole === 'worker'
                    ? 'bg-white text-blue-900 font-semibold shadow-xs'
                    : 'text-[#657169] hover:text-[#17201B]'
                }`}
              >
                <Truck className="w-3.5 h-3.5" />
                <span>Field crew</span>
              </button>

              <button
                onClick={() => {
                  onRoleChange('admin');
                  onNavigateTab('admin');
                }}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-[6px] font-medium transition-colors cursor-pointer ${
                  currentRole === 'admin' || currentRole === 'supervisor'
                    ? 'bg-white text-purple-900 font-semibold shadow-xs'
                    : 'text-[#657169] hover:text-[#17201B]'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Admin</span>
              </button>
            </div>

            {/* Reset Data Button */}
            <button
              onClick={onResetData}
              className="p-2 text-[#8B9690] hover:text-[#17201B] hover:bg-slate-100 rounded-[6px] transition-colors cursor-pointer"
              title="Reset demonstration data"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            {/* Primary Action Button */}
            <button
              onClick={() => onNavigateTab('report')}
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 bg-[#176B45] hover:bg-[#0E4D32] text-white font-medium text-xs rounded-[6px] transition-colors cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Report waste</span>
            </button>

            {/* Mobile Hamburger Menu */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-[#657169] hover:text-[#17201B] rounded-[6px]"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-3 border-t border-[#E2E8E4] space-y-1">
            <button
              onClick={() => {
                onNavigateTab('home');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-[6px] text-xs font-medium text-[#17201B] hover:bg-[#F7F9F7]"
            >
              Home
            </button>
            <button
              onClick={() => {
                onNavigateTab('report');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-[6px] text-xs font-semibold text-[#176B45] bg-[#E8F5EE] flex items-center gap-2"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Report waste</span>
            </button>
            <button
              onClick={() => {
                onNavigateTab('map');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-[6px] text-xs font-medium text-[#17201B] hover:bg-[#F7F9F7] flex items-center gap-2"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Waste map</span>
            </button>
            <button
              onClick={() => {
                onNavigateTab('how-it-works');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-[6px] text-xs font-medium text-[#17201B] hover:bg-[#F7F9F7]"
            >
              How it works
            </button>
            <button
              onClick={() => {
                onNavigateTab('track');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-[6px] text-xs font-medium text-[#17201B] hover:bg-[#F7F9F7]"
            >
              My reports
            </button>
            <button
              onClick={() => {
                onNavigateTab('admin');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-[6px] text-xs font-medium text-[#17201B] hover:bg-[#F7F9F7] flex items-center gap-2"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Command center</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
