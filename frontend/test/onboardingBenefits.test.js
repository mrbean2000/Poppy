const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const readSource = (name) =>
  fs.readFileSync(path.join(__dirname, "..", "screen", name), "utf8");

test("weekly summary continues to reminders and reminders to benefits", () => {
  const weeklySource = readSource("OnboardingWeeklyGoalSummaryScreen.js");
  const reminderSource = readSource("OnboardingReminderScreen.js");
  const benefitsSource = readSource("OnboardingThreeMonthBenefitsScreen.js");

  assert.match(
    weeklySource,
    /navigation\.navigate\("OnboardingReminderScreen"/,
  );
  assert.match(
    reminderSource,
    /navigation\.navigate\("OnboardingThreeMonthBenefitsScreen"/,
  );
  assert.match(
    benefitsSource,
    /navigation\.navigate\("CreateAccount"/,
  );
  assert.match(benefitsSource, /practiceRemindersEnabled:\s*route\.params\?\.practiceRemindersEnabled/);
  assert.match(benefitsSource, /Read with confidence/);
  assert.match(benefitsSource, /Listen at a much higher level/);
  assert.match(benefitsSource, /Grow your vocabulary/);
  assert.match(
    benefitsSource,
    /benefits:\s*\{[\s\S]*?borderRadius:\s*28,[\s\S]*?backgroundColor:\s*"#FFFCF5"/,
  );
  assert.match(
    benefitsSource,
    /benefitRow:\s*\{[\s\S]*?alignItems:\s*"flex-start"/,
  );
  assert.match(benefitsSource, /benefitIcon:\s*\{[\s\S]*?marginTop:\s*2/);
});
