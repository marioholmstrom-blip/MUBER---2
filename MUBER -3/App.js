import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
} from "react-native";
import HomeScreen from "./HomeScreen";
import UserScreen from "./UserScreen";
import AssistedScreen from "./AssistedScreen";
import DriverScreen from "./DriverScreen";
import AdminDashboard from "./AdminDashboard";
import DirectorPanel from "./DirectorPanel";
import AuthScreen from "./AuthScreen";
import { supabase } from "./lib/supabase";

export default function App() {
  const [screen, setScreen] = useState("loading");
  const [userRole, setUserRole] = useState(null);
  const [initialUserService, setInitialUserService] = useState("");
  const [authMessage, setAuthMessage] = useState("");

  const resolveScreenByRole = useCallback((roleValue) => {
    const role = String(roleValue || "customer").toLowerCase();
    setUserRole(role);

    if (role === "driver") {
      setScreen("driver");
      return;
    }

    if (role === "admin") {
      setScreen("director");
      return;
    }

    setScreen("home");
  }, []);

  const loadSessionAndRole = useCallback(async () => {
    setScreen("loading");
    setAuthMessage("");

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      setAuthMessage(
        sessionError?.message ||
          "No se pudo validar la sesión en Supabase Auth. Intenta nuevamente."
      );
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

    const profileNotFound =
      !profile ||
      profileError?.code === "PGRST116" ||
      /0 rows|no rows/i.test(String(profileError?.message || ""));

    if (profileError && !profileNotFound) {
      setAuthMessage(
        profileError?.message ||
          "No se pudo cargar el perfil del usuario desde Supabase profiles."
      );
      setScreen("unauthenticated");
      return;
    }

    if (profileNotFound) {
      setAuthMessage(
        "Sesión iniciada, pero no existe perfil asociado en Supabase profiles."
      );
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

  useEffect(() => {
    if (Platform.OS !== "android") {
      return undefined;
    }

    const handleHardwareBack = () => {
      const role = String(userRole || "customer").toLowerCase();

      if (role === "admin") {
        if (screen !== "director") {
          setScreen("director");
          return true;
        }

        Alert.alert("Salir de MUBER", "¿Deseas salir de la app?", [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Salir",
            style: "destructive",
            onPress: () => BackHandler.exitApp(),
          },
        ]);
        return true;
      }

      if (role === "driver") {
        if (screen !== "driver") {
          setScreen("driver");
          return true;
        }
        return false;
      }

      if (role === "customer") {
        if (screen !== "home" && screen !== "loading" && screen !== "unauthenticated") {
          setScreen("home");
          return true;
        }
      }

      return false;
    };

    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      handleHardwareBack
    );

    return () => {
      subscription.remove();
    };
  }, [screen, userRole]);

  const goHomeByRole = () => {
    const role = String(userRole || "customer").toLowerCase();

    if (role === "admin") {
      setScreen("director");
      return;
    }

    if (role === "driver") {
      setScreen("driver");
      return;
    }

    setScreen("home");
  };

  const signOutToUnauthenticated = async () => {
    try {
      await supabase.auth.signOut();
    } finally {
      setUserRole(null);
      setAuthMessage("");
      setScreen("unauthenticated");
    }
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
      <AuthScreen
        onAuthenticated={loadSessionAndRole}
        profileMessage={authMessage}
      />
    );
  }

  if (screen === "admin") {
    return <AdminDashboard goHome={goHomeByRole} />;
  }

  if (screen === "director") {
    return (
      <DirectorPanel
        onOpenDashboard={() => setScreen("admin")}
        onOpenUser={() => setScreen("user")}
        onOpenAssisted={() => setScreen("assisted")}
        onOpenDriver={() => setScreen("driver")}
        onOpenHome={() => setScreen("home")}
        onSignOut={signOutToUnauthenticated}
      />
    );
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
});