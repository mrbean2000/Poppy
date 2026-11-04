import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useTheme } from "../theme/ThemeContext";

export default function ImportCameraScreen({ navigation }) {
  const { theme } = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isTakingPicture, setIsTakingPicture] = useState(false);
  const cameraRef = useRef(null);

  async function handleTakePicture() {
    if (!cameraRef.current || !isCameraReady || isTakingPicture) {
      return;
    }

    try {
      setIsTakingPicture(true);
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      Alert.alert("Photo captured", photo?.uri || "The photo was captured.");
    } catch {
      Alert.alert("Camera error", "Unable to capture the photo.");
    } finally {
      setIsTakingPicture(false);
    }
  }

  if (!permission) {
    return (
      <SafeAreaView
        style={[styles.centered, { backgroundColor: theme.colors.background }]}
      >
        <ActivityIndicator color={theme.colors.primary} />
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView
        style={[styles.centered, { backgroundColor: theme.colors.background }]}
      >
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Camera access needed
        </Text>
        <Text style={[styles.message, { color: theme.colors.textSecondary }]}>
          Allow camera access to import vocabulary from a photo.
        </Text>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.colors.primary }]}
          onPress={requestPermission}
        >
          <Text
            style={[styles.buttonText, { color: theme.colors.primaryText }]}
          >
            Allow Camera
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text
            style={[styles.cancelText, { color: theme.colors.textSecondary }]}
          >
            Cancel
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="back"
        onCameraReady={() => setIsCameraReady(true)}
      >
        <View style={styles.overlay}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.closeText}>Close</Text>
          </TouchableOpacity>
          <View style={styles.captureArea}>
            <View style={styles.scanFrame} />
          </View>
          <TouchableOpacity
            style={[
              styles.captureButton,
              !isCameraReady && styles.disabledButton,
            ]}
            onPress={handleTakePicture}
            disabled={!isCameraReady || isTakingPicture}
            accessibilityRole="button"
            accessibilityLabel="Take picture"
          >
            {isTakingPicture ? (
              <ActivityIndicator color="#111111" />
            ) : (
              <View style={styles.captureInner} />
            )}
          </TouchableOpacity>
        </View>
      </CameraView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000000" },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  camera: { flex: 1 },
  overlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-between",
    padding: 24,
  },
  closeButton: {
    alignSelf: "flex-end",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
  },
  closeText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
  captureArea: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  scanFrame: {
    width: "82%",
    aspectRatio: 1,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    borderRadius: 16,
  },
  captureButton: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  captureInner: {
    width: 62,
    height: 62,
    borderRadius: 31,
    borderWidth: 3,
    borderColor: "#111111",
  },
  disabledButton: { opacity: 0.5 },
  title: { fontSize: 22, fontWeight: "800", textAlign: "center" },
  message: { marginTop: 12, textAlign: "center", lineHeight: 21 },
  button: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 10,
  },
  buttonText: { color: "#FFFFFF", fontWeight: "800" },
  cancelText: { marginTop: 20, padding: 12 },
});
