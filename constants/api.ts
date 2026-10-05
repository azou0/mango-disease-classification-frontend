import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";
import * as ImageManipulator from "expo-image-manipulator";
import * as Location from "expo-location";
import { Image } from "react-native";

// ⚠️ Backend base URL (no trailing slash)
export const BASE_URL = "http://3.24.218.246:8000";

const MODEL_INPUT_SIZE = 224; // model minimum 224x224
const TOKEN_KEY = "auth_token";
const USER_ID_KEY = "user_id";

// true = local mock for UI testing; false = call the real backend
export const USE_MOCK = false;

// Error categories the UI can branch on
export type DetectErrorCode =
  | "not_logged_in"
  | "no_image"
  | "image_too_large"
  | "invalid_image"
  | "network"
  | "server"
  | "timeout"
  | "unknown";

export class DetectError extends Error {
  code: DetectErrorCode;
  constructor(code: DetectErrorCode, message?: string) {
    super(message ?? code);
    this.code = code;
  }
}

export type Recommendation = {
  label: string;
  display_name: string;
  category: string;
  severity: string;
  advice: string[];
  prevention: string[];
  pesticide: string | null;
};

export type ClassificationResult = {
  status: "healthy" | "disease";
  disease: string;
  confidence: number;
  decisionMessage: string;
  recommendations: Recommendation[];
};

export type NearbyResult = {
  total: number;
  days: number;
  radius_km: number;
  disease_counts: Record<string, number>;
  message: string;
};

export type ScanHistoryItem = {
  image_id: string;
  status: string | null;
  result_category: string | null;
  top_prediction: { label: string; score: number } | null;
  top_score: number | null;
  timestamp: string | null;
};

// ---------- Token / user storage ----------

export async function saveToken(token: string) {
  try {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  } catch {}
}

export async function getToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function clearToken() {
  try {
    await AsyncStorage.removeItem(TOKEN_KEY);
  } catch {}
}

export async function saveUserId(id: string) {
  try {
    await AsyncStorage.setItem(USER_ID_KEY, id);
  } catch {}
}

export async function getUserId(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(USER_ID_KEY);
  } catch {
    return null;
  }
}

// ---------- Auth ----------

export async function apiRegister(username: string, password: string) {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 600));
    return { ok: true as const };
  }
  const res = await fetch(`${BASE_URL}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) return { ok: false as const, error: await safeError(res) };
  return { ok: true as const };
}

export async function apiLogin(username: string, password: string) {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 600));
    await saveToken("mock-token");
    await saveUserId(username);
    return { ok: true as const };
  }
  const body = new URLSearchParams();
  body.append("username", username);
  body.append("password", password);

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });
  } catch (e) {
    console.log("Login fetch error:", e);
    return { ok: false as const, error: "Couldn't reach the server." };
  }
  if (!res.ok) return { ok: false as const, error: await safeError(res) };
  const data = await res.json();
  await saveToken(data.access_token);
  await saveUserId(username);
  console.log("Login OK, token saved");
  return { ok: true as const };
}

export async function apiLogout() {
  const token = await getToken();
  if (!USE_MOCK && token) {
    try {
      await fetch(`${BASE_URL}/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {}
  }
  await clearToken();
  try {
    await AsyncStorage.removeItem(USER_ID_KEY);
  } catch {}
}

// ---------- Preprocessing ----------

export async function preprocessImage(uri: string): Promise<string> {
  const { width, height } = await new Promise<{
    width: number;
    height: number;
  }>((resolve, reject) => {
    Image.getSize(
      uri,
      (w, h) => resolve({ width: w, height: h }),
      (err) => reject(err),
    );
  });

  const scale = MODEL_INPUT_SIZE / Math.min(width, height);
  const scaledWidth = Math.round(width * scale);
  const scaledHeight = Math.round(height * scale);
  const originX = Math.max(0, Math.round((scaledWidth - MODEL_INPUT_SIZE) / 2));
  const originY = Math.max(
    0,
    Math.round((scaledHeight - MODEL_INPUT_SIZE) / 2),
  );

  const result = await ImageManipulator.manipulateAsync(
    uri,
    [
      { resize: { width: scaledWidth, height: scaledHeight } },
      {
        crop: {
          originX,
          originY,
          width: MODEL_INPUT_SIZE,
          height: MODEL_INPUT_SIZE,
        },
      },
    ],
    { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG },
  );
  return result.uri;
}

