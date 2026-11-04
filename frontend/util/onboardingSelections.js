const initialOnboardingSelections = {
  nativeLanguage: null,
  learningLanguage: null,
  dailyReadingGoal: null,
  dailyListeningGoal: null,
};

function updateOnboardingSelection(selections, key, value) {
  return {
    ...selections,
    [key]: value,
  };
}

module.exports = {
  initialOnboardingSelections,
  updateOnboardingSelection,
};
