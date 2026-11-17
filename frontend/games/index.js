import { SafeAreaView, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from "@expo/vector-icons";
import TestGame from './test/test';
import { useTheme } from "../theme/ThemeContext";

export function InstantiateTestGame({ navigation })
{

    const { theme, isDarkMode } = useTheme();
    const itemBackground = isDarkMode ? "#000000" : "#FFFFFF";
    return (
    <SafeAreaView style={{ flex: 1 }}>
      <TouchableOpacity
                    style={[
                      styles.backButton,
                      { backgroundColor: itemBackground },
                    ]}
                    onPress={() => navigation.goBack()}
                    accessibilityRole="button"
                    accessibilityLabel="Go back"
                  >
                    <MaterialCommunityIcons
                      name="arrow-left"
                      size={22}
                      color={theme.colors.text}
                    />
                  </TouchableOpacity>
      <TestGame />
    </SafeAreaView>
  );
}

export const GameList = [
    {
        id: 'test',
        name: 'test',
        thumbnail: 'test',
        component: InstantiateTestGame
    },
    {
        id: 'test1',
        name: 'test1',
        thumbnail: 'test1',
        component: InstantiateTestGame
    }
];

const styles = StyleSheet.create({
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  }
});