import React, { useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function DirectorPanel({
  onOpenDashboard,
  onOpenUser,
  onOpenAssisted,
  onOpenDriver,
  onOpenHome,
  onSignOut,
}) {
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    if (typeof onSignOut !== "function") {
      return;
    }

    try {
      setIsSigningOut(true);
      await onSignOut();
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.card}>
        <Text style={styles.title}>Panel Director MUBER</Text>
        <Text style={styles.subtitle}>Modo TEST · Navegación interna del fundador</Text>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={onOpenDashboard}
          activeOpacity={0.9}
          disabled={isSigningOut}
        >
          <Text style={styles.primaryButtonText}>Abrir Dashboard Director</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={onOpenUser}
          activeOpacity={0.9}
          disabled={isSigningOut}
        >
          <Text style={styles.buttonText}>Probar flujo Usuario</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={onOpenAssisted}
          activeOpacity={0.9}
          disabled={isSigningOut}
        >
          <Text style={styles.buttonText}>Probar Mudanza Asistida</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={onOpenDriver}
          activeOpacity={0.9}
          disabled={isSigningOut}
        >
          <Text style={styles.buttonText}>Probar flujo Conductor</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={onOpenHome}
          activeOpacity={0.9}
          disabled={isSigningOut}
        >
          <Text style={styles.buttonText}>Volver a Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.signOutButton, isSigningOut && styles.buttonDisabled]}
          onPress={handleSignOut}
          activeOpacity={0.9}
          disabled={isSigningOut}
        >
          {isSigningOut ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color="#ffe0e0" />
              <Text style={styles.signOutButtonText}>Cerrando sesión...</Text>
            </View>
          ) : (
            <Text style={styles.signOutButtonText}>Cerrar sesión</Text>
          )}
        </TouchableOpacity>
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
    borderWidth: 1,
    borderColor: "#2d3f51",
    borderRadius: 16,
    padding: 18,
  },
  title: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "900",
  },
  subtitle: {
    color: "#c5d2df",
    fontSize: 13,
    marginTop: 6,
    marginBottom: 14,
  },
  primaryButton: {
    backgroundColor: "#e6a93f",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: "center",
    marginBottom: 10,
  },
  primaryButtonText: {
    color: "#122234",
    fontWeight: "900",
    fontSize: 15,
  },
  button: {
    backgroundColor: "#223547",
    borderColor: "#39516a",
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: "center",
    marginBottom: 10,
  },
  buttonText: {
    color: "#e6edf5",
    fontWeight: "800",
    fontSize: 14,
  },
  signOutButton: {
    backgroundColor: "#7f2f2f",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: "center",
    marginTop: 2,
  },
  signOutButtonText: {
    color: "#ffe0e0",
    fontWeight: "900",
    fontSize: 14,
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
});