// ---------- Analysis (upload + poll) ----------

export async function classifyImage(
  uri: string,
): Promise<ClassificationResult> {
  console.log("classifyImage start, uri:", uri);
  if (!uri) throw new DetectError("no_image", "No image selected.");

  let processedUri: string;
  try {
    processedUri = await preprocessImage(uri);
    console.log("Preprocess OK:", processedUri);
  } catch (e) {
    console.log("Preprocess error:", e);
    throw new DetectError(
      "invalid_image",
      "This image couldn't be processed. Please use a valid photo.",
    );
  }

  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 1500));
    const diseased = Math.random() > 0.5;
    return {
      status: diseased ? "disease" : "healthy",
      disease: diseased ? "Anthracnose of Mango" : "Healthy",
      confidence: 0.9,
      decisionMessage: diseased
        ? "Disease detected with high confidence."
        : "This mango leaf looks healthy.",
      recommendations: [],
    };
  }

  const token = await getToken();
  console.log("Token present:", !!token);
  if (!token) throw new DetectError("not_logged_in");

  // Gather optional coordinates FIRST (before building the form)
  let lat: number | null = null;
  let lng: number | null = null;
  try {
    const perm = await Location.getForegroundPermissionsAsync();
    let granted = perm.status === "granted";
    if (!granted) {
      const req = await Location.requestForegroundPermissionsAsync();
      granted = req.status === "granted";
    }
    if (granted) {
      const loc = await Location.getCurrentPositionAsync({});
      lat = loc.coords.latitude;
      lng = loc.coords.longitude;
      console.log("Location obtained");
    } else {
      console.log("Location not granted, uploading without it");
    }
  } catch (e) {
    console.log("Location error (continuing without):", e);
  }

  // 1. Upload using FileSystem.uploadAsync (avoids RN FormData file issues).
  const fileUri = processedUri.startsWith("file://")
    ? processedUri
    : `file://${processedUri}`;

  // Coordinates go as extra multipart parameters when available.
  const parameters: Record<string, string> = {};
  if (lat != null && lng != null) {
    parameters.latitude = lat.toFixed(6);
    parameters.longitude = lng.toFixed(6);
    console.log("Location attached to upload");
  }

  console.log("Uploading to", `${BASE_URL}/analysis`);
  let uploadResult: FileSystem.FileSystemUploadResult;
  try {
    uploadResult = await FileSystem.uploadAsync(
      `${BASE_URL}/analysis`,
      fileUri,
      {
        httpMethod: "POST",
        uploadType: FileSystem.FileSystemUploadType.MULTIPART,
        fieldName: "file",
        mimeType: "image/jpeg",
        parameters,
        headers: { Authorization: `Bearer ${token}` },
      },
    );
  } catch (e) {
    console.log("Upload error:", e);
    throw new DetectError("network", "Couldn't reach the server.");
  }
  console.log("Upload status:", uploadResult.status);

  if (uploadResult.status === 413)
    throw new DetectError("image_too_large", "That image is too large.");
  if (uploadResult.status === 422)
    throw new DetectError(
      "invalid_image",
      "That file wasn't accepted. Please use a clear mango photo.",
    );
  if (uploadResult.status === 401 || uploadResult.status === 403)
    throw new DetectError("not_logged_in", "Please log in again.");
  if (uploadResult.status < 200 || uploadResult.status >= 300)
    throw new DetectError("server", `Server error (${uploadResult.status}).`);

  let uploadData: any;
  try {
    uploadData = JSON.parse(uploadResult.body);
  } catch {
    throw new DetectError("server", "Unexpected server response.");
  }
  console.log("Upload data:", JSON.stringify(uploadData));
  const imageId: string = uploadData.image_id;
  if (!imageId) {
    throw new DetectError("server", "No image_id returned by server.");
  }

  // 3. Poll
  const maxAttempts = 20;
  const intervalMs = 1500;
  for (let i = 0; i < maxAttempts; i++) {
    let statusRes: Response;
    try {
      statusRes = await fetch(`${BASE_URL}/analysis/${imageId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (e) {
      console.log("Poll fetch error:", e);
      throw new DetectError("network", "Couldn't reach the server.");
    }
    if (!statusRes.ok)
      throw new DetectError("server", `Server error (${statusRes.status}).`);

    const data = await statusRes.json();
    console.log(`Poll ${i} status:`, data.status);

    if (data.status === "completed") {
      const cat = String(data.result_category ?? "").toLowerCase();
      const isHealthy = cat === "healthy" || cat === "good_healthy";

      const top = data.top_prediction ?? {};
      const topLabel: string = top.label ?? "Unknown";

      const preds: any[] = Array.isArray(data.predictions)
        ? data.predictions
        : [];
      const diseasePred = preds.find(
        (p) =>
          !String(p.label ?? "")
            .toLowerCase()
            .includes("healthy") &&
          !String(p.label ?? "")
            .toLowerCase()
            .includes("control"),
      );

      const displayName = isHealthy
        ? "Healthy"
        : (diseasePred?.label ?? topLabel).replace(/_/g, " ");
      const confidence: number = isHealthy
        ? (data.top_score ?? top.score ?? 0)
        : (diseasePred?.score ?? data.top_score ?? 0);

      return {
        status: isHealthy ? "healthy" : "disease",
        disease: displayName,
        confidence,
        decisionMessage: data.decision_message ?? "",
        recommendations: data.recommendations ?? [],
      };
    }
    if (data.status === "failed" || data.status === "error") {
      throw new DetectError(
        "invalid_image",
        "Couldn't analyze this image. Try a clearer mango photo.",
      );
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new DetectError("timeout", "Analysis took too long. Please try again.");
}

// ---------- Nearby cases ----------

export async function getNearbyCases(params: {
  latitude: number;
  longitude: number;
  radius_km?: number;
  days?: number;
}): Promise<NearbyResult> {
  const radius_km = params.radius_km ?? 10;
  const days = params.days ?? 30;

  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 800));
    const base = Math.max(1, Math.round(radius_km / 3));
    return {
      total: base + 1,
      days,
      radius_km,
      disease_counts: { Anthracnose_of_Mango: base, Scab_of_Mango: 1 },
      message: `Found ${base + 1} nearby disease cases in the last ${days} days`,
    };
  }

  const token = await getToken();
  if (!token) throw new Error("Not logged in");

  const query = new URLSearchParams({
    latitude: String(params.latitude),
    longitude: String(params.longitude),
    radius_km: String(radius_km),
    days: String(days),
  });

  const res = await fetch(`${BASE_URL}/nearby-cases?${query.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Nearby search failed: ${res.status}`);
  const data = await res.json();

  return {
    total: data.total ?? 0,
    days: data.days ?? days,
    radius_km: data.radius_km ?? radius_km,
    disease_counts: data.disease_counts ?? {},
    message: data.message ?? "",
  };
}

// ---------- Scan history ----------

export async function getUserScans(
  userId: string,
  limit = 100,
  offset = 0,
): Promise<ScanHistoryItem[]> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 600));
    const day = 24 * 60 * 60 * 1000;
    const now = Date.now();
    return [
      {
        image_id: "m1",
        status: "completed",
        result_category: "disease_detected",
        top_prediction: { label: "Anthracnose_of_Mango", score: 0.93 },
        top_score: 0.93,
        timestamp: new Date(now - 1 * day).toISOString(),
      },
      {
        image_id: "m2",
        status: "completed",
        result_category: "healthy",
        top_prediction: { label: "Good_Healthy", score: 0.97 },
        top_score: 0.97,
        timestamp: new Date(now - 4 * day).toISOString(),
      },
    ];
  }

  const token = await getToken();
  if (!token) throw new Error("Not logged in");

  const query = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });
  const res = await fetch(
    `${BASE_URL}/users/${encodeURIComponent(userId)}/scans?${query.toString()}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) throw new Error(`History failed: ${res.status}`);
  const data = await res.json();
  const scans = data?.data?.scans ?? [];
  return scans as ScanHistoryItem[];
}

// ---------- helpers ----------

async function safeError(res: Response): Promise<string> {
  try {
    const data = await res.json();
    if (typeof data?.detail === "string") return data.detail;
    if (Array.isArray(data?.detail) && data.detail[0]?.msg)
      return data.detail[0].msg;
    return `Request failed (${res.status})`;
  } catch {
    return `Request failed (${res.status})`;
  }
}
