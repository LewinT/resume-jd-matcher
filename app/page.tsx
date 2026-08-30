"use client";

import { useRef, useState, type ChangeEvent } from "react";

import type { AnalysisResponse } from "@/lib/analysis-schema";
import type { MatchResult, MatchStatus } from "@/lib/match-schema";

type ExtractionResponse = {
  text?: unknown;
  pages?: unknown;
  error?: unknown;
};

type RequestPhase = "idle" | "extracting" | "analyzing" | "matching";

const CATEGORY_LABELS: Array<{
  key: keyof MatchResult["categories"];
  label: string;
}> = [
  { key: "skills", label: "Skills" },
  { key: "experience", label: "Experience" },
  { key: "responsibilities", label: "Responsibilities" },
  { key: "education", label: "Education" },
  { key: "languages", label: "Languages" },
];

const STATUS_SECTIONS: Array<{
  status: MatchStatus;
  label: string;
  description: string;
  borderClass: string;
  backgroundClass: string;
  badgeClass: string;
}> = [
  {
    status: "matched",
    label: "Matched",
    description: "The resume contains evidence supporting these requirements.",
    borderClass: "border-emerald-200",
    backgroundClass: "bg-emerald-50/50",
    badgeClass: "bg-emerald-100 text-emerald-800",
  },
  {
    status: "partial",
    label: "Partial",
    description: "Relevant evidence exists, but the complete requirement is not supported.",
    borderClass: "border-amber-200",
    backgroundClass: "bg-amber-50/50",
    badgeClass: "bg-amber-100 text-amber-800",
  },
  {
    status: "missing",
    label: "Missing",
    description: "No supporting resume evidence was identified.",
    borderClass: "border-red-200",
    backgroundClass: "bg-red-50/50",
    badgeClass: "bg-red-100 text-red-800",
  },
  {
    status: "uncertain",
    label: "Uncertain",
    description: "The available evidence could not be associated safely.",
    borderClass: "border-violet-200",
    backgroundClass: "bg-violet-50/50",
    badgeClass: "bg-violet-100 text-violet-800",
  },
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function getApiError(data: unknown, fallback: string) {
  if (isRecord(data) && typeof data.error === "string") {
    return data.error;
  }

  return fallback;
}

function isAnalysisResponse(data: unknown): data is AnalysisResponse {
  if (!isRecord(data)) {
    return false;
  }

  const resumeProfile = data.resumeProfile;
  const jobProfile = data.jobProfile;

  return (
    isRecord(resumeProfile) &&
    typeof resumeProfile.inputLanguage === "string" &&
    Array.isArray(resumeProfile.skills) &&
    Array.isArray(resumeProfile.experience) &&
    Array.isArray(resumeProfile.education) &&
    Array.isArray(resumeProfile.languages) &&
    Array.isArray(resumeProfile.uncertainties) &&
    isRecord(jobProfile) &&
    typeof jobProfile.inputLanguage === "string" &&
    (typeof jobProfile.jobTitle === "string" || jobProfile.jobTitle === null) &&
    Array.isArray(jobProfile.skills) &&
    Array.isArray(jobProfile.experienceRequirements) &&
    Array.isArray(jobProfile.responsibilities) &&
    Array.isArray(jobProfile.educationRequirements) &&
    Array.isArray(jobProfile.languageRequirements) &&
    Array.isArray(jobProfile.uncertainties)
  );
}

function isScoreBreakdown(value: unknown) {
  if (!isRecord(value)) {
    return false;
  }

  return (
    (typeof value.score === "number" || value.score === null) &&
    typeof value.earnedPoints === "number" &&
    typeof value.possiblePoints === "number" &&
    typeof value.matched === "number" &&
    typeof value.partial === "number" &&
    typeof value.missing === "number" &&
    typeof value.uncertain === "number"
  );
}

function isMatchStatus(value: unknown): value is MatchStatus {
  return (
    value === "matched" ||
    value === "partial" ||
    value === "missing" ||
    value === "uncertain"
  );
}

function isImportance(value: unknown) {
  return (
    value === "required" ||
    value === "preferred" ||
    value === "unspecified"
  );
}

function isResumeEvidence(value: unknown) {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.category === "string" &&
    typeof value.text === "string"
  );
}

