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
  borderClass: string;
  backgroundClass: string;
  badgeClass: string;
}> = [
  {
    status: "matched",
    label: "Matched",
    borderClass: "border-emerald-200",
    backgroundClass: "bg-emerald-50/50",
    badgeClass: "bg-emerald-100 text-emerald-800",
  },
  {
    status: "partial",
    label: "Partial",
    borderClass: "border-amber-200",
    backgroundClass: "bg-amber-50/50",
    badgeClass: "bg-amber-100 text-amber-800",
  },
  {
    status: "missing",
    label: "Missing",
    borderClass: "border-red-200",
    backgroundClass: "bg-red-50/50",
    badgeClass: "bg-red-100 text-red-800",
  },
  {
    status: "uncertain",
    label: "Uncertain",
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
    Array.isArray(data.requirements) &&
    data.requirements.every(
      (requirement) =>
        isRecord(requirement) &&
        typeof requirement.id === "string" &&
        typeof requirement.requirement === "string" &&
        (requirement.importance === "required" ||
          requirement.importance === "preferred" ||
          requirement.importance === "unspecified") &&
        isMatchStatus(requirement.status) &&
        typeof requirement.explanation === "string" &&
        Array.isArray(requirement.resumeEvidence) &&
        requirement.resumeEvidence.every(
          (evidence) =>
            isRecord(evidence) &&
            typeof evidence.id === "string" &&
            typeof evidence.category === "string" &&
            typeof evidence.text === "string",
        ),
    )
  );
}

function importanceLabel(importance: string) {
  if (importance === "unspecified") {
    return "Importance not stated";
  }

  return `${importance.charAt(0).toUpperCase()}${importance.slice(1)}`;
}

