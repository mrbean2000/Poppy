const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const source = fs.readFileSync(
  path.join(__dirname, "..", "screen", "OnboardingDailyListeningGoalScreen.js"),
  "utf8",
);

test("restores listening content animation values whenever screen gains focus", () => {
  assert.match(source, /useFocusEffect/);
  assert.match(source, /contentOpacity\.setValue\(0\)/);
  assert.match(source, /contentOffset\.setValue\(20\)/);
  assert.match(source, /toValue:\s*1/);
  assert.match(source, /toValue:\s*0/);
});