function isSuggestionResult(value: unknown) {
  if (!isRecord(value)) {
    return false;
  }

  return (
    (value.language === "en" || value.language === "de") &&
    Array.isArray(value.supportedImprovements) &&
    value.supportedImprovements.every(
      (improvement) =>
        isRecord(improvement) &&
        typeof improvement.relatedRequirementId === "string" &&
        (improvement.action === "increase_visibility" ||
          improvement.action === "clarify_supported_scope") &&
        typeof improvement.reason === "string" &&
        Array.isArray(improvement.existingResumeEvidence) &&
        improvement.existingResumeEvidence.length > 0 &&
        improvement.existingResumeEvidence.every(isResumeEvidence) &&
        (improvement.claimBoundary === null ||
          typeof improvement.claimBoundary === "string"),
    ) &&
    Array.isArray(value.gapsThatMustNotBeFabricated) &&
    value.gapsThatMustNotBeFabricated.every(
      (gap) =>
        isRecord(gap) &&
        typeof gap.relatedRequirementId === "string" &&
        typeof gap.requirement === "string" &&
        isImportance(gap.importance) &&
        typeof gap.reason === "string",
    ) &&
    Array.isArray(value.needsVerification) &&
    value.needsVerification.every(
      (verification) =>
        isRecord(verification) &&
        typeof verification.relatedRequirementId === "string" &&
        typeof verification.reason === "string" &&
        Array.isArray(verification.candidateResumeEvidence) &&
        verification.candidateResumeEvidence.every(isResumeEvidence),
    )
  );
}

function isMatchResult(data: unknown): data is MatchResult {
  if (!isRecord(data) || !isRecord(data.categories)) {
    return false;
  }

  const categories = data.categories;
  const hasValidCategories = CATEGORY_LABELS.every(({ key }) =>
    isScoreBreakdown(categories[key]),
  );

  return (
    data.scoringRubric === "weighted-requirements-v1" &&
    typeof data.overallScore === "number" &&
    hasValidCategories &&
    isSuggestionResult(data.suggestions) &&
    Array.isArray(data.requirements) &&
    data.requirements.every(
      (requirement) =>
        isRecord(requirement) &&
        typeof requirement.id === "string" &&
        typeof requirement.requirement === "string" &&
        isImportance(requirement.importance) &&
        isMatchStatus(requirement.status) &&
        typeof requirement.explanation === "string" &&
        Array.isArray(requirement.resumeEvidence) &&
        requirement.resumeEvidence.every(isResumeEvidence),
    )
  );
}

function importanceLabel(importance: string) {
  if (importance === "unspecified") {
    return "Importance not stated";
  }

  return `${importance.charAt(0).toUpperCase()}${importance.slice(1)}`;
}

type ResumeEvidenceItem =
  MatchResult["requirements"][number]["resumeEvidence"][number];

function EvidenceList({
  evidence,
  label = "Resume evidence",
}: {
  evidence: ResumeEvidenceItem[];
  label?: string;
}) {
  if (evidence.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 min-w-0">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <ul className="mt-2 space-y-2">
        {evidence.map((item) => (
          <li
            key={item.id}
            className="min-w-0 break-words rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm italic leading-6 text-slate-700"
          >
            “{item.text}”
          </li>
        ))}
      </ul>
    </div>
  );
}

function improvementActionLabel(
  action: MatchResult["suggestions"]["supportedImprovements"][number]["action"],
) {
  return action === "increase_visibility"
    ? "Make evidence more visible"
    : "Clarify the supported scope";
}

