import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "./lib/supabase";

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

export default function AuthScreen({ onAuthenticated, profileMessage = "" }) {
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [loadingAction, setLoadingAction] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  const isBusy = Boolean(loadingAction);
  const cleanEmail = useMemo(() => normalizeEmail(email), [email]);
  const cleanOtp = useMemo(() => String(otpCode || "").trim(), [otpCode]);

  const handleSendCode = async () => {
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setStatusMessage("Ingresa un email válido para recibir el código.");
      return;
    }

    try {
      setLoadingAction("send");
      setStatusMessage("");

      const { error } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
      });

      if (error) {
        throw error;
      }

      setStatusMessage("Código enviado. Revisa tu correo e ingrésalo abajo.");
    } catch (error) {
      setStatusMessage(
        error?.message || "No se pudo enviar el código OTP. Intenta nuevamente."
      );
    } finally {
      setLoadingAction("");
    }
  };

  const handleVerifyCode = async () => {
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setStatusMessage("Ingresa un email válido antes de verificar el código.");
      return;
    }

    if (!cleanOtp) {
      setStatusMessage("Ingresa el código OTP para continuar.");
      return;
    }

    try {
      setLoadingAction("verify");
      setStatusMessage("");

      const { error } = await supabase.auth.verifyOtp({
        email: cleanEmail,
        token: cleanOtp,
        type: "email",
      });

      if (error) {
        throw error;
      }

      setStatusMessage("Sesión iniciada correctamente.");

      if (typeof onAuthenticated === "function") {
        await onAuthenticated();
      }
    } catch (error) {
      setStatusMessage(
        error?.message || "No se pudo verificar el código OTP. Reintenta."
      );
    } finally {
      setLoadingAction("");
    }
  };

  const handleCheckSession = async () => {
    try {
      setLoadingAction("session");
      setStatusMessage("");

      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        throw error;
      }

      if (!session?.user?.id) {
        setStatusMessage("No hay sesión activa actualmente.");
        return;
      }

      setStatusMessage(`Sesión activa para ${session.user.email || "usuario"}.`);

      if (typeof onAuthenticated === "function") {
        await onAuthenticated();
      }
    } catch (error) {
      setStatusMessage(
        error?.message || "No se pudo revisar la sesión actual de Supabase Auth."
      );
    } finally {
      setLoadingAction("");
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.card}>
        <Text style={styles.title}>Iniciar sesión</Text>
        <Text style={styles.subtitle}>Supabase Auth · Entorno TEST</Text>

        <Text style={styles.label}>Email</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="correo@ejemplo.com"
          placeholderTextColor="#7f8fa3"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.input}
          editable={!isBusy}
        />

        <TouchableOpacity
          style={[styles.button, isBusy && styles.buttonDisabled]}
          onPress={handleSendCode}
          disabled={isBusy}
          activeOpacity={0.9}
        >
          <Text style={styles.buttonText}>Enviar código</Text>
        </TouchableOpacity>

        <Text style={[styles.label, styles.otpLabel]}>Código OTP</Text>
        <TextInput
          value={otpCode}
          onChangeText={setOtpCode}
          placeholder="Ingresa el código"
          placeholderTextColor="#7f8fa3"
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.input}
          editable={!isBusy}
        />

        <TouchableOpacity
          style={[styles.button, isBusy && styles.buttonDisabled]}
          onPress={handleVerifyCode}
          disabled={isBusy}
          activeOpacity={0.9}
        >
          <Text style={styles.buttonText}>Ingresar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.buttonSecondary, isBusy && styles.buttonDisabled]}
          onPress={handleCheckSession}
          disabled={isBusy}
          activeOpacity={0.9}
        >
          <Text style={styles.buttonSecondaryText}>Revisar sesión</Text>
        </TouchableOpacity>

        {isBusy ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color="#e6a93f" />
            <Text style={styles.loadingText}>Procesando...</Text>
          </View>
        ) : null}

        {profileMessage ? <Text style={styles.errorText}>{profileMessage}</Text> : null}
        {statusMessage ? <Text style={styles.statusText}>{statusMessage}</Text> : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#111d2a",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: "#1c2b3b",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#2d3f51",
    padding: 18,
  },
  title: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "900",
  },
  subtitle: {
    color: "#bfcadb",
    fontSize: 13,
    marginTop: 4,
    marginBottom: 14,
  },
  label: {
    color: "#dce5f2",
    fontSize: 13,
    marginBottom: 6,
    fontWeight: "700",
  },
  otpLabel: {
    marginTop: 12,
  },
  input: {
    backgroundColor: "#0f1a26",
    borderColor: "#2d3f51",
    borderWidth: 1,
    borderRadius: 12,
    color: "#ffffff",
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
  },
  button: {
    backgroundColor: "#e6a93f",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 12,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#162434",
    fontWeight: "900",
    fontSize: 15,
  },
  buttonSecondary: {
    marginTop: 10,
    borderColor: "#3a536a",
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  buttonSecondaryText: {
    color: "#dce5f2",
    fontWeight: "800",
    fontSize: 14,
  },
  loadingRow: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  loadingText: {
    color: "#dce5f2",
    fontSize: 13,
  },
  errorText: {
    marginTop: 12,
    color: "#ffb4b4",
    fontSize: 13,
    lineHeight: 19,
  },
  statusText: {
    marginTop: 10,
    color: "#dce5f2",
    fontSize: 13,
    lineHeight: 19,
  },
});
