import React, { useState } from 'react';
import { UserRole } from '../types';
import {
  Sparkles,
  ChevronRight,
  ChevronLeft,
  X,
  CheckCircle2,
  Camera,
  Shield,
  Truck,
  Flame,
  Award,
} from 'lucide-react';

interface HackathonDemoTourProps {
  isOpen: boolean;
  onClose: () => void;
  onSetRole: (role: UserRole) => void;
}

export const HackathonDemoTour: React.FC<HackathonDemoTourProps> = ({
  isOpen,
  onClose,
  onSetRole,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);

  if (!isOpen) return null;

  const steps = [
    {
      step: 1,
      title: 'Demo 1: Citizen Quick Report & AI Analysis',
      role: 'citizen' as UserRole,
      icon: Camera,
      tag: 'CITIZEN DISCOVERY',
      description:
        'A citizen spots an overflowing public garbage bin on the sidewalk. They open CleanSpot, click "Report Waste", upload a photo or pick a sample preset. Gemini Multimodal AI categorizes the waste, assesses severity, and suggests volume in under 30 seconds.',
      actionNote: 'Citizen View → "Report Waste" → Pick Preset 1 → Watch AI Scan & Pin Location!',
    },
    {
      step: 2,
      title: 'Demo 2: Report Generated & Community Confirmation',
      role: 'citizen' as UserRole,
      icon: Award,
      tag: 'SUBMISSION & COMMUNITY VOTING',
      description:
        'CleanSpot generates a unique ID (such as CS-2026-000184). Nearby citizens exploring the Waste Map can confirm "Is this waste still here?" (Still There / Worsened), increasing priority confidence without creating duplicate complaints.',
      actionNote: 'Explore Waste Map → Find report → Vote "Still There" or "Cleaned"!',
    },
    {
      step: 3,
      title: 'Demo 3: Authority Command Center & Duplicate Linking',
      role: 'admin' as UserRole,
      icon: Shield,
      tag: 'AUTHORITY INTAKE',
      description:
        'The report enters the CleanSpot Command Center. Authorities inspect the report on the GIS map, review the transparent Smart Priority score, and check duplicate candidates within 200m to group them without losing citizen evidence.',
      actionNote: 'Command Center → Report Management → Inspect report → Review duplicate grouping & SLA!',
    },
    {
      step: 4,
      title: 'Demo 4: Cleanup Team Assignment & Worker Dispatch',
      role: 'admin' as UserRole,
      icon: Truck,
      tag: 'TEAM DISPATCH',
      description:
        'The authority verifies the report and assigns a specialized crew (e.g., Zone 1 Sanitation Team). The field worker receives the work order with GPS coordinates and starts cleanup on site.',
      actionNote: 'Inspect Report → Assign to Zone 1 Sanitation Team (Rajan Kumar)!',
    },
    {
      step: 5,
      title: 'Demo 5: Resolution Proof & AI Clearance Comparison',
      role: 'worker' as UserRole,
      icon: CheckCircle2,
      tag: 'BEFORE / AFTER PROOF',
      description:
        'After clearing the debris, the crew uploads an AFTER cleanup photo. CleanSpot runs an AI comparative audit confirming the sidewalk is clear, creating visible proof of impact before marking it resolved.',
      actionNote: 'Field Team View → Select Task → Complete Resolution → Test Clean Photo → Submit Evidence!',
    },
    {
      step: 6,
      title: 'Demo 6: Hotspot Analytics & Recurring Problem Detection',
      role: 'admin' as UserRole,
      icon: Flame,
      tag: 'PREVENTIVE HOTSPOT INTELLIGENCE',
      description:
        'If a location repeatedly receives reports after being closed, CleanSpot flags it as a "Recurring Waste Hotspot". Authorities inspect the 0-100 mathematical score and apply structural interventions (e.g., double bin capacity or schedule additional sweeps).',
      actionNote: 'Command Center → "Waste Hotspots & Trends" → Inspect structural interventions!',
    },
  ];

  const active = steps[currentStep - 1];
  const IconComponent = active.icon;

  const handleNext = () => {
    if (currentStep < steps.length) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      onSetRole(steps[nextStep - 1].role);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      onSetRole(steps[prevStep - 1].role);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 space-y-6 shadow-2xl border border-slate-200 animate-in fade-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">
                CleanSpot 3-Minute Guided Walkthrough
              </h3>
              <span className="text-[11px] text-slate-500 font-medium">
                Step {currentStep} of {steps.length}: {active.tag}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Content */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shrink-0">
              <IconComponent className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Persona: {active.role.toUpperCase()}
              </span>
              <h4 className="font-extrabold text-slate-900 text-base mt-1">{active.title}</h4>
            </div>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-200">
            {active.description}
          </p>

          <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-300 text-xs text-emerald-950 font-semibold flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{active.actionNote}</span>
          </div>
        </div>

        {/* Progress Dots */}
        <div className="flex items-center justify-center gap-1.5 pt-1">
          {steps.map((s) => (
            <button
              key={s.step}
              onClick={() => {
                setCurrentStep(s.step);
                onSetRole(s.role);
              }}
              className={`h-2 rounded-full transition-all cursor-pointer ${
                s.step === currentStep ? 'w-6 bg-emerald-600' : 'w-2 bg-slate-200 hover:bg-slate-300'
              }`}
            />
          ))}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <button
            onClick={handlePrev}
            disabled={currentStep === 1}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl disabled:opacity-30 cursor-pointer flex items-center gap-1"
          >
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>

          <button
            onClick={handleNext}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer flex items-center gap-1"
          >
            {currentStep === steps.length ? 'Finish Tour' : 'Next Step'} <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
