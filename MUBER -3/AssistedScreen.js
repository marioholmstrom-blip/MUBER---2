import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ImageBackground,
  TextInput,
  Alert,
} from "react-native";
import {
  createAssistedRequest,
  getAssistedRequestTracking,
} from "./api/assistedRequestApi";
import InventoryStepRefactor from "./components/InventoryStepRefactor";
import { registerUserPayment } from "./api/paymentApi";

export default function AssistedScreen({ goHome }) {
  const [step, setStep] = useState("service");
  const [assistType, setAssistType] = useState("");
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [inventoryMethod, setInventoryMethod] = useState("");
  const [inventoryItems, setInventoryItems] = useState([]);
  const [inventorySpecialNeeds, setInventorySpecialNeeds] = useState([]);
  const [estimatedPrice] = useState(12990);
  const [loading, setLoading] = useState(false);
  const [requestId, setRequestId] = useState(null);
  const [tripId, setTripId] = useState(null);
  const [tripStatus, setTripStatus] = useState(null);
  const [tripTotalPrice, setTripTotalPrice] = useState(0);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [userPaymentMethod, setUserPaymentMethod] = useState("efectivo");
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [requestStatus, setRequestStatus] = useState("pending");
  const [driverInfo, setDriverInfo] = useState(null);

  useEffect(() => {
    if (step !== "tracking" || !requestId) {
      return;
    }

    let intervalId;

    const checkRequestStatus = async () => {
      try {
        const tracking = await getAssistedRequestTracking(requestId);

        if (tracking?.requestStatus) {
          setRequestStatus(tracking.requestStatus);
        }

        setTripId(tracking?.tripId || null);
        setTripStatus(tracking?.tripStatus || null);
        setTripTotalPrice(Number(tracking?.totalPriceClp || 0));
        setPaymentStatus(
          tracking?.paymentStatus ? String(tracking.paymentStatus) : null
        );
        setPaymentMethod(
          tracking?.paymentMethod ? String(tracking.paymentMethod) : null
        );
        setDriverInfo(tracking?.driverInfo || null);
      } catch (error) {
        console.warn(
          "No se pudo actualizar tracking asistido TEST:",
          error?.message || error
        );
      }
    };

    checkRequestStatus();
    intervalId = setInterval(checkRequestStatus, 3000);

    return () => clearInterval(intervalId);
  }, [step, requestId]);

  const handleCreateRequest = async () => {
    try {
      setLoading(true);

      const data = await createAssistedRequest({
        assistType,
        origin,
        destination,
        inventoryMethod,
        inventoryItems,
        inventorySpecialNeeds,
        estimatedPrice,
      });

      setRequestId(data.requestId);
      setTripId(null);
      setTripStatus(null);
      setTripTotalPrice(0);
      setPaymentStatus(null);
      setPaymentMethod(null);
      setUserPaymentMethod("efectivo");
      setRequestStatus(data.status || "pending");
      setDriverInfo(null);
      setStep("tracking");
    } catch (err) {
      Alert.alert("Error", err.message || "No se pudo crear la solicitud");
    } finally {
      setLoading(false);
    }
  };

  const isAccepted = requestStatus === "accepted";
  const isTripCompleted = tripStatus === "completed";
  const isPaymentPaid = paymentStatus === "paid";

  const handleUserPayment = async () => {
    if (!tripId) {
      Alert.alert("Pago no disponible", "No se encontro el viaje a cobrar.");
      return;
    }

    if (tripStatus !== "completed") {
      Alert.alert(
        "Pago no disponible",
        "El pago se habilita cuando el viaje este completado."
      );
      return;
    }

    const totalToPay = Number(tripTotalPrice || estimatedPrice || 0);
    if (!totalToPay || totalToPay <= 0) {
      Alert.alert("Monto no valido", "Este viaje no tiene monto total cargado.");
      return;
    }

    try {
      setPaymentLoading(true);

      await registerUserPayment({
        tripId,
        paymentMethod: userPaymentMethod,
      });

      const tracking = await getAssistedRequestTracking(requestId);
      setTripId(tracking?.tripId || null);
      setTripStatus(tracking?.tripStatus || null);
      setTripTotalPrice(Number(tracking?.totalPriceClp || 0));
      setPaymentStatus(
        tracking?.paymentStatus ? String(tracking.paymentStatus) : null
      );
      setPaymentMethod(
        tracking?.paymentMethod ? String(tracking.paymentMethod) : null
      );

      Alert.alert("Pago confirmado", "El pago fue registrado correctamente.");
      setStep("tracking");
    } catch (error) {
      Alert.alert(
        "Error de pago",
        error?.message || "No se pudo registrar el pago."
      );
    } finally {
      setPaymentLoading(false);
    }
  };

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
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={goHome}
            activeOpacity={0.9}
          >
            <Text style={styles.backButtonText}>‹</Text>
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.brand}>MUBER</Text>
            <Text style={styles.headerSubtitle}>Mudanza asistida</Text>
          </View>

          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.sheet}>
          {step === "service" && (
            <>
              <Text style={styles.title}>1. Elegir ayuda</Text>
              <Text style={styles.subtitle}>
                Selecciona el tipo de apoyo que necesitas para este traslado.
              </Text>

              <TouchableOpacity
                style={[
                  styles.optionCard,
                  assistType === "adultomayor" && styles.optionCardSelected,
                ]}
                onPress={() => setAssistType("adultomayor")}
                activeOpacity={0.9}
              >
                <View>
                  <Text style={styles.optionTitle}>Adulto mayor</Text>
                  <Text style={styles.optionText}>
                    Acompanamiento con mas cuidado y apoyo
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.optionCard,
                  assistType === "movilidad" && styles.optionCardSelected,
                ]}
                onPress={() => setAssistType("movilidad")}
                activeOpacity={0.9}
              >
                <View>
                  <Text style={styles.optionTitle}>Movilidad reducida</Text>
                  <Text style={styles.optionText}>
                    Ayuda fisica y accesibilidad adicional
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.optionCard,
                  assistType === "cuidado" && styles.optionCardSelected,
                ]}
                onPress={() => setAssistType("cuidado")}
                activeOpacity={0.9}
              >
                <View>
                  <Text style={styles.optionTitle}>Carga delicada</Text>
                  <Text style={styles.optionText}>
                    Objetos fragiles o traslado con mayor precaucion
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.darkButton, !assistType && styles.buttonDisabled]}
                onPress={() => assistType && setStep("route")}
                activeOpacity={0.9}
                disabled={!assistType}
              >
                <Text style={styles.darkButtonText}>Continuar</Text>
              </TouchableOpacity>
            </>
          )}

          {step === "route" && (
            <>
              <Text style={styles.title}>2. Origen y destino</Text>
              <Text style={styles.subtitle}>
                Indica desde donde sale y hacia donde va el traslado asistido.
              </Text>

              <Text style={styles.label}>Origen</Text>
              <TextInput
                value={origin}
                onChangeText={setOrigin}
                placeholder="Ej: Cerro Baron, Valparaiso"
                placeholderTextColor="#8a97a6"
                style={styles.input}
              />

              <Text style={styles.label}>Destino</Text>
              <TextInput
                value={destination}
                onChangeText={setDestination}
                placeholder="Ej: Renaca, Vina del Mar"
                placeholderTextColor="#8a97a6"
                style={styles.input}
              />

              <TouchableOpacity
                style={[
                  styles.darkButton,
                  (!origin || !destination) && styles.buttonDisabled,
                ]}
                onPress={() => origin && destination && setStep("inventory")}
                activeOpacity={0.9}
                disabled={!origin || !destination}
              >
                <Text style={styles.darkButtonText}>Continuar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.lightButton}
                onPress={() => setStep("service")}
                activeOpacity={0.9}
              >
                <Text style={styles.lightButtonText}>Volver</Text>
              </TouchableOpacity>
            </>
          )}

          {step === "inventory" && (
            <InventoryStepRefactor
              onBack={() => setStep("route")}
              onConfirm={({
                inventoryMethod,
                inventoryItems,
                inventorySpecialNeeds,
              }) => {
                setInventoryMethod(inventoryMethod);
                setInventoryItems(inventoryItems);
                setInventorySpecialNeeds(inventorySpecialNeeds);
                setStep("summary");
              }}
            />
          )}

          {step === "summary" && (
            <>
              <Text style={styles.title}>4. Resumen y precio</Text>
              <Text style={styles.subtitle}>
                Revisa la informacion antes de enviar tu servicio asistido.
              </Text>

              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Tipo de ayuda</Text>
                <Text style={styles.summaryValue}>
                  {assistType === "adultomayor" && "Adulto mayor"}
                  {assistType === "movilidad" && "Movilidad reducida"}
                  {assistType === "cuidado" && "Carga delicada"}
                </Text>

                <Text style={styles.summaryLabel}>Origen</Text>
                <Text style={styles.summaryValue}>{origin}</Text>

                <Text style={styles.summaryLabel}>Destino</Text>
                <Text style={styles.summaryValue}>{destination}</Text>

                <Text style={styles.summaryLabel}>Inventario</Text>
                <Text style={styles.summaryValue}>
                  {inventoryItems.length > 0
                    ? inventoryItems
                        .map((item) => `${item.quantity || 1}x ${item.name}`)
                        .join(", ")
                    : inventoryMethod || "Sin inventario"}
                </Text>

                <Text style={styles.summaryLabel}>Necesidades especiales</Text>
                <Text style={styles.summaryValue}>
                  {inventorySpecialNeeds.length > 0
                    ? inventorySpecialNeeds.join(", ")
                    : "Ninguna"}
                </Text>

                <Text style={styles.summaryLabel}>Precio estimado</Text>
                <Text style={styles.price}>${estimatedPrice}</Text>
              </View>

              <TouchableOpacity
                style={styles.orangeButton}
                onPress={() => setStep("request")}
                activeOpacity={0.9}
              >
                <Text style={styles.orangeButtonText}>Continuar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.lightButton}
                onPress={() => setStep("inventory")}
                activeOpacity={0.9}
              >
                <Text style={styles.lightButtonText}>Volver</Text>
              </TouchableOpacity>
            </>
          )}

          {step === "request" && (
            <>
              <Text style={styles.title}>5. Solicitar viaje</Text>
              <Text style={styles.subtitle}>
                Todo esta listo para enviar tu solicitud asistida.
              </Text>

              <View style={styles.statusCard}>
                <Text style={styles.statusTitle}>Solicitud lista</Text>
                <Text style={styles.statusValue}>
                  Tu servicio puede enviarse ahora
                </Text>
                <Text style={styles.statusHint}>
                  Esta vez se guardara en Supabase a traves de la capa API.
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.darkButton, loading && styles.buttonDisabled]}
                onPress={handleCreateRequest}
                activeOpacity={0.9}
                disabled={loading}
              >
                <Text style={styles.darkButtonText}>
                  {loading ? "Guardando..." : "Solicitar viaje"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.lightButton}
                onPress={() => setStep("summary")}
                activeOpacity={0.9}
              >
                <Text style={styles.lightButtonText}>Volver</Text>
              </TouchableOpacity>
            </>
          )}

          {step === "tracking" && (
            <>
              <Text style={styles.title}>6. Tracking</Text>
              <Text style={styles.subtitle}>
                {isAccepted
                  ? "Tu solicitud fue aceptada por un chofer."
                  : "La solicitud asistida fue creada correctamente en Supabase."}
              </Text>

              <View style={styles.statusCard}>
                <Text style={styles.statusTitle}>Estado</Text>
                <Text style={styles.statusValue}>
                  {isAccepted ? "Conductor asignado" : "Buscando conductor..."}
                </Text>
                <Text style={styles.statusHint}>
                  {isAccepted
                    ? "Driver ya acepto tu solicitud asistida."
                    : "Esta pantalla revisa automaticamente el estado real."}
                </Text>

                {isAccepted && driverInfo && (
                  <View style={styles.driverInfoBox}>
                    <Text style={styles.driverInfoLabel}>Chofer</Text>
                    <Text style={styles.driverInfoValue}>
                      {driverInfo.driverName}
                    </Text>

                    <Text style={styles.driverInfoLabel}>Vehiculo</Text>
                    <Text style={styles.driverInfoValue}>
                      {driverInfo.vehicle}
                    </Text>

                    <Text style={styles.driverInfoLabel}>Patente</Text>
                    <Text style={styles.driverInfoValue}>
                      {driverInfo.plate}
                    </Text>
                  </View>
                )}

                {isAccepted ? (
                  <View style={styles.driverInfoBox}>
                    <Text style={styles.driverInfoLabel}>Estado del viaje</Text>
                    <Text style={styles.driverInfoValue}>{tripStatus || "-"}</Text>
                    <Text style={styles.driverInfoLabel}>Monto final</Text>
                    <Text style={styles.driverInfoValue}>
                      ${Number(tripTotalPrice || estimatedPrice || 0).toLocaleString("es-CL")}
                    </Text>
                    <Text style={styles.driverInfoLabel}>Estado de pago</Text>
                    <Text style={styles.driverInfoValue}>{paymentStatus || "pending"}</Text>

                    {isTripCompleted && !isPaymentPaid && (
                      <TouchableOpacity
                        style={styles.darkButton}
                        onPress={() => setStep("payment")}
                        activeOpacity={0.9}
                        disabled={paymentLoading}
                      >
                        <Text style={styles.darkButtonText}>Ir a pago</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ) : null}
              </View>

              <TouchableOpacity
                style={styles.darkButton}
                onPress={goHome}
                activeOpacity={0.9}
              >
                <Text style={styles.darkButtonText}>Volver al inicio</Text>
              </TouchableOpacity>
            </>
          )}

          {step === "payment" && (
            <>
              <Text style={styles.title}>7. Pago</Text>
              <Text style={styles.subtitle}>
                Selecciona metodo de pago y confirma el cierre del viaje.
              </Text>

              <View style={styles.statusCard}>
                <Text style={styles.statusTitle}>Monto total</Text>
                <Text style={styles.statusValue}>
                  ${Number(tripTotalPrice || estimatedPrice || 0).toLocaleString("es-CL")}
                </Text>

                <Text style={styles.driverInfoLabel}>Metodo de pago</Text>
                <View style={styles.userPaymentMethodRow}>
                  <TouchableOpacity
                    style={[
                      styles.userPaymentChip,
                      userPaymentMethod === "efectivo" &&
                        styles.userPaymentChipActive,
                    ]}
                    onPress={() => setUserPaymentMethod("efectivo")}
                    activeOpacity={0.9}
                  >
                    <Text
                      style={[
                        styles.userPaymentChipText,
                        userPaymentMethod === "efectivo" &&
                          styles.userPaymentChipTextActive,
                      ]}
                    >
                      Efectivo
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.userPaymentChip,
                      userPaymentMethod === "transferencia" &&
                        styles.userPaymentChipActive,
                    ]}
                    onPress={() => setUserPaymentMethod("transferencia")}
                    activeOpacity={0.9}
                  >
                    <Text
                      style={[
                        styles.userPaymentChipText,
                        userPaymentMethod === "transferencia" &&
                          styles.userPaymentChipTextActive,
                      ]}
                    >
                      Transferencia
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.darkButton, paymentLoading && styles.buttonDisabled]}
                onPress={handleUserPayment}
                activeOpacity={0.9}
                disabled={paymentLoading}
              >
                <Text style={styles.darkButtonText}>
                  {paymentLoading ? "Confirmando..." : "Confirmar pago"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.lightButton}
                onPress={() => setStep("tracking")}
                activeOpacity={0.9}
                disabled={paymentLoading}
              >
                <Text style={styles.lightButtonText}>Volver</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: "#223244" },
  bgImage: { transform: [{ scale: 1.08 }, { translateY: 35 }] },
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
  header: {
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.92)",
    alignItems: "center",
    justifyContent: "center",
  },
  backButtonText: { fontSize: 24, fontWeight: "800", color: "#1f2d3a" },
  headerCenter: { alignItems: "center" },
  brand: { fontSize: 28, fontWeight: "900", color: "#ffffff", letterSpacing: 1 },
  headerSubtitle: { marginTop: 4, fontSize: 14, fontWeight: "700", color: "#f3f5f7" },
  headerSpacer: { width: 48, height: 48 },
  sheet: {
    backgroundColor: "#ffffff",
    borderRadius: 28,
    padding: 28,
    marginBottom: 6,
    minHeight: 520,
  },
  title: { fontSize: 24, fontWeight: "900", color: "#22313f", marginBottom: 8 },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: "#5f6c79",
    marginBottom: 18,
    fontWeight: "600",
  },
  optionCard: {
    backgroundColor: "transparent",
    borderWidth: 0,
    borderBottomWidth: 1,
    borderBottomColor: "#e8eef3",
    borderRadius: 0,
    padding: 16,
    marginBottom: 0,
  },
  optionCardSelected: { backgroundColor: "#fff7ef" },
  optionTitle: { color: "#22313f", fontSize: 18, fontWeight: "700", marginBottom: 6 },
  optionText: { color: "#5f6c79", fontSize: 14, fontWeight: "600", lineHeight: 20 },
  label: { fontSize: 15, fontWeight: "800", color: "#22313f", marginBottom: 8, marginTop: 4 },
  input: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e8eef3",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: "#22313f",
    marginBottom: 12,
  },
  inventoryCard: {
    backgroundColor: "transparent",
    borderWidth: 0,
    borderBottomWidth: 1,
    borderBottomColor: "#e8eef3",
    borderRadius: 0,
    padding: 16,
    marginBottom: 0,
  },
  inventoryCardSelected: { backgroundColor: "#fff7ef" },
  inventoryTitle: { color: "#22313f", fontSize: 18, fontWeight: "700", marginBottom: 6 },
  inventoryText: { color: "#5f6c79", fontSize: 14, fontWeight: "600", lineHeight: 20 },
  micButton: {
    marginTop: 4,
    marginBottom: 16,
    borderRadius: 22,
    backgroundColor: "#1f2d3a",
    paddingVertical: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  micIcon: { fontSize: 34, marginBottom: 6 },
  micText: { color: "#ffffff", fontSize: 18, fontWeight: "800" },
  darkButton: {
    backgroundColor: "#1f2d3a",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  darkButtonText: { color: "#ffffff", fontSize: 16, fontWeight: "700" },
  orangeButton: {
    backgroundColor: "#e67e22",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  orangeButtonText: { color: "#22313f", fontSize: 16, fontWeight: "700" },
  lightButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#e8eef3",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 12,
  },
  lightButtonText: { color: "#2c3e50", fontSize: 16, fontWeight: "700" },
  buttonDisabled: { opacity: 0.5 },
  summaryCard: {
    backgroundColor: "transparent",
    borderWidth: 0,
    borderBottomWidth: 1,
    borderBottomColor: "#e8eef3",
    borderRadius: 0,
    padding: 16,
    marginBottom: 0,
  },
  summaryLabel: { fontSize: 14, fontWeight: "800", color: "#6a7682", marginTop: 6 },
  summaryValue: { fontSize: 16, fontWeight: "700", color: "#22313f", marginTop: 4 },
  price: { fontSize: 28, fontWeight: "900", color: "#e67e22", marginTop: 6 },
  statusCard: {
    backgroundColor: "transparent",
    borderWidth: 0,
    borderBottomWidth: 1,
    borderBottomColor: "#e8eef3",
    borderRadius: 0,
    padding: 16,
    marginBottom: 0,
  },
  statusTitle: { fontSize: 15, fontWeight: "800", color: "#6a7682", marginBottom: 8 },
  statusValue: { fontSize: 20, fontWeight: "900", color: "#22313f", marginBottom: 8 },
  statusHint: { fontSize: 14, lineHeight: 20, color: "#5f6c79", fontWeight: "600" },
  driverInfoBox: {
    marginTop: 14,
    backgroundColor: "#fff7ef",
    borderWidth: 1,
    borderColor: "#f0d2b2",
    borderRadius: 18,
    padding: 16,
  },
  driverInfoLabel: {
    fontSize: 13,
    fontWeight: "800",
    color: "#6a7682",
    marginTop: 4,
  },
  driverInfoValue: {
    fontSize: 16,
    fontWeight: "800",
    color: "#22313f",
    marginTop: 2,
  },
  userPaymentMethodRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
  },
  userPaymentChip: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#d8e0e8",
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  userPaymentChipActive: {
    borderColor: "#e67e22",
    backgroundColor: "#fff7ef",
  },
  userPaymentChipText: {
    color: "#22313f",
    fontSize: 14,
    fontWeight: "700",
  },
  userPaymentChipTextActive: {
    color: "#e67e22",
  },
});
