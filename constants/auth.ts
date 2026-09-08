import AsyncStorage from "@react-native-async-storage/async-storage";

const USERS_KEY = "registered_users";
const SESSION_KEY = "current_user";

export type User = { name: string; email: string; password: string };

//test account
const SEED_USERS: User[] = [
  { name: "Test User 1", email: "testuser1@example.com", password: "12345" },
  { name: "Test User 2", email: "testuser2@example.com", password: "12345" },
];

async function getUsers(): Promise<User[]> {
  try {
    const raw = await AsyncStorage.getItem(USERS_KEY);
    const stored: User[] = raw ? JSON.parse(raw) : [];
    return [...SEED_USERS, ...stored];
  } catch {
    return SEED_USERS;
  }
}

export async function registerUser(user: User) {
  const email = user.email.trim().toLowerCase();
  const users = await getUsers();

  if (users.some((u) => u.email.toLowerCase() === email)) {
    return {
      ok: false as const,
      error: "An account with that email already exists.",
    };
  }

  try {
    const raw = await AsyncStorage.getItem(USERS_KEY);
    const stored: User[] = raw ? JSON.parse(raw) : [];
    stored.push({ ...user, email });
    await AsyncStorage.setItem(USERS_KEY, JSON.stringify(stored));
    return { ok: true as const };
  } catch {
    return { ok: false as const, error: "Could not save account. Try again." };
  }
}

export async function loginUser(email: string, password: string) {
  const users = await getUsers();
  const match = users.find(
    (u) =>
      u.email.toLowerCase() === email.trim().toLowerCase() &&
      u.password === password,
  );
  if (!match) {
    return { ok: false as const, error: "Invalid email or password." };
  }
  return { ok: true as const, user: match };
}

// ---- Session (remember who's logged in) ----

export async function setSession(email: string) {
  try {
    await AsyncStorage.setItem(SESSION_KEY, email.trim().toLowerCase());
  } catch {}
}

export async function getSession(): Promise<User | null> {
  try {
    const email = await AsyncStorage.getItem(SESSION_KEY);
    if (!email) return null;
    const users = await getUsers();
    return users.find((u) => u.email.toLowerCase() === email) ?? null;
  } catch {
    return null;
  }
}

export async function clearSession() {
  try {
    await AsyncStorage.removeItem(SESSION_KEY);
  } catch {}
}
