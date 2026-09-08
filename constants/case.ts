//show nearby cases

import AsyncStorage from "@react-native-async-storage/async-storage";

const CASES_KEY = "disease_cases";

export type Case = {
  id: string;
  disease: string;
  suburb: string;
  date: string; // ISO string
};

export async function addCase(disease: string, suburb: string) {
  try {
    const raw = await AsyncStorage.getItem(CASES_KEY);
    const cases: Case[] = raw ? JSON.parse(raw) : [];
    cases.push({
      id: Date.now().toString(),
      disease,
      suburb: suburb.trim(),
      date: new Date().toISOString(),
    });
    await AsyncStorage.setItem(CASES_KEY, JSON.stringify(cases));
  } catch {}
}

export async function getCasesBySuburb(suburb: string): Promise<Case[]> {
  try {
    const raw = await AsyncStorage.getItem(CASES_KEY);
    const cases: Case[] = raw ? JSON.parse(raw) : [];
    return cases
      .filter((c) => c.suburb.toLowerCase() === suburb.trim().toLowerCase())
      .sort((a, b) => b.date.localeCompare(a.date));
  } catch {
    return [];
  }
}

export async function seedCasesIfEmpty() {
  try {
    const raw = await AsyncStorage.getItem(CASES_KEY);
    if (raw) return;
    const sample: Case[] = [
      {
        id: "s1",
        disease: "Anthracnose",
        suburb: "Richmond",
        date: new Date().toISOString(),
      },
      {
        id: "s2",
        disease: "Powdery Mildew",
        suburb: "Richmond",
        date: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: "s3",
        disease: "Leaf Rust",
        suburb: "Fitzroy",
        date: new Date().toISOString(),
      },
    ];
    await AsyncStorage.setItem(CASES_KEY, JSON.stringify(sample));
  } catch {}
}
