import { z } from "zod";

import { analysisResponseSchema } from "@/lib/analysis-schema";

export const requirementCategorySchema = z.enum([
  "skills",
  "experience",
  "responsibilities",
  "education",
  "languages",
]);

export const importanceSchema = z.enum([
  "required",
  "preferred",
  "unspecified",
]);

export const matchStatusSchema = z.enum([
  "matched",
  "partial",
  "missing",
  "uncertain",
]);

export const matchRequestSchema = z
  .object({
    resumeProfile: analysisResponseSchema.shape.resumeProfile,
    jobProfile: analysisResponseSchema.shape.jobProfile,
  })
  .strict();

const semanticComparisonSchema = z
  .object({
    requirementId: z.string(),
    status: matchStatusSchema,
    explanation: z.string(),
    resumeEvidenceIds: z.array(z.string()),
  })
  .strict();

export const semanticComparisonResponseSchema = z
  .object({
    comparisons: z.array(semanticComparisonSchema),
  })
  .strict();

const resumeEvidenceSchema = z
  .object({
    id: z.string(),
    category: z.enum(["skills", "experience", "education", "languages"]),
    text: z.string(),
  })
  .strict();

const scoreBreakdownSchema = z
  .object({
    score: z.number().nullable(),
    earnedPoints: z.number(),
    possiblePoints: z.number(),
    matched: z.number().int().nonnegative(),
    partial: z.number().int().nonnegative(),
    missing: z.number().int().nonnegative(),
    uncertain: z.number().int().nonnegative(),
  })
  .strict();

const requirementMatchSchema = z
  .object({
    id: z.string(),
    category: requirementCategorySchema,
    requirement: z.string(),
    importance: importanceSchema,
    status: matchStatusSchema,
    explanation: z.string(),
    jdEvidence: z.array(z.string()),
    resumeEvidence: z.array(resumeEvidenceSchema),
  })
  .strict();

export const matchResultSchema = z
  .object({
    scoringRubric: z.literal("weighted-requirements-v1"),
    overallScore: z.number(),
    categories: z
      .object({
        skills: scoreBreakdownSchema,
        experience: scoreBreakdownSchema,
        responsibilities: scoreBreakdownSchema,
        education: scoreBreakdownSchema,
        languages: scoreBreakdownSchema,
      })
      .strict(),
    requirements: z.array(requirementMatchSchema),
  })
  .strict();

export type MatchRequest = z.infer<typeof matchRequestSchema>;
export type RequirementCategory = z.infer<typeof requirementCategorySchema>;
export type Importance = z.infer<typeof importanceSchema>;
export type MatchStatus = z.infer<typeof matchStatusSchema>;
export type SemanticComparisonResponse = z.infer<
  typeof semanticComparisonResponseSchema
>;
export type ResumeEvidence = z.infer<typeof resumeEvidenceSchema>;
export type RequirementMatch = z.infer<typeof requirementMatchSchema>;
export type MatchResult = z.infer<typeof matchResultSchema>;

export type JobRequirement = {
  id: string;
  category: RequirementCategory;
  description: string;
  importance: Importance;
  jdEvidence: string[];
  details?: Record<string, string | number>;
};
