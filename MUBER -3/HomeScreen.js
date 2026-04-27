import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ImageBackground,
  useWindowDimensions,
} from "react-native";

export default function HomeScreen({
  onSelectStandard,
  onSelectAssisted,
  onActivateVoice,
}) {
  const { width } = useWindowDimensions();
  const isSmall = width < 390;

  return (
    <ImageBackground
      source={require("./assets/mapa-valparaiso-fondo.png")}
      style={styles.bg}
      imageStyle={styles.bgImage}
      resizeMode="cover"
    >
      <StatusBar barStyle="light-content" />
      <View style={styles.overlay} />

      <SafeAreaView style={styles.container}>
        <View style={styles.topBlock}>
          <Text style={styles.brand}>MUBER</Text>
          <View style={styles.tag}>
            <Text style={styles.tagText}>Logística · Mudanzas · Valparaíso</Text>
          </View>
          <Text style={styles.subtitle}>
            Selecciona el servicio para iniciar tu flujo de mudanza.
          </Text>
        </View>

        <View style={[styles.bottomCard, isSmall && styles.bottomCardSmall]}>
          <View style={styles.handle} />
          <Text style={styles.question}>¿Qué servicio necesitas hoy?</Text>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={onSelectStandard}
            activeOpacity={0.9}
            accessibilityRole="button"
            accessibilityLabel="Seleccionar logística estándar"
          >
            <View>
              <Text style={styles.primaryButtonTitle}>🚚 Logística estándar</Text>
              <Text style={styles.primaryButtonText}>
                Última milla · Carga general · Empresas
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={onSelectAssisted}
            activeOpacity={0.9}
            accessibilityRole="button"
            accessibilityLabel="Seleccionar mudanza asistida"
          >
            <View>
              <Text style={styles.secondaryButtonTitle}>♿ Mudanza asistida</Text>
              <Text style={styles.secondaryButtonText}>
                Adultos mayores · Discapacidad · Cuidado premium
              </Text>
            </View>
          </TouchableOpacity>

          <View
            style={styles.accessibilityBar}
            accessible
            accessibilityRole="summary"
            accessibilityLabel="Opciones de accesibilidad"
          >
            <TouchableOpacity
              style={styles.accessChip}
              onPress={onActivateVoice}
              activeOpacity={0.9}
              accessibilityRole="button"
              accessibilityLabel="Activar navegación por voz"
            >
              <Text style={styles.accessChipText}>🔊 Voz</Text>
            </TouchableOpacity>
            <View style={styles.accessChip}>
              <Text style={styles.accessChipText}>🔡 Texto grande</Text>
            </View>
            <View style={styles.accessChip}>
              <Text style={styles.accessChipText}>🌐 ES/EN/PT</Text>
            </View>
            <View style={styles.accessChip}>
              <Text style={styles.accessChipText}>📶 Modo lite</Text>
            </View>
          </View>

          <View style={styles.bottomNav}>
            <Text style={[styles.bottomTab, styles.bottomTabActive]}>Inicio</Text>
            <Text style={styles.bottomTab}>Pedidos</Text>
            <Text style={styles.bottomTab}>Perfil</Text>
          </View>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: {
    flex: 1,
    backgroundColor: "#223244",
  },

  bgImage: {
    transform: [{ scale: 1.08 }, { translateY: 35 }],
    opacity: 0.85,
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(22, 32, 43, 0.35)",
  },

  container: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 10,
  },

  topBlock: {
    marginTop: 18,
  },

  brand: {
    fontSize: 56,
    fontWeight: "900",
    color: "#ffffff",
    letterSpacing: 1,
  },

  tag: {
    marginTop: 8,
    alignSelf: "flex-start",
    backgroundColor: "#e67e22",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
  },

  tagText: {
    color: "#1f2d3a",
    fontSize: 14,
    fontWeight: "800",
  },

  subtitle: {
    marginTop: 16,
    fontSize: 16,
    lineHeight: 23,
    color: "#f2f4f7",
    maxWidth: "92%",
    fontWeight: "600",
  },

  bottomCard: {
    backgroundColor: "#ffffff",
    borderRadius: 28,
    padding: 28,
    marginBottom: 6,
    minHeight: 420,
  },

  bottomCardSmall: {
    minHeight: 400,
    paddingHorizontal: 18,
  },

  handle: {
    width: 40,
    height: 4,
    backgroundColor: "#d0d5dd",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },

  question: {
    fontSize: 21,
    fontWeight: "800",
    color: "#233240",
    marginBottom: 14,
  },

  primaryButton: {
    backgroundColor: "#1f2d3a",
    borderRadius: 20,
    padding: 24,
    marginBottom: 12,
    minHeight: 106,
    justifyContent: "center",
  },

  primaryButtonTitle: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "800",
  },

  primaryButtonText: {
    color: "#d8e0e8",
    fontSize: 15,
    fontWeight: "600",
    maxWidth: "96%",
    marginTop: 6,
  },

  secondaryButton: {
    backgroundColor: "#e67e22",
    borderRadius: 20,
    padding: 24,
    marginBottom: 14,
    minHeight: 106,
    justifyContent: "center",
  },

  secondaryButtonTitle: {
    color: "#22313f",
    fontSize: 22,
    fontWeight: "800",
  },

  secondaryButtonText: {
    color: "#2c3e50",
    fontSize: 15,
    fontWeight: "700",
    maxWidth: "96%",
    marginTop: 6,
  },

  accessibilityBar: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 2,
  },

  accessChip: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#d7dde5",
  },

  accessChipText: {
    color: "#22313f",
    fontSize: 13,
    fontWeight: "700",
  },

  bottomNav: {
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "#e7edf3",
    flexDirection: "row",
    justifyContent: "space-around",
  },

  bottomTab: {
    color: "#5f6c79",
    fontSize: 14,
    fontWeight: "700",
  },

  bottomTabActive: {
    color: "#22313f",
    textDecorationLine: "underline",
  },
});