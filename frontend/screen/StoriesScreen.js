import { useEffect, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  ImageBackground,
} from "react-native";
import { getAllPassage } from "../util/http";
import { useTheme } from "../theme/ThemeContext";
import { useWalkthroughScreen, WalkthroughStep, WalkthroughTouchable } from "../context/HomeWalkthroughContext";

export default function StoriesScreen({ navigation }) {
  const { theme, isDarkMode } = useTheme();
  const [stories, setStories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);
  const { track } = useWalkthroughScreen("Stories");

  async function fetchPassage() {
    try {
      setIsLoading(true);
      const passageData = await getAllPassage();

      setStories(passageData);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  }
  useEffect(() => {
    fetchPassage();
  }, []);

  return (
    <ImageBackground
      source={
        isDarkMode
          ? require("../assets/images/masot/backgroundimagequestion_darkmode.png")
          : require("../assets/images/masot/backgroundimagequestion.png")
      }
      style={styles.container}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={[styles.back, { color: theme.colors.text }]}>‹</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            All Stories
          </Text>
          <WalkthroughStep name="addStory">
          <WalkthroughTouchable
            onLayout={track("addStory")}
            style={styles.addButton}
            onPress={() => navigation.navigate("Import")}
            accessibilityRole="button"
            accessibilityLabel="Add a story"
          >
            <Text style={[styles.addButtonText, { color: theme.colors.primary }]}>
              +
            </Text>
          </WalkthroughTouchable>
          </WalkthroughStep>
        </View>

        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Choose a story and keep learning.
        </Text>

        {isLoading && (
          <Text style={[styles.status, { color: theme.colors.textSecondary }]}>
            Loading stories...
          </Text>
        )}

        {errorMessage && <Text style={styles.error}>{errorMessage}</Text>}

        {!isLoading &&
          !errorMessage &&
          stories.map((story) => (
            <TouchableOpacity
              key={story.id}
              style={[styles.card, { backgroundColor: theme.colors.surface }]}
              onPress={() =>
                navigation.navigate("Reader", {
                  id: story.id,
                  title: story.title,
                  imageUrl: story.imageUrl,
                })
              }
            >
              <View style={styles.image}>
                {/* <Text style={styles.emoji}>{story.emoji}</Text> */}
                <Image
                  source={
                    story.imageUrl
                      ? { url: story.imageUrl }
                      : require("../assets/images/masot/poppy_raincoat.jpeg")
                  }
                  style={
                    story.imageUrl ? styles.storyImage : styles.avatarImage
                  }
                />
              </View>
              <View style={styles.cardInfo}>
                <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
                  {story.title}
                </Text>
                <Text
                  style={[styles.meta, { color: theme.colors.textSecondary }]}
                >
                  {"1"} • {"5min"}
                </Text>
              </View>
              <Text style={[styles.chevron, { color: theme.colors.primary }]}>
                ›
              </Text>
            </TouchableOpacity>
          ))}
      </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  back: {
    fontSize: 32,
    color: "#172033",
  },
  title: {
    fontSize: 22,
    fontWeight: "900",
    color: "#172033",
  },
  addButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  addButtonText: {
    fontSize: 30,
    fontWeight: "400",
    lineHeight: 32,
  },
  subtitle: {
    color: "#6B7280",
    fontSize: 14,
    marginBottom: 20,
  },
  status: {
    color: "#6B7280",
    fontSize: 14,
    marginBottom: 16,
  },
  error: {
    color: "#B42318",
    fontSize: 14,
    marginBottom: 16,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 14,
  },
  image: {
    height: 135,
    alignItems: "center",
    justifyContent: "center",
  },

  avatarImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    resizeMode: "cover",
  },
  storyImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  emoji: {
    fontSize: 52,
  },
  cardInfo: {
    padding: 15,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: "#172033",
  },
  meta: {
    marginTop: 5,
    color: "#6B7280",
    fontSize: 13,
  },
  chevron: {
    position: "absolute",
    right: 16,
    bottom: 15,
    fontSize: 28,
  },
});
