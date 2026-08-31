import ButtonPrimary from "@/components/ButtonPrimary";
import { router } from "expo-router";
import React, { useState } from "react";
import {
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

const theme = {
  bg: "#F6F8F4",
  surface: "#FFFFFF",
  primary: "#2E7D5B",
  text: "#1A2B22",
  muted: "#6B7C74",
  border: "#E3E9E1",
  error: "#B0685C",
};

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = () => {
    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }
    // Mock login — accepts anything
    router.replace("/(tabs)");
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Log in</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={theme.muted}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
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
          <ButtonPrimary title="Log in" onPress={handleLogin} />
        </View>

        <TouchableOpacity onPress={() => router.push("/register")} hitSlop={12}>
          <Text style={styles.switchText}>No account? Create one</Text>
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
  backText: {
    color: theme.muted,
    fontSize: 15,
    textAlign: "center",
    marginTop: 16,
  },
});
