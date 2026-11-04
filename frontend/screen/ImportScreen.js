import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
  ImageBackground,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import {
  Camera as CameraIcon,
  ChevronLeft,
  RotateCcw,
} from "lucide-react-native";
import { useTheme } from "../theme/ThemeContext";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function ImportScreen({ navigation, route }) {
  const { theme, isDarkMode } = useTheme();
  const [showCamera, setShowCamera] = useState(false);
  const [facing, setFacing] = useState("back");
  const [isCapturing, setIsCapturing] = useState(false);
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentOffset = useRef(new Animated.Value(20)).current;
  const backPressScale = useRef(new Animated.Value(1)).current;

  const cameraRef = useRef(null);
  const [permission, requestPermission] = useCameraPermissions();

  useEffect(() => {
    Animated.parallel([
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(contentOffset, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  }, [contentOffset, contentOpacity]);

  const toggleFacing = () => {
    setFacing((current) => (current === "back" ? "front" : "back"));
  };

  const animateBackPressIn = () => {
    Animated.spring(backPressScale, {
      toValue: 0.86,
      speed: 28,
      bounciness: 8,
      useNativeDriver: true,
    }).start();
  };

  const animateBackPressOut = () => {
    Animated.spring(backPressScale, {
      toValue: 1,
      speed: 24,
      bounciness: 10,
      useNativeDriver: true,
    }).start();
  };

  const handleTakePicture = async () => {
    if (!cameraRef.current || isCapturing) return;

    try {
      setIsCapturing(true);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
      });

      console.log("Photo captured:", photo.uri);
      setShowCamera(false);
    } catch (error) {
      console.error("Failed to take picture:", error);
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <ImageBackground
      source={
        isDarkMode
          ? require("../assets/images/masot/backgroundimagequestion_darkmode.png")
          : require("../assets/images/masot/backgroundimagequestion.png")
      }
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.topBar}>
          <Animated.View style={{ transform: [{ scale: backPressScale }] }}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              onPressIn={animateBackPressIn}
              onPressOut={animateBackPressOut}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <ChevronLeft size={28} color="#203B32" />
            </TouchableOpacity>
          </Animated.View>
        </View>

        <Animated.View
          style={[
            styles.content,
            {
              opacity: contentOpacity,
              transform: [{ translateX: contentOffset }],
            },
          ]}
        >
          <Text style={[styles.title, { color: theme.colors.text }]}>
            Import
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Import vocabulary to start learning.
          </Text>
          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.colors.primary }]}
              onPress={() => navigation.navigate("ImportUrl")}
            >
              <Text
                style={[
                  styles.buttonText,
                  { color: theme.colors.primaryText },
                ]}
              >
                Import via URL
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.colors.blue }]}
              onPress={() => navigation.navigate("ImportYourself")}
            >
              <Text style={styles.buttonText}>Import Yourself</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.colors.primary }]}
              onPress={() => setShowCamera(true)}
            >
              <Text
                style={[
                  styles.buttonText,
                  { color: theme.colors.primaryText },
                ]}
              >
                Import via Camera
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Half-Screen Camera Overlay */}
        {showCamera && (
          <View style={styles.halfScreenOverlay}>
          {!permission ? (
            <View style={styles.cameraPermission}>
              <ActivityIndicator size="large" color="#242424" />
            </View>
          ) : !permission.granted ? (
            <View style={styles.cameraPermission}>
              <CameraIcon size={36} color="#242424" />
              <Text style={styles.cameraTitle}>Camera Access Required</Text>
              <Text style={styles.cameraMessage}>
                We need access to your camera to scan vocabulary.
              </Text>
              <TouchableOpacity
                style={styles.permissionButton}
                onPress={requestPermission}
              >
                <Text style={styles.permissionButtonText}>
                  Grant Permission
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowCamera(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.halfCameraContainer}>
              <View style={styles.cameraCard}>
                {/* Camera stays as the background */}
                <CameraView
                  ref={cameraRef}
                  style={styles.camera}
                  facing={facing}
                />

                {/* Controls are explicitly layered ABOVE the camera */}
                <View style={styles.cameraOverlay} pointerEvents="box-none">
                  <View style={styles.cameraControls}>
                    <TouchableOpacity
                      style={styles.controlButton}
                      onPress={() => setShowCamera(false)}
                      accessibilityLabel="Close camera"
                    >
                      <ChevronLeft size={22} color="#FFFFFF" />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.captureButton,
                        isCapturing && styles.disabledButton,
                      ]}
                      onPress={handleTakePicture}
                      disabled={isCapturing}
                      activeOpacity={0.8}
                      accessibilityLabel="Take picture"
                    >
                      {isCapturing ? (
                        <ActivityIndicator color="#242424" />
                      ) : (
                        <View style={styles.captureInner} />
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.controlButton}
                      onPress={toggleFacing}
                      accessibilityLabel="Switch camera"
                    >
                      <RotateCcw size={22} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          )}
          </View>
        )}

      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
  },
  container: { flex: 1, backgroundColor: "transparent" },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 4,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
    backgroundColor: "#FFFCF5",
    elevation: 3,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  title: { fontSize: 28, fontWeight: "900" },
  subtitle: { marginTop: 8, fontSize: 14, textAlign: "center" },
  buttonGroup: { width: "100%", marginTop: 32, gap: 12 },
  button: {
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    paddingHorizontal: 20,
  },
  buttonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" },

  /* Half Screen Overlay Styling */
  halfScreenOverlay: {
    position: "absolute",
    bottom: 60, // Above bottom navigation bar
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 0.65,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 8,
  },
  halfCameraContainer: {
    flex: 1,
  },
  halfHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  iconButton: { padding: 8 },
  cameraCard: {
    flex: 1,
    overflow: "hidden",
    borderRadius: 24,
    backgroundColor: "#111111",
  },
  camera: { ...StyleSheet.absoluteFillObject, flex: 1 },
  cameraOverlay: {
    ...StyleSheet.absoluteFillObject,
    position: "absolute",
    justifyContent: "flex-end",
    alignItems: "center",
    bottom: 20,
    left: 0,
    right: 0,
  },
  cameraControls: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
    justifyContent: "space-between",
  },
  controlButton: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
  },
  captureButton: {
    width: 35,
    height: 35,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 36,
    borderWidth: 3,
    borderColor: "#FFFFFF",
    backgroundColor: "transparent",
  },
  captureInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#FFFFFF",
  },
  disabledButton: { opacity: 0.5 },
  cameraPermission: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  cameraTitle: {
    marginTop: 10,
    color: "#242424",
    fontSize: 18,
    fontWeight: "800",
  },
  cameraMessage: {
    marginTop: 8,
    color: "#6B6B6B",
    textAlign: "center",
    fontSize: 13,
  },
  permissionButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#242424",
  },
  permissionButtonText: { color: "#FFFFFF", fontWeight: "700" },
  cancelText: { marginTop: 12, color: "#6B6B6B" },
});