function MatchResultView({ result }: { result: MatchResult }) {
  const requirementById = new Map(
    result.requirements.map((requirement) => [requirement.id, requirement]),
  );

  return (
    <div className="mt-10 space-y-6" aria-labelledby="match-result-heading">
      <section className="overflow-hidden rounded-3xl border border-blue-200 bg-white shadow-sm">
        <div className="grid lg:grid-cols-[0.8fr_1.7fr]">
          <div className="flex flex-col justify-center bg-blue-700 px-6 py-10 text-center text-white sm:px-10 lg:min-h-72">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-100">
              Your result
            </p>
            <h2
              id="match-result-heading"
              className="mt-3 text-xl font-semibold"
            >
              Overall Match
            </h2>
            <p className="mt-3 text-6xl font-bold tracking-tight sm:text-7xl">
              {result.overallScore}%
            </p>
            <p className="mx-auto mt-4 max-w-xs text-sm leading-6 text-blue-100">
              Calculated from fixed requirement and importance weights.
            </p>
          </div>

          <div className="min-w-0 p-6 sm:p-8 lg:p-10">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
                Score details
              </p>
              <h3
                id="category-breakdown-heading"
                className="mt-1 text-2xl font-bold tracking-tight text-slate-950"
              >
                Category Breakdown
              </h3>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
              {CATEGORY_LABELS.map(({ key, label }) => {
                const category = result.categories[key];

                return (
                  <div
                    key={key}
                    className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <p className="text-sm font-medium leading-5 text-slate-600">
                      {label}
                    </p>
                    <p className="mt-2 text-2xl font-bold text-slate-950">
                      {category.score === null ? "N/A" : `${category.score}%`}
                    </p>
                    {category.score !== null && (
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        {category.earnedPoints} / {category.possiblePoints}{" "}
                        points
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section
        className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8"
        aria-labelledby="requirement-results-heading"
      >
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
            Evidence-based comparison
          </p>
          <h3
            id="requirement-results-heading"
            className="mt-1 text-2xl font-bold tracking-tight text-slate-950"
          >
            Requirement Results
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            See which job requirements are supported, partially supported,
            missing, or still ambiguous.
          </p>
        </div>

        {result.requirements.length === 0 ? (
          <p className="mt-6 rounded-2xl bg-slate-50 p-5 text-sm text-slate-600">
            No job requirements were identified for comparison.
          </p>
        ) : (
          <div className="mt-7 grid items-start gap-6 lg:grid-cols-2">
            {STATUS_SECTIONS.map((section) => {
              const requirements = result.requirements.filter(
                (requirement) => requirement.status === section.status,
              );

              return (
                <section
                  key={section.status}
                  className={`min-w-0 rounded-2xl border p-4 sm:p-5 ${section.borderClass} ${section.backgroundClass}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h4 className="text-lg font-bold text-slate-950">
                        {section.label}
                      </h4>
                      <p className="mt-1 text-sm leading-5 text-slate-600">
                        {section.description}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${section.badgeClass}`}
                    >
                      {requirements.length}
                    </span>
                  </div>

                  {requirements.length === 0 ? (
                    <p className="mt-5 rounded-xl bg-white/70 px-4 py-3 text-sm text-slate-500">
                      No {section.label.toLowerCase()} requirements.
                    </p>
                  ) : (
                    <div className="mt-5 space-y-3">
                      {requirements.map((requirement) => (
                        <article
                          key={requirement.id}
                          className="min-w-0 rounded-2xl border border-white/80 bg-white p-4 shadow-sm"
                        >
                          <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <h5 className="min-w-0 break-words font-semibold leading-6 text-slate-950">
                              {requirement.requirement}
                            </h5>
                            <span className="w-fit shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                              {importanceLabel(requirement.importance)}
                            </span>
                          </div>
                          <p className="mt-3 break-words text-sm leading-6 text-slate-700">
                            {requirement.explanation}
                          </p>
                          {requirement.status !== "missing" && (
                            <EvidenceList
                              evidence={requirement.resumeEvidence}
                            />
                          )}
                        </article>
                      ))}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        )}
      </section>

      <section
        className="rounded-3xl border border-blue-200 bg-white p-5 shadow-sm sm:p-8"
        aria-labelledby="resume-improvements-heading"
      >
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
            Evidence-grounded guidance
          </p>
          <h3
            id="resume-improvements-heading"
            className="mt-1 text-2xl font-bold tracking-tight text-slate-950"
          >
            Resume Improvements
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            These suggestions only use information already supported by your
            resume.
          </p>
        </div>

        {result.suggestions.supportedImprovements.length === 0 ? (
          <p className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
            No evidence-grounded resume improvements were identified.
          </p>
        ) : (
          <div className="mt-7 grid items-start gap-4 lg:grid-cols-2">
            {result.suggestions.supportedImprovements.map((improvement) => {
              const relatedRequirement = requirementById.get(
                improvement.relatedRequirementId,
              );

              return (
                <article
                  key={improvement.relatedRequirementId}
                  className="min-w-0 rounded-2xl border border-blue-200 bg-blue-50/40 p-5"
                >
                  <span className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">
                    {improvementActionLabel(improvement.action)}
                  </span>
                  <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Related job requirement
                  </p>
                  <h4 className="mt-1 break-words font-semibold leading-6 text-slate-950">
                    {relatedRequirement?.requirement ??
                      "Related requirement"}
                  </h4>
                  <p className="mt-3 break-words text-sm leading-6 text-slate-700">
                    {improvement.reason}
                  </p>
                  <EvidenceList
                    evidence={improvement.existingResumeEvidence}
                    label="Existing resume evidence"
                  />
                  {improvement.claimBoundary !== null && (
                    <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">
                        Keep this claim boundary
                      </p>
                      <p className="mt-2 break-words text-sm leading-6 text-amber-950">
                        {improvement.claimBoundary}
                      </p>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section
        className="rounded-3xl border border-red-200 bg-white p-5 shadow-sm sm:p-8"
        aria-labelledby="gaps-heading"
      >
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-red-700">
            Unsupported requirements
          </p>
          <h3
            id="gaps-heading"
            className="mt-1 text-2xl font-bold tracking-tight text-slate-950"
          >
            Gaps
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Treat these as genuine gaps. They should not be added to the resume
            unless they are true.
          </p>
        </div>

        {result.suggestions.gapsThatMustNotBeFabricated.length === 0 ? (
          <p className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-800">
            No unsupported requirements were identified.
          </p>
        ) : (
          <div className="mt-7 grid items-start gap-4 lg:grid-cols-2">
            {result.suggestions.gapsThatMustNotBeFabricated.map((gap) => (
              <article
                key={gap.relatedRequirementId}
                className="min-w-0 rounded-2xl border border-red-200 bg-red-50/60 p-5"
              >
                <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <h4 className="min-w-0 break-words font-semibold leading-6 text-slate-950">
                    {gap.requirement}
                  </h4>
                  <span className="w-fit shrink-0 rounded-full bg-white px-2.5 py-1 text-xs font-medium text-red-800 ring-1 ring-red-200">
                    {importanceLabel(gap.importance)}
                  </span>
                </div>
                <p className="mt-4 break-words text-sm leading-6 text-red-900">
                  {gap.reason}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>

      {result.suggestions.needsVerification.length > 0 && (
        <section
          className="rounded-3xl border border-violet-200 bg-white p-5 shadow-sm sm:p-8"
          aria-labelledby="verification-heading"
        >
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-violet-700">
              Check before editing
            </p>
            <h3
              id="verification-heading"
              className="mt-1 text-2xl font-bold tracking-tight text-slate-950"
            >
              Needs Verification
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Verify the ambiguous evidence or relationship before changing
              the resume.
            </p>
          </div>

          <div className="mt-7 grid items-start gap-4 lg:grid-cols-2">
            {result.suggestions.needsVerification.map((verification) => {
              const relatedRequirement = requirementById.get(
                verification.relatedRequirementId,
              );

              return (
                <article
                  key={verification.relatedRequirementId}
                  className="min-w-0 rounded-2xl border border-violet-200 bg-violet-50/60 p-5"
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">
                    Requirement to verify
                  </p>
                  <h4 className="mt-1 break-words font-semibold leading-6 text-slate-950">
                    {relatedRequirement?.requirement ??
                      "Uncertain requirement"}
                  </h4>
                  <p className="mt-3 break-words text-sm leading-6 text-slate-700">
                    {verification.reason}
                  </p>
                  <EvidenceList
                    evidence={verification.candidateResumeEvidence}
                    label="Candidate evidence"
                  />
                </article>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

function ProfileField({ label, value }: { label: string; value: unknown }) {
  const displayValue =
    typeof value === "string"
      ? value
      : value === null
        ? "Not identified"
        : JSON.stringify(value, null, 2);

  return (
    <section>
      <h3 className="text-sm font-semibold text-slate-900">{label}</h3>
      <pre className="mt-2 max-h-80 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-slate-50 p-3 font-mono text-xs leading-5 text-slate-700">
        {displayValue}
      </pre>
    </section>
  );
}

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [extractedText, setExtractedText] = useState("");
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [extractionError, setExtractionError] = useState("");
  const [analysisResult, setAnalysisResult] =
    useState<AnalysisResponse | null>(null);
  const [analysisError, setAnalysisError] = useState("");
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [matchError, setMatchError] = useState("");
  const [requestPhase, setRequestPhase] = useState<RequestPhase>("idle");
  const activeRequest = useRef<AbortController | null>(null);
  const lastAnalyzedInputs = useRef<{
    file: File;
    jobDescription: string;
  } | null>(null);
  const lastSuccessfulInputs = useRef<{
    file: File;
    jobDescription: string;
  } | null>(null);

  const canAnalyze =
    selectedFile !== null && jobDescription.trim().length > 0;
  const isRunning = requestPhase !== "idle";

  function stopActiveRequest() {
    activeRequest.current?.abort();
    activeRequest.current = null;
    setRequestPhase("idle");
  }

  function clearForFileChange() {
    stopActiveRequest();
    setExtractedText("");
    setPageCount(null);
    setExtractionError("");
    setAnalysisResult(null);
    setAnalysisError("");
    setMatchResult(null);
    setMatchError("");
    lastAnalyzedInputs.current = null;
    lastSuccessfulInputs.current = null;
  }

  function clearForJobDescriptionChange() {
    stopActiveRequest();
    setAnalysisResult(null);
    setAnalysisError("");
    setMatchResult(null);
    setMatchError("");
    lastAnalyzedInputs.current = null;
    lastSuccessfulInputs.current = null;
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    clearForFileChange();

    if (!file) {
      setSelectedFile(null);
      setFileError("");
      return;
    }

    const isPdf =
      file.type === "application/pdf" ||
      file.name.toLowerCase().endsWith(".pdf");

    if (!isPdf) {
      setSelectedFile(null);
      setFileError("Please upload a PDF file.");
      event.target.value = "";
      return;
    }

    setSelectedFile(file);
    setFileError("");
  }

  async function handleAnalyze() {
    if (
      !canAnalyze ||
      !selectedFile ||
      isRunning ||
      activeRequest.current !== null
    ) {
      return;
    }

    const submittedJobDescription = jobDescription.trim();
    const previousInputs = lastSuccessfulInputs.current;

    if (
      previousInputs?.file === selectedFile &&
      previousInputs.jobDescription === submittedJobDescription
    ) {
      return;
    }

    const analyzedInputs = lastAnalyzedInputs.current;
    const canReuseAnalysis =
      analysisResult !== null &&
      analyzedInputs?.file === selectedFile &&
      analyzedInputs.jobDescription === submittedJobDescription;
    const controller = new AbortController();
    let activePhase: Exclude<RequestPhase, "idle"> = canReuseAnalysis
      ? "matching"
      : "extracting";
    let submittedAnalysis: AnalysisResponse;

    activeRequest.current = controller;
    setRequestPhase(activePhase);
    setExtractionError("");
    setAnalysisError("");
    setMatchError("");
    setMatchResult(null);

    if (!canReuseAnalysis) {
      setAnalysisResult(null);
      setExtractedText("");
      setPageCount(null);
      lastAnalyzedInputs.current = null;
    }

    try {
      if (canReuseAnalysis) {
        submittedAnalysis = analysisResult;
      } else {
        const formData = new FormData();
        formData.append("file", selectedFile);

        const extractionResponse = await fetch("/api/extract-resume", {
          method: "POST",
          body: formData,
          signal: controller.signal,
        });
        const extractionData =
          (await extractionResponse.json()) as ExtractionResponse;

        if (!extractionResponse.ok) {
          setExtractionError(
            getApiError(
              extractionData,
              "The resume could not be read. Please try again.",
            ),
          );
          return;
        }

        if (
          typeof extractionData.text !== "string" ||
          typeof extractionData.pages !== "number"
        ) {
          setExtractionError(
            "The extraction server returned an unexpected response.",
          );
          return;
        }

        setExtractedText(extractionData.text);
        setPageCount(extractionData.pages);
        activePhase = "analyzing";
        setRequestPhase("analyzing");

        const analysisResponse = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            resumeText: extractionData.text,
            jobDescription: submittedJobDescription,
          }),
          signal: controller.signal,
        });
        const analysisData: unknown = await analysisResponse.json();

        if (!analysisResponse.ok) {
          setAnalysisError(
            getApiError(
              analysisData,
              "The structured analysis could not be completed. Please try again.",
            ),
          );
          return;
        }

        if (!isAnalysisResponse(analysisData)) {
          setAnalysisError(
            "The analysis server returned an unexpected response.",
          );
          return;
        }

        submittedAnalysis = analysisData;
        setAnalysisResult(analysisData);
        lastAnalyzedInputs.current = {
          file: selectedFile,
          jobDescription: submittedJobDescription,
        };
      }

      activePhase = "matching";
      setRequestPhase("matching");

      const matchResponse = await fetch("/api/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submittedAnalysis),
        signal: controller.signal,
      });
      const matchData: unknown = await matchResponse.json();

      if (!matchResponse.ok) {
        setMatchError(
          getApiError(
            matchData,
            "Match calculation could not be completed. Please try again.",
          ),
        );
        return;
      }

      if (!isMatchResult(matchData)) {
        setMatchError(
          "The matching server returned an unexpected response. Please try again.",
        );
        return;
      }

      lastSuccessfulInputs.current = {
        file: selectedFile,
        jobDescription: submittedJobDescription,
      };
      setMatchResult(matchData);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      if (activePhase === "extracting") {
        setExtractionError(
          "The resume could not be sent to the server. Please try again.",
        );
      } else if (activePhase === "analyzing") {
        setAnalysisError(
          "The structured analysis could not be completed. Please try again.",
        );
      } else {
        setMatchError(
          "Match calculation could not be completed. Please try again.",
        );
      }
    } finally {
      if (activeRequest.current === controller) {
        activeRequest.current = null;
        setRequestPhase("idle");
      }
    }
  }

  return (
    <main className="min-h-screen w-full bg-slate-50 px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto w-full max-w-6xl">
        <header className="mb-10 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Resume ↔ Job Matcher
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
            Upload your resume and paste a job description to see how well they
            match.
          </p>
        </header>

        <div className="mx-auto max-w-4xl space-y-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
          <section aria-labelledby="resume-heading">
            <h2
              id="resume-heading"
              className="text-lg font-semibold text-slate-900"
            >
              Resume
            </h2>
            <label className="mt-3 block" htmlFor="resume">
              <span className="sr-only">Choose a PDF resume</span>
              <input
                id="resume"
                name="resume"
                type="file"
                accept="application/pdf,.pdf"
                onChange={handleFileChange}
                className="block w-full min-w-0 rounded-xl border border-slate-300 bg-white text-sm text-slate-600 file:mr-3 file:border-0 file:border-r file:border-slate-300 file:bg-slate-100 file:px-3 file:py-3 file:font-medium file:text-slate-800 hover:file:bg-slate-200 sm:file:mr-4 sm:file:px-4"
              />
            </label>
            <p className="mt-2 text-sm text-slate-500">
              Only PDF resumes are supported.
            </p>
            <div className="mt-2 text-sm" aria-live="polite">
              {selectedFile && (
                <p className="font-medium text-emerald-700">
                  ✓ {selectedFile.name}
                </p>
              )}
              {fileError && (
                <p className="font-medium text-red-600">{fileError}</p>
              )}
            </div>
          </section>

          <section aria-labelledby="job-description-heading">
            <label
              id="job-description-heading"
              className="text-lg font-semibold text-slate-900"
              htmlFor="job-description"
            >
              Job Description
            </label>
            <textarea
              id="job-description"
              name="jobDescription"
              rows={10}
              value={jobDescription}
              onChange={(event) => {
                setJobDescription(event.target.value);
                clearForJobDescriptionChange();
              }}
              placeholder="Paste the job description here..."
              className="mt-3 block w-full min-w-0 resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </section>

          <button
            type="button"
            disabled={!canAnalyze || isRunning}
            onClick={handleAnalyze}
            className="w-full rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition-colors hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:hover:bg-slate-300"
          >
            {requestPhase === "extracting"
              ? "Reading Resume..."
              : requestPhase === "analyzing"
                ? "Analyzing Resume and Job..."
                : requestPhase === "matching"
                  ? "Calculating Match..."
                  : "Analyze Match"}
          </button>

          {isRunning && (
            <p
              className="text-center text-sm font-medium text-blue-700"
              aria-live="polite"
            >
              {requestPhase === "extracting"
                ? "Extracting text from your resume..."
                : requestPhase === "analyzing"
                  ? "Analyzing your resume and Job Description..."
                  : "Comparing requirements and calculating your match..."}
            </p>
          )}
        </div>

        {extractionError && (
          <div
            className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
            role="alert"
          >
            <p className="font-semibold">Resume extraction error</p>
            <p className="mt-1">{extractionError}</p>
          </div>
        )}

        {analysisError && (
          <div
            className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
            role="alert"
          >
            <p className="font-semibold">Analysis error</p>
            <p className="mt-1">{analysisError}</p>
          </div>
        )}

        {matchError && (
          <div
            className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
            role="alert"
          >
            <p className="font-semibold">Matching error</p>
            <p className="mt-1">{matchError}</p>
          </div>
        )}

        {matchResult && <MatchResultView result={matchResult} />}

        {(analysisResult || (extractedText && pageCount !== null)) && (
          <details className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <summary className="cursor-pointer px-5 py-4 font-semibold text-slate-800 outline-none hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 sm:px-6">
              Technical Details
            </summary>
            <div className="border-t border-slate-200 p-5 sm:p-6">
              <p className="text-sm leading-6 text-slate-600">
                Development information used to verify extraction and
                structured analysis.
              </p>

              {extractedText && pageCount !== null && (
                <section
                  className="mt-6"
                  aria-labelledby="extracted-text-heading"
                >
                  <h2
                    id="extracted-text-heading"
                    className="text-xl font-bold text-slate-900"
                  >
                    Extracted Resume Text
                  </h2>
                  <p className="mt-2 text-sm font-medium text-slate-600">
                    Pages: {pageCount}
                  </p>
                  <pre className="mt-4 max-h-96 min-w-0 overflow-auto whitespace-pre-wrap break-words rounded-xl bg-slate-50 p-4 font-sans text-sm leading-6 text-slate-700 sm:p-5">
                    {extractedText}
                  </pre>
                </section>
              )}

              {analysisResult && (
                <section
                  className="mt-8 border-t border-slate-200 pt-8"
                  aria-labelledby="structured-analysis-heading"
                >
                  <h2
                    id="structured-analysis-heading"
                    className="text-xl font-bold text-slate-900"
                  >
                    Structured Analysis
                  </h2>
                  <div className="mt-6 grid items-start gap-8 lg:grid-cols-2">
                    <section
                      className="min-w-0"
                      aria-labelledby="resume-profile-heading"
                    >
                      <h3
                        id="resume-profile-heading"
                        className="text-lg font-bold text-slate-900"
                      >
                        Resume Profile
                      </h3>
                      <div className="mt-4 space-y-5">
                        <ProfileField
                          label="Input language"
                          value={analysisResult.resumeProfile.inputLanguage}
                        />
                        <ProfileField
                          label="Skills"
                          value={analysisResult.resumeProfile.skills}
                        />
                        <ProfileField
                          label="Languages"
                          value={analysisResult.resumeProfile.languages}
                        />
                        <ProfileField
                          label="Experience"
                          value={analysisResult.resumeProfile.experience}
                        />
                        <ProfileField
                          label="Education"
                          value={analysisResult.resumeProfile.education}
                        />
                        <ProfileField
                          label="Uncertainties"
                          value={analysisResult.resumeProfile.uncertainties}
                        />
                      </div>
                    </section>

                    <section
                      className="min-w-0"
                      aria-labelledby="job-profile-heading"
                    >
                      <h3
                        id="job-profile-heading"
                        className="text-lg font-bold text-slate-900"
                      >
                        Job Profile
                      </h3>
                      <div className="mt-4 space-y-5">
                        <ProfileField
                          label="Input language"
                          value={analysisResult.jobProfile.inputLanguage}
                        />
                        <ProfileField
                          label="Job title"
                          value={analysisResult.jobProfile.jobTitle}
                        />
                        <ProfileField
                          label="Skills (including importance)"
                          value={analysisResult.jobProfile.skills}
                        />
                        <ProfileField
                          label="Experience requirements"
                          value={
                            analysisResult.jobProfile.experienceRequirements
                          }
                        />
                        <ProfileField
                          label="Responsibilities"
                          value={analysisResult.jobProfile.responsibilities}
                        />
                        <ProfileField
                          label="Education requirements"
                          value={
                            analysisResult.jobProfile.educationRequirements
                          }
                        />
                        <ProfileField
                          label="Language requirements"
                          value={analysisResult.jobProfile.languageRequirements}
                        />
                        <ProfileField
                          label="Uncertainties"
                          value={analysisResult.jobProfile.uncertainties}
                        />
                      </div>
                    </section>
                  </div>
                </section>
              )}
            </div>
          </details>
        )}
      </div>
    </main>
  );
}
