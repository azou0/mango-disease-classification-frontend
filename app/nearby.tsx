import ButtonPrimary from "@/components/ButtonPrimary";
import {
    getCasesBySuburb,
    seedCasesIfEmpty,
    type Case,
} from "@/constants/case";
import * as Location from "expo-location";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { FlatList, StyleSheet, Text, TextInput, View } from "react-native";

const theme = {
  primary: "#4A7C2E",
  bg: "#F5F1E6",
  text: "#3B2F2A",
  surface: "#FFFFFF",
  muted: "#7A6E64",
  border: "#E4DCC8",
  diseased: "#B23A3A",
};

export default function NearbyScreen() {
  const [suburb, setSuburb] = useState("");
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // Auto-detect suburb via GPS on mount, then load its cases
  useEffect(() => {
    seedCasesIfEmpty();
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;
      try {
        const loc = await Location.getCurrentPositionAsync({});
        const [place] = await Location.reverseGeocodeAsync(loc.coords);
        const detected =
          place?.subregion || place?.city || place?.district || "";
        if (detected) {
          setSuburb(detected);
          loadCases(detected);
        }
      } catch {}
    })();
  }, []);

  const loadCases = async (s: string) => {
    if (!s.trim()) return;
    setLoading(true);
    const found = await getCasesBySuburb(s);
    setCases(found);
    setSearched(true);
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Nearby cases</Text>
      <Text style={styles.subtitle}>Disease reports in your suburb</Text>

      <TextInput
        style={styles.input}
        placeholder="Enter suburb"
        placeholderTextColor={theme.muted}
        value={suburb}
        onChangeText={setSuburb}
        autoCapitalize="words"
      />
      <ButtonPrimary title="Search" onPress={() => loadCases(suburb)} />

      <FlatList
        style={styles.list}
        data={cases}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          searched && !loading ? (
            <Text style={styles.empty}>
              No cases found for {suburb || "your area"}.
            </Text>
          ) : null
        }
        renderItem={({ item }) => (
          <View style={styles.caseCard}>
            <Text style={styles.caseDisease}>{item.disease}</Text>
            <Text style={styles.caseMeta}>
              {item.suburb} · {new Date(item.date).toLocaleDateString()}
            </Text>
          </View>
        )}
      />

      <ButtonPrimary
        title="← Back"
        variant="ghost"
        onPress={() => router.back()}
      />
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
  },
  subtitle: {
    fontSize: 16,
    color: theme.muted,
    textAlign: "center",
    marginBottom: 16,
  },
  input: {
    backgroundColor: theme.surface,
    borderWidth: 1.5,
    borderColor: theme.border,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: theme.text,
    marginBottom: 12,
  },
  list: {
    marginTop: 20,
    width: "100%",
  },
  caseCard: {
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
  },
  caseDisease: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.diseased,
    marginBottom: 4,
  },
  caseMeta: {
    fontSize: 14,
    color: theme.muted,
  },
  empty: {
    textAlign: "center",
    color: theme.muted,
    marginTop: 24,
    fontSize: 15,
  },
});
