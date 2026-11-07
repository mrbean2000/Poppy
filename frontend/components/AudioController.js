import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function AudioController({
  isReadingAloud,
  speechRate,
  theme,
  onSkip,
  onPlayPress,
  onRatePress,
  isAutoScrollEnabled,
  onAutoScrollToggle,
}) {
  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        },
      ]}
    >
      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => onSkip(-5)}
          accessibilityLabel="Go back five words"
        >
          <MaterialCommunityIcons
            name="rotate-left"
            size={22}
            color="#1766B1"
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.playButton}
          onPress={onPlayPress}
          accessibilityRole="button"
          accessibilityLabel={isReadingAloud ? "Pause reading" : "Play reading"}
        >
          <Text style={styles.playIcon}>{isReadingAloud ? "Ⅱ" : "▶"}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => onSkip(5)}
          accessibilityLabel="Skip forward five words"
        >
          <MaterialCommunityIcons
            name="rotate-right"
            size={22}
            color="#1766B1"
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.speedButton}
          onPress={onRatePress}
          accessibilityLabel={`Speech speed ${speechRate} times`}
          accessibilityRole="button"
        >
          <Text style={styles.speedLabel}>{speechRate}x</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.iconButton, isAutoScrollEnabled && styles.iconButtonActive]}
          onPress={onAutoScrollToggle}
          accessibilityRole="button"
          accessibilityState={{ selected: isAutoScrollEnabled }}
          accessibilityLabel={
            isAutoScrollEnabled ? "Disable auto scroll" : "Enable auto scroll"
          }
        >
          <MaterialCommunityIcons
            name="swap-vertical"
            size={20}
            color={isAutoScrollEnabled ? "#FFFFFF" : "#1766B1"}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: "50%",
    right: 1,
    padding: 8,
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: "#172033",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -3 },
    elevation: 8,
  },
  controls: {
    alignItems: "center",
    gap: 10,
  },
  iconButton: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 17,
    backgroundColor: "#E7EEF8",
  },
  iconButtonActive: {
    backgroundColor: "#1766B1",
  },
  playButton: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 24,
    backgroundColor: "#1766B1",
  },
  playIcon: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "800",
  },
  speedButton: {
    minWidth: 42,
    paddingVertical: 8,
    paddingHorizontal: 4,
    alignItems: "center",
    borderRadius: 10,
  },
  speedLabel: {
    color: "#1766B1",
    fontSize: 12,
    fontWeight: "800",
  },
});
