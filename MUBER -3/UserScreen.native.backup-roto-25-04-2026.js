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
import MapView, { Marker } from "react-native-maps";
import { createRequestWithInventory, getRequestTracking } from "./api/userRequestApi";
import { createTripPayment, getPaymentStatus } from "./api/paymentApi";
import InventoryStepRefactor from "./components/InventoryStepRefactor";
import PaymentScreen from "./PaymentScreen.native";

function getTripTrackingLabel(tripStatus, requestStatus) {
  switch (tripStatus) {
    case "driver_assigned":
      return "Chofer asignado";
    case "heading_to_pickup":
      return "Fletero en camino al retiro";
    case "arrived_pickup":
      return "Fletero llego al retiro";
    case "cargo_picked_up":
      return "Carga recogida";
    case "heading_to_dropoff":
      return "Fletero en camino a la entrega";
    case "arrived_dropoff":
      return "Fletero llego a la entrega";
    case "completed":
      return "Flete completado";
    default:
      return requestStatus === "accepted"
        ? "Conductor asignado"
        : "Buscando conductor...";
  }
}

function getStepProgressLabel(step, stepConfig) {
  const config = stepConfig[step];
  if (!config) return "";
  return `Paso ${config.number} de ${config.total}: ${config.label}`;
}

function getTimeSinceLastPoll(lastPollTime) {
  if (!lastPollTime) return "No actualizado";
  const now = new Date();
  const diffMs = now - lastPollTime;
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return `Actualizado hace ${diffSec}s`;
  const diffMin = Math.floor(diffSec / 60);
  return `Actualizado hace ${diffMin} min`;
}

function getUserJourneySummary({ requestStatus, tripStatus, paymentStatus }) {
  if (paymentStatus === "paid") {
    return {
      phaseLabel: "Cierre del servicio",
      currentLabel: "Pago confirmado",
      nextStepLabel: "No necesitas hacer nada mas. Tu servicio ya quedo cerrado.",
    };
  }

  if (paymentStatus === "pending" && tripStatus === "completed") {
    return {
      phaseLabel: "Cierre del servicio",
      currentLabel: "Pago en proceso",
      nextStepLabel: "Completa el cobro en Webpay Plus y vuelve para confirmar el resultado.",
    };
  }

  if (tripStatus === "completed") {
    return {
      phaseLabel: "Cierre del servicio",
      currentLabel: "Viaje completado",
      nextStepLabel: "Ahora puedes revisar el monto final y completar el pago.",
    };
  }

  if (tripStatus) {
    return {
      phaseLabel: "Viaje en curso",
      currentLabel: getTripTrackingLabel(tripStatus, requestStatus),
      nextStepLabel: "Sigue el avance del chofer. El pago se habilita cuando el viaje termine.",
    };
  }

  if (requestStatus === "accepted") {
    return {
      phaseLabel: "Preparando el viaje",
      currentLabel: "Chofer asignado",
      nextStepLabel: "Tu chofer ya fue asignado. Pronto veras el viaje avanzar en tiempo real.",
    };
  }

  return {
    phaseLabel: "Solicitud enviada",
    currentLabel: "Buscando chofer",
    nextStepLabel: "Estamos revisando tu solicitud y te avisaremos cuando un chofer la tome.",
  };
}

