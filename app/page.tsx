"use client";

import { useState, type ChangeEvent } from "react";

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [showResults, setShowResults] = useState(false);

  const canAnalyze =
    selectedFile !== null && jobDescription.trim().length > 0;

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setShowResults(false);

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

  function handleAnalyze() {
    if (canAnalyze) {
      setShowResults(true);
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
                setShowResults(false);
              }}
              placeholder="Paste the job description here..."
              className="mt-3 block w-full resize-y rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </section>

          <button
            type="button"
            disabled={!canAnalyze}
            onClick={handleAnalyze}
            className="w-full rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white transition-colors hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:hover:bg-slate-300"
          >
            Analyze Match
          </button>
        </div>

        {showResults && canAnalyze && (
          <section
            className="mt-8 rounded-2xl border border-blue-200 bg-white p-6 shadow-sm sm:p-8"
            aria-labelledby="results-heading"
          >
            <div className="border-b border-slate-200 pb-5">
              <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
                Analysis Result
              </p>
              <h2
                id="results-heading"
                className="mt-1 text-2xl font-bold text-slate-900"
              >
                Overall Match: <span className="text-blue-600">78%</span>
              </h2>
            </div>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <div className="rounded-xl bg-emerald-50 p-5">
                <h3 className="font-semibold text-emerald-900">
                  Matched Skills
                </h3>
                <ul className="mt-3 list-inside list-disc space-y-1 text-emerald-800">
                  <li>Python</li>
                  <li>MATLAB</li>
                  <li>CAD</li>
                </ul>
              </div>

              <div className="rounded-xl bg-amber-50 p-5">
                <h3 className="font-semibold text-amber-900">
                  Missing Skills
                </h3>
                <ul className="mt-3 list-inside list-disc space-y-1 text-amber-800">
                  <li>Git</li>
                  <li>Power BI</li>
                </ul>
              </div>
            </div>

            <div className="mt-5 rounded-xl bg-slate-50 p-5">
              <h3 className="font-semibold text-slate-900">
                Resume Suggestions
              </h3>
              <ul className="mt-3 list-inside list-disc space-y-2 text-slate-700">
                <li>Quantify the impact of project work.</li>
                <li>Make relevant technical skills easier to find.</li>
                <li>
                  Highlight experience that directly matches the job
                  requirements.
                </li>
              </ul>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
