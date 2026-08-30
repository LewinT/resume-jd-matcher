import type {
  MatchRequest,
  RequirementMatch,
  SuggestionResult,
} from "./match-schema";

type InputLanguage = MatchRequest["jobProfile"]["inputLanguage"];
type SupportedImprovement =
  SuggestionResult["supportedImprovements"][number];

const ENGLISH_GAP_WARNING =
  "This requirement is not supported by the current resume. Do not add it unless it is genuinely true.";
const GERMAN_GAP_WARNING =
  "Diese Anforderung ist im aktuellen Lebenslauf nicht belegt. Ergänzen Sie sie nur, wenn sie tatsächlich zutrifft.";

function getSuggestionPriority(requirement: RequirementMatch) {
  if (requirement.importance === "required") {
    return requirement.status === "partial" ? 0 : 1;
  }

  if (requirement.importance === "preferred") {
    return requirement.status === "partial" ? 2 : 3;
  }

  return 4;
}

export function buildSuggestions(
  requirementMatches: RequirementMatch[],
  inputLanguage: InputLanguage,
): SuggestionResult {
  const language = inputLanguage === "de" ? "de" : "en";
  const isGerman = language === "de";

  const supportedImprovements = requirementMatches
    .map((requirement, originalIndex) => {
      let improvement: SupportedImprovement | null = null;

      if (requirement.status === "matched") {
        improvement = {
          relatedRequirementId: requirement.id,
          action: "increase_visibility",
          reason: isGerman
            ? "Der Lebenslauf enthält bereits Nachweise für diese Anforderung. Machen Sie diese vorhandenen Nachweise leichter auffindbar oder sichtbarer."
            : "The resume already contains evidence supporting this requirement. Make that existing evidence easier to find or more prominent.",
          existingResumeEvidence: requirement.resumeEvidence,
          claimBoundary: null,
        };
      }

      if (requirement.status === "partial") {
        improvement = {
          relatedRequirementId: requirement.id,
          action: "clarify_supported_scope",
          reason: isGerman
            ? `Belegter Umfang: ${requirement.explanation} Machen Sie die angeführten Nachweise leichter auffindbar und beschreiben Sie nur, was daraus hervorgeht.`
            : `Supported scope: ${requirement.explanation} Make the cited evidence easier to find and describe only what it establishes.`,
          existingResumeEvidence: requirement.resumeEvidence,
          claimBoundary: isGerman
            ? `Die aktuellen Nachweise im Lebenslauf belegen nicht die vollständige Anforderung: „${requirement.requirement}“. Behaupten Sie den nicht belegten Teil nur, wenn er tatsächlich zutrifft.`
            : `The current resume evidence does not support the complete requirement: “${requirement.requirement}.” Do not claim the unsupported part unless it is genuinely true.`,
        };
      }

      if (!improvement || improvement.existingResumeEvidence.length === 0) {
        return null;
      }

      return {
        improvement,
        originalIndex,
        priority: getSuggestionPriority(requirement),
      };
    })
    .filter((candidate) => candidate !== null)
    .sort(
      (left, right) =>
        left.priority - right.priority ||
        left.originalIndex - right.originalIndex,
    )
    .slice(0, 5)
    .map((candidate) => candidate.improvement);

  const gapsThatMustNotBeFabricated = requirementMatches
    .filter((requirement) => requirement.status === "missing")
    .map((requirement) => ({
      relatedRequirementId: requirement.id,
      requirement: requirement.requirement,
      importance: requirement.importance,
      reason: isGerman ? GERMAN_GAP_WARNING : ENGLISH_GAP_WARNING,
    }));

  const needsVerification = requirementMatches
    .filter((requirement) => requirement.status === "uncertain")
    .map((requirement) => ({
      relatedRequirementId: requirement.id,
      reason: isGerman
        ? `Prüfung erforderlich: ${requirement.explanation} Prüfen Sie die Nachweise oder ihre Zuordnung, bevor Sie den Lebenslauf ändern.`
        : `Verification needed: ${requirement.explanation} Verify the evidence or its association before changing the resume.`,
      candidateResumeEvidence: requirement.resumeEvidence,
    }));

  return {
    language,
    supportedImprovements,
    gapsThatMustNotBeFabricated,
    needsVerification,
  };
}
