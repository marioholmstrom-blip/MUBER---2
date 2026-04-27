import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
} from "react-native";
import HomeScreen from "./HomeScreen";
import UserScreen from "./UserScreen";
import AssistedScreen from "./AssistedScreen";
import DriverScreen from "./DriverScreen";
import AdminDashboard from "./AdminDashboard";
import { supabase } from "./lib/supabase";

export default function App() {
  const [screen, setScreen] = useState("loading");
  const [userRole, setUserRole] = useState(null);
  const [initialUserService, setInitialUserService] = useState("");

  const resolveScreenByRole = useCallback((roleValue) => {
    const role = String(roleValue || "customer").toLowerCase();
    setUserRole(role);

    if (role === "driver") {
      setScreen("driver");
      return;
    }

    if (role === "admin") {
      setScreen("admin");
      return;
    }

    setScreen("home");
  }, []);

  const loadSessionAndRole = useCallback(async () => {
    setScreen("loading");

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      setScreen("unauthenticated");
      return;
    }

    if (!session?.user?.id) {
      setScreen("unauthenticated");
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role, full_name, accessibility_notes")
      .eq("id", session.user.id)
      .single();

    if (profileError) {
      setScreen("unauthenticated");
      return;
    }

    resolveScreenByRole(profile?.role);
  }, [resolveScreenByRole]);

  useEffect(() => {
    let isMounted = true;

    const bootstrap = async () => {
      if (!isMounted) {
        return;
      }

      await loadSessionAndRole();
    };

    bootstrap();

    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      if (!isMounted) {
        return;
      }

      loadSessionAndRole();
    });

    return () => {
      isMounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, [loadSessionAndRole]);

  const goHomeByRole = () => {
    resolveScreenByRole(userRole || "customer");
  };

  if (screen === "loading") {
    return (
      <SafeAreaView style={styles.centeredScreen}>
        <ActivityIndicator size="large" color="#e67e22" />
        <Text style={styles.centeredTitle}>Verificando sesión</Text>
        <Text style={styles.centeredHint}>Cargando perfil del usuario…</Text>
      </SafeAreaView>
    );
  }

  if (screen === "unauthenticated") {
    return (
      <SafeAreaView style={styles.centeredScreen}>
        <Text style={styles.centeredTitle}>AuthScreen</Text>
        <Text style={styles.centeredHint}>
          No hay sesión activa. Inicia sesión para continuar.
        </Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={loadSessionAndRole}
          activeOpacity={0.9}
        >
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (screen === "admin") {
    return <AdminDashboard goHome={goHomeByRole} />;
  }

  if (screen === "user") {
    return (
      <UserScreen
        goHome={goHomeByRole}
        initialService={initialUserService}
      />
    );
  }

  if (screen === "assisted") {
    return <AssistedScreen goHome={goHomeByRole} />;
  }

  if (screen === "driver") {
    return <DriverScreen goHome={goHomeByRole} />;
  }

  return (
    <HomeScreen
      onSelectStandard={() => {
        setInitialUserService("");
        setScreen("user");
      }}
      onSelectAssisted={() => setScreen("assisted")}
      onActivateVoice={() =>
        Alert.alert("Voz", "Navegación por voz activada (modo TEST).")
      }
    />
  );
}

const styles = StyleSheet.create({
  centeredScreen: {
    flex: 1,
    backgroundColor: "#111d2a",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  centeredTitle: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "900",
    marginTop: 16,
  },
  centeredHint: {
    color: "#d8e0e8",
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    marginTop: 8,
  },
  retryButton: {
    backgroundColor: "#e67e22",
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 12,
    marginTop: 20,
  },
  retryButtonText: {
    color: "#1f2d3a",
    fontWeight: "800",
    fontSize: 15,
  },
});