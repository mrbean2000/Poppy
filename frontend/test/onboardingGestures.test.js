const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const appSource = fs.readFileSync(path.join(__dirname, "..", "App.js"), "utf8");

const onboardingScreens = [
  "OnboardingNativeLanguageScreen",
  "OnboardingDailyReadingGoalScreen",
  "OnboardingDailyListeningGoalScreen",
  "OnboardingWeeklyGoalSummaryScreen",
  "OnboardingThreeMonthBenefitsScreen",
  "OnboardingReminderScreen",
  "OnboardingLearningLanguageScreen",
];

test("disables swipe-back gestures on every onboarding screen", () => {
  for (const screenName of onboardingScreens) {
    const screenStart = appSource.indexOf(`name="${screenName}"`);
    assert.notEqual(screenStart, -1, `${screenName} is missing`);

    const screenEnd = appSource.indexOf("/>", screenStart);
    assert.notEqual(screenEnd, -1, `${screenName} declaration is incomplete`);

    const screenBlock = appSource.slice(screenStart, screenEnd);
    assert.match(
      screenBlock,
      /gestureEnabled:\s*false/,
      `${screenName} must disable swipe-back navigation`,
    );
  }
});
