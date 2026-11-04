const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const read = (file) =>
  fs.readFileSync(path.join(__dirname, "..", file), "utf8");

test("login and onboarding navigate to the separate account creation screen", () => {
  const appSource = read("App.js");
  const loginSource = read("screen/LoginScreen.js");
  const benefitsSource = read("screen/OnboardingThreeMonthBenefitsScreen.js");

  assert.match(appSource, /name="CreateAccount"[\s\S]*?component=\{CreateAccountScreen\}/);
  assert.match(loginSource, /navigation\.navigate\("CreateAccount"\)/);
  assert.match(benefitsSource, /navigation\.navigate\("CreateAccount"/);
  assert.doesNotMatch(loginSource, /Create your account/);
});

test("account creation uses Facebook with Google and Apple alternatives", () => {
  const source = read("screen/CreateAccountScreen.js");

  assert.match(source, /FacebookAuthProvider\.credential\(accessToken\)/);
  assert.match(source, /EXPO_PUBLIC_FACEBOOK_APP_ID/);
  assert.match(source, /Continue with Facebook/);
  assert.match(source, /disabled=\{!isFirebaseConfigured \|\| isBusy\}/);
  assert.doesNotMatch(source, /Add EXPO_PUBLIC_FACEBOOK_APP_ID/);
  assert.match(source, /Sign up with Email/);
  assert.match(source, /AppleAuthenticationButtonType\s*\.CONTINUE/);
  assert.match(source, /showEmailForm \? \(/);
  assert.match(source, /placeholder="Email address"/);
  assert.match(source, /placeholder="Confirm password"/);
  assert.match(source, /await createAccount\(email, password\)/);
  assert.match(source, /<GoogleSignInButton/);
});

test("Facebook, Google, Apple, and email choices are shown without a Continue with divider", () => {
  const source = read("screen/CreateAccountScreen.js");
  const facebookIndex = source.indexOf("Continue with Facebook");
  const googleIndex = source.indexOf("<GoogleSignInButton");
  const appleIndex = source.indexOf("AppleAuthenticationButton");
  const emailIndex = source.indexOf("Sign up with Email");

  assert.doesNotMatch(source, /CONTINUE WITH/);
  assert.ok(facebookIndex >= 0);
  assert.ok(googleIndex > facebookIndex);
  assert.ok(appleIndex > googleIndex);
  assert.ok(emailIndex > appleIndex);
});

test("account creation back button matches onboarding styling", () => {
  const source = read("screen/CreateAccountScreen.js");

  assert.match(source, /backButton:\s*\{[\s\S]*?borderRadius:\s*22/);
  assert.match(source, /borderColor:\s*"#F9D96F"/);
  assert.match(source, /backgroundColor:\s*"#FFFCF5"/);
  assert.match(source, /name="arrow-left"\s+size=\{28\}\s+color="#203B32"/);
});

test("account form content is not enclosed in a card", () => {
  const source = read("screen/CreateAccountScreen.js");

  assert.match(source, /<View style=\{styles\.formContent\}>/);
  assert.doesNotMatch(source, /formCard:/);
});

test("account form content starts near the top of the screen", () => {
  const source = read("screen/CreateAccountScreen.js");

  assert.match(source, /content:\s*\{[\s\S]*?paddingTop:\s*12/);
});

test("account title uses the dark onboarding text color", () => {
  const source = read("screen/CreateAccountScreen.js");

  assert.match(source, /styles\.title,\s*\{\s*color:\s*"#203B32"\s*\}/);
});

test("account back button uses the onboarding top-bar position", () => {
  const source = read("screen/CreateAccountScreen.js");

  assert.match(
    source,
    /topBar:\s*\{[\s\S]*?paddingHorizontal:\s*24,[\s\S]*?paddingTop:\s*4/,
  );
  assert.match(source, /<View style=\{styles\.topBar\}>/);
});
