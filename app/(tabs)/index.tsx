import ButtonPrimary from "@/components/ButtonPrimary";
import {
  classifyImage,
  DetectError,
  type DetectErrorCode,
  type Recommendation,
} from "@/constants/api";
import { clearSession, getSession, type User } from "@/constants/auth";
import * as ImagePicker from "expo-image-picker";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
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
  primary: "#4A7C2E",
  bg: "#F5F1E6",
  text: "#3B2F2A",
  healthy: "#3E8E41",
  diseased: "#B23A3A",
  error: "#C4622D",
  surface: "#FFFFFF",
  muted: "#7A6E64",
  border: "#E4DCC8",
};

export default function HomeScreen() {
  const [screen, setScreen] = useState<ScreenState>("home");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [diseaseName, setDiseaseName] = useState("Anthracnose");
  const [confidence, setConfidence] = useState<number | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [decisionMessage, setDecisionMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [errorCode, setErrorCode] = useState<DetectErrorCode | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useFocusEffect(
    useCallback(() => {
      getSession().then(setUser);
    }, []),
  );

  const handleLogout = async () => {
    await clearSession();
    setUser(null);
  };

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

  // Real classification: preprocess + upload (with optional location) + poll.
  // Reporting to nearby cases happens automatically server-side when the
  // upload includes coordinates and the result is a disease.
  const detectDisease = async () => {
    if (!imageUri) {
      setScreen("error");
      return;
    }
    setScreen("loading");

    try {
      const result = await classifyImage(imageUri);
      setDiseaseName(result.disease);
      setConfidence(result.confidence);
      setRecommendations(result.recommendations);
      setDecisionMessage(result.decisionMessage);
      setScreen(result.status === "disease" ? "disease" : "healthy");
    } catch (e) {
      if (e instanceof DetectError) {
        setErrorCode(e.code);
        setErrorMessage(e.message);
      } else {
        setErrorCode("unknown");
        setErrorMessage("Something went wrong. Please try again.");
      }
      setScreen("error");
    }
  };

  const goHome = () => {
    setImageUri(null);
    setConfidence(null);
    setRecommendations([]);
    setDecisionMessage("");
    setErrorMessage("");
    setErrorCode(null);
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

  const confidenceLabel =
    confidence != null ? `${Math.round(confidence * 100)}% confidence` : "";

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
            <ButtonPrimary
              title="Nearby cases"
              variant="secondary"
              onPress={() => router.push("/nearby")}
            />
            <ButtonPrimary
              title="Scan history"
              variant="secondary"
              onPress={() => router.push("/history")}
            />
            {user ? (
              <>
                <Text style={styles.signedInText}>
                  Signed in as {user.name}
                </Text>
                <ButtonPrimary
                  title="Log out"
                  variant="ghost"
                  onPress={handleLogout}
                />
              </>
            ) : (
              <ButtonPrimary
                title="Account"
                variant="ghost"
                onPress={() => router.push("/login")}
              />
            )}
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
          <Text style={styles.loadingText}>Analyzing leaf...</Text>
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
            subtitle={confidenceLabel || "No disease detected"}
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
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {imageUri && (
            <Image source={{ uri: imageUri }} style={styles.previewImage} />
          )}
          <ResultCard
            status="diseased"
            title={diseaseName}
            subtitle={confidenceLabel || "Disease detected"}
          />
          <Text style={styles.reportNote}>
            This result has been added to nearby cases.
          </Text>

          {recommendations.map((rec) => (
            <View key={rec.label} style={styles.adviceCard}>
              <Text style={styles.adviceTitle}>{rec.display_name}</Text>
              {rec.severity ? (
                <Text style={styles.adviceMeta}>
                  {rec.category} · Severity: {rec.severity}
                </Text>
              ) : null}

              {rec.advice?.length > 0 && (
                <>
                  <Text style={styles.adviceHeading}>Treatment</Text>
                  {rec.advice.map((a, i) => (
                    <Text key={i} style={styles.adviceItem}>
                      • {a}
                    </Text>
                  ))}
                </>
              )}

              {rec.prevention?.length > 0 && (
                <>
                  <Text style={styles.adviceHeading}>Prevention</Text>
                  {rec.prevention.map((p, i) => (
                    <Text key={i} style={styles.adviceItem}>
                      • {p}
                    </Text>
                  ))}
                </>
              )}

              {rec.pesticide ? (
                <>
                  <Text style={styles.adviceHeading}>Suggested pesticide</Text>
                  <Text style={styles.adviceItem}>{rec.pesticide}</Text>
                </>
              ) : null}
            </View>
          ))}
          <View style={styles.buttonGroup}>
            <ButtonPrimary
              title="Scan another"
              variant="ghost"
              onPress={goHome}
            />
          </View>
        </ScrollView>
      </View>
    );
  }

  // ERROR
  const errorTitle =
    errorCode === "not_logged_in"
      ? "Login required"
      : errorCode === "invalid_image" || errorCode === "no_image"
        ? "Image problem"
        : errorCode === "image_too_large"
          ? "Image too large"
          : errorCode === "network"
            ? "Connection problem"
            : errorCode === "timeout"
              ? "Took too long"
              : "Error";

  return (
    <View style={styles.container}>
      {renderHeader(true)}
      <View style={styles.centerContent}>
        <ResultCard
          status="error"
          title={errorTitle}
          subtitle={errorMessage || "Something went wrong. Please try again."}
        />
        <View style={styles.buttonGroup}>
          {errorCode === "not_logged_in" ? (
            <ButtonPrimary
              title="Log in"
              onPress={() => router.push("/login")}
            />
          ) : null}
          <ButtonPrimary
            title="Try again"
            variant={errorCode === "not_logged_in" ? "ghost" : "primary"}
            onPress={goHome}
          />
        </View>
      </View>
    </View>
  );
}

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
  scrollContent: {
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 40,
    flexGrow: 1,
  },
  buttonGroup: {
    width: "100%",
    maxWidth: 320,
    gap: 12,
    marginTop: 24,
  },
  signedInText: {
    fontSize: 15,
    color: theme.muted,
    textAlign: "center",
    marginBottom: 4,
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
  reportNote: {
    fontSize: 14,
    color: theme.muted,
    textAlign: "center",
    marginTop: 16,
    paddingHorizontal: 24,
  },
  adviceCard: {
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 16,
    padding: 18,
    marginTop: 20,
    width: "100%",
    maxWidth: 340,
  },
  adviceTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.text,
    marginBottom: 2,
  },
  adviceMeta: {
    fontSize: 13,
    color: theme.muted,
    marginBottom: 10,
  },
  adviceHeading: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.primary,
    marginTop: 10,
    marginBottom: 4,
  },
  adviceItem: {
    fontSize: 14,
    color: theme.text,
    lineHeight: 20,
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
