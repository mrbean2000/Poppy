const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const read = (file) =>
  fs.readFileSync(path.join(__dirname, "..", file), "utf8");

test("TrialOfferScreen is imported in App.js", () => {
  const appSource = read("App.js");
  assert.match(appSource, /import TrialOfferScreen from "\.\/screen\/TrialOfferScreen"/);
});

test("TrialOfferScreen is registered in Stack.Navigator", () => {
  const appSource = read("App.js");
  assert.match(appSource, /name="TrialOffer"[\s\S]*?component=\{TrialOfferScreen\}/);
  assert.match(appSource, /TrialOffer[\s\S]*?headerShown:\s*false/);
});

test("CreateAccountScreen navigates to TrialOffer after successful account creation", () => {
  const createAccountSource = read("screen/CreateAccountScreen.js");
  assert.match(
    createAccountSource,
    /await createAccount\(email, password\);[\s\S]*?navigation\.navigate\("TrialOffer"\)/
  );
});

test("TrialOfferScreen exports a valid React component", () => {
  const trialSource = read("screen/TrialOfferScreen.js");
  assert.match(trialSource, /export default function TrialOfferScreen/);
});

test("TrialOfferScreen includes plan selection toggle", () => {
  const trialSource = read("screen/TrialOfferScreen.js");
  assert.match(trialSource, /Annual/);
  assert.match(trialSource, /Monthly/);
  assert.match(trialSource, /selectedPlan/);
});

test("TrialOfferScreen includes trial timeline with 3 steps", () => {
  const trialSource = read("screen/TrialOfferScreen.js");
  assert.match(trialSource, /How your trial works/);
  assert.match(trialSource, /lock-outline|bell-outline|star-outline/);
  assert.match(trialSource, /Today|In 12 days|In 14 days/);
});

test("TrialOfferScreen includes CTA button", () => {
  const trialSource = read("screen/TrialOfferScreen.js");
  assert.match(trialSource, /Start my free trial|Start trial/);
});

test("TrialOfferScreen has sun illustration", () => {
  const trialSource = read("screen/TrialOfferScreen.js");
  assert.match(trialSource, /sun-circle|circle.*background.*yellow|illustration/i);
});
