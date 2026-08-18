import ButtonPrimary from "@/components/ButtonPrimary";
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

const theme = {
  bg: "#F6F8F4",
  surface: "#FFFFFF",
  primary: "#2E7D5B",
  text: "#1A2B22",
  muted: "#6B7C74",
  healthy: "#2E7D5B",
  diseased: "#E08A2B",
  error: "#B0685C",
  border: "#E3E9E1",
};

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

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setScreen("error");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 1,
    });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      setScreen("preview");
    }
  };

  const detectDisease = () => {
    if (!imageUri) {
      setScreen("error");
      return;
    }
    setScreen("loading");
    setTimeout(() => {
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
        <TouchableOpacity onPress={goHome} hitSlop={12}>
          <Text style={styles.returnText}>← Return</Text>
        </TouchableOpacity>
      ) : (
        <Text style={styles.appTitle}>DiseaseClassifier</Text>
      )}
    </View>
  );

  // HOME
  if (screen === "home") {
    return (
      <View style={styles.container}>
        {renderHeader(false)}
        <View style={styles.centerContent}>
          <View style={styles.emptyPreview}>
            <Text style={styles.emptyIcon}>🌿</Text>
            <Text style={styles.emptyText}>Add a photo of your plant</Text>
          </View>
          <View style={styles.buttonGroup}>
            <ButtonPrimary title="Take a photo" onPress={takePhoto} />
            <ButtonPrimary
              title="Upload a photo"
              variant="secondary"
              onPress={pickImage}
            />
          </View>
        </View>
      </View>
    );
  }

  // PREVIEW
  if (screen === "preview") {
    return (
      <View style={styles.container}>
        {renderHeader(true)}
        <View style={styles.centerContent}>
          {imageUri && (
            <Image source={{ uri: imageUri }} style={styles.previewImage} />
          )}
          <View style={styles.buttonGroup}>
            <ButtonPrimary title="Detect disease" onPress={detectDisease} />
          </View>
        </View>
      </View>
    );
  }

  // LOADING
  if (screen === "loading") {
    return (
      <View style={styles.container}>
        {renderHeader(false)}
        <View style={styles.centerContent}>
          {imageUri && (
            <Image source={{ uri: imageUri }} style={styles.previewImage} />
          )}
          <ActivityIndicator
            size="large"
            color={theme.primary}
            style={{ marginTop: 24 }}
          />
          <Text style={styles.loadingText}>Analyzing leaf…</Text>
        </View>
      </View>
    );
  }

  // HEALTHY
  if (screen === "healthy") {
    return (
      <View style={styles.container}>
        {renderHeader(true)}
        <View style={styles.centerContent}>
          {imageUri && (
            <Image source={{ uri: imageUri }} style={styles.previewImage} />
          )}
          <ResultCard
            status="healthy"
            title="Healthy"
            subtitle="No disease detected"
          />
          <View style={styles.buttonGroup}>
            <ButtonPrimary
              title="Scan another"
              variant="ghost"
              onPress={goHome}
            />
          </View>
        </View>
      </View>
    );
  }

  // DISEASE
  if (screen === "disease") {
    return (
      <View style={styles.container}>
        {renderHeader(true)}
        <View style={styles.centerContent}>
          {imageUri && (
            <Image source={{ uri: imageUri }} style={styles.previewImage} />
          )}
          <ResultCard
            status="diseased"
            title={diseaseName}
            subtitle="Disease detected — inspect the affected leaves"
          />
          <View style={styles.buttonGroup}>
            <ButtonPrimary
              title="Scan another"
              variant="ghost"
              onPress={goHome}
            />
          </View>
        </View>
      </View>
    );
  }

  // ERROR
  return (
    <View style={styles.container}>
      {renderHeader(true)}
      <View style={styles.centerContent}>
        <ResultCard
          status="error"
          title="Couldn’t analyze"
          subtitle="Try a clearer, well-lit photo of the leaf"
        />
        <View style={styles.buttonGroup}>
          <ButtonPrimary title="Try again" onPress={goHome} />
        </View>
      </View>
    </View>
  );
}

// --- Reusable result card for the three outcomes ---
type ResultProps = {
  status: "healthy" | "diseased" | "error";
  title: string;
  subtitle: string;
};

function ResultCard({ status, title, subtitle }: ResultProps) {
  const config = {
    healthy: { color: theme.healthy, icon: "✔", label: "Result" },
    diseased: { color: theme.diseased, icon: "!", label: "Result" },
    error: { color: theme.error, icon: "×", label: "" },
  }[status];

  return (
    <View style={styles.resultCard}>
      <View
        style={[styles.resultIconCircle, { backgroundColor: config.color }]}
      >
        <Text style={styles.resultIcon}>{config.icon}</Text>
      </View>
      <Text style={[styles.resultTitle, { color: config.color }]}>{title}</Text>
      <Text style={styles.resultSubtitle}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
    paddingTop: 60,
    paddingHorizontal: 24,
  },
  header: {
    minHeight: 40,
    justifyContent: "center",
  },
  appTitle: {
    fontSize: 18,
    color: theme.primary,
    fontWeight: "700",
  },
  returnText: {
    fontSize: 17,
    color: theme.text,
    fontWeight: "600",
  },
  centerContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonGroup: {
    width: "100%",
    maxWidth: 320,
    gap: 12,
    marginTop: 24,
  },
  emptyPreview: {
    width: 240,
    height: 240,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: theme.border,
    borderStyle: "dashed",
    backgroundColor: theme.surface,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  emptyIcon: {
    fontSize: 48,
  },
  emptyText: {
    fontSize: 16,
    color: theme.muted,
  },
  previewImage: {
    width: 240,
    height: 240,
    resizeMode: "cover",
    borderRadius: 24,
    backgroundColor: theme.border,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 20,
    color: theme.text,
    fontWeight: "500",
  },
  resultCard: {
    alignItems: "center",
    marginTop: 28,
    paddingHorizontal: 16,
  },
  resultIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  resultIcon: {
    fontSize: 38,
    color: "#FFFFFF",
    fontWeight: "700",
    lineHeight: 40,
  },
  resultTitle: {
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 6,
  },
  resultSubtitle: {
    fontSize: 16,
    color: theme.muted,
    textAlign: "center",
  },
});
