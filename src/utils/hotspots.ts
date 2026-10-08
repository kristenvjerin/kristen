import { Hotspot, SeverityLevel, WasteCategory, WasteReport } from '../types';
import { calculateDistanceMeters } from './duplicates';

export interface HotspotCalculationParams {
  reports: WasteReport[];
  clusterRadiusMeters?: number; // default 250m
  minIncidentsForHotspot?: number; // default 2
}

/**
 * Groups reports into geospatial clusters and computes transparent hotspot intelligence.
 */
export function calculateHotspots(params: HotspotCalculationParams): Hotspot[] {
  const { reports, clusterRadiusMeters = 250, minIncidentsForHotspot = 2 } = params;
  if (!reports || reports.length === 0) return [];

  // Consider all historical & active reports to calculate chronic patterns
  const clusters: {
    center: { latitude: number; longitude: number };
    reports: WasteReport[];
    zoneId: string;
    locality: string;
  }[] = [];

  for (const report of reports) {
    let matchedCluster = null;

    for (const cluster of clusters) {
      const dist = calculateDistanceMeters(report.location, cluster.center);
      if (dist <= clusterRadiusMeters) {
        matchedCluster = cluster;
        break;
      }
    }

    if (matchedCluster) {
      matchedCluster.reports.push(report);
      // Re-center coordinates slightly towards center of mass
      const len = matchedCluster.reports.length;
      matchedCluster.center.latitude =
        (matchedCluster.center.latitude * (len - 1) + report.location.latitude) / len;
      matchedCluster.center.longitude =
        (matchedCluster.center.longitude * (len - 1) + report.location.longitude) / len;
    } else {
      clusters.push({
        center: { latitude: report.location.latitude, longitude: report.location.longitude },
        reports: [report],
        zoneId: report.zoneId || 'zone-central',
        locality: report.location.locality || report.location.formattedAddress || 'Urban Sector',
      });
    }
  }

  // Filter clusters with at least minIncidentsForHotspot
  const qualifyingClusters = clusters.filter((c) => c.reports.length >= minIncidentsForHotspot);

  const hotspots: Hotspot[] = qualifyingClusters.map((cluster, index) => {
    const clusterReports = cluster.reports;
    const incidentCount = clusterReports.length;

    // 1. Category aggregation
    const categoryCounts: Record<string, number> = {};
    let criticalOrHighCount = 0;
    let totalResolutionHours = 0;
    let resolvedReportsCount = 0;
    let reopenedCount = 0;

    for (const r of clusterReports) {
      categoryCounts[r.category] = (categoryCounts[r.category] || 0) + 1;
      if (r.severity === 'critical' || r.severity === 'high') {
        criticalOrHighCount++;
      }
      if (r.status === 'REOPENED' || (r.reopenCount && r.reopenCount > 0)) {
        reopenedCount++;
      }
      if (r.resolvedAt && r.createdAt) {
        const diffMs = new Date(r.resolvedAt).getTime() - new Date(r.createdAt).getTime();
        totalResolutionHours += Math.max(1, diffMs / (1000 * 60 * 60));
        resolvedReportsCount++;
      }
    }

    const avgResolutionHours =
      resolvedReportsCount > 0 ? Math.round(totalResolutionHours / resolvedReportsCount) : 18;

    const recurringCategories = Object.entries(categoryCounts)
      .map(([cat, count]) => ({ category: cat as WasteCategory, count }))
      .sort((a, b) => b.count - a.count);

    const dominantCategory = recurringCategories[0]?.category || 'mixed_municipal_waste';

    // 2. Hotspot scoring formula (0 - 100)
    // - Incident count frequency: min(count * 8, 40)
    // - Severity ratio factor: (criticalOrHigh / count) * 25
    // - Reopen / chronic recidivism: min(reopenedCount * 10, 20)
    // - Resolution delay factor: min(avgResolutionHours / 2, 15)
    const frequencyFactor = Math.min(incidentCount * 8, 40);
    const severityFactor = (criticalOrHighCount / incidentCount) * 25;
    const recidivismFactor = Math.min(reopenedCount * 10, 20);
    const delayFactor = Math.min(avgResolutionHours / 2, 15);

    const rawScore = frequencyFactor + severityFactor + recidivismFactor + delayFactor;
    const score = Math.min(Math.round(rawScore), 100);

    let severityLevel: SeverityLevel = 'medium';
    if (score >= 75) severityLevel = 'critical';
    else if (score >= 50) severityLevel = 'high';
    else if (score >= 25) severityLevel = 'medium';
    else severityLevel = 'low';

    // 3. Data-driven recommendation generation
    let recommendedIntervention = '';
    let interventionType: Hotspot['interventionType'] = 'collection_frequency';
    let sdgImpact = '';

    if (dominantCategory === 'overflowing_bin') {
      recommendedIntervention =
        'Capacity Deficit: Double municipal bin volume (deploy 2x 1100L heavy-duty bins) or increase collection route from 3x/week to daily.';
      interventionType = 'bin_capacity';
      sdgImpact = 'SDG 11: Eliminates neighborhood pest vector and street overflow';
    } else if (dominantCategory === 'illegal_dumping' || dominantCategory === 'construction_debris') {
      recommendedIntervention =
        'Enforcement & Deterrence: Install civic CCTV warning signage, physical barricade along vacant perimeter, and schedule targeted night patrol.';
      interventionType = 'surveillance_signage';
      sdgImpact = 'SDG 11 & 12: Prevents illicit dumping hazardous material contamination';
    } else if (dominantCategory === 'plastic_waste' || dominantCategory === 'mixed_municipal_waste') {
      recommendedIntervention =
        'Source Segregation Hub: Deploy neighborhood segregated recycling deposit cages and conduct community door-to-door awareness.';
      interventionType = 'segregation_hub';
      sdgImpact = 'SDG 12: Diverts high-volume polymers from municipal landfills into circular recovery';
    } else if (dominantCategory === 'drain_waste') {
      recommendedIntervention =
        'Critical Hydrological Risk: Install mesh litter traps upstream, clear stormwater siltation, and deploy barrier nets.';
      interventionType = 'enforcement';
      sdgImpact = 'SDG 11: Prevents urban flash flooding and urban waterbody degradation';
    } else {
      recommendedIntervention =
        'Optimize routing: Adjust morning sanitation beat to include this corridor twice daily.';
      interventionType = 'collection_frequency';
      sdgImpact = 'SDG 11: Improves municipal operational efficiency and civic street cleanliness';
    }

    const repeatOffenseRate = Math.min(Math.round((reopenedCount / Math.max(incidentCount, 1)) * 100), 100);

    return {
      id: `HOTSPOT-${String(index + 1).padStart(3, '0')}`,
      name: `${cluster.locality.split(',')[0]} Chronic Hotspot`,
      zoneId: cluster.zoneId,
      center: cluster.center,
      radiusMeters: clusterRadiusMeters,
      score,
      severityLevel,
      incidentCount,
      recurringCategories,
      averageResolutionHours: avgResolutionHours,
      repeatOffenseRate,
      recommendedIntervention,
      interventionType,
      sdgImpact,
      calculatedAt: new Date().toISOString(),
    };
  });

  return hotspots.sort((a, b) => b.score - a.score);
}
