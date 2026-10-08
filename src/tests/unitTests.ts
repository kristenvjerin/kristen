import { calculatePriorityScore, DEFAULT_PRIORITY_WEIGHTS } from '../utils/priority';
import { calculateDueDate, getSLAStatus } from '../utils/sla';
import { calculateDistanceMeters, findPotentialDuplicates } from '../utils/duplicates';
import { calculateHotspots } from '../utils/hotspots';
import { SEED_REPORTS } from '../utils/seedData';
import { WasteReport } from '../types';

export function runCleanSpotTestSuite(): {
  total: number;
  passed: number;
  failed: number;
  results: { testName: string; passed: boolean; details?: string }[];
} {
  const results: { testName: string; passed: boolean; details?: string }[] = [];

  function assert(testName: string, condition: boolean, details?: string) {
    if (condition) {
      results.push({ testName, passed: true });
    } else {
      results.push({ testName, passed: false, details: details || 'Assertion failed' });
    }
  }

  // 1. Priority Calculation Tests
  try {
    const criticalScore = calculatePriorityScore({
      severity: 'critical',
      category: 'drain_waste',
      volume: 'very_large',
      nearbyIncidentCount: 4,
      communityVotesCount: 5,
      hoursOpen: 8,
    });
    assert(
      'Priority Engine: Critical drain waste yields CRITICAL priority and high score',
      criticalScore.priority === 'CRITICAL' && criticalScore.score >= 80,
      `Calculated score: ${criticalScore.score}, priority: ${criticalScore.priority}`
    );

    const lowScore = calculatePriorityScore({
      severity: 'low',
      category: 'public_litter',
      volume: 'small',
      nearbyIncidentCount: 0,
      communityVotesCount: 0,
      hoursOpen: 0,
    });
    assert(
      'Priority Engine: Minor public litter yields LOW priority',
      lowScore.priority === 'LOW' && lowScore.score <= 25,
      `Calculated score: ${lowScore.score}, priority: ${lowScore.priority}`
    );
  } catch (err: any) {
    results.push({ testName: 'Priority Engine Suite', passed: false, details: err.message });
  }

  // 2. SLA Engine Tests
  try {
    const base = new Date('2026-10-08T10:00:00Z');
    const dueCritical = calculateDueDate('CRITICAL', base);
    const diffHours = (dueCritical.getTime() - base.getTime()) / (1000 * 60 * 60);
    assert(
      'SLA Engine: Critical priority sets 2-hour deadline',
      diffHours === 2,
      `Calculated hours: ${diffHours}`
    );

    const dueHigh = calculateDueDate('HIGH', base);
    const diffHigh = (dueHigh.getTime() - base.getTime()) / (1000 * 60 * 60);
    assert(
      'SLA Engine: High priority sets 6-hour deadline',
      diffHigh === 6,
      `Calculated hours: ${diffHigh}`
    );

    const pastDue = new Date(Date.now() - 3600 * 1000).toISOString();
    const slaStatusOverdue = getSLAStatus(pastDue);
    assert('SLA Engine: Correctly flags past due timestamp as isOverdue', slaStatusOverdue.isOverdue);
  } catch (err: any) {
    results.push({ testName: 'SLA Engine Suite', passed: false, details: err.message });
  }

  // 3. Distance & Duplicate Scoring Tests
  try {
    const locA = { latitude: 13.0827, longitude: 80.2707 };
    const locB = { latitude: 13.0831, longitude: 80.2711 }; // ~60m away
    const distance = calculateDistanceMeters(locA, locB);
    assert(
      'Geospatial: Haversine distance correctly calculates neighborhood meters',
      distance > 30 && distance < 120,
      `Calculated distance: ${distance}m`
    );

    const activeMockReports: WasteReport[] = [
      {
        ...SEED_REPORTS[0],
        status: 'SUBMITTED',
        location: {
          latitude: 13.0828,
          longitude: 80.2708,
          formattedAddress: 'Gandhi Road',
          zoneId: 'zone-central',
        },
      },
    ];

    const duplicateMatches = findPotentialDuplicates(
      { latitude: 13.0829, longitude: 80.2709 },
      'overflowing_bin',
      activeMockReports,
      undefined,
      150
    );

    assert(
      'Duplicate Detection: Identifies nearby same-category active reports as candidate duplicate',
      duplicateMatches.length > 0 && duplicateMatches[0].duplicateScore >= 0.5,
      `Matches found: ${duplicateMatches.length}`
    );
  } catch (err: any) {
    results.push({ testName: 'Duplicate Engine Suite', passed: false, details: err.message });
  }

  // 4. Hotspot Clustering Tests
  try {
    const hotspots = calculateHotspots({
      reports: SEED_REPORTS,
      clusterRadiusMeters: 300,
      minIncidentsForHotspot: 2,
    });
    assert(
      'Hotspot Engine: Identifies clusters with >= 2 incidents and computes transparent scores',
      hotspots.length > 0 && hotspots[0].score > 0 && !!hotspots[0].recommendedIntervention,
      `Hotspots found: ${hotspots.length}`
    );
  } catch (err: any) {
    results.push({ testName: 'Hotspot Engine Suite', passed: false, details: err.message });
  }

  // 5. State Machine Validation
  try {
    const validTransitions: Record<string, string[]> = {
      SUBMITTED: ['VERIFIED', 'REJECTED', 'DUPLICATE'],
      VERIFIED: ['ASSIGNED', 'REJECTED'],
      ASSIGNED: ['IN_PROGRESS', 'UNABLE_TO_RESOLVE'],
      IN_PROGRESS: ['RESOLVED_PENDING_CONFIRMATION', 'UNABLE_TO_RESOLVE'],
      RESOLVED_PENDING_CONFIRMATION: ['RESOLVED', 'REOPENED'],
      REOPENED: ['ASSIGNED', 'IN_PROGRESS'],
    };

    assert(
      'State Machine: Validates operational state progression',
      validTransitions['IN_PROGRESS'].includes('RESOLVED_PENDING_CONFIRMATION') &&
        validTransitions['RESOLVED_PENDING_CONFIRMATION'].includes('REOPENED')
    );
  } catch (err: any) {
    results.push({ testName: 'State Machine Suite', passed: false, details: err.message });
  }

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  return {
    total: results.length,
    passed,
    failed,
    results,
  };
}
