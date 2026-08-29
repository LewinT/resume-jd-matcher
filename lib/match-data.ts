import { calculateMatchScores } from "@/lib/match-scoring";
import type {
  JobRequirement,
  MatchRequest,
  MatchResult,
  RequirementMatch,
  ResumeEvidence,
  SemanticComparisonResponse,
} from "@/lib/match-schema";

function firstEvidenceOrFallback(evidence: string[], fallback: string) {
  return evidence.find((item) => item.trim().length > 0) ?? fallback;
}

export function flattenJobProfile(
  jobProfile: MatchRequest["jobProfile"],
): JobRequirement[] {
  return [
    ...jobProfile.skills.map((skill, index) => ({
      id: `skill-${index}`,
      category: "skills" as const,
      description: skill.name,
      importance: skill.importance,
      jdEvidence: skill.evidence,
    })),
    ...jobProfile.experienceRequirements.map((experience, index) => {
      const details: Record<string, string | number> = {};

      if (experience.area !== null) details.area = experience.area;
      if (experience.minimumYears !== null) {
        details.minimumYears = experience.minimumYears;
      }
      if (experience.seniority !== null) {
        details.seniority = experience.seniority;
      }

      return {
        id: `experience-${index}`,
        category: "experience" as const,
        description: experience.description,
        importance: experience.importance,
        jdEvidence: experience.evidence,
        ...(Object.keys(details).length > 0 ? { details } : {}),
      };
    }),
    ...jobProfile.responsibilities.map((responsibility, index) => ({
      id: `responsibility-${index}`,
      category: "responsibilities" as const,
      description: responsibility.description,
      importance: "unspecified" as const,
      jdEvidence: responsibility.evidence,
    })),
    ...jobProfile.educationRequirements.map((education, index) => {
      const description = [education.credential, education.field]
        .filter((part): part is string => part !== null)
        .join(" — ");
      const details: Record<string, string | number> = {};

      if (education.credential !== null) {
        details.credential = education.credential;
      }
      if (education.field !== null) details.field = education.field;

      return {
        id: `education-${index}`,
        category: "education" as const,
        description:
          description ||
          firstEvidenceOrFallback(
            education.evidence,
            "Education requirement",
          ),
        importance: education.importance,
        jdEvidence: education.evidence,
        ...(Object.keys(details).length > 0 ? { details } : {}),
      };
    }),
    ...jobProfile.languageRequirements.map((language, index) => ({
      id: `language-${index}`,
      category: "languages" as const,
      description: [language.name, language.proficiency]
        .filter((part): part is string => part !== null)
        .join(" — "),
      importance: language.importance,
      jdEvidence: language.evidence,
      ...(language.proficiency === null
        ? {}
        : { details: { proficiency: language.proficiency } }),
    })),
  ];
}

export function buildResumeEvidenceCatalogue(
  resumeProfile: MatchRequest["resumeProfile"],
): ResumeEvidence[] {
  const catalogue: ResumeEvidence[] = [];

  function addEvidence(
    idPrefix: string,
    category: ResumeEvidence["category"],
    evidence: string[],
  ) {
    evidence.forEach((text, evidenceIndex) => {
      if (text.trim().length === 0) return;

      catalogue.push({
        id: `${idPrefix}-evidence-${evidenceIndex}`,
        category,
        text,
      });
    });
  }

  resumeProfile.skills.forEach((skill, skillIndex) => {
    addEvidence(`skill-${skillIndex}`, "skills", skill.evidence);
  });

  resumeProfile.experience.forEach((experience, experienceIndex) => {
    addEvidence(
      `experience-${experienceIndex}`,
      "experience",
      experience.evidence,
    );

    experience.highlights.forEach((highlight, highlightIndex) => {
      addEvidence(
        `experience-${experienceIndex}-highlight-${highlightIndex}`,
        "experience",
        highlight.evidence,
      );
    });
  });

  resumeProfile.education.forEach((education, educationIndex) => {
    addEvidence(`education-${educationIndex}`, "education", education.evidence);
  });

  resumeProfile.languages.forEach((language, languageIndex) => {
    addEvidence(`language-${languageIndex}`, "languages", language.evidence);
  });

  return catalogue;
}

export function resolveSemanticComparisons(
  requirements: JobRequirement[],
  evidenceCatalogue: ResumeEvidence[],
  semanticResult: SemanticComparisonResponse,
): RequirementMatch[] | null {
  if (semanticResult.comparisons.length !== requirements.length) return null;

  const requirementById = new Map(
    requirements.map((requirement) => [requirement.id, requirement]),
  );
  const evidenceById = new Map(
    evidenceCatalogue.map((evidence) => [evidence.id, evidence]),
  );
  const comparisonByRequirementId = new Map(
    semanticResult.comparisons.map((comparison) => [
      comparison.requirementId,
      comparison,
    ]),
  );

  if (comparisonByRequirementId.size !== semanticResult.comparisons.length) {
    return null;
  }

  for (const comparison of semanticResult.comparisons) {
    if (!requirementById.has(comparison.requirementId)) return null;
    if (comparison.explanation.trim().length === 0) return null;

    const uniqueEvidenceIds = new Set(comparison.resumeEvidenceIds);
    if (uniqueEvidenceIds.size !== comparison.resumeEvidenceIds.length) {
      return null;
    }
    if (
      comparison.resumeEvidenceIds.some(
        (evidenceId) => !evidenceById.has(evidenceId),
      )
    ) {
      return null;
    }
    if (
      (comparison.status === "matched" || comparison.status === "partial") &&
      comparison.resumeEvidenceIds.length === 0
    ) {
      return null;
    }
    if (
      comparison.status === "missing" &&
      comparison.resumeEvidenceIds.length > 0
    ) {
      return null;
    }
  }

  return requirements.map((requirement) => {
    const comparison = comparisonByRequirementId.get(requirement.id);

    if (!comparison) {
      throw new Error("Validated semantic comparison is incomplete.");
    }

    return {
      id: requirement.id,
      category: requirement.category,
      requirement: requirement.description,
      importance: requirement.importance,
      status: comparison.status,
      explanation: comparison.explanation,
      jdEvidence: requirement.jdEvidence,
      resumeEvidence: comparison.resumeEvidenceIds.map((evidenceId) => {
        const evidence = evidenceById.get(evidenceId);

        if (!evidence) {
          throw new Error("Validated resume evidence reference is missing.");
        }

        return evidence;
      }),
    };
  });
}

export function buildMatchResult(
  requirementMatches: RequirementMatch[],
): MatchResult {
  const scores = calculateMatchScores(requirementMatches);

  return {
    scoringRubric: "weighted-requirements-v1",
    overallScore: scores.overallScore,
    categories: scores.categories,
    requirements: requirementMatches,
  };
}
