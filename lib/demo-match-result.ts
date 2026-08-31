import type { MatchResult } from "./match-schema";

const TYPESCRIPT_EVIDENCE = {
  id: "demo-skill-typescript",
  category: "skills",
  text: "Built and maintained TypeScript features for a fictional community-events platform.",
} as const;

const ACCESSIBILITY_EVIDENCE = {
  id: "demo-experience-accessibility",
  category: "experience",
  text: "Improved keyboard navigation and form labels while working at the fictional Northstar Community Lab.",
} as const;

const EXPERIENCE_EVIDENCE = {
  id: "demo-experience-duration",
  category: "experience",
  text: "Frontend Developer, Northstar Community Lab — January 2024 to present.",
} as const;

const ENGLISH_EVIDENCE = {
  id: "demo-language-english",
  category: "languages",
  text: "English — professional working proficiency.",
} as const;

export const DEMO_MATCH_RESULT = {
  scoringRubric: "weighted-requirements-v1",
  overallScore: 69,
  categories: {
    skills: {
      score: 67,
      earnedPoints: 2,
      possiblePoints: 3,
      matched: 1,
      partial: 0,
      missing: 1,
      uncertain: 0,
    },
    experience: {
      score: 50,
      earnedPoints: 0.5,
      possiblePoints: 1,
      matched: 0,
      partial: 1,
      missing: 0,
      uncertain: 0,
    },
    responsibilities: {
      score: 100,
      earnedPoints: 1,
      possiblePoints: 1,
      matched: 1,
      partial: 0,
      missing: 0,
      uncertain: 0,
    },
    education: {
      score: 0,
      earnedPoints: 0,
      possiblePoints: 1,
      matched: 0,
      partial: 0,
      missing: 1,
      uncertain: 0,
    },
    languages: {
      score: 100,
      earnedPoints: 2,
      possiblePoints: 2,
      matched: 1,
      partial: 0,
      missing: 0,
      uncertain: 0,
    },
  },
  requirements: [
    {
      id: "demo-skill-0",
      category: "skills",
      requirement: "TypeScript",
      importance: "required",
      status: "matched",
      explanation: "The resume contains direct TypeScript project evidence.",
      jdEvidence: ["Strong TypeScript skills are required."],
      resumeEvidence: [TYPESCRIPT_EVIDENCE],
    },
    {
      id: "demo-skill-1",
      category: "skills",
      requirement: "GraphQL",
      importance: "preferred",
      status: "missing",
      explanation: "No GraphQL evidence appears in the fictional resume.",
      jdEvidence: ["Experience with GraphQL is preferred."],
      resumeEvidence: [],
    },
    {
      id: "demo-experience-0",
      category: "experience",
      requirement: "At least three years of frontend development experience",
      importance: "preferred",
      status: "partial",
      explanation: "Relevant frontend experience exists, but the resume supports less than three years.",
      jdEvidence: ["Three or more years of frontend development experience preferred."],
      resumeEvidence: [EXPERIENCE_EVIDENCE],
    },
    {
      id: "demo-responsibility-0",
      category: "responsibilities",
      requirement: "Build accessible user interfaces",
      importance: "unspecified",
      status: "matched",
      explanation: "The resume provides direct accessibility-related implementation evidence.",
      jdEvidence: ["You will build accessible interfaces for a broad audience."],
      resumeEvidence: [ACCESSIBILITY_EVIDENCE],
    },
    {
      id: "demo-education-0",
      category: "education",
      requirement: "Bachelor's degree in computer science or equivalent",
      importance: "unspecified",
      status: "missing",
      explanation: "The fictional resume does not list this education or an equivalent qualification.",
      jdEvidence: ["Bachelor's degree in computer science or equivalent."],
      resumeEvidence: [],
    },
    {
      id: "demo-language-0",
      category: "languages",
      requirement: "Professional English",
      importance: "required",
      status: "matched",
      explanation: "The stated English proficiency supports this requirement.",
      jdEvidence: ["Professional English is required."],
      resumeEvidence: [ENGLISH_EVIDENCE],
    },
  ],
  suggestions: {
    language: "en",
    supportedImprovements: [
      {
        relatedRequirementId: "demo-skill-0",
        action: "increase_visibility",
        reason: "Move the existing TypeScript evidence closer to the top of the resume so recruiters see it quickly.",
        existingResumeEvidence: [TYPESCRIPT_EVIDENCE],
        claimBoundary: null,
      },
      {
        relatedRequirementId: "demo-experience-0",
        action: "clarify_supported_scope",
        reason: "Make the dates and frontend focus easier to scan while keeping the supported duration accurate.",
        existingResumeEvidence: [EXPERIENCE_EVIDENCE],
        claimBoundary: "Do not claim three years of experience until the resume evidence supports that duration.",
      },
    ],
    gapsThatMustNotBeFabricated: [
      {
        relatedRequirementId: "demo-skill-1",
        requirement: "GraphQL",
        importance: "preferred",
        reason: "GraphQL is not supported by the resume and must not be added as a claimed skill.",
      },
      {
        relatedRequirementId: "demo-education-0",
        requirement: "Bachelor's degree in computer science or equivalent",
        importance: "unspecified",
        reason: "The qualification is not present and must not be invented.",
      },
    ],
    needsVerification: [],
  },
} satisfies MatchResult;

export function getDemoMatchResult(): MatchResult {
  return DEMO_MATCH_RESULT;
}
