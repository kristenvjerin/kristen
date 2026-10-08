import { WasteCategory, WasteCategoryInfo } from '../types';

export const WASTE_CATEGORIES: WasteCategoryInfo[] = [
  {
    id: 'overflowing_bin',
    label: 'Overflowing Public Bin',
    icon: 'Trash2',
    color: '#EF4444',
    description: 'Community or street bin filled past capacity and spilling onto pavement.',
    defaultSeverity: 'high',
  },
  {
    id: 'illegal_dumping',
    label: 'Illegal Dumping / Fly-Tipping',
    icon: 'AlertTriangle',
    color: '#DC2626',
    description: 'Unauthorized dumping on vacant lots, corners, or roadsides.',
    defaultSeverity: 'critical',
  },
  {
    id: 'roadside_garbage',
    label: 'Roadside Garbage Pile',
    icon: 'Footprints',
    color: '#F97316',
    description: 'Scattered garbage accumulation obstructing public pathways.',
    defaultSeverity: 'medium',
  },
  {
    id: 'plastic_waste',
    label: 'Plastic Waste Accumulation',
    icon: 'Recycle',
    color: '#3B82F6',
    description: 'Single-use bottles, packaging polymers, or plastic bags.',
    defaultSeverity: 'medium',
  },
  {
    id: 'organic_waste',
    label: 'Food & Organic Waste',
    icon: 'Apple',
    color: '#10B981',
    description: 'Decomposing food remnants, wet kitchen refuse, or market discards.',
    defaultSeverity: 'high',
  },
  {
    id: 'construction_debris',
    label: 'Construction & Demolition Debris',
    icon: 'Hammer',
    color: '#6B7280',
    description: 'Concrete chunks, rubble, tiles, broken plaster, or gravel piles.',
    defaultSeverity: 'medium',
  },
  {
    id: 'e_waste',
    label: 'Electronic Waste (E-Waste)',
    icon: 'Cpu',
    color: '#8B5CF6',
    description: 'Discarded electronics, batteries, appliances, or cables.',
    defaultSeverity: 'high',
  },
  {
    id: 'hazardous_waste',
    label: 'Hazardous / Chemical Waste',
    icon: 'Biohazard',
    color: '#991B1B',
    description: 'Medical supplies, paint chemicals, oils, or sharp glass hazards.',
    defaultSeverity: 'critical',
  },
  {
    id: 'drain_waste',
    label: 'Waste in Drain / Waterway',
    icon: 'Droplets',
    color: '#06B6D4',
    description: 'Debris choking drainage culverts, gutters, or urban canals.',
    defaultSeverity: 'critical',
  },
  {
    id: 'public_litter',
    label: 'Public Space / Park Litter',
    icon: 'Trees',
    color: '#14B8A6',
    description: 'Litter scattered in community playgrounds, bus shelters, or parks.',
    defaultSeverity: 'low',
  },
  {
    id: 'mixed_municipal_waste',
    label: 'Mixed Unsegregated Waste',
    icon: 'Package',
    color: '#EAB308',
    description: 'General unseparated commercial and household municipal trash.',
    defaultSeverity: 'high',
  },
  {
    id: 'other',
    label: 'Other Waste Hazard',
    icon: 'HelpCircle',
    color: '#9CA3AF',
    description: 'Unclassified waste or civic sanitation hazard.',
    defaultSeverity: 'medium',
  },
];

export function getCategoryInfo(id: WasteCategory): WasteCategoryInfo {
  return (
    WASTE_CATEGORIES.find((c) => c.id === id) || {
      id: 'other',
      label: 'Other Waste Hazard',
      icon: 'HelpCircle',
      color: '#9CA3AF',
      description: 'Unclassified waste hazard',
      defaultSeverity: 'medium',
    }
  );
}
