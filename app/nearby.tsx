import ButtonPrimary from "@/components/ButtonPrimary";
import { getNearbyCases, type NearbyResult } from "@/constants/api";
import * as Location from "expo-location";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const theme = {
  primary: "#4A7C2E",
  bg: "#F5F1E6",
  text: "#3B2F2A",
  surface: "#FFFFFF",
  muted: "#7A6E64",
  border: "#E4DCC8",
  diseased: "#B23A3A",
};

const RADIUS_OPTIONS = [3, 5, 10];
const TIME_OPTIONS = [7, 30, 90];

type Coords = { latitude: number; longitude: number };

export default function NearbyScreen() {
  const [locationLabel, setLocationLabel] = useState<string | null>(null);
  const [coords, setCoords] = useState<Coords | null>(null);
  const [manualText, setManualText] = useState("");
  const [locating, setLocating] = useState(false);
  const [radiusKm, setRadiusKm] = useState(10);
  const [days, setDays] = useState(30);
  const [result, setResult] = useState<NearbyResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    detectLocation();
  }, []);

  const detectLocation = async () => {
    setLocating(true);
    setError("");
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLocating(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      setCoords({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      const [place] = await Location.reverseGeocodeAsync(loc.coords);
      const label = place?.subregion || place?.city || place?.district || "";
      if (label) setLocationLabel(label);
    } catch {
      setError("Couldn't get your location.");
    }
    setLocating(false);
  };

  const applyManualLocation = async (): Promise<Coords | null> => {
    if (!manualText.trim()) return null;
    try {
      const results = await Location.geocodeAsync(manualText.trim());
      if (results.length > 0) {
        const c = { latitude: results[0].latitude, longitude: results[0].longitude };
        setCoords(c);
        setLocationLabel(manualText.trim());
        return c;
      }
      setError("Couldn't find that location.");
      return null;
    } catch {
      setError("Couldn't look up that location.");
      return null;
    }
  };

  const search = async () => {
    setError("");
    let activeCoords = coords;
    if (manualText.trim()) {
      activeCoords = await applyManualLocation();
    }
    if (!activeCoords) {
      setError("Set a location first (use current location or enter one).");
      return;
    }
    setLoading(true);
    try {
      const res = await getNearbyCases({
        latitude: activeCoords.latitude,
        longitude: activeCoords.longitude,
        radius_km: radiusKm,
        days,
      });
      setResult(res);
      setSearched(true);
    } catch {
      setError("Search failed. Please try again.");
    }
    setLoading(false);
  };

  const diseaseEntries = result ? Object.entries(result.disease_counts) : [];

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Nearby cases</Text>

        <View style={styles.locationRow}>
          {locating ? (
            <ActivityIndicator color={theme.primary} />
          ) : (
            <Text style={styles.locationText}>
              {locationLabel ? `Current location: ${locationLabel}` : "Location not detected"}
            </Text>
          )}
        </View>

        <TouchableOpacity onPress={detectLocation} hitSlop={8}>
          <Text style={styles.useLocationText}>Use current location</Text>
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          placeholder="Or enter a location"
          placeholderTextColor={theme.muted}
          value={manualText}
          onChangeText={setManualText}
          autoCapitalize="words"
        />

        <Text style={styles.filterLabel}>Search radius:</Text>
        <View style={styles.chipRow}>
          {RADIUS_OPTIONS.map((km) => {
            const active = radiusKm === km;
            return (
              <TouchableOpacity key={km} onPress={() => setRadiusKm(km)} style={[styles.chip, active && styles.chipActive]}>
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{km} km</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.filterLabel}>Show cases from the last:</Text>
        <View style={styles.chipRow}>
          {TIME_OPTIONS.map((d) => {
            const active = days === d;
            return (
              <TouchableOpacity key={d} onPress={() => setDays(d)} style={[styles.chip, active && styles.chipActive]}>
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{d} days</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <ButtonPrimary title="Search" loading={loading} onPress={search} />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {searched && !loading && result && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTotal}>{result.total}</Text>
            <Text style={styles.summaryLabel}>
              cases within {result.radius_km} km, last {result.days} days
            </Text>
            {diseaseEntries.length > 0 ? (
              <View style={styles.breakdown}>
                {diseaseEntries.map(([name, count]) => (
                  <View key={name} style={styles.breakdownRow}>
                    <Text style={styles.diseaseName}>{name.replace(/_/g, " ")}</Text>
                    <Text style={styles.diseaseCount}>{count}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.empty}>No cases reported in this area.</Text>
            )}
          </View>
        )}

        <View style={{ marginTop: 24 }}>
          <ButtonPrimary title="← Back" variant="ghost" onPress={() => router.back()} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg, paddingTop: 60, paddingHorizontal: 24 },
  scroll: { paddingBottom: 40 },
  title: { fontSize: 28, fontWeight: "700", color: theme.text, textAlign: "center", marginBottom: 12 },
  locationRow: { minHeight: 24, justifyContent: "center", alignItems: "center" },
  locationText: { fontSize: 15, color: theme.text, fontWeight: "600", textAlign: "center" },
  useLocationText: { fontSize: 14, color: theme.primary, fontWeight: "600", textAlign: "center", marginTop: 4, marginBottom: 12 },
  input: { backgroundColor: theme.surface, borderWidth: 1.5, borderColor: theme.border, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 16, fontSize: 16, color: theme.text, marginBottom: 16 },
  filterLabel: { fontSize: 14, color: theme.muted, marginBottom: 8 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  chip: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1.5, borderColor: theme.border, backgroundColor: theme.surface },
  chipActive: { backgroundColor: theme.primary, borderColor: theme.primary },
  chipText: { fontSize: 14, color: theme.text, fontWeight: "600" },
  chipTextActive: { color: "#FFFFFF" },
  errorText: { color: theme.diseased, fontSize: 14, textAlign: "center", marginTop: 12 },
  summaryCard: { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, borderRadius: 16, padding: 20, marginTop: 20, alignItems: "center" },
  summaryTotal: { fontSize: 44, fontWeight: "800", color: theme.primary },
  summaryLabel: { fontSize: 14, color: theme.muted, textAlign: "center", marginTop: 4, marginBottom: 12 },
  breakdown: { width: "100%", marginTop: 8 },
  breakdownRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10, borderTopWidth: 1, borderTopColor: theme.border },
  diseaseName: { fontSize: 16, color: theme.text, fontWeight: "600", flex: 1 },
  diseaseCount: { fontSize: 16, color: theme.diseased, fontWeight: "700" },
  empty: { textAlign: "center", color: theme.muted, marginTop: 8, fontSize: 15 },
});
