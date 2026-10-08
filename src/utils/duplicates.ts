import { GeoLocation, WasteCategory, WasteReport } from '../types';

/**
 * Haversine distance formula between two GPS coordinates in meters.
 */
export function calculateDistanceMeters(
  loc1: { latitude: number; longitude: number },
  loc2: { latitude: number; longitude: number }
): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (loc1.latitude * Math.PI) / 180;
  const phi2 = (loc2.latitude * Math.PI) / 180;
  const deltaPhi = ((loc2.latitude - loc1.latitude) * Math.PI) / 180;
  const deltaLambda = ((loc2.longitude - loc1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

export interface DuplicateMatch {
  candidateReport: WasteReport;
  distanceMeters: number;
  duplicateScore: number; // 0.0 - 1.0
  reasons: string[];
}

/**
 * Evaluates candidate duplicates among active reports.
 */
export function findPotentialDuplicates(
  newLocation: GeoLocation | { latitude: number; longitude: number },
  category: WasteCategory,
  activeReports: WasteReport[],
  excludeReportId?: string,
  searchRadiusMeters: number = 200
): DuplicateMatch[] {
  const matches: DuplicateMatch[] = [];

  for (const report of activeReports) {
    if (excludeReportId && report.id === excludeReportId) continue;
    if (report.status === 'RESOLVED' || report.status === 'REJECTED' || report.status === 'CANCELLED') {
      continue;
    }

    const dist = calculateDistanceMeters(newLocation, report.location);
    if (dist > searchRadiusMeters) continue;

    const reasons: string[] = [];
    let score = 0;

    // 1. Proximity score (Max 0.5)
    // Within 25m -> 0.5, within 100m -> 0.35, within 200m -> 0.2
    if (dist <= 30) {
      score += 0.5;
      reasons.push(`Extremely close distance (${dist}m)`);
    } else if (dist <= 100) {
      score += 0.35;
      reasons.push(`Nearby location (${dist}m)`);
    } else {
      score += 0.2;
      reasons.push(`Within neighborhood radius (${dist}m)`);
    }

    // 2. Category match (Max 0.3)
    if (report.category === category) {
      score += 0.3;
      reasons.push(`Identical waste category (${category.replace('_', ' ')})`);
    } else if (
      (report.category === 'mixed_municipal_waste' && category === 'roadside_garbage') ||
      (report.category === 'roadside_garbage' && category === 'mixed_municipal_waste')
    ) {
      score += 0.15;
      reasons.push('Related waste category');
    }

    // 3. Time recency (Max 0.2 if reported within last 48 hours)
    const reportTime = new Date(report.createdAt).getTime();
    const ageHours = (Date.now() - reportTime) / (1000 * 60 * 60);
    if (ageHours < 24) {
      score += 0.2;
      reasons.push(`Reported very recently (${Math.round(ageHours)}h ago)`);
    } else if (ageHours < 72) {
      score += 0.1;
      reasons.push(`Reported within 3 days`);
    }

    const normalizedScore = Number(Math.min(score, 1.0).toFixed(2));
    if (normalizedScore >= 0.45) {
      matches.push({
        candidateReport: report,
        distanceMeters: dist,
        duplicateScore: normalizedScore,
        reasons,
      });
    }
  }

  // Sort highest duplicate score first
  return matches.sort((a, b) => b.duplicateScore - a.duplicateScore);
}
