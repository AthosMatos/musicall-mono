import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ApiError } from "@monorepo/core/api";
import { MonoLabel } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { colors, fonts } from "@/theme";

type Mode = "login" | "register";

export default function LoginScreen() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (busy) return;
    setError(null);
    setBusy(true);
    try {
      if (mode === "login") await login(email.trim(), password);
      else await register(name.trim(), email.trim(), password);
      // AuthGate redirects to "/" on signedIn
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 401
          ? "e-mail ou senha inválidos"
          : err instanceof ApiError && err.status !== 0
            ? err.message
            : "não foi possível conectar ao servidor",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView
        style={styles.body}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.logoRow}>
          <View style={styles.logoBadge}>
            <Ionicons name="musical-note" size={18} color={colors.onAccent} />
          </View>
          <Text style={styles.logoText}>MusicAll</Text>
        </View>

        <Text style={styles.title}>{mode === "login" ? "Entrar" : "Criar conta"}</Text>
        <Text style={styles.subtitle}>
          {mode === "login" ? "bem-vindo de volta ao seu ateliê" : "seu ateliê de músicas te espera"}
        </Text>

        {mode === "register" && (
          <View style={styles.field}>
            <MonoLabel style={{ marginBottom: 8 }}>Nome</MonoLabel>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="como te chamamos?"
              placeholderTextColor={colors.faint}
              autoCapitalize="words"
              style={styles.input}
            />
          </View>
        )}
        <View style={styles.field}>
          <MonoLabel style={{ marginBottom: 8 }}>E-mail</MonoLabel>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="voce@exemplo.com"
            placeholderTextColor={colors.faint}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            style={styles.input}
          />
        </View>
        <View style={styles.field}>
          <MonoLabel style={{ marginBottom: 8 }}>Senha</MonoLabel>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor={colors.faint}
            secureTextEntry
            style={styles.input}
          />
        </View>

        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <Pressable
          onPress={() => void submit()}
          disabled={busy || !email.trim() || !password}
          style={[styles.submit, (busy || !email.trim() || !password) && { opacity: 0.6 }]}
        >
          <Text style={styles.submitText}>
            {busy ? "…" : mode === "login" ? "Entrar" : "Criar conta"}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => {
            setMode((m) => (m === "login" ? "register" : "login"));
            setError(null);
          }}
          hitSlop={8}
          style={{ marginTop: 24 }}
        >
          <Text style={styles.switchText}>
            {mode === "login" ? "não tem conta? criar uma →" : "já tem conta? entrar →"}
          </Text>
        </Pressable>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  body: { flex: 1, justifyContent: "center", paddingHorizontal: 28 },
  logoRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 30 },
  logoBadge: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: { fontFamily: fonts.uiSemiBold, fontSize: 20, color: colors.ink },
  title: { fontFamily: fonts.uiSemiBold, fontSize: 28, color: colors.ink, letterSpacing: -0.56 },
  subtitle: { fontFamily: fonts.mono, fontSize: 12, color: colors.meta2, marginTop: 4, marginBottom: 26 },
  field: { marginBottom: 16 },
  input: {
    height: 48,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: 15,
    fontFamily: fonts.ui,
    fontSize: 15,
    color: colors.ink,
  },
  errorBox: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(194,94,68,.35)",
    backgroundColor: "rgba(194,94,68,.1)",
    paddingHorizontal: 13,
    paddingVertical: 10,
    marginBottom: 16,
  },
  errorText: { fontFamily: fonts.mono, fontSize: 12, color: colors.accentSoft },
  submit: {
    height: 50,
    borderRadius: 13,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  submitText: { fontFamily: fonts.uiSemiBold, fontSize: 15, color: colors.onAccent },
  switchText: { fontFamily: fonts.mono, fontSize: 12, color: colors.meta },
});
