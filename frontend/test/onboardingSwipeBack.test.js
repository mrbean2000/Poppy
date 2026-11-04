const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const hookSource = fs.readFileSync(
  path.join(__dirname, "..", "util", "useOnboardingSwipeBackToLogin.js"),
  "utf8",
);
const appSource = fs.readFileSync(path.join(__dirname, "..", "App.js"), "utf8");
const onboardingScreens = [
  "OnboardingLearningLanguageScreen",
  "OnboardingNativeLanguageScreen",
  "OnboardingDailyReadingGoalScreen",
  "OnboardingDailyListeningGoalScreen",
  "OnboardingWeeklyGoalSummaryScreen",
  "OnboardingThreeMonthBenefitsScreen",
  "OnboardingReminderScreen",
];

test("back navigation from every onboarding screen resets to Login", () => {
  assert.match(hookSource, /usePreventRemove\(true/);
  assert.match(hookSource, /CommonActions\.reset/);
  assert.match(hookSource, /routes:\s*\[\{\s*name:\s*"Login"\s*\}\]/);
  assert.match(hookSource, /setTimeout\(\(\)\s*=>/);
  assert.match(
    hookSource,
    /allowCustomNavigation\.current = true;\s*try\s*\{\s*navigation\.dispatch\([\s\S]*?CommonActions\.reset/,
  );
  assert.match(appSource, /name="Login"\s+component=\{LoginScreen\}/);

  for (const screenName of onboardingScreens) {
    const screenSource = fs.readFileSync(
      path.join(__dirname, "..", "screen", `${screenName}.js`),
      "utf8",
    );
    assert.match(
      screenSource,
      /useOnboardingSwipeBackToLogin\(navigation\)/,
      `${screenName} must redirect swipe back to Login`,
    );
  }
});

test("explicit onboarding navigation remains allowed", () => {
  for (const screenName of onboardingScreens) {
    const screenSource = fs.readFileSync(
      path.join(__dirname, "..", "screen", `${screenName}.js`),
      "utf8",
    );
    assert.match(
      screenSource,
      /runAllowedNavigation/,
      `${screenName} must allow its explicit back or continue navigation`,
    );
  }

  assert.match(hookSource, /navigation\.dispatch\(data\.action\)/);
});