function MatchResultView({ result }: { result: MatchResult }) {
  return (
    <section
      className="mt-8 rounded-2xl border border-blue-200 bg-white p-6 shadow-sm sm:p-8"
      aria-labelledby="match-result-heading"
    >
      <div className="text-center">
        <h2
          id="match-result-heading"
          className="text-lg font-semibold text-slate-700"
        >
          Overall Match
        </h2>
        <p className="mt-2 text-5xl font-bold tracking-tight text-blue-700">
          {result.overallScore}%
        </p>
        <p className="mt-3 text-sm text-slate-600">
          Calculated from fixed requirement and importance weights.
        </p>
      </div>

      <section className="mt-8" aria-labelledby="category-breakdown-heading">
        <h3
          id="category-breakdown-heading"
          className="text-xl font-bold text-slate-900"
        >
          Category Breakdown
        </h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {CATEGORY_LABELS.map(({ key, label }) => {
            const category = result.categories[key];

            return (
              <div
                key={key}
                className="rounded-xl border border-slate-200 bg-slate-50 p-4"
              >
                <p className="text-sm font-medium text-slate-600">{label}</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">
                  {category.score === null ? "N/A" : `${category.score}%`}
                </p>
                {category.score !== null && (
                  <p className="mt-1 text-xs text-slate-500">
                    {category.earnedPoints} / {category.possiblePoints} points
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section
        className="mt-10 border-t border-slate-200 pt-8"
        aria-labelledby="requirement-results-heading"
      >
        <h3
          id="requirement-results-heading"
          className="text-xl font-bold text-slate-900"
        >
          Requirement Results
        </h3>

        {result.requirements.length === 0 ? (
          <p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
            No job requirements were identified for comparison.
          </p>
        ) : (
          <div className="mt-5 space-y-8">
            {STATUS_SECTIONS.map((section) => {
              const requirements = result.requirements.filter(
                (requirement) => requirement.status === section.status,
              );

              return (
                <section key={section.status}>
                  <div className="flex items-center gap-2">
                    <h4 className="text-lg font-bold text-slate-900">
                      {section.label}
                    </h4>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${section.badgeClass}`}
                    >
                      {requirements.length}
                    </span>
                  </div>

                  {requirements.length === 0 ? (
                    <p className="mt-3 text-sm text-slate-500">
                      No {section.label.toLowerCase()} requirements.
                    </p>
                  ) : (
                    <div className="mt-3 space-y-3">
                      {requirements.map((requirement) => (
                        <article
                          key={requirement.id}
                          className={`rounded-xl border p-4 ${section.borderClass} ${section.backgroundClass}`}
                        >
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <h5 className="font-semibold text-slate-900">
                              {requirement.requirement}
                            </h5>
                            <div className="flex flex-wrap gap-2">
                              <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-200">
                                {importanceLabel(requirement.importance)}
                              </span>
                              <span
                                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${section.badgeClass}`}
                              >
                                {section.label}
                              </span>
                            </div>
                          </div>

                          <p className="mt-3 text-sm leading-6 text-slate-700">
                            {requirement.explanation}
                          </p>

                          {requirement.status !== "missing" &&
                            requirement.resumeEvidence.length > 0 && (
                              <div className="mt-4">
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                                  Resume evidence
                                </p>
                                <ul className="mt-2 space-y-2">
                                  {requirement.resumeEvidence.map((evidence) => (
                                    <li
                                      key={evidence.id}
                                      className="rounded-lg bg-white p-3 text-sm italic leading-6 text-slate-700 ring-1 ring-slate-200"
                                    >
                                      “{evidence.text}”
                                    </li>
                                  ))}
                                </ul>
                              </div>
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
    </section>
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
    <main className="flex min-h-screen w-full items-center justify-center bg-slate-50 px-4 py-12 sm:px-6">
      <div className="w-full max-w-4xl">
        <header className="mb-10 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Resume ↔ Job Matcher
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
            Upload your resume and paste a job description to see how well they
            match.
          </p>
        </header>

        <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
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
                className="block w-full rounded-lg border border-slate-300 bg-white text-sm text-slate-600 file:mr-4 file:border-0 file:border-r file:border-slate-300 file:bg-slate-100 file:px-4 file:py-3 file:font-medium file:text-slate-800 hover:file:bg-slate-200"
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
              className="mt-3 block w-full resize-y rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </section>

          <button
            type="button"
            disabled={!canAnalyze || isRunning}
            onClick={handleAnalyze}
            className="w-full rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white transition-colors hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:hover:bg-slate-300"
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

        {analysisResult && (
          <section
            className="mt-8 rounded-2xl border border-emerald-200 bg-white p-6 shadow-sm sm:p-8"
            aria-labelledby="structured-analysis-heading"
          >
            <h2
              id="structured-analysis-heading"
              className="text-2xl font-bold text-slate-900"
            >
              Structured Analysis
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Development view of the structured profiles used for matching.
            </p>

            <section className="mt-8" aria-labelledby="resume-profile-heading">
              <h2
                id="resume-profile-heading"
                className="text-xl font-bold text-slate-900"
              >
                Resume Profile
              </h2>
              <div className="mt-5 space-y-5">
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
              className="mt-10 border-t border-slate-200 pt-8"
              aria-labelledby="job-profile-heading"
            >
              <h2
                id="job-profile-heading"
                className="text-xl font-bold text-slate-900"
              >
                Job Profile
              </h2>
              <div className="mt-5 space-y-5">
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
                  value={analysisResult.jobProfile.experienceRequirements}
                />
                <ProfileField
                  label="Responsibilities"
                  value={analysisResult.jobProfile.responsibilities}
                />
                <ProfileField
                  label="Education requirements"
                  value={analysisResult.jobProfile.educationRequirements}
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
          </section>
        )}

        {extractedText && pageCount !== null && (
          <section
            className="mt-8 rounded-2xl border border-blue-200 bg-white p-6 shadow-sm sm:p-8"
            aria-labelledby="extracted-text-heading"
          >
            <h2
              id="extracted-text-heading"
              className="text-2xl font-bold text-slate-900"
            >
              Extracted Resume Text
            </h2>
            <p className="mt-2 text-sm font-medium text-slate-600">
              Pages: {pageCount}
            </p>
            <pre className="mt-5 max-h-96 overflow-y-auto whitespace-pre-wrap break-words rounded-xl bg-slate-50 p-5 font-sans text-sm leading-6 text-slate-700">
              {extractedText}
            </pre>
          </section>
        )}
      </div>
    </main>
  );
}
