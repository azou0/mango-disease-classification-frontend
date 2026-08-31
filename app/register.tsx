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

export default function RegisterScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");

  const handleRegister = () => {
    if (!name || !email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    // Mock register — accepts anything
    router.replace("/(tabs)");
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Create account</Text>

        <TextInput
          style={styles.input}
          placeholder="Name"
          placeholderTextColor={theme.muted}
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
        />
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
        <TextInput
          style={styles.input}
          placeholder="Confirm password"
          placeholderTextColor={theme.muted}
          value={confirm}
          onChangeText={setConfirm}
          secureTextEntry
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.buttonGroup}>
          <ButtonPrimary title="Sign up" onPress={handleRegister} />
        </View>

        <TouchableOpacity onPress={() => router.push("/login")} hitSlop={12}>
          <Text style={styles.switchText}>Already have an account? Log in</Text>
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
