import type {
  Importance,
  MatchStatus,
  RequirementCategory,
} from "./match-schema";

export const REQUIREMENT_CATEGORIES: RequirementCategory[] = [
  "skills",
  "experience",
  "responsibilities",
  "education",
  "languages",
];

const IMPORTANCE_WEIGHTS: Record<Importance, number> = {
  required: 2,
  preferred: 1,
  unspecified: 1,
};

const STATUS_VALUES: Record<MatchStatus, number> = {
  matched: 1,
  partial: 0.5,
  missing: 0,
  uncertain: 0,
};

export type ScoringRequirement = {
  category: RequirementCategory;
  importance: Importance;
  status: MatchStatus;
};

export type ScoreBreakdown = {
  score: number | null;
  earnedPoints: number;
  possiblePoints: number;
  matched: number;
  partial: number;
  missing: number;
  uncertain: number;
};

function calculateBreakdown(
  requirements: ScoringRequirement[],
): ScoreBreakdown {
  let earnedPoints = 0;
  let possiblePoints = 0;
  const counts: Record<MatchStatus, number> = {
    matched: 0,
    partial: 0,
    missing: 0,
    uncertain: 0,
  };

  for (const requirement of requirements) {
    const importanceWeight = IMPORTANCE_WEIGHTS[requirement.importance];

    earnedPoints += importanceWeight * STATUS_VALUES[requirement.status];
    possiblePoints += importanceWeight;
    counts[requirement.status] += 1;
  }

  return {
    // Scores use ordinary rounding to the nearest whole percentage.
    score:
      possiblePoints === 0
        ? null
        : Math.round((earnedPoints / possiblePoints) * 100),
    earnedPoints,
    possiblePoints,
    ...counts,
  };
}

export function calculateMatchScores(requirements: ScoringRequirement[]) {
  const overall = calculateBreakdown(requirements);
  const categories = Object.fromEntries(
    REQUIREMENT_CATEGORIES.map((category) => [
      category,
      calculateBreakdown(
        requirements.filter((requirement) => requirement.category === category),
      ),
    ]),
  ) as Record<RequirementCategory, ScoreBreakdown>;

  return {
    // No requirements means there is no possible score; the API returns 0.
    overallScore: overall.score ?? 0,
    categories,
  };
}
