import ButtonPrimary from "@/components/ButtonPrimary";
import { apiLogin } from "@/constants/api";
import { setSession } from "@/constants/auth";
import { router } from "expo-router";
import { useState } from "react";
import {
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
  error: "#B0685C",
};

export default function LoginScreen() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) {
      setError("Please enter your username and password.");
      return;
    }
    setError("");
    setLoading(true);
    const result = await apiLogin(username, password);
    setLoading(false);

    if (!result.ok) {
      setError(result.error || "Login failed.");
      return;
    }
    await setSession(username);
    router.replace("/(tabs)");
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Log in</Text>

        <TextInput
          style={styles.input}
          placeholder="Username"
          placeholderTextColor={theme.muted}
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={theme.muted}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.buttonGroup}>
          <ButtonPrimary
            title="Log in"
            loading={loading}
            onPress={handleLogin}
          />
        </View>

        <TouchableOpacity onPress={() => router.push("/register")} hitSlop={12}>
          <Text style={styles.switchText}>No account? Create one</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.replace("/(tabs)")}
          hitSlop={12}
        >
          <Text style={styles.guestText}>Continue as guest →</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
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
  content: { flex: 1, justifyContent: "center" },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: theme.text,
    textAlign: "center",
    marginBottom: 12,
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
    marginTop: 12,
  },
  errorText: {
    color: theme.error,
    fontSize: 14,
    marginTop: 12,
    textAlign: "center",
  },
  buttonGroup: {
    width: "100%",
    maxWidth: 320,
    gap: 12,
    marginTop: 24,
    alignSelf: "center",
  },
  switchText: {
    color: theme.primary,
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 20,
  },
  guestText: {
    color: theme.muted,
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 16,
  },
  backText: {
    color: theme.muted,
    fontSize: 15,
    textAlign: "center",
    marginTop: 16,
  },
});
