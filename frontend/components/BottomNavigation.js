import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Svg, { Circle, Path, Rect } from "react-native-svg";
import { useTheme } from "../theme/ThemeContext";

const tabs = [
  { route: "Home", label: "Home", icon: "home" },
  { route: "Vocabulary", label: "Vocabulary", icon: "vocabulary" },
  { route: "Flashcards", label: "Flashcards", icon: "flashcards" },
  { route: "Import", label: "Import", icon: "import" },
];

function TabIcon({ name, color, active }) {
  const commonProps = {
    width: 25,
    height: 25,
    viewBox: "0 0 25 25",
  };

  if (name === "home") {
    return (
      <Svg {...commonProps}>
        <Path
          d="M3.5 11.2 12.5 3l9 8.2v9.3a1.5 1.5 0 0 1-1.5 1.5h-5.1v-6.6H10.1V22H5a1.5 1.5 0 0 1-1.5-1.5v-9.3Z"
          fill={active ? color : "none"}
          stroke={color}
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </Svg>
    );
  }

  if (name === "vocabulary") {
    return (
      <Svg {...commonProps}>
        <Rect
          x="4"
          y="3.5"
          width="17"
          height="18"
          rx="2"
          fill="none"
          stroke={color}
          strokeWidth="1.8"
        />
        <Path
          d="M12.5 5.5v14M7.5 7.5h2.5M15 7.5h2.5M7.5 11.5h2.5M15 11.5h2.5"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </Svg>
    );
  }

  if (name === "flashcards") {
    return (
      <Svg {...commonProps}>
        <Rect
          x="6"
          y="3.5"
          width="14"
          height="16"
          rx="1.8"
          fill="none"
          stroke={color}
          strokeWidth="1.8"
        />
        <Path
          d="M9 7h8M9 10.5h5M4 7.5v12a2 2 0 0 0 2 2h10"
          fill="none"
          stroke={color}
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </Svg>
    );
  }

  if (name === "import") {
    return (
      <Svg {...commonProps}>
        <Path
          d="M12.5 3.5v11M8 10l4.5 4.5L17 10M5 19.5h15"
          fill="none"
          stroke={color}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    );
  }

  return (
    <Svg {...commonProps}>
      <Circle
        cx="12.5"
        cy="8"
        r="3.5"
        fill="none"
        stroke={color}
        strokeWidth="1.8"
      />
      <Path
        d="M5.5 21c.5-4 3-6 7-6s6.5 2 7 6"
        fill="none"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </Svg>
  );
}

export default function BottomNavigation({ navigation, activeRoute = "Home" }) {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
        },
      ]}
    >
      {tabs.map((tab) => {
        const isActive = tab.route === activeRoute;

        return (
          <TouchableOpacity
            key={tab.route}
            style={styles.item}
            onPress={() => navigation.navigate(tab.route)}
            accessibilityRole="tab"
            accessibilityLabel={tab.label}
            accessibilityState={{ selected: isActive }}
          >
            <View style={styles.icon}>
              <TabIcon
                name={tab.icon}
                color={isActive ? theme.colors.primary : "#94A3B8"}
                active={isActive}
              />
            </View>
            <Text
              style={[
                styles.label,
                { color: theme.colors.textSecondary },
                isActive && { color: theme.colors.primary },
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 74,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingBottom: 8,
    zIndex: 10,
    elevation: 10,
  },
  item: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 58,
  },
  icon: {
    width: 25,
    height: 25,
  },
  label: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: "700",
    color: "#94A3B8",
  },
});
