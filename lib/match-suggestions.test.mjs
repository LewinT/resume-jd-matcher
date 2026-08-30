import assert from "node:assert/strict";
import test from "node:test";

import { buildSuggestions } from "./match-suggestions.ts";

function evidence(id = "skill-0-evidence-0", text = "Python") {
  return { id, category: "skills", text };
}

function requirement({
  id,
  status,
  importance = "required",
  resumeEvidence,
}) {
  return {
    id,
    category: "skills",
    requirement: id,
    importance,
    status,
    explanation: `${id} explanation.`,
    jdEvidence: [id],
    resumeEvidence:
      resumeEvidence ??
      (status === "missing" ? [] : [evidence(`${id}-evidence`, id)]),
  };
}

test("matched creates an increase_visibility improvement", () => {
  const result = buildSuggestions(
    [requirement({ id: "python", status: "matched" })],
    "en",
  );

  assert.equal(result.supportedImprovements.length, 1);
  assert.equal(
    result.supportedImprovements[0].action,
    "increase_visibility",
  );
  assert.equal(result.supportedImprovements[0].claimBoundary, null);
});

test("partial creates clarify_supported_scope with a claim boundary", () => {
  const result = buildSuggestions(
    [requirement({ id: "five-years-python", status: "partial" })],
    "en",
  );

  assert.equal(result.supportedImprovements.length, 1);
  assert.equal(
    result.supportedImprovements[0].action,
    "clarify_supported_scope",
  );
  assert.ok(result.supportedImprovements[0].claimBoundary.length > 0);
});

test("missing creates only a fabrication-protected gap", () => {
  const result = buildSuggestions(
    [requirement({ id: "sap", status: "missing" })],
    "en",
  );

  assert.equal(result.supportedImprovements.length, 0);
  assert.equal(result.gapsThatMustNotBeFabricated.length, 1);
  assert.equal(result.needsVerification.length, 0);
});

test("uncertain creates only a verification item", () => {
  const result = buildSuggestions(
    [requirement({ id: "ambiguous-skill", status: "uncertain" })],
    "en",
  );

  assert.equal(result.supportedImprovements.length, 0);
  assert.equal(result.gapsThatMustNotBeFabricated.length, 0);
  assert.equal(result.needsVerification.length, 1);
});

test("missing never creates a supported improvement", () => {
  const result = buildSuggestions(
    [
      requirement({ id: "python", status: "matched" }),
      requirement({ id: "sap", status: "missing" }),
    ],
    "en",
  );

  assert.equal(
    result.supportedImprovements.some(
      (item) => item.relatedRequirementId === "sap",
    ),
    false,
  );
});

test("every supported improvement contains existing resume evidence", () => {
  const result = buildSuggestions(
    [
      requirement({ id: "python", status: "matched" }),
      requirement({ id: "matlab", status: "partial" }),
    ],
    "en",
  );

  assert.equal(
    result.supportedImprovements.every(
      (item) => item.existingResumeEvidence.length > 0,
    ),
    true,
  );
});

test("supported improvements are deterministically ordered and limited to five", () => {
  const result = buildSuggestions(
    [
      requirement({
        id: "preferred-matched",
        status: "matched",
        importance: "preferred",
      }),
      requirement({ id: "required-matched-1", status: "matched" }),
      requirement({
        id: "unspecified-partial",
        status: "partial",
        importance: "unspecified",
      }),
      requirement({ id: "required-partial", status: "partial" }),
      requirement({
        id: "preferred-partial",
        status: "partial",
        importance: "preferred",
      }),
      requirement({ id: "required-matched-2", status: "matched" }),
      requirement({
        id: "unspecified-matched",
        status: "matched",
        importance: "unspecified",
      }),
    ],
    "en",
  );

  assert.deepEqual(
    result.supportedImprovements.map((item) => item.relatedRequirementId),
    [
      "required-partial",
      "required-matched-1",
      "required-matched-2",
      "preferred-partial",
      "preferred-matched",
    ],
  );
});

test("German input uses German suggestion templates", () => {
  const result = buildSuggestions(
    [
      requirement({ id: "python", status: "matched" }),
      requirement({ id: "sap", status: "missing" }),
    ],
    "de",
  );

  assert.equal(result.language, "de");
  assert.match(result.supportedImprovements[0].reason, /Lebenslauf/);
  assert.equal(
    result.gapsThatMustNotBeFabricated[0].reason,
    "Diese Anforderung ist im aktuellen Lebenslauf nicht belegt. Ergänzen Sie sie nur, wenn sie tatsächlich zutrifft.",
  );
});

test("English input uses English suggestion templates", () => {
  const result = buildSuggestions(
    [
      requirement({ id: "python", status: "matched" }),
      requirement({ id: "sap", status: "missing" }),
    ],
    "en",
  );

  assert.equal(result.language, "en");
  assert.match(result.supportedImprovements[0].reason, /resume/);
  assert.equal(
    result.gapsThatMustNotBeFabricated[0].reason,
    "This requirement is not supported by the current resume. Do not add it unless it is genuinely true.",
  );
});

test("mixed and unknown input languages fall back to English", () => {
  for (const inputLanguage of ["mixed", "unknown"]) {
    const result = buildSuggestions(
      [requirement({ id: inputLanguage, status: "matched" })],
      inputLanguage,
    );

    assert.equal(result.language, "en");
    assert.match(result.supportedImprovements[0].reason, /resume/);
  }
});
