import assert from "node:assert/strict";
import test from "node:test";

import { calculateMatchScores } from "./match-scoring.ts";

function requirement(
  importance,
  status,
  category = "skills",
) {
  return { category, importance, status };
}

test("required matched earns two of two points", () => {
  const result = calculateMatchScores([
    requirement("required", "matched"),
  ]);

  assert.equal(result.overallScore, 100);
  assert.equal(result.categories.skills.earnedPoints, 2);
  assert.equal(result.categories.skills.possiblePoints, 2);
});

test("required missing earns zero of two points", () => {
  const result = calculateMatchScores([
    requirement("required", "missing"),
  ]);

  assert.equal(result.overallScore, 0);
});

test("preferred matched earns one of one point", () => {
  const result = calculateMatchScores([
    requirement("preferred", "matched"),
  ]);

  assert.equal(result.overallScore, 100);
  assert.equal(result.categories.skills.earnedPoints, 1);
});

test("partial earns half of the importance weight", () => {
  const result = calculateMatchScores([
    requirement("required", "partial"),
  ]);

  assert.equal(result.overallScore, 50);
  assert.equal(result.categories.skills.earnedPoints, 1);
});

test("uncertain earns no points", () => {
  const result = calculateMatchScores([
    requirement("required", "uncertain"),
  ]);

  assert.equal(result.overallScore, 0);
  assert.equal(result.categories.skills.uncertain, 1);
});

test("empty category has a null score and zero points", () => {
  const result = calculateMatchScores([
    requirement("required", "matched", "skills"),
  ]);

  assert.equal(result.categories.education.score, null);
  assert.equal(result.categories.education.earnedPoints, 0);
  assert.equal(result.categories.education.possiblePoints, 0);
});

test("multiple requirements produce the expected weighted score", () => {
  const result = calculateMatchScores([
    requirement("required", "matched", "skills"),
    requirement("required", "missing", "skills"),
    requirement("preferred", "partial", "skills"),
  ]);

  assert.equal(result.overallScore, 50);
  assert.equal(result.categories.skills.score, 50);
  assert.equal(result.categories.skills.earnedPoints, 2.5);
  assert.equal(result.categories.skills.possiblePoints, 5);
});
