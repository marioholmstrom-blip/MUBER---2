import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
} from "react-native";
import { createRequestWithInventory, getRequestTracking } from "./api/userRequestApi";
import { createTripPayment, getPaymentStatus } from "./api/paymentApi";
import InventoryStepRefactor from "./components/InventoryStepRefactor";

function getTripTrackingLabel(tripStatus, requestStatus) {
  switch (tripStatus) {
    case "driver_assigned":
      return "Chofer asignado";
    case "heading_to_pickup":
      return "Fletero en camino al retiro";
    case "arrived_pickup":
      return "Fletero llego al retiro";
    case "cargo_picked_up":
      return "Carga retirada, viaje en curso";
    case "heading_to_dropoff":
      return "En ruta al destino";
    case "arrived_dropoff":
      return "Llegando al destino";
    case "completed":
      return "Viaje completado";
    default:
      return "Procesando solicitud";
  }
}

function getPaymentStatusLabel(paymentStatus) {
  const normalizedStatus = String(paymentStatus || "").toLowerCase();

  switch (normalizedStatus) {
    case "paid":
      return "Pago confirmado";
    case "pending":
      return "Pago pendiente";
    case "failed":
      return "Pago rechazado";
    case "cancelled":
      return "Pago cancelado";
    case "refunded":
      return "Pago reembolsado";
    case "authorized":
      return "Pago autorizado";
    case "redirected":
      return "Pago en proceso";
    default:
      return "Pago pendiente";
  }
}

