import { z } from "zod";

const inputLanguageSchema = z.enum(["en", "de", "mixed", "unknown"]);
const importanceSchema = z.enum(["required", "preferred", "unspecified"]);
const evidenceSchema = z.array(z.string());

const uncertaintySchema = z
  .object({
    description: z.string(),
    evidence: evidenceSchema,
  })
  .strict();

const resumeSkillSchema = z
  .object({
    name: z.string(),
    statedLevel: z.string().nullable(),
    statedExperienceYears: z.number().nullable(),
    evidence: evidenceSchema,
  })
  .strict();

const experienceHighlightSchema = z
  .object({
    statement: z.string(),
    evidence: evidenceSchema,
  })
  .strict();

const resumeExperienceSchema = z
  .object({
    type: z.enum([
      "employment",
      "project",
      "volunteering",
      "other",
      "unknown",
    ]),
    title: z.string().nullable(),
    organization: z.string().nullable(),
    startDate: z.string().nullable(),
    endDate: z.string().nullable(),
    highlights: z.array(experienceHighlightSchema),
    evidence: evidenceSchema,
  })
  .strict();

const resumeEducationSchema = z
  .object({
    credential: z.string().nullable(),
    field: z.string().nullable(),
    institution: z.string().nullable(),
    completionDate: z.string().nullable(),
    evidence: evidenceSchema,
  })
  .strict();

const resumeLanguageSchema = z
  .object({
    name: z.string(),
    proficiency: z.string().nullable(),
    evidence: evidenceSchema,
  })
  .strict();

const jobSkillSchema = z
  .object({
    name: z.string(),
    importance: importanceSchema,
    evidence: evidenceSchema,
  })
  .strict();

const experienceRequirementSchema = z
  .object({
    description: z.string(),
    area: z.string().nullable(),
    minimumYears: z.number().nullable(),
    seniority: z.string().nullable(),
    importance: importanceSchema,
    evidence: evidenceSchema,
  })
  .strict();

const responsibilitySchema = z
  .object({
    description: z.string(),
    evidence: evidenceSchema,
  })
  .strict();

const educationRequirementSchema = z
  .object({
    credential: z.string().nullable(),
    field: z.string().nullable(),
    importance: importanceSchema,
    evidence: evidenceSchema,
  })
  .strict();

const languageRequirementSchema = z
  .object({
    name: z.string(),
    proficiency: z.string().nullable(),
    importance: importanceSchema,
    evidence: evidenceSchema,
  })
  .strict();

export const analysisResponseSchema = z
  .object({
    resumeProfile: z
      .object({
        inputLanguage: inputLanguageSchema,
        skills: z.array(resumeSkillSchema),
        experience: z.array(resumeExperienceSchema),
        education: z.array(resumeEducationSchema),
        languages: z.array(resumeLanguageSchema),
        uncertainties: z.array(uncertaintySchema),
      })
      .strict(),
    jobProfile: z
      .object({
        inputLanguage: inputLanguageSchema,
        jobTitle: z.string().nullable(),
        skills: z.array(jobSkillSchema),
        experienceRequirements: z.array(experienceRequirementSchema),
        responsibilities: z.array(responsibilitySchema),
        educationRequirements: z.array(educationRequirementSchema),
        languageRequirements: z.array(languageRequirementSchema),
        uncertainties: z.array(uncertaintySchema),
      })
      .strict(),
  })
  .strict();

export type AnalysisResponse = z.infer<typeof analysisResponseSchema>;