export default function UserScreen({ goHome }) {
  const [step, setStep] = useState("service");
  const [service, setService] = useState("");
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [inventoryMethod, setInventoryMethod] = useState("");
  const [inventoryItems, setInventoryItems] = useState([]);
  const [inventorySpecialNeeds, setInventorySpecialNeeds] = useState([]);

  const getServicePrice = (serviceType) => {
    switch (serviceType) {
      case "flete":
        return 15000;
      case "ultima_milla":
        return 8990;
      case "asistida":
        return 20000;
      default:
        return 8990;
    }
  };

  const estimatedPrice = getServicePrice(service);
  const [loading, setLoading] = useState(false);

  const [requestId, setRequestId] = useState(null);
  const [requestStatus, setRequestStatus] = useState("new");
  const [tripStatus, setTripStatus] = useState(null);
  const [driverInfo, setDriverInfo] = useState(null);
  const [liveLocation, setLiveLocation] = useState(null);
  const [tripTotalPrice, setTripTotalPrice] = useState(0);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [latestPaymentId, setLatestPaymentId] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentSession, setPaymentSession] = useState(null);
  const [lastPollTime, setLastPollTime] = useState(null);

  const stepConfig = {
    service: { number: 1, total: 4, label: "Servicio" },
    inventory: { number: 2, total: 4, label: "Inventario" },
    summary: { number: 3, total: 4, label: "Resumen" },
    request: { number: 4, total: 4, label: "Solicitar" },
    tracking: { number: 4, total: 4, label: "Tracking" },
    payment: { number: 5, total: 5, label: "Pago" },
  };

  useEffect(() => {
    if (step !== "tracking" || !requestId) {
      return;
    }

    let intervalId;

    const checkRequestStatus = async () => {
      try {
        const tracking = await getRequestTracking(requestId);

        if (tracking?.requestStatus) {
          setRequestStatus(tracking.requestStatus);
        }

        setTripStatus(tracking?.tripStatus || null);
        setTripTotalPrice(Number(tracking?.totalPriceClp || 0));
        setPaymentStatus(
          tracking?.paymentStatus ? String(tracking.paymentStatus) : null
        );
        setPaymentMethod(
          tracking?.paymentMethod ? String(tracking.paymentMethod) : null
        );
        setLatestPaymentId(tracking?.latestPaymentId || null);
        setDriverInfo(tracking?.driverInfo || null);
        setLiveLocation(tracking?.liveLocation || null);
        setLastPollTime(new Date());
      } catch (error) {
        console.warn(
          "No se pudo actualizar tracking TEST:",
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

      const data = await createRequestWithInventory({
        serviceType: service,
        originText: origin,
        destinationText: destination,
        inventoryMethod: inventoryMethod || "manual",
        inventoryItems,
        inventorySpecialNeeds,
      });

      setRequestId(data.requestId);
      setRequestStatus(data.status || "new");
      setTripStatus(null);
      setTripTotalPrice(0);
      setPaymentStatus(null);
      setPaymentMethod(null);
      setLatestPaymentId(null);
      setDriverInfo(null);
      setLiveLocation(null);
      setStep("tracking");
    } catch (err) {
      Alert.alert(
        "Error",
        err.message || "No se pudo crear la solicitud con inventario"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleStartPayment = async () => {
    if (!tripStatus || tripStatus !== "completed") {
      Alert.alert(
        "Pago no disponible",
        "El pago se habilita cuando el viaje este completado."
      );
      return;
    }

    if (!requestId) {
      Alert.alert("Pago no disponible", "Todavia no existe un request valido.");
      return;
    }

    try {
      setPaymentLoading(true);

      const tracking = await getRequestTracking(requestId);
      const nextTripId = tracking?.tripId || null;

      if (!nextTripId) {
        throw new Error("No se encontro el viaje a cobrar.");
      }

      const paymentData = await createTripPayment(nextTripId);

      setLatestPaymentId(paymentData.paymentId || null);
      setPaymentStatus(String(paymentData.paymentStatus || "pending"));
      setPaymentMethod(
        paymentData.paymentMethod ? String(paymentData.paymentMethod) : "webpay_plus"
      );
      setPaymentSession({
        paymentId: paymentData.paymentId || null,
        amountClp: Number(paymentData.amountClp || tracking?.totalPriceClp || 0),
        paymentMethod: paymentData.paymentMethod || "webpay_plus",
        providerUrl: paymentData.providerUrl || null,
        providerToken: paymentData.providerToken || null,
        confirmUrl: paymentData.confirmUrl || null,
        redirectUrl: paymentData.redirectUrl || null,
      });
      setStep("payment");
    } catch (error) {
      Alert.alert(
        "Error de pago",
        error?.message || "No se pudo iniciar el pago."
      );
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleRefreshPayment = async () => {
    if (!requestId) {
      return;
    }

    try {
      setPaymentLoading(true);

      const tracking = await getRequestTracking(requestId);

      if (tracking?.tripStatus) {
        setTripStatus(tracking.tripStatus);
      }

      setTripTotalPrice(Number(tracking?.totalPriceClp || 0));
      setPaymentStatus(
        tracking?.paymentStatus ? String(tracking.paymentStatus) : null
      );
      setPaymentMethod(
        tracking?.paymentMethod ? String(tracking.paymentMethod) : null
      );
      setLatestPaymentId(tracking?.latestPaymentId || null);

      if (tracking?.latestPaymentId || latestPaymentId || tracking?.tripId) {
        const paymentData = await getPaymentStatus({
          paymentId: tracking?.latestPaymentId || latestPaymentId,
          tripId: tracking?.tripId || null,
        });

        setLatestPaymentId(paymentData?.paymentId || null);
        setPaymentStatus(String(paymentData?.paymentStatus || "pending"));
        setPaymentMethod(
          paymentData?.paymentMethod
            ? String(paymentData.paymentMethod)
            : "webpay_plus"
        );
      }
    } catch (error) {
      Alert.alert(
        "No se pudo actualizar",
        error?.message || "No se pudo refrescar el pago."
      );
    } finally {
      setPaymentLoading(false);
    }
  };

  const isAccepted = requestStatus === "accepted";
  const isTripCompleted = tripStatus === "completed";
  const isPaymentPaid = paymentStatus === "paid";
  const hasPaymentAttempt =
    paymentStatus === "pending" ||
    paymentStatus === "failed" ||
    paymentStatus === "paid" ||
    Boolean(latestPaymentId);
  const paymentPanelStatusLabel = isPaymentPaid
    ? getPaymentStatusLabel(paymentStatus)
    : paymentStatus === "failed"
      ? getPaymentStatusLabel(paymentStatus)
      : "Pago pendiente";
  const paymentAmountLabel = "Monto final";
  const paymentAmountValue =
    isTripCompleted || hasPaymentAttempt
      ? Number(tripTotalPrice || estimatedPrice || 0)
      : Number(estimatedPrice || 0);
  const paymentAmountFormatted = Number(paymentAmountValue || 0).toLocaleString(
    "es-CL"
  );
  const journeySummary = getUserJourneySummary({
    requestStatus,
    tripStatus,
    paymentStatus,
  });

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
            <Text style={styles.backButtonText}>{"<"}</Text>
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.brand}>MUBER</Text>
            <Text style={styles.headerSubtitle}>Usuario</Text>
          </View>

          <View style={styles.headerSpacer} />
        </View>

        {step !== "tracking" && step !== "payment" && (
          <View style={styles.progressBarContainer}>
            <Text style={styles.progressLabel}>
              {getStepProgressLabel(step, stepConfig)}
            </Text>
            <View style={styles.progressBarTrack}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${((stepConfig[step]?.number || 0) / (stepConfig[step]?.total || 6)) * 100}%`,
                  },
                ]}
              />
            </View>
          </View>
        )}

        {step === "tracking" && lastPollTime && (
          <View style={styles.pollingStatusContainer}>
            <Text style={styles.pollingStatusLabel}>
              {getTimeSinceLastPoll(lastPollTime)}
            </Text>
          </View>
        )}

        {step === "tracking" ? (
          <View style={styles.trackingOverlay}>
            <View style={styles.trackingMapWrapper}>
              {isAccepted && liveLocation ? (
                <MapView
                  style={styles.trackingMapFull}
                  region={{
                    latitude: Number(liveLocation.latitude),
                    longitude: Number(liveLocation.longitude),
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                  }}
                >
                  <Marker
                    coordinate={{
                      latitude: Number(liveLocation.latitude),
                      longitude: Number(liveLocation.longitude),
                    }}
                    title={driverInfo?.driverName || "Fletero"}
                    description={getTripTrackingLabel(tripStatus, requestStatus)}
                  />
                </MapView>
              ) : (
                <View style={styles.trackingPlaceholderFull}>
                  <Text style={styles.trackingPlaceholderText}>
                    {isAccepted ? "Esperando ubicación..." : "Buscando conductor..."}
                  </Text>
                </View>
              )}
            </View>
            
            <View style={styles.trackingBottomSheet}>
              <View style={styles.trackingColumns}>
                {isAccepted && driverInfo && (
                  <View style={styles.trackingColumn}>
                    <Text style={styles.trackingColumnTitle}>Chofer</Text>
                    <Text style={styles.trackingColumnValue}>{driverInfo.driverName}</Text>
                    <Text style={styles.trackingColumnLabel}>Vehículo</Text>
                    <Text style={styles.trackingColumnValue}>{driverInfo.vehicle}</Text>
                    <Text style={styles.trackingColumnLabel}>Patente</Text>
                    <Text style={styles.trackingColumnValue}>{driverInfo.plate}</Text>
                  </View>
                )}
                <View style={styles.trackingColumn}>
                  <Text style={styles.trackingColumnTitle}>Pago</Text>
                  <Text style={styles.trackingColumnValue}>{paymentPanelStatusLabel}</Text>
                  <Text style={styles.trackingColumnLabel}>Monto</Text>
                  <Text style={styles.trackingColumnAmount}>${paymentAmountFormatted}</Text>
                  {isTripCompleted && !isPaymentPaid && (
                    <TouchableOpacity
                      style={styles.trackingPayButton}
                      onPress={handleStartPayment}
                      activeOpacity={0.9}
                      disabled={paymentLoading}
                    >
                      <Text style={styles.trackingPayButtonText}>Pagar</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
              <TouchableOpacity
                style={styles.trackingHomeButtonSmall}
                onPress={goHome}
                activeOpacity={0.9}
              >
                <Text style={styles.trackingHomeButtonText}>Volver al inicio</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
        <View style={styles.sheet}>
          {step === "service" && (
            <>
              <Text style={styles.sheetTitle}>Servicio</Text>
              <Text style={styles.sheetSubtitle}>
                Completa los datos de tu traslado
              </Text>

              <View style={styles.locationInputs}>
                <View style={styles.locationField}>
                  <View style={styles.locationDot} />
                  <TextInput
                    value={origin}
                    onChangeText={setOrigin}
                    placeholder="Punto de partida"
                    placeholderTextColor="#8a97a6"
                    style={styles.locationInput}
                  />
                </View>
                <View style={styles.locationLine} />
                <View style={styles.locationField}>
                  <View style={[styles.locationDot, styles.locationDotDest]} />
                  <TextInput
                    value={destination}
                    onChangeText={setDestination}
                    placeholder="Destino"
                    placeholderTextColor="#8a97a6"
                    style={styles.locationInput}
                  />
                </View>
              </View>

              <Text style={styles.sectionLabel}>Tipo de servicio</Text>
              <View style={styles.serviceOptions}>
                <TouchableOpacity
                  style={[
                    styles.serviceOption,
                    service === "flete" && styles.serviceOptionActive,
                  ]}
                  onPress={() => setService("flete")}
                  activeOpacity={0.9}
                >
                  <Text style={[
                    styles.serviceOptionTitle,
                    service === "flete" && styles.serviceOptionTitleActive,
                  ]}>Flete</Text>
                  <Text style={styles.serviceOptionDesc}>Mudanzas y muebles</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.serviceOption,
                    service === "ultima_milla" && styles.serviceOptionActive,
                  ]}
                  onPress={() => setService("ultima_milla")}
                  activeOpacity={0.9}
                >
                  <Text style={[
                    styles.serviceOptionTitle,
                    service === "ultima_milla" && styles.serviceOptionTitleActive,
                  ]}>Última milla</Text>
                  <Text style={styles.serviceOptionDesc}>Paquetes y entregas</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.mainButton, (!service || !origin || !destination) && styles.buttonDisabled]}
                onPress={() => service && origin && destination && setStep("inventory")}
                activeOpacity={0.9}
                disabled={!service || !origin || !destination}
              >
                <Text style={styles.mainButtonText}>Continuar</Text>
              </TouchableOpacity>
            </>
          )}

          {step === "inventory" && (
            <InventoryStepRefactor
              onBack={() => setStep("service")}
              onConfirm={({ inventoryMethod, inventoryItems, inventorySpecialNeeds }) => {
                setInventoryMethod(inventoryMethod);
                setInventoryItems(inventoryItems);
                setInventorySpecialNeeds(inventorySpecialNeeds);
                setStep("summary");
              }}
            />
          )}

          {step === "summary" && (
            <>
              <Text style={styles.sheetTitle}>Resumen</Text>
              
              <View style={styles.summaryCompact}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabelSmall}>Servicio</Text>
                  <Text style={styles.summaryValueSmall}>
                    {service === "flete" ? "Flete" : service === "ultima_milla" ? "Última milla" : service}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabelSmall}>Origen</Text>
                  <Text style={styles.summaryValueSmall}>{origin}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabelSmall}>Destino</Text>
                  <Text style={styles.summaryValueSmall}>{destination}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabelSmall}>Items</Text>
                  <Text style={styles.summaryValueSmall}>{inventoryItems.length} objetos</Text>
                </View>
                {inventorySpecialNeeds.length > 0 && (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabelSmall}>Extras</Text>
                    <Text style={styles.summaryValueSmall}>{inventorySpecialNeeds.join(", ")}</Text>
                  </View>
                )}
              </View>

              <View style={styles.priceSection}>
                <Text style={styles.priceLabel}>Precio estimado</Text>
                <Text style={styles.priceBig}>${estimatedPrice.toLocaleString()} CLP</Text>
              </View>

              <TouchableOpacity
                style={styles.mainButton}
                onPress={() => setStep("request")}
                activeOpacity={0.9}
              >
                <Text style={styles.mainButtonText}>Solicitar servicio</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => setStep("inventory")}
                activeOpacity={0.9}
              >
                <Text style={styles.secondaryButtonText}>Editar</Text>
              </TouchableOpacity>
            </>
          )}

          {step === "request" && (
            <>
              <Text style={styles.sheetTitle}>Confirmar solicitud</Text>
              <Text style={styles.sheetSubtitle}>
                Revisa que todo esté correcto antes de enviar
              </Text>

              <View style={styles.confirmCard}>
                <Text style={styles.confirmText}>
                  {service === "flete" ? "Flete" : service === "ultima_milla" ? "Última milla" : service} desde {origin} hasta {destination}
                </Text>
                <Text style={styles.confirmPrice}>${estimatedPrice.toLocaleString()} CLP</Text>
              </View>

              <TouchableOpacity
                style={[styles.mainButton, loading && styles.buttonDisabled]}
                onPress={handleCreateRequest}
                activeOpacity={0.9}
                disabled={loading}
              >
                <Text style={styles.mainButtonText}>
                  {loading ? "Enviando..." : "Confirmar solicitud"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => setStep("summary")}
                activeOpacity={0.9}
              >
                <Text style={styles.secondaryButtonText}>Volver</Text>
              </TouchableOpacity>
            </>
          )}

          {step === "payment" && (
            <PaymentScreen
              paymentSession={paymentSession}
              paymentLoading={paymentLoading}
              onBack={async () => {
                setPaymentSession(null);
                setStep("tracking");
                await handleRefreshPayment();
              }}
              onRefresh={handleRefreshPayment}
              onPaymentReturn={async () => {
                setPaymentSession(null);
                setStep("tracking");
                await handleRefreshPayment();
              }}
            />
          )}

        </View>
        )}
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
  headerSubtitle: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: "700",
    color: "#f3f5f7",
  },
  headerSpacer: { width: 48, height: 48 },
  sheet: {
    backgroundColor: "#ffffff",
    borderRadius: 28,
    padding: 28,
    marginBottom: 6,
    minHeight: 500,
  },
  title: { fontSize: 24, fontWeight: "900", color: "#22313f", marginBottom: 8 },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: "#5f6c79",
    marginBottom: 18,
    fontWeight: "600",
  },
  primaryCard: {
    backgroundColor: "#1f2d3a",
    borderRadius: 12,
    padding: 20,
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  primaryCardSelected: { borderWidth: 1, borderColor: "#ffffff" },
  primaryCardTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  primaryCardText: {
    color: "#d8e0e8",
    fontSize: 14,
    fontWeight: "600",
    maxWidth: 240,
  },
  secondaryCard: {
    backgroundColor: "#e67e22",
    borderRadius: 12,
    padding: 20,
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  secondaryCardSelected: { borderWidth: 1, borderColor: "#22313f" },
  secondaryCardTitle: {
    color: "#22313f",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  secondaryCardText: {
    color: "#2c3e50",
    fontSize: 14,
    fontWeight: "600",
    maxWidth: 240,
  },
  arrowLight: { color: "#ffffff", fontSize: 26, fontWeight: "900", marginLeft: 10 },
  arrowDark: { color: "#22313f", fontSize: 26, fontWeight: "900", marginLeft: 10 },
  progressBarContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  progressLabel: {
    fontSize: 13,
    fontWeight: "800",
    color: "#44566c",
    marginBottom: 6,
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: "#eef3f7",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#e67e22",
    borderRadius: 3,
  },
  pollingStatusContainer: {
    backgroundColor: "#e8f7ef",
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
    alignItems: "center",
  },
  pollingStatusLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0f3a24",
  },
  label: {
    fontSize: 15,
    fontWeight: "800",
    color: "#22313f",
    marginBottom: 8,
    marginTop: 4,
  },
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
  optionTitle: {
    color: "#22313f",
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 6,
  },
  optionText: {
    color: "#5f6c79",
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 22,
  },
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
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  summaryCard: {
    backgroundColor: "transparent",
    borderWidth: 0,
    borderBottomWidth: 1,
    borderBottomColor: "#e8eef3",
    borderRadius: 0,
    padding: 16,
    marginBottom: 0,
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: "800",
    color: "#6a7682",
    marginTop: 6,
  },
  summaryValue: {
    fontSize: 17,
    fontWeight: "700",
    color: "#22313f",
    marginTop: 4,
  },
  price: { fontSize: 28, fontWeight: "900", color: "#e67e22", marginTop: 6 },
  priceBreakdownCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e8eef3",
  },
  priceBreakdownTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#22313f",
    marginBottom: 8,
  },
  priceBreakdownSubtitle: {
    fontSize: 14,
    color: "#5f6c79",
    marginBottom: 16,
    lineHeight: 20,
    fontWeight: "600",
  },
  priceBreakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  priceBreakdownLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#22313f",
  },
  priceBreakdownValue: {
    fontSize: 15,
    fontWeight: "700",
    color: "#22313f",
  },
  priceBreakdownNote: {
    fontSize: 12,
    color: "#6a7682",
    marginTop: 16,
    lineHeight: 18,
    fontWeight: "500",
  },
  statusCard: {
    backgroundColor: "transparent",
    borderWidth: 0,
    borderBottomWidth: 1,
    borderBottomColor: "#e8eef3",
    borderRadius: 0,
    padding: 16,
    marginBottom: 0,
  },
  statusTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#6a7682",
    marginBottom: 8,
  },
  statusValue: {
    fontSize: 22,
    fontWeight: "900",
    color: "#22313f",
    marginBottom: 8,
  },
  statusHint: {
    fontSize: 15,
    lineHeight: 22,
    color: "#5f6c79",
    fontWeight: "600",
  },
  driverInfoInlineBox: {
    marginTop: 12,
    backgroundColor: "#fff7ef",
    borderWidth: 0,
    borderRadius: 8,
    padding: 12,
  },
  locationInfoBox: {
    marginTop: 12,
    backgroundColor: "#eef6ff",
    borderWidth: 0,
    borderRadius: 8,
    padding: 12,
  },
  paymentInfoBox: {
    marginTop: 12,
    backgroundColor: "#f4f8ed",
    borderWidth: 0,
    borderRadius: 8,
    padding: 12,
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
  mapHeroCard: {
    backgroundColor: "#f8fafb",
    borderWidth: 1,
    borderColor: "#dbe3ea",
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 12,
  },
  mapTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#22313f",
    marginBottom: 10,
  },
  paymentCard: {
    backgroundColor: "#f8fafb",
    borderWidth: 1,
    borderColor: "#dbe3ea",
    borderRadius: 20,
    padding: 16,
    marginTop: 12,
    marginBottom: 6,
  },
  trackingMap: {
    width: "100%",
    height: 240,
  },
  trackingContainer: {
    flex: 1,
    flexDirection: "column",
  },
  trackingMapSection: {
    flex: 1,
  },
  trackingMapHalf: {
    flex: 1,
    width: "100%",
  },
  trackingPlaceholder: {
    flex: 1,
    backgroundColor: "#f8fafc",
    justifyContent: "center",
    alignItems: "center",
  },
  trackingPlaceholderText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#6a7682",
  },
  trackingInfoSection: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 12,
  },
  trackingStatusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  trackingStatusLabel: {
    fontSize: 14,
    fontWeight: "800",
    color: "#6a7682",
  },
  trackingStatusValue: {
    fontSize: 16,
    fontWeight: "900",
    color: "#22313f",
  },
  trackingHeaderTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: "#22313f",
    marginBottom: 4,
  },
  trackingHeaderSubtitle: {
    fontSize: 15,
    color: "#5f6c79",
    marginBottom: 16,
    fontWeight: "600",
  },
  trackingTabs: {
    flexDirection: "row",
    gap: 12,
  },
  trackingTab: {
    flex: 1,
    padding: 12,
  },
  trackingTabTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#22313f",
    marginBottom: 12,
  },
  trackingTabContent: {
    gap: 8,
  },
  trackingField: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  trackingFieldLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6a7682",
  },
  trackingFieldValue: {
    fontSize: 15,
    fontWeight: "700",
    color: "#22313f",
  },
  trackingFieldAmount: {
    fontSize: 18,
    fontWeight: "900",
    color: "#e67e22",
  },
  trackingPayButton: {
    backgroundColor: "#e67e22",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 12,
  },
  trackingPayButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  trackingHomeButton: {
    backgroundColor: "#1f2d3a",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 16,
  },
  trackingHomeButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  // Nuevos estilos tipo Uber
  sheetTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: "#22313f",
    marginBottom: 4,
  },
  sheetSubtitle: {
    fontSize: 15,
    color: "#5f6c79",
    marginBottom: 24,
    fontWeight: "600",
  },
  locationInputs: {
    marginBottom: 24,
  },
  locationField: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  locationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#e67e22",
  },
  locationDotDest: {
    backgroundColor: "#22313f",
  },
  locationLine: {
    width: 2,
    height: 24,
    backgroundColor: "#e8eef3",
    marginLeft: 4,
    marginVertical: 4,
  },
  locationInput: {
    flex: 1,
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: "#22313f",
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#6a7682",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  serviceOptions: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  serviceOption: {
    flex: 1,
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: "#e8eef3",
  },
  serviceOptionActive: {
    borderColor: "#e67e22",
    backgroundColor: "#fff7ef",
  },
  serviceOptionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#22313f",
    marginBottom: 4,
  },
  serviceOptionTitleActive: {
    color: "#e67e22",
  },
  serviceOptionDesc: {
    fontSize: 13,
    color: "#6a7682",
  },
  mainButton: {
    backgroundColor: "#22313f",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  mainButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "800",
  },
  secondaryButton: {
    backgroundColor: "transparent",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  secondaryButtonText: {
    color: "#6a7682",
    fontSize: 15,
    fontWeight: "700",
  },
  summaryCompact: {
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e8eef3",
  },
  summaryLabelSmall: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6a7682",
  },
  summaryValueSmall: {
    fontSize: 14,
    fontWeight: "700",
    color: "#22313f",
  },
  priceSection: {
    alignItems: "center",
    marginBottom: 24,
  },
  priceLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6a7682",
    marginBottom: 4,
  },
  priceBig: {
    fontSize: 32,
    fontWeight: "900",
    color: "#e67e22",
  },
  confirmCard: {
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    alignItems: "center",
  },
  confirmText: {
    fontSize: 15,
    color: "#5f6c79",
    textAlign: "center",
    marginBottom: 12,
    fontWeight: "600",
  },
  confirmPrice: {
    fontSize: 24,
    fontWeight: "900",
    color: "#22313f",
  },
  // Tracking fuera del sheet
  trackingOverlay: {
    flex: 1,
    position: "relative",
  },
  trackingMapWrapper: {
    flex: 1,
  },
  trackingMapFull: {
    flex: 1,
    width: "100%",
  },
  trackingPlaceholderFull: {
    flex: 1,
    backgroundColor: "#f8fafc",
    justifyContent: "center",
    alignItems: "center",
  },
  trackingBottomSheet: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  trackingColumns: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 16,
  },
  trackingColumn: {
    flex: 1,
  },
  trackingColumnTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#6a7682",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  trackingColumnValue: {
    fontSize: 15,
    fontWeight: "700",
    color: "#22313f",
    marginBottom: 8,
  },
  trackingColumnAmount: {
    fontSize: 20,
    fontWeight: "900",
    color: "#e67e22",
  },
  trackingColumnLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6a7682",
    marginBottom: 4,
  },
  trackingPayButton: {
    backgroundColor: "#e67e22",
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
    marginTop: 8,
  },
  trackingHomeButtonSmall: {
    backgroundColor: "#22313f",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
});
