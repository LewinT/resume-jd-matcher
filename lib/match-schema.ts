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

export const suggestionResultSchema = z
  .object({
    language: z.enum(["en", "de"]),
    supportedImprovements: z
      .array(
        z.discriminatedUnion("action", [
          z
            .object({
              relatedRequirementId: z.string().min(1),
              action: z.literal("increase_visibility"),
              reason: z.string().min(1),
              existingResumeEvidence: z.array(resumeEvidenceSchema).min(1),
              claimBoundary: z.null(),
            })
            .strict(),
          z
            .object({
              relatedRequirementId: z.string().min(1),
              action: z.literal("clarify_supported_scope"),
              reason: z.string().min(1),
              existingResumeEvidence: z.array(resumeEvidenceSchema).min(1),
              claimBoundary: z.string().min(1),
            })
            .strict(),
        ]),
      )
      .max(5),
    gapsThatMustNotBeFabricated: z.array(
      z
        .object({
          relatedRequirementId: z.string().min(1),
          requirement: z.string(),
          importance: importanceSchema,
          reason: z.string().min(1),
        })
        .strict(),
    ),
    needsVerification: z.array(
      z
        .object({
          relatedRequirementId: z.string().min(1),
          reason: z.string().min(1),
          candidateResumeEvidence: z.array(resumeEvidenceSchema),
        })
        .strict(),
    ),
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
    suggestions: suggestionResultSchema,
  })
  .strict()
  .superRefine((result, context) => {
    const requirementById = new Map(
      result.requirements.map((requirement) => [requirement.id, requirement]),
    );

    function evidenceMatchesRequirement(
      relatedRequirementId: string,
      evidence: z.infer<typeof resumeEvidenceSchema>[],
      path: (string | number)[],
    ) {
      const requirement = requirementById.get(relatedRequirementId);

      if (!requirement) return;

      const expectedEvidence = new Map(
        requirement.resumeEvidence.map((item) => [item.id, item]),
      );

      evidence.forEach((item, evidenceIndex) => {
        const expected = expectedEvidence.get(item.id);

        if (
          !expected ||
          expected.category !== item.category ||
          expected.text !== item.text
        ) {
          context.addIssue({
            code: "custom",
            message: "Suggestion evidence must match the related requirement evidence.",
            path: [...path, evidenceIndex],
          });
        }
      });
    }

    const supportedIds = new Set<string>();

    result.suggestions.supportedImprovements.forEach((improvement, index) => {
      const requirement = requirementById.get(improvement.relatedRequirementId);
      const path = ["suggestions", "supportedImprovements", index];

      if (!requirement) {
        context.addIssue({
          code: "custom",
          message: "Supported improvement must reference an existing requirement.",
          path: [...path, "relatedRequirementId"],
        });
        return;
      }

      if (supportedIds.has(improvement.relatedRequirementId)) {
        context.addIssue({
          code: "custom",
          message: "A requirement may have only one supported improvement.",
          path: [...path, "relatedRequirementId"],
        });
      }
      supportedIds.add(improvement.relatedRequirementId);

      const actionMatchesStatus =
        (requirement.status === "matched" &&
          improvement.action === "increase_visibility") ||
        (requirement.status === "partial" &&
          improvement.action === "clarify_supported_scope");

      if (!actionMatchesStatus) {
        context.addIssue({
          code: "custom",
          message: "Suggestion action must match the requirement status.",
          path: [...path, "action"],
        });
      }

      evidenceMatchesRequirement(
        improvement.relatedRequirementId,
        improvement.existingResumeEvidence,
        [...path, "existingResumeEvidence"],
      );
    });

    const gapIds = new Set<string>();

    result.suggestions.gapsThatMustNotBeFabricated.forEach((gap, index) => {
      const requirement = requirementById.get(gap.relatedRequirementId);
      const path = ["suggestions", "gapsThatMustNotBeFabricated", index];

      if (
        !requirement ||
        requirement.status !== "missing" ||
        requirement.requirement !== gap.requirement ||
        requirement.importance !== gap.importance ||
        gapIds.has(gap.relatedRequirementId)
      ) {
        context.addIssue({
          code: "custom",
          message: "Gap must correspond exactly to one missing requirement.",
          path,
        });
      }

      gapIds.add(gap.relatedRequirementId);
    });

    const missingIds = result.requirements
      .filter((requirement) => requirement.status === "missing")
      .map((requirement) => requirement.id);

    if (
      gapIds.size !== missingIds.length ||
      missingIds.some((requirementId) => !gapIds.has(requirementId))
    ) {
      context.addIssue({
        code: "custom",
        message: "Every missing requirement must appear exactly once as a gap.",
        path: ["suggestions", "gapsThatMustNotBeFabricated"],
      });
    }

    const verificationIds = new Set<string>();

    result.suggestions.needsVerification.forEach((verification, index) => {
      const requirement = requirementById.get(
        verification.relatedRequirementId,
      );
      const path = ["suggestions", "needsVerification", index];

      if (
        !requirement ||
        requirement.status !== "uncertain" ||
        verificationIds.has(verification.relatedRequirementId)
      ) {
        context.addIssue({
          code: "custom",
          message: "Verification item must correspond to one uncertain requirement.",
          path,
        });
        return;
      }

      verificationIds.add(verification.relatedRequirementId);
      evidenceMatchesRequirement(
        verification.relatedRequirementId,
        verification.candidateResumeEvidence,
        [...path, "candidateResumeEvidence"],
      );
    });

    const uncertainIds = result.requirements
      .filter((requirement) => requirement.status === "uncertain")
      .map((requirement) => requirement.id);

    if (
      verificationIds.size !== uncertainIds.length ||
      uncertainIds.some(
        (requirementId) => !verificationIds.has(requirementId),
      )
    ) {
      context.addIssue({
        code: "custom",
        message: "Every uncertain requirement must appear exactly once for verification.",
        path: ["suggestions", "needsVerification"],
      });
    }
  });

export type MatchRequest = z.infer<typeof matchRequestSchema>;
export type RequirementCategory = z.infer<typeof requirementCategorySchema>;
export type Importance = z.infer<typeof importanceSchema>;
export type MatchStatus = z.infer<typeof matchStatusSchema>;
export type SemanticComparisonResponse = z.infer<
  typeof semanticComparisonResponseSchema
>;
export type ResumeEvidence = z.infer<typeof resumeEvidenceSchema>;
export type RequirementMatch = z.infer<typeof requirementMatchSchema>;
export type SuggestionResult = z.infer<typeof suggestionResultSchema>;
export type MatchResult = z.infer<typeof matchResultSchema>;

export type JobRequirement = {
  id: string;
  category: RequirementCategory;
  description: string;
  importance: Importance;
  jdEvidence: string[];
  details?: Record<string, string | number>;
};
