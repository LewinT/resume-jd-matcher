"use client";

import { useRef, useState, type ChangeEvent } from "react";

type ExtractionResponse = {
  text?: unknown;
  pages?: unknown;
  error?: unknown;
};

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [extractedText, setExtractedText] = useState("");
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [extractionError, setExtractionError] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const activeRequest = useRef<AbortController | null>(null);

  const canAnalyze =
    selectedFile !== null && jobDescription.trim().length > 0;

  function clearExtraction() {
    activeRequest.current?.abort();
    activeRequest.current = null;
    setExtractedText("");
    setPageCount(null);
    setExtractionError("");
    setIsExtracting(false);
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    clearExtraction();

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
    if (!canAnalyze || !selectedFile || isExtracting) {
      return;
    }

    const controller = new AbortController();
    activeRequest.current = controller;
    setIsExtracting(true);
    setExtractionError("");
    setExtractedText("");
    setPageCount(null);

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await fetch("/api/extract-resume", {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });
      const data = (await response.json()) as ExtractionResponse;

      if (!response.ok) {
        const message =
          typeof data.error === "string"
            ? data.error
            : "The resume could not be read. Please try again.";
        setExtractionError(message);
        return;
      }

      if (typeof data.text !== "string" || typeof data.pages !== "number") {
        setExtractionError("The server returned an unexpected response.");
        return;
      }

      setExtractedText(data.text);
      setPageCount(data.pages);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      setExtractionError(
        "The resume could not be sent to the server. Please try again.",
      );
    } finally {
      if (activeRequest.current === controller) {
        activeRequest.current = null;
        setIsExtracting(false);
      }
    }
  }

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-slate-50 px-4 py-12 sm:px-6">
      <div className="w-full max-w-2xl">
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
                clearExtraction();
              }}
              placeholder="Paste the job description here..."
              className="mt-3 block w-full resize-y rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </section>

          <button
            type="button"
            disabled={!canAnalyze || isExtracting}
            onClick={handleAnalyze}
            className="w-full rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white transition-colors hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:hover:bg-slate-300"
          >
            {isExtracting ? "Reading Resume..." : "Analyze Match"}
          </button>
        </div>

        {extractionError && (
          <div
            className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700"
            role="alert"
          >
            {extractionError}
          </div>
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
