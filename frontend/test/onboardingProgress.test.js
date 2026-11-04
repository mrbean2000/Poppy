const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const screenSource = (name) =>
  fs.readFileSync(
    path.join(__dirname, "..", "screen", `${name}.js`),
    "utf8",
  );

const progressBarSource = (source) => {
  const roleIndex = source.indexOf('accessibilityRole="progressbar"');
  const startIndex = source.lastIndexOf("<View", roleIndex);
  const endIndex = source.indexOf("</View>", roleIndex);

  assert.notEqual(roleIndex, -1);
  assert.notEqual(startIndex, -1);
  assert.notEqual(endIndex, -1);
  return source.slice(startIndex, endIndex);
};

test("onboarding progress advances consistently through all seven steps", () => {
  const expectedProgress = [
    ["OnboardingNativeLanguageScreen", "step 2 of 7", 2, "28.57%"],
    ["OnboardingDailyReadingGoalScreen", "step 3 of 7", 3, "42.86%"],
    ["OnboardingDailyListeningGoalScreen", "step 4 of 7", 4, "57.14%"],
    ["OnboardingWeeklyGoalSummaryScreen", "step 5 of 7", 5, "71.43%"],
    ["OnboardingReminderScreen", "step 6 of 7", 6, "85.71%"],
    ["OnboardingThreeMonthBenefitsScreen", "step 7 of 7", 7, "100%"],
  ];

  for (const [screenName, label, step, width] of expectedProgress) {
    const source = screenSource(screenName);
    assert.ok(source.includes(`accessibilityLabel="Onboarding ${label}"`));
    assert.ok(source.includes(`max: 7, now: ${step}`));
    assert.ok(source.includes(`width: "${width}"`));

    const progressBar = progressBarSource(source);
    assert.match(progressBar, /backgroundColor:\s*"#DDD4C4"/);
    assert.match(progressBar, /backgroundColor:\s*"#FFD044"/);
  }

  const learningLanguageSource = screenSource(
    "OnboardingLearningLanguageScreen",
  );
  assert.ok(
    learningLanguageSource.includes(
      "accessibilityLabel={`Onboarding step ${currentStep} of 7`}",
    ),
  );
  assert.ok(
    learningLanguageSource.includes(
      'width: currentStep === 1 ? "14.29%" : "28.57%"',
    ),
  );
  const learningLanguageProgressBar = progressBarSource(
    learningLanguageSource,
  );
  assert.match(learningLanguageProgressBar, /backgroundColor:\s*"#DDD4C4"/);
  assert.match(learningLanguageProgressBar, /backgroundColor:\s*"#FFD044"/);
});
