import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type ScreenState =
  | "home"
  | "preview"
  | "loading"
  | "healthy"
  | "disease"
  | "error";

export default function HomeScreen() {
  const [screen, setScreen] = useState<ScreenState>("home");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [diseaseName, setDiseaseName] = useState("Anthracnose");

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      setScreen("error");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      setScreen("preview");
    }
  };

  const fakeScan = async () => {
    await pickImage();
  };

  const detectDisease = () => {
    if (!imageUri) {
      setScreen("error");
      return;
    }

    setScreen("loading");

    setTimeout(() => {
      // Temporary fake result
      const outcomes: ScreenState[] = ["healthy", "disease", "error"];
      const randomResult =
        outcomes[Math.floor(Math.random() * outcomes.length)];
      setDiseaseName("Anthracnose");
      setScreen(randomResult);
    }, 2000);
  };

  const goHome = () => {
    setImageUri(null);
    setScreen("home");
  };

  const renderHeader = (showReturn = false) => (
    <View style={styles.header}>
      {showReturn ? (
        <TouchableOpacity onPress={goHome}>
          <Text style={styles.returnText}>← Return</Text>
        </TouchableOpacity>
      ) : (
        <Text style={styles.appTitle}>DiseaseClassifier</Text>
      )}
    </View>
  );

  if (screen === "home") {
    return (
      <View style={styles.container}>
        {renderHeader(false)}

        <View style={styles.centerContent}>
          <TouchableOpacity style={styles.greenButton} onPress={fakeScan}>
            <Text style={styles.buttonText}>📷 Take a photo</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.greenButton} onPress={pickImage}>
            <Text style={styles.buttonText}>⬆️ Upload a photo</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (screen === "preview") {
    return (
      <View style={styles.container}>
        {renderHeader(true)}

        <View style={styles.centerContent}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.previewImage} />
          ) : (
            <View style={styles.placeholderBox}>
              <Text style={styles.placeholderText}>No image</Text>
            </View>
          )}

          <TouchableOpacity style={styles.greenButton} onPress={detectDisease}>
            <Text style={styles.buttonText}>Detect</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (screen === "loading") {
    return (
      <View style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#6FAF73" />
          <Text style={styles.loadingText}>Detecting the disease...</Text>
        </View>
      </View>
    );
  }

  if (screen === "healthy") {
    return (
      <View style={styles.container}>
        {renderHeader(true)}

        <View style={styles.centerContent}>
          {imageUri && (
            <Image source={{ uri: imageUri }} style={styles.previewImage} />
          )}
          <Text style={styles.iconHealthy}>✔</Text>
          <Text style={styles.healthyText}>Result: Healthy</Text>
        </View>
      </View>
    );
  }

  if (screen === "disease") {
    return (
      <View style={styles.container}>
        {renderHeader(true)}

        <View style={styles.centerContent}>
          {imageUri && (
            <Image source={{ uri: imageUri }} style={styles.previewImage} />
          )}
          <Text style={styles.iconDisease}>!</Text>
          <Text style={styles.diseaseText}>Result: {diseaseName}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderHeader(true)}

      <View style={styles.centerContent}>
        <View style={styles.errorCircle}>
          <Text style={styles.errorX}>×</Text>
        </View>
        <Text style={styles.errorTitle}>Error</Text>
        <Text style={styles.errorSubtitle}>Please try again</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f6f6f6",
    paddingTop: 60,
    paddingHorizontal: 24,
  },
  header: {
    minHeight: 40,
    justifyContent: "center",
  },
  appTitle: {
    fontSize: 16,
    color: "#7ca34d",
    fontWeight: "600",
  },
  returnText: {
    fontSize: 18,
    color: "#000",
    fontWeight: "600",
  },
  centerContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  greenButton: {
    backgroundColor: "#2f7d32",
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 6,
    marginVertical: 12,
    minWidth: 120,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  previewImage: {
    width: 130,
    height: 100,
    resizeMode: "cover",
    marginBottom: 28,
    borderRadius: 4,
    backgroundColor: "#ddd",
  },
  placeholderBox: {
    width: 130,
    height: 100,
    backgroundColor: "#ddd",
    marginBottom: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderText: {
    color: "#666",
  },
  loadingText: {
    marginTop: 24,
    fontSize: 28,
    fontFamily: undefined,
    color: "#222",
  },
  iconHealthy: {
    fontSize: 36,
    color: "#40b95f",
    marginBottom: 8,
  },
  healthyText: {
    fontSize: 32,
    color: "#6aa86f",
    textAlign: "center",
  },
  iconDisease: {
    fontSize: 36,
    color: "red",
    fontWeight: "700",
    marginBottom: 8,
  },
  diseaseText: {
    fontSize: 30,
    color: "#d33",
    textAlign: "center",
  },
  errorCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#ffeb00",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  errorX: {
    fontSize: 46,
    color: "#444",
    lineHeight: 48,
  },
  errorTitle: {
    fontSize: 34,
    color: "#111",
    marginBottom: 6,
  },
  errorSubtitle: {
    fontSize: 22,
    color: "#222",
  },
});
