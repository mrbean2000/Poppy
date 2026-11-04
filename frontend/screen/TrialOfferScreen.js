import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  ImageBackground,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const trialAnnualSteps = [
  {
    icon: "lock-open-outline",
    title: "Today",
    description: "Unlock every story, word translation and flashcard",
  },
  {
    icon: "bell-outline",
    title: "In 12 days",
    description: "We’ll send you a reminder that your trial is ending soon.",
  },
  {
    icon: "star",
    title: "In 14 days",
    description: `You'll be charged on ${new Date(
      Date.now() + 14 * 24 * 60 * 60 * 1000,
    ).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
    })}, cancel anytime before that date`,
  },
];

const trialMonthlySteps = [
  {
    icon: "lock-open-outline",
    title: "Today",
    description: "Unlock every story, word translation and flashcard",
  },
  {
    icon: "bell-outline",
    title: "In 5 days",
    description: "We’ll send you a reminder that your trial is ending soon.",
  },
  {
    icon: "star",
    title: "In 7 days",
    description: `You'll be charged on ${new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000,
    ).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
    })}, cancel anytime before that date`,
  },
];

const trialPlans = [
  {
    id: "annual",
    name: "Annual",
    price: "$1.99",
    savings: null,
    isPopular: true,
  },
  {
    id: "monthly",
    name: "Monthly",
    price: "$2.49",
    savings: null,
    isPopular: false,
  },
];

export default function TrialOfferScreen({ navigation }) {
  const [selectedPlan, setSelectedPlan] = useState("annual");
  const selectedPlanDetails = trialPlans.find(
    (plan) => plan.id === selectedPlan,
  );
  const trialSteps =
    selectedPlanDetails.id === "annual" ? trialAnnualSteps : trialMonthlySteps;

  const handleStartTrial = () => {
    Alert.alert("You're all set.", "Your purchase was successful.", [
      {
        text: "OK",
        onPress: () =>
          navigation.replace("TrialStarted", {
            trialDays: selectedPlan === "annual" ? 14 : 7,
          }),
      },
    ]);
  };

  return (
    <ImageBackground
      source={require("../assets/images/masot/paywall_background.png")}
      style={styles.background}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={28}
              color="#203B32"
            />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.scrollContent}>
            <Text style={styles.title}>How your trial works</Text>
            <Text style={styles.subtitle}>
              {selectedPlanDetails.id === "annual"
                ? "First 14 days free"
                : "First 7 days free"}
              , then{" "}
              {selectedPlanDetails.id === "annual"
                ? `$${(
                    parseFloat(selectedPlanDetails.price.slice(1)) * 12
                  ).toFixed(
                    2,
                  )} ($${selectedPlanDetails.price.slice(1)} / month)`
                : `${selectedPlanDetails.price} / month`}
            </Text>

            <View style={styles.plansContainer}>
              {trialPlans.map((plan) => {
                const isSelected = selectedPlan === plan.id;
                return (
                  <TouchableOpacity
                    key={plan.id}
                    style={[
                      styles.planButton,
                      isSelected && styles.planButtonActive,
                    ]}
                    onPress={() => setSelectedPlan(plan.id)}
                    accessibilityRole="button"
                    accessibilityLabel={`Select ${plan.name} plan`}
                    accessibilityState={{ selected: isSelected }}
                  >
                    <Text
                      style={[
                        styles.planName,
                        isSelected && styles.planNameActive,
                      ]}
                    >
                      {plan.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <View style={styles.stepsContainer}>
              {trialSteps.map((step, index) => (
                <View key={index} style={styles.stepRow}>
                  <View style={styles.stepIconContainer}>
                    <View style={styles.stepIcon}>
                      <MaterialCommunityIcons
                        name={step.icon}
                        size={24}
                        color="#FFFFFF"
                      />
                    </View>
                    <View
                      style={[
                        styles.stepConnector,
                        index === trialSteps.length - 1 &&
                          styles.lastStepConnector,
                      ]}
                    >
                      {index === trialSteps.length - 1 ? (
                        <>
                          <View style={styles.lastConnectorTop} />
                          <View style={styles.lastConnectorMiddle} />
                          <View style={styles.lastConnectorBottom} />
                        </>
                      ) : null}
                    </View>
                  </View>
                  <View style={styles.stepContent}>
                    <Text style={styles.stepTitle}>{step.title}</Text>
                    <Text style={styles.stepDescription}>
                      {step.description.split("cancel anytime")[0]}
                      {step.description.includes("cancel anytime") ? (
                        <>
                          {"\n"}
                          <Text style={styles.stepDescriptionStrong}>
                            cancel anytime
                          </Text>
                        </>
                      ) : null}
                      {step.description.split("cancel anytime")[1]}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.startButton, { backgroundColor: "#2F80ED" }]}
            onPress={handleStartTrial}
            accessibilityRole="button"
            accessibilityLabel="Start my free trial"
          >
            <Text style={styles.startButtonText}>Start my free trial</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "transparent" },
  background: { flex: 1 },
  content: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.72)",
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 12,
    marginBottom: 18,
  },
  title: {
    fontSize: 28,
    lineHeight: 33,
    fontWeight: "800",
    color: "#20242B",
    textAlign: "center",
    marginTop: "40%",
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 20,
    color: "#3D414A",
    textAlign: "center",
    marginBottom: 20,
    fontWeight: "500",
  },
  plansContainer: {
    flexDirection: "row",
    alignSelf: "center",
    width: "76%",
    padding: 4,
    marginBottom: 20,
    borderRadius: 30,
    backgroundColor: "rgba(255, 255, 255, 0.78)",
  },
  planButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 26,
  },
  planButtonActive: { backgroundColor: "#FFD044" },
  planName: {
    fontSize: 17,
    fontWeight: "700",
    color: "#30343B",
  },
  planNameActive: { color: "#20242B" },
  stepsContainer: { marginBottom: 4 },
  stepRow: {
    flexDirection: "row",
    marginBottom: 18,
  },
  stepIconContainer: {
    alignItems: "center",
    width: 52,
    marginRight: 8,
    paddingTop: 2,
  },
  stepIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FF8A1F",
    alignItems: "center",
    justifyContent: "center",
  },
  stepConnector: {
    width: 2,
    flex: 1,
    minHeight: 40,
    backgroundColor: "#F2C98E",
    marginTop: 6,
  },
  lastStepConnector: {
    flex: 0,
    height: 55,
    backgroundColor: "transparent",
  },
  lastConnectorTop: {
    flex: 1,
    backgroundColor: "#BFE7A5",
  },
  lastConnectorMiddle: {
    flex: 1,
    backgroundColor: "#BFE7A5",
    opacity: 0.55,
  },
  lastConnectorBottom: {
    flex: 1,
    backgroundColor: "#BFE7A5",
    opacity: 0.2,
  },
  stepContent: { flex: 1, justifyContent: "center" },
  stepTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#20242B",
    marginBottom: 1,
  },
  stepDescription: {
    fontSize: 14,
    color: "#626875",
    lineHeight: 19,
  },
  stepDescriptionStrong: { fontWeight: "800" },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 8,
    paddingTop: 2,
    backgroundColor: "transparent",
  },
  startButton: {
    minHeight: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
