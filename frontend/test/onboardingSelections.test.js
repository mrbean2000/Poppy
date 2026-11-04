const test = require("node:test");
const assert = require("node:assert/strict");
const {
  initialOnboardingSelections,
  updateOnboardingSelection,
} = require("../util/onboardingSelections");

test("preserves every onboarding choice while another choice changes", () => {
  const nativeLanguage = { id: "en", language: "English" };
  const learningLanguage = { id: "ja", language: "Japanese" };
  const readingGoal = { articles: 4, level: "Serious" };
  const listeningGoal = { minutes: 30, level: "Dedicated" };

  let selections = updateOnboardingSelection(
    initialOnboardingSelections,
    "nativeLanguage",
    nativeLanguage,
  );
  selections = updateOnboardingSelection(
    selections,
    "learningLanguage",
    learningLanguage,
  );
  selections = updateOnboardingSelection(
    selections,
    "dailyReadingGoal",
    readingGoal,
  );
  selections = updateOnboardingSelection(
    selections,
    "dailyListeningGoal",
    listeningGoal,
  );

  assert.deepEqual(selections.nativeLanguage, nativeLanguage);
  assert.deepEqual(selections.learningLanguage, learningLanguage);
  assert.deepEqual(selections.dailyReadingGoal, readingGoal);
  assert.deepEqual(selections.dailyListeningGoal, listeningGoal);
});

test("deselecting one choice clears only that choice", () => {
  const selections = {
    nativeLanguage: { id: "en" },
    learningLanguage: { id: "ja" },
    dailyReadingGoal: 4,
    dailyListeningGoal: 30,
  };

  const updated = updateOnboardingSelection(
    selections,
    "dailyListeningGoal",
    null,
  );

  assert.equal(updated.dailyListeningGoal, null);
  assert.deepEqual(updated.nativeLanguage, selections.nativeLanguage);
  assert.deepEqual(updated.learningLanguage, selections.learningLanguage);
  assert.equal(updated.dailyReadingGoal, selections.dailyReadingGoal);
});
