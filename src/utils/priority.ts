import { PriorityLevel, SeverityLevel, WasteCategory, WasteVolume } from '../types';

export interface PriorityWeights {
  severityWeights: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  volumeWeights: {
    very_large: number;
    large: number;
    medium: number;
    small: number;
  };
  communityConfirmationsBonus: number; // bonus per citizen vote
  drainObstructionBonus: number;
  hazardousBonus: number;
  maxScore: number;
}

export const DEFAULT_PRIORITY_WEIGHTS: PriorityWeights = {
  severityWeights: {
    critical: 40,
    high: 28,
    medium: 16,
    low: 8,
  },
  volumeWeights: {
    very_large: 20,
    large: 15,
    medium: 10,
    small: 4,
  },
  communityConfirmationsBonus: 5,
  drainObstructionBonus: 20,
  hazardousBonus: 25,
  maxScore: 100,
};

/**
 * Calculates a transparent deterministic 0-100 priority score and maps to PriorityLevel.
 */
export function calculatePriorityScore(params: {
  severity: SeverityLevel;
  category: WasteCategory;
  volume?: WasteVolume;
  nearbyIncidentCount?: number;
  communityVotesCount?: number;
  hoursOpen?: number;
  weights?: PriorityWeights;
}): { score: number; priority: PriorityLevel; breakdown: Record<string, number>; reasonSummary: string } {
  const weights = params.weights || DEFAULT_PRIORITY_WEIGHTS;
  const breakdown: Record<string, number> = {};
  const reasons: string[] = [];

  // 1. Severity weight
  const sevScore = weights.severityWeights[params.severity] || 15;
  breakdown['Severity Factor'] = sevScore;
  reasons.push(`${params.severity.toUpperCase()} severity (+${sevScore})`);

  // 2. Volume weight
  const volKey = params.volume || 'medium';
  const volScore = weights.volumeWeights[volKey] || 10;
  breakdown['Waste Volume'] = volScore;

  // 3. Sensitive Category
  if (params.category === 'drain_waste') {
    breakdown['Drain Obstruction Risk'] = weights.drainObstructionBonus;
    reasons.push(`Waterway/drain flood risk (+${weights.drainObstructionBonus})`);
  } else if (params.category === 'hazardous_waste') {
    breakdown['Hazardous Material Risk'] = weights.hazardousBonus;
    reasons.push(`Chemical/medical hazard risk (+${weights.hazardousBonus})`);
  }

  // 4. Community confirmations & duplicates
  const votes = params.communityVotesCount || 0;
  if (votes > 0) {
    const voteBonus = Math.min(votes * weights.communityConfirmationsBonus, 20);
    breakdown['Community Confirmations'] = voteBonus;
    reasons.push(`${votes} supporting citizen votes (+${voteBonus})`);
  }

  const nearbyCount = Math.min(params.nearbyIncidentCount || 0, 4);
  if (nearbyCount > 0) {
    const clusterScore = nearbyCount * 4;
    breakdown['Area Cluster Factor'] = clusterScore;
    reasons.push(`${nearbyCount} duplicate reports nearby (+${clusterScore})`);
  }

  // 5. Aging escalation
  const hours = params.hoursOpen || 0;
  if (hours >= 24) {
    const ageScore = Math.min(Math.floor(hours / 12) * 3, 15);
    breakdown['Aging Escalation'] = ageScore;
    reasons.push(`Unresolved for ${Math.floor(hours / 24)}d (+${ageScore})`);
  }

  // Total summed score capped at maxScore (100)
  const rawTotal = Object.values(breakdown).reduce((sum, v) => sum + v, 0);
  const score = Math.min(Math.round(rawTotal), weights.maxScore);

  let priority: PriorityLevel = 'LOW';
  if (score >= 75) {
    priority = 'CRITICAL';
  } else if (score >= 50) {
    priority = 'HIGH';
  } else if (score >= 25) {
    priority = 'MEDIUM';
  } else {
    priority = 'LOW';
  }

  const reasonSummary = reasons.join(' + ');

  return { score, priority, breakdown, reasonSummary };
}