export default function UserScreen({ goHome, initialService = "" }) {
  const [step, setStep] = useState("service");
  const [service, setService] = useState(initialService);
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [inventoryMethod, setInventoryMethod] = useState("manual");
  const [inventoryItems, setInventoryItems] = useState([]);
  const [inventorySpecialNeeds, setInventorySpecialNeeds] = useState([]);
  const [requestId, setRequestId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [trackingData, setTrackingData] = useState(null);
  const [driverInfo, setDriverInfo] = useState(null);
  const [liveLocation, setLiveLocation] = useState(null);
  const [locationClockTick, setLocationClockTick] = useState(0);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [isAccepted, setIsAccepted] = useState(false);

  useEffect(() => {
    if (initialService) {
      setService(initialService);
    }
  }, [initialService]);

  const handleCreateRequest = async () => {
    if (!service || !origin || !destination) {
      Alert.alert("Error", "Por favor completa todos los campos");
      return;
    }

    try {
      setLoading(true);
      const result = await createRequestWithInventory({
        serviceType: service,
        originText: origin,
        destinationText: destination,
        inventoryMethod: inventoryMethod,
        inventoryItems: inventoryItems,
        inventorySpecialNeeds: inventorySpecialNeeds,
      });

      setRequestId(result.requestId);
      setStep("tracking");
      startTracking(result.requestId);
    } catch (error) {
      Alert.alert("Error", error.message || "No se pudo crear la solicitud");
    } finally {
      setLoading(false);
    }
  };

  const startTracking = async (id) => {
    setRequestId(id);
    setIsAccepted(false);

    try {
      const data = await getRequestTracking(id);
      setTrackingData(data);
      setPaymentStatus(data.paymentStatus);
      setPaymentMethod(data.paymentMethod);
      setDriverInfo(data.driverInfo);
      setLiveLocation(data.liveLocation);

      if (data.tripId) {
        setIsAccepted(true);
      }
    } catch (error) {
      console.error("Error fetching tracking:", error);
    }

    // Poll for updates (web doesn't have realtime like native)
    const interval = setInterval(async () => {
      try {
        const data = await getRequestTracking(id);
        setTrackingData(data);
        setPaymentStatus(data.paymentStatus);
        setPaymentMethod(data.paymentMethod);
        setDriverInfo(data.driverInfo);
        setLiveLocation(data.liveLocation);

        if (data.tripId && !isAccepted) {
          setIsAccepted(true);
        }

        if (data.tripStatus === "completed") {
          clearInterval(interval);
        }
      } catch (error) {
        console.error("Error polling tracking:", error);
      }
    }, 5000);

    // Clock tick for UI updates
    const clockInterval = setInterval(() => {
      setLocationClockTick((prev) => prev + 1);
    }, 1000);

    return () => {
      clearInterval(interval);
      clearInterval(clockInterval);
    };
  };

  const handleOpenPayment = () => {
    if (!trackingData?.tripId) {
      Alert.alert("Error", "No hay viaje activo para cobrar");
      return;
    }
    setIsPaymentModalOpen(true);
  };

  const handleClosePayment = () => {
    setIsPaymentModalOpen(false);
  };

  const handlePaymentComplete = async (status) => {
    setPaymentStatus(status);
    setIsPaymentModalOpen(false);
    if (status === "paid") {
      Alert.alert("Pago completado", "El pago se ha procesado correctamente");
    }
  };

  useEffect(() => {
    let interval;
    if (requestId && step === "tracking") {
      interval = setInterval(() => {
        setLocationClockTick((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [requestId, step]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>MUBER - Usuario</Text>
        <TouchableOpacity style={styles.backButton} onPress={goHome}>
          <Text style={styles.backButtonText}>← Volver</Text>
        </TouchableOpacity>
      </View>

      {step === "service" && (
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Crear Solicitud</Text>
          
          <Text style={styles.label}>Tipo de Servicio</Text>
          <TextInput
            style={styles.input}
            value={service}
            onChangeText={setService}
            placeholder="Ej: Mudanza, Flete, etc."
          />

          <Text style={styles.label}>Origen</Text>
          <TextInput
            style={styles.input}
            value={origin}
            onChangeText={setOrigin}
            placeholder="Dirección de origen"
          />

          <Text style={styles.label}>Destino</Text>
          <TextInput
            style={styles.input}
            value={destination}
            onChangeText={setDestination}
            placeholder="Dirección de destino"
          />

          <TouchableOpacity
            style={styles.button}
            onPress={() => setStep("inventory")}
          >
            <Text style={styles.buttonText}>Continuar →</Text>
          </TouchableOpacity>
        </View>
      )}

      {step === "inventory" && (
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Inventario</Text>
          
          <InventoryStepRefactor
            inventoryMethod={inventoryMethod}
            setInventoryMethod={setInventoryMethod}
            inventoryItems={inventoryItems}
            setInventoryItems={setInventoryItems}
            inventorySpecialNeeds={inventorySpecialNeeds}
            setInventorySpecialNeeds={setInventorySpecialNeeds}
          />

          <TouchableOpacity
            style={styles.button}
            onPress={handleCreateRequest}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? "Procesando..." : "Enviar Solicitud"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => setStep("service")}
          >
            <Text style={styles.secondaryButtonText}>{"\u2190"} Atrás</Text>
          </TouchableOpacity>
        </View>
      )}

      {step === "tracking" && trackingData && (
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Seguimiento</Text>
          
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Estado del Viaje:</Text>
            <Text style={styles.cardValue}>
              {getTripTrackingLabel(trackingData.tripStatus, trackingData.requestStatus)}
            </Text>
          </View>

          {isAccepted && driverInfo && (
            <View style={styles.card}>
              <Text style={styles.cardLabel}>Conductor:</Text>
              <Text style={styles.cardValue}>{driverInfo.driverName || "Fletero"}</Text>
              {driverInfo.vehicleName && (
                <Text style={styles.cardSubvalue}>
                  Vehículo: {driverInfo.vehicleName}
                </Text>
              )}
            </View>
          )}

          <View style={styles.card}>
            <Text style={styles.cardLabel}>Estado de Pago:</Text>
            <Text style={styles.cardValue}>
              {getPaymentStatusLabel(paymentStatus)}
            </Text>
          </View>

          {trackingData.tripStatus === "completed" && paymentStatus !== "paid" && (
            <View style={styles.card}>
              <Text style={styles.cardLabel}>Monto a Pagar:</Text>
              <Text style={styles.cardValue}>
                ${trackingData.totalPriceClp ? trackingData.totalPriceClp.toLocaleString("es-CL") : "Pendiente"}
              </Text>
              <TouchableOpacity
                style={styles.button}
                onPress={handleOpenPayment}
              >
                <Text style={styles.buttonText}>Contactar para Pago</Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={goHome}
          >
            <Text style={styles.secondaryButtonText}>Volver al Inicio</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#4A90E2",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
  },
  backButton: {
    padding: 8,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 8,
  },
  backButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#333",
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    color: "#555",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: "white",
  },
  button: {
    backgroundColor: "#4A90E2",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  secondaryButton: {
    backgroundColor: "#999",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  secondaryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  card: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  cardLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  cardSubvalue: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
});