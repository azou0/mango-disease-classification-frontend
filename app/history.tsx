import ButtonPrimary from "@/components/ButtonPrimary";
import { getUserId, getUserScans, type ScanHistoryItem } from "@/constants/api";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    Text,
    View,
} from "react-native";

const theme = {
  primary: "#4A7C2E",
  bg: "#F5F1E6",
  text: "#3B2F2A",
  surface: "#FFFFFF",
  muted: "#7A6E64",
  border: "#E4DCC8",
  healthy: "#3E8E41",
  diseased: "#B23A3A",
};

function isHealthy(item: ScanHistoryItem): boolean {
  const cat = String(item.result_category ?? "").toLowerCase();
  const label = String(item.top_prediction?.label ?? "").toLowerCase();
  return (
    cat.includes("healthy") || cat.includes("good") || label.includes("healthy")
  );
}

function prettyLabel(item: ScanHistoryItem): string {
  const label = item.top_prediction?.label ?? "Unknown";
  return label.replace(/_/g, " ");
}

export default function HistoryScreen() {
  const [scans, setScans] = useState<ScanHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [loggedIn, setLoggedIn] = useState(true);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    setError("");
    const userId = await getUserId();
    if (!userId) {
      setLoggedIn(false);
      setLoading(false);
      return;
    }
    try {
      const result = await getUserScans(userId);
      setScans(result);
    } catch {
      setError("Couldn't load your scan history.");
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Scan history</Text>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : !loggedIn ? (
        <View style={styles.center}>
          <Text style={styles.empty}>Log in to see your scan history.</Text>
          <View style={styles.buttonGroup}>
            <ButtonPrimary
              title="Log in"
              onPress={() => router.push("/login")}
            />
          </View>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.empty}>{error}</Text>
          <View style={styles.buttonGroup}>
            <ButtonPrimary title="Retry" variant="secondary" onPress={load} />
          </View>
        </View>
      ) : (
        <FlatList
          style={styles.list}
          data={scans}
          keyExtractor={(item) => item.image_id}
          ListEmptyComponent={<Text style={styles.empty}>No scans yet.</Text>}
          renderItem={({ item }) => {
            const healthy = isHealthy(item);
            return (
              <View style={styles.card}>
                <View style={styles.cardRow}>
                  <Text
                    style={[
                      styles.cardLabel,
                      { color: healthy ? theme.healthy : theme.diseased },
                    ]}
                  >
                    {healthy ? "Healthy" : prettyLabel(item)}
                  </Text>
                  {item.top_score != null && (
                    <Text style={styles.cardScore}>
                      {Math.round((item.top_score ?? 0) * 100)}%
                    </Text>
                  )}
                </View>
                {item.timestamp && (
                  <Text style={styles.cardDate}>
                    {new Date(item.timestamp).toLocaleString()}
                  </Text>
                )}
              </View>
            );
          }}
        />
      )}

      <View style={styles.buttonGroup}>
        <ButtonPrimary
          title="← Back"
          variant="ghost"
          onPress={() => router.back()}
        />
      </View>
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
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: theme.text,
    textAlign: "center",
    marginBottom: 16,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  list: {
    flex: 1,
    width: "100%",
  },
  card: {
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
  },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardLabel: {
    fontSize: 17,
    fontWeight: "700",
    flex: 1,
  },
  cardScore: {
    fontSize: 15,
    color: theme.muted,
    fontWeight: "600",
  },
  cardDate: {
    fontSize: 13,
    color: theme.muted,
    marginTop: 4,
  },
  empty: {
    textAlign: "center",
    color: theme.muted,
    fontSize: 15,
    marginBottom: 16,
  },
  buttonGroup: {
    width: "100%",
    maxWidth: 320,
    gap: 12,
    marginTop: 16,
    alignSelf: "center",
  },
});
