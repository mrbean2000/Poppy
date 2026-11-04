import { useEffect, useRef } from "react";
import {
  Animated,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function TrialStartedScreen({ navigation, route }) {
  const trialDays = route.params?.trialDays || 14;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentOffset = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    const animation = Animated.parallel([
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 240,
        useNativeDriver: true,
      }),
      Animated.timing(contentOffset, {
        toValue: 0,
        duration: 240,
        useNativeDriver: true,
      }),
    ]);

    animation.start();

    return () => animation.stop();
  }, [contentOffset, contentOpacity]);

  function finish() {
    navigation.replace("Home");
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Animated.View
        style={[
          styles.content,
          {
            opacity: contentOpacity,
            transform: [{ translateX: contentOffset }],
          },
        ]}
      >
        <Text style={styles.title}>Your {trialDays} day trial has started</Text>
        <Text style={styles.subtitle}>
          Get notifications about when your trial is about to end and more.
        </Text>

        <View style={styles.illustration}>
          <MaterialCommunityIcons
            name="bell"
            size={150}
            color="#FFCC05"
            style={styles.bell}
          />
          <MaterialCommunityIcons
            name="star-four-points"
            size={28}
            color="#FF8A00"
            style={styles.sparkleOne}
          />
          <MaterialCommunityIcons
            name="star-four-points"
            size={22}
            color="#FF8A00"
            style={styles.sparkleTwo}
          />
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={finish}
            accessibilityRole="button"
            accessibilityLabel="Remind me"
          >
            <Text style={styles.primaryButtonText}>Remind me</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={finish}
            accessibilityRole="button"
            accessibilityLabel="Maybe later"
          >
            <Text style={styles.secondaryButtonText}>Maybe later</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  content: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 72,
    paddingBottom: 28,
  },
  title: {
    color: "#36363B",
    fontSize: 32,
    lineHeight: 40,
    fontWeight: "800",
    textAlign: "center",
  },
  subtitle: {
    maxWidth: 350,
    marginTop: 36,
    color: "#3F3F44",
    fontSize: 22,
    lineHeight: 30,
    textAlign: "center",
  },
  illustration: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  bell: { transform: [{ rotate: "-12deg" }] },
  sparkleOne: { position: "absolute", top: "38%", left: "58%" },
  sparkleTwo: { position: "absolute", top: "34%", left: "64%" },
  actions: { width: "100%", gap: 18 },
  primaryButton: {
    minHeight: 64,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 32,
    backgroundColor: "#1677F2",
    borderBottomWidth: 4,
    borderBottomColor: "#D5D5D5",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "400",
  },
  secondaryButton: {
    minHeight: 46,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 32,
    backgroundColor: "#FFF9F9",
    borderBottomWidth: 3,
    borderBottomColor: "#D5D5D5",
  },
  secondaryButtonText: {
    color: "#36363B",
    fontSize: 20,
    fontWeight: "400",
  },
});
