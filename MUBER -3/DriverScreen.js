import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  PanResponder,
  View,
  Text,
  Pressable,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Dimensions,
  TextInput,
  Platform,
  useWindowDimensions,
} from "react-native";
import {
  submitDriverApplicationRecord,
  findLatestDriverApplicationByEmail,
} from "./api/driverApplicationApi";
import {
  loadDriverPanelData,
  acceptDriverRequest,
  advanceDriverTrip,
  registerDriverTripPayment,
  updateDriverTripTotal,
  updateDriverLiveLocation,
  getDriverTripDetail,
} from "./api/driverOperationsApi";
import {
  setDriverOnline,
  getDeclinedDriverRequestIds,
  declineDriverRequest,
} from "./api/driversApi.js";
import { getCurrentDevicePosition } from "./lib/deviceLocation";
import { supabase } from "./lib/supabase";

const { width } = Dimensions.get("window");
const isSmallScreen = width < 480;

function getTimeSinceLastSync(lastSyncTime) {
  if (!lastSyncTime) return "No sincronizado";
  const now = new Date();
  const diffMs = now - lastSyncTime;
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return `Sincronizado hace ${diffSec}s`;
  const diffMin = Math.floor(diffSec / 60);
  return `Sincronizado hace ${diffMin} min`;
}

function getOfferServiceLabel(requestItem) {
  const value = String(requestItem?.service_type || "").toLowerCase();
  if (value === "mudanza_asistida" || value === "assisted") {
    return "Mudanza asistida";
  }
  if (value === "ultima_milla") {
    return "Última milla";
  }
  if (value === "flete" || value === "standard") {
    return "Flete estándar";
  }
  return requestItem?.service_type || "Servicio";
}

function SwipeAcceptButton({ onAccept, disabled }) {
  const fillAnim = useRef(new Animated.Value(0)).current;
  const [trackWidth, setTrackWidth] = useState(0);

  const animateFillTo = (toValue) => {
    Animated.spring(fillAnim, {
      toValue,
      useNativeDriver: false,
      bounciness: 0,
      speed: 25,
    }).start();
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !disabled,
      onMoveShouldSetPanResponder: () => !disabled,
      onPanResponderMove: (_evt, gestureState) => {
        if (!trackWidth) {
          return;
        }
        const next = Math.max(0, Math.min(1, gestureState.dx / trackWidth));
        fillAnim.setValue(next);
      },
      onPanResponderRelease: (_evt, gestureState) => {
        if (!trackWidth) {
          animateFillTo(0);
          return;
        }

        const ratio = Math.max(0, Math.min(1, gestureState.dx / trackWidth));
        if (ratio >= 0.82) {
          animateFillTo(1);
          onAccept?.();
          setTimeout(() => animateFillTo(0), 220);
        } else {
          animateFillTo(0);
        }
      },
      onPanResponderTerminate: () => {
        animateFillTo(0);
      },
    })
  ).current;

  const fillWidth = fillAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, trackWidth || 1],
    extrapolate: "clamp",
  });

  return (
    <View
      style={[
        styles.swipeTrack,
        disabled && styles.swipeTrackDisabled,
      ]}
      onLayout={(event) => {
        setTrackWidth(event.nativeEvent.layout.width || 0);
      }}
      {...panResponder.panHandlers}
    >
      <Animated.View style={[styles.swipeFill, { width: fillWidth }]} />
      <Text style={styles.swipeLabel}>Desliza para aceptar</Text>
    </View>
  );
}

function formatCurrencyClp(value) {
  if (!Number.isFinite(Number(value)) || Number(value) === 0) {
    return "Precio pendiente";
  }
  return `$${Number(value).toLocaleString("es-CL")}`;
}

function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validatePhone(phone) {
  const phoneRegex = /^\+?56?9?\d{8,9}$/;
  return phoneRegex.test(phone.replace(/\s/g, ""));
}

function validateChileanPlate(plate) {
  const plateRegex = /^[A-Z]{2,3}-\d{3,4}$/;
  return plateRegex.test(plate.toUpperCase().trim());
}

function Chip({ label, tone = "neutral" }) {
  return (
    <View
      style={[
        styles.chip,
        tone === "primary" && styles.chipPrimary,
        tone === "success" && styles.chipSuccess,
        tone === "warning" && styles.chipWarning,
        tone === "danger" && styles.chipDanger,
      ]}
    >
      <Text
        style={[
          styles.chipText,
          tone === "primary" && styles.chipTextPrimary,
          tone === "success" && styles.chipTextSuccess,
          tone === "warning" && styles.chipTextWarning,
          tone === "danger" && styles.chipTextDanger,
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

const emptyApplicationForm = {
  fullName: "",
  phone: "",
  email: "",
  city: "",
  notes: "",
  vehicleType: "",
  vehicleBrand: "",
  vehicleModel: "",
  vehiclePlate: "",
  vehicleCapacity: "",
  availableNow: false,
  zones: "",
  scheduleText: "",
  acceptsLastMile: true,
  acceptsStandard: true,
  acceptsAssisted: false,
  acceptsFragile: false,
  hasIdDocument: false,
  hasLicenseDocument: false,
  hasVehicleDocument: false,
  hasInsuranceDocument: false,
};

const TRACKABLE_TRIP_STATUSES = new Set([
  "driver_assigned",
  "heading_to_pickup",
  "arrived_pickup",
  "cargo_picked_up",
  "heading_to_dropoff",
  "arrived_dropoff",
]);

export default function DriverScreen({ goHome }) {
  const { width: windowWidth } = useWindowDimensions();
  const isDesktop = windowWidth >= 1024;
  const isTablet = windowWidth >= 480 && windowWidth < 1024;
  const isWeb = Platform.OS === "web";
  const isCompact = isWeb || isTablet || isDesktop;
  const [screenMode, setScreenMode] = useState("landing");
  const [applicationStep, setApplicationStep] = useState(1);
  const [applicationLoading, setApplicationLoading] = useState(false);
  const [applicationForm, setApplicationForm] = useState(emptyApplicationForm);
  const [applicationStatusEmail, setApplicationStatusEmail] = useState("");
  const [applicationStatusResult, setApplicationStatusResult] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  const [isOnline, setIsOnline] = useState(false);
  const [loading, setLoading] = useState(false);
  const [acceptingRequestId, setAcceptingRequestId] = useState(null);
  const [declinedRequestIds, setDeclinedRequestIds] = useState([]);
  const [driverRating, setDriverRating] = useState(5);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [activeTrips, setActiveTrips] = useState([]);
  const [tripPriceInputs, setTripPriceInputs] = useState({});
  const [locationSharingBusy, setLocationSharingBusy] = useState(false);
  const [locationSharingError, setLocationSharingError] = useState("");
  const [locationSharingEnabled, setLocationSharingEnabled] = useState(true);
  const [lastLocationSyncAt, setLastLocationSyncAt] = useState(null);
  const [lastPanelSyncAt, setLastPanelSyncAt] = useState(null);
  const [tripDetails, setTripDetails] = useState({});
  const [paymentSheetTrip, setPaymentSheetTrip] = useState(null);
  const [driverPaymentMethod, setDriverPaymentMethod] = useState("efectivo");
  const paymentCardOpacity = useRef(new Animated.Value(0)).current;
  const paymentCardTranslateY = useRef(new Animated.Value(22)).current;

  const resetDriverPanelState = () => {
    setIsOnline(false);
    setAcceptingRequestId(null);
    setDeclinedRequestIds([]);
    setDriverRating(5);
    setPendingRequests([]);
    setActiveTrips([]);
    setTripPriceInputs({});
    setLocationSharingBusy(false);
    setLocationSharingError("");
    setLocationSharingEnabled(true);
    setLastLocationSyncAt(null);
    setLastPanelSyncAt(null);
    setTripDetails({});
  };

  const syncTripPriceInputs = (trips) => {
    setTripPriceInputs(
      Object.fromEntries(
        (trips || []).map((tripItem) => [
          tripItem.id,
          String(Number(tripItem.total_price_clp || 0) || ""),
        ])
      )
    );
  };

  useEffect(() => {
    if (screenMode === "driver" && isOnline) {
      getDeclinedDriverRequestIds()
        .then((ids) => {
          setDeclinedRequestIds(Array.isArray(ids) ? ids : []);
        })
        .catch(() => {
          setDeclinedRequestIds([]);
        });

      loadDriverData();
    }

    if (screenMode !== "driver") {
      resetDriverPanelState();
    }
  }, [screenMode, isOnline]);

  useEffect(() => {
    if (screenMode !== "driver" || !isOnline) {
      return;
    }

    const channel = supabase
      .channel("new_requests")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "requests",
          filter: "status=eq.pending",
        },
        (payload) => {
          const nextRequest = payload?.new;
          if (!nextRequest?.id) {
            return;
          }

          if (String(nextRequest.status || "") !== "pending") {
            return;
          }

          getDriverTripDetail({ requestId: nextRequest.id, tripId: null })
            .then((detail) => {
              setTripDetails((prev) => ({
                ...prev,
                [nextRequest.id]: detail,
              }));
            })
            .catch(() => {
              // Si falla el detalle, igual mostramos la oferta base.
            });

          setPendingRequests((prev) => {
            const base = Array.isArray(prev) ? prev : [];
            if (
              declinedRequestIds.includes(nextRequest.id) ||
              base.some((item) => item.id === nextRequest.id)
            ) {
              return base;
            }

            return [nextRequest, ...base];
          });
          setLastPanelSyncAt(new Date());
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [screenMode, isOnline, declinedRequestIds]);

  useEffect(() => {
    if (screenMode !== "driver" || !isOnline) {
      return;
    }

    const intervalId = setInterval(() => {
      loadDriverData({ silent: true });
      setLastPanelSyncAt(new Date());
    }, 6000);

    return () => clearInterval(intervalId);
  }, [screenMode, isOnline, declinedRequestIds]);

  useEffect(() => {
    if (
      screenMode !== "driver" ||
      !isOnline ||
      !locationSharingEnabled ||
      activeTrips.length === 0
    ) {
      return;
    }

    const trackableTrip = activeTrips.find((tripItem) =>
      TRACKABLE_TRIP_STATUSES.has(String(tripItem.trip_status || ""))
    );

    if (!trackableTrip) {
      return;
    }

    let intervalId;
    let cancelled = false;

    const syncLiveLocation = async () => {
      if (cancelled) return;

      try {
        setLocationSharingBusy(true);
        setLocationSharingError("");

        const currentPosition = await getCurrentDevicePosition();
        await updateDriverLiveLocation(
          trackableTrip.id,
          trackableTrip.request_id,
          currentPosition
        );

        if (!cancelled) {
          setLastLocationSyncAt(currentPosition.recordedAt);
        }
      } catch (error) {
        if (!cancelled) {
          setLocationSharingError(
            error?.message || "No se pudo sincronizar ubicacion del chofer."
          );
        }
      } finally {
        if (!cancelled) {
          setLocationSharingBusy(false);
        }
      }
    };

    syncLiveLocation();
    intervalId = setInterval(syncLiveLocation, 15000);

    return () => {
      cancelled = true;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [screenMode, isOnline, activeTrips, locationSharingEnabled]);

  useEffect(() => {
    if (!paymentSheetTrip) {
      return;
    }

    paymentCardOpacity.setValue(0);
    paymentCardTranslateY.setValue(22);

    Animated.parallel([
      Animated.timing(paymentCardOpacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(paymentCardTranslateY, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  }, [paymentSheetTrip, paymentCardOpacity, paymentCardTranslateY]);

  const closePaymentSheet = () => {
    Animated.parallel([
      Animated.timing(paymentCardOpacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(paymentCardTranslateY, {
        toValue: 18,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setPaymentSheetTrip(null);
    });
  };

  const updateApplicationField = (field, value) => {
    setApplicationForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateApplicationStep = () => {
    const errors = {};

    if (applicationStep === 1) {
      if (!applicationForm.fullName.trim()) {
        errors.fullName = "Nombre es requerido";
      }
      if (!applicationForm.phone.trim()) {
        errors.phone = "Telefono es requerido";
      } else if (!validatePhone(applicationForm.phone)) {
        errors.phone = "Formato invalido (ej: +56912345678)";
      }
      if (!applicationForm.email.trim()) {
        errors.email = "Email es requerido";
      } else if (!validateEmail(applicationForm.email)) {
        errors.email = "Email invalido";
      }
      if (!applicationForm.city.trim()) {
        errors.city = "Ciudad es requerida";
      }
    }

    if (applicationStep === 2) {
      if (!applicationForm.vehicleType.trim()) {
        errors.vehicleType = "Tipo de vehiculo es requerido";
      }
      if (!applicationForm.vehicleBrand.trim()) {
        errors.vehicleBrand = "Marca es requerida";
      }
      if (!applicationForm.vehicleModel.trim()) {
        errors.vehicleModel = "Modelo es requerido";
      }
      if (!applicationForm.vehiclePlate.trim()) {
        errors.vehiclePlate = "Patente es requerida";
      } else if (!validateChileanPlate(applicationForm.vehiclePlate)) {
        errors.vehiclePlate = "Formato invalido (ej: XX-XXX o XXX-XX)";
      }
    }

    if (applicationStep === 3) {
      if (!applicationForm.hasIdDocument) {
        errors.hasIdDocument = "Cedula es requerida";
      }
      if (!applicationForm.hasLicenseDocument) {
        errors.hasLicenseDocument = "Licencia es requerida";
      }
      if (!applicationForm.hasVehicleDocument) {
        errors.hasVehicleDocument = "Documento del vehiculo es requerido";
      }
    }

    if (applicationStep === 4) {
      if (!applicationForm.zones.trim()) {
        errors.zones = "Cobertura es requerida";
      }
      if (!applicationForm.scheduleText.trim()) {
        errors.scheduleText = "Horario es requerido";
      }
    }

    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      Alert.alert(
        "Faltan datos o hay errores",
        "Revisa los campos marcados."
      );
      return false;
    }

    return true;
  };

  const goToNextApplicationStep = () => {
    if (!validateApplicationStep()) return;
    setApplicationStep((prev) => Math.min(prev + 1, 5));
  };

  const goToPreviousApplicationStep = () => {
    setApplicationStep((prev) => Math.max(prev - 1, 1));
  };

  const submitDriverApplication = async () => {
    try {
      setApplicationLoading(true);

      const { application, email } = await submitDriverApplicationRecord(
        applicationForm
      );

      setApplicationStatusResult(application);
      setApplicationStatusEmail(email);
      setScreenMode("status");

      Alert.alert(
        "Postulacion enviada",
        "Tu inscripcion quedo guardada y esta en revision."
      );
    } catch (error) {
      Alert.alert(
        "Error de inscripcion",
        error.message || "No se pudo guardar la postulacion."
      );
    } finally {
      setApplicationLoading(false);
    }
  };

  const todayTrips = activeTrips.filter(
    (tripItem) => String(tripItem.trip_status || "") === "completed"
  ).length;
  const todayEarned = activeTrips
    .filter((tripItem) => String(tripItem.payment_status || "") === "paid")
    .reduce((sum, tripItem) => sum + Number(tripItem.total_price_clp || 0), 0);

  const driverPanelState = !isOnline
    ? "offline"
    : acceptingRequestId
      ? "accepting"
      : pendingRequests.length === 0
        ? "online_no_requests"
        : "offer_available";

  const loadDriverData = async ({ silent = false } = {}) => {
    try {
      if (!silent) {
        setLoading(true);
      }

      const { pendingRequests: nextPendingRequests, activeTrips: nextActiveTrips } =
        await loadDriverPanelData();

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user?.id) {
        const { data: driverData } = await supabase
          .from("drivers")
          .select("rating")
          .eq("profile_id", session.user.id)
          .single();

        if (driverData && Number.isFinite(Number(driverData.rating))) {
          setDriverRating(Number(driverData.rating));
        }
      }

      const normalizedPending = (nextPendingRequests || []).filter(
        (requestItem) =>
          String(requestItem?.status || "") === "pending" &&
          !declinedRequestIds.includes(requestItem?.id)
      );

      setPendingRequests(normalizedPending);
      setActiveTrips(nextActiveTrips || []);
      syncTripPriceInputs(nextActiveTrips || []);

      // Load detailed trip data for active trips and pending requests
      const details = {};
      
      // Fetch details for active trips
      for (const trip of nextActiveTrips || []) {
        try {
          const detail = await getDriverTripDetail({
            requestId: trip.request_id,
            tripId: trip.id,
          });
          details[trip.id] = detail;
        } catch (error) {
          console.warn(
            `No se pudo cargar detalles del viaje ${trip.id}:`,
            error?.message || error
          );
        }
      }
      
      // Fetch details for pending requests
      for (const request of normalizedPending) {
        try {
          const detail = await getDriverTripDetail({
            requestId: request.id,
            tripId: null,
          });
          details[request.id] = detail;
        } catch (error) {
          console.warn(
            `No se pudo cargar detalles de la solicitud ${request.id}:`,
            error?.message || error
          );
        }
      }
      
      setTripDetails(details);
    } catch (error) {
      if (silent) {
        console.warn(
          "No se pudo refrescar Driver:",
          error?.message || error
        );
      } else {
        Alert.alert("Error", error.message || "No se pudo cargar Driver.");
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  const loadApplicationStatus = async () => {
    try {
      setApplicationLoading(true);
      setApplicationStatusResult(null);

      const { application } = await findLatestDriverApplicationByEmail(
        applicationStatusEmail
      );

      setApplicationStatusResult(application);
    } catch (error) {
      Alert.alert(
        "Estado no encontrado",
        error.message || "No se pudo consultar el estado."
      );
    } finally {
      setApplicationLoading(false);
    }
  };

  const getRequestServiceLabel = (requestItem) => {
    if (requestItem?.service_type) {
      return String(requestItem.service_type);
    }

    const noteText = requestItem?.notes ? String(requestItem.notes) : "";
    const serviceMatch = noteText.match(/Servicio:\s*([^|]+)/i);

    if (serviceMatch?.[1]) {
      return serviceMatch[1].trim();
    }

    return "Solicitud";
  };

  const getRequestInventoryLabel = (requestItem) => {
    if (requestItem?.inventory_method) {
      return String(requestItem.inventory_method);
    }

    const noteText = requestItem?.notes ? String(requestItem.notes) : "";
    const inventoryMatch = noteText.match(/Inventario:\s*(.+)$/i);

    if (inventoryMatch?.[1]) {
      return inventoryMatch[1].trim();
    }

    return null;
  };

  const toggleDriverOnline = async () => {
    try {
      if (isOnline && activeTrips.length > 0) {
        Alert.alert(
          "Confirmar desconexión",
          "Tienes viajes activos. ¿Seguro que quieres desconectarte?",
          [
            { text: "Cancelar", style: "cancel" },
            {
              text: "Desconectar",
              style: "destructive",
              onPress: async () => {
                setLoading(true);
                try {
                  await setDriverOnline(false);
                  setIsOnline(false);
                } finally {
                  setLoading(false);
                }
              },
            },
          ]
        );
        return;
      }

      setLoading(true);
      await setDriverOnline(!isOnline);
      setIsOnline((prev) => !prev);
    } catch (error) {
      Alert.alert(
        "Estado del turno",
        error?.message || "No se pudo actualizar el estado online."
      );
    } finally {
      setLoading(false);
    }
  };

  const declinePendingRequest = (requestItem) => {
    const requestId = requestItem?.id;
    if (!requestId) {
      return;
    }

    const previousPending = pendingRequests;

    setDeclinedRequestIds((prev) =>
      prev.includes(requestId) ? prev : [...prev, requestId]
    );
    setPendingRequests((prev) => prev.filter((item) => item.id !== requestId));

    declineDriverRequest(requestId)
      .then((result) => {
        if (Array.isArray(result?.declinedRequestIds)) {
          setDeclinedRequestIds(result.declinedRequestIds);
        }
      })
      .catch((error) => {
        setPendingRequests(previousPending);
        setDeclinedRequestIds((prev) => prev.filter((id) => id !== requestId));
        Alert.alert(
          "No se pudo rechazar",
          error?.message || "No fue posible guardar este rechazo en TEST."
        );
      });
  };

  const acceptRequestWithRealDriver = async (requestItem) => {
    const requestId = requestItem?.id;
    if (!requestId) {
      return;
    }

    try {
      setAcceptingRequestId(requestId);
      const { message } = await acceptDriverRequest(requestId);

      Alert.alert("Solicitud aceptada", message || "Solicitud aceptada.");
      setPendingRequests((prev) => prev.filter((item) => item.id !== requestId));
      await loadDriverData();
    } catch (error) {
      Alert.alert(
        "Error Driver",
        error.message || "No se pudo aceptar la solicitud."
      );
    } finally {
      setAcceptingRequestId(null);
    }
  };

  const moveTripToNextStatus = async (tripId, currentStatus, requestId) => {
    try {
      setLoading(true);
      const { status: nextStatus, message } = await advanceDriverTrip(
        tripId,
        currentStatus,
        requestId
      );

      Alert.alert(
        "Estado actualizado",
        message || `El viaje paso a: ${nextStatus}`
      );
      await loadDriverData();
    } catch (error) {
      Alert.alert(
        "Error Driver",
        error.message || "No se pudo actualizar el estado."
      );
    } finally {
      setLoading(false);
    }
  };

  const saveRealPayment = async (tripItem, paymentMethod) => {
    try {
      setLoading(true);
      const { message } = await registerDriverTripPayment(
        tripItem.id,
        paymentMethod
      );

      Alert.alert(
        "Pago registrado",
        message || `Pago guardado por ${paymentMethod}.`
      );
      closePaymentSheet();
      await loadDriverData();
    } catch (error) {
      Alert.alert(
        "Error de pago",
        error.message || "No se pudo registrar el pago."
      );
    } finally {
      setLoading(false);
    }
  };

  const openPaymentOptions = (tripItem) => {
    if (tripItem.trip_status !== "completed") {
      Alert.alert(
        "Pago no disponible",
        "Primero debes completar el viaje."
      );
      return;
    }

    const amountClp = Number(tripItem.total_price_clp || 0);
    if (!amountClp || amountClp <= 0) {
      Alert.alert(
        "Monto faltante",
        "Este viaje no tiene monto total cargado."
      );
      return;
    }

    if (tripItem.payment_status === "paid") {
      Alert.alert("Pago ya registrado", "Este viaje ya tiene pago guardado.");
      return;
    }

    if (
      tripItem.payment_status === "pending" &&
      tripItem.payment_method === "webpay_plus"
    ) {
      Alert.alert(
        "Pago Webpay en curso",
        "Este viaje ya tiene un pago Webpay Plus iniciado por el usuario. No se puede registrar un pago manual hasta que ese intento se cierre."
      );
      return;
    }

    setDriverPaymentMethod("efectivo");
    setPaymentSheetTrip(tripItem);
  };

  const shareDriverLiveLocationNow = async (tripItem) => {
    try {
      setLocationSharingBusy(true);
      setLocationSharingError("");

      const currentPosition = await getCurrentDevicePosition();
      const { message, recordedAt } = await updateDriverLiveLocation(
        tripItem.id,
        tripItem.request_id,
        currentPosition
      );

      setLastLocationSyncAt(recordedAt || currentPosition.recordedAt);
      Alert.alert("Tracking actualizado", message || "Ubicacion actual enviada.");
    } catch (error) {
      const nextMessage =
        error?.message || "No se pudo sincronizar la ubicacion actual.";
      setLocationSharingError(nextMessage);
      Alert.alert("Error de tracking", nextMessage);
    } finally {
      setLocationSharingBusy(false);
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "driver_assigned":
        return "Conductor asignado";
      case "heading_to_pickup":
        return "En camino al retiro";
      case "arrived_pickup":
        return "Llegada a retiro";
      case "cargo_picked_up":
        return "Carga recogida";
      case "heading_to_dropoff":
        return "En camino a entrega";
      case "arrived_dropoff":
        return "Llegada a entrega";
      case "completed":
        return "Viaje finalizado";
      case "payment_registered":
        return "Pago registrado";
      default:
        return status || "Sin estado";
    }
  };

  const getDriverTripHeadline = (tripItem) => {
    if (
      String(tripItem.trip_status || "") === "completed" &&
      String(tripItem.payment_status || "") === "paid"
    ) {
      return "Viaje completado con exito";
    }

    return getStatusLabel(tripItem.trip_status);
  };

  const getDriverNextActionLabel = (tripItem) => {
    if (
      String(tripItem.trip_status || "") === "completed" &&
      String(tripItem.payment_status || "") === "paid"
    ) {
      return "Servicio cerrado. No necesitas realizar otra accion.";
    }

    if (
      String(tripItem.trip_status || "") === "completed" &&
      String(tripItem.payment_status || "") === "pending" &&
      String(tripItem.payment_method || "") === "webpay_plus"
    ) {
      return "Espera a que el usuario termine Webpay Plus. No registres un pago manual.";
    }

    if (String(tripItem.trip_status || "") === "completed") {
      return "El viaje ya termino. Ahora corresponde registrar el pago real.";
    }

    return "Avanza el viaje paso a paso hasta completar la entrega.";
  };

  const getPaymentLabel = (status, method) => {
    if (status === "paid") {
      return `Pago registrado (${method || "sin metodo"})`;
    }
    if (status === "pending" && method === "webpay_plus") {
      return "Pago Webpay en curso";
    }
    return "Pago pendiente";
  };

  const updateTripPriceInput = (tripId, value) => {
    const numericValue = value.replace(/[^\d]/g, "");
    setTripPriceInputs((prev) => ({
      ...prev,
      [tripId]: numericValue,
    }));
  };

  const saveTripTotalPrice = async (tripItem) => {
    try {
      setLoading(true);

      const rawValue = String(tripPriceInputs[tripItem.id] || "").trim();
      const normalizedTotal = Number(rawValue);

      if (!rawValue || !Number.isFinite(normalizedTotal) || normalizedTotal <= 0) {
        throw new Error("Escribe un total real mayor a 0.");
      }

      const { totalPriceClp, message } = await updateDriverTripTotal(
        tripItem.id,
        normalizedTotal
      );

      setTripPriceInputs((prev) => ({
        ...prev,
        [tripItem.id]: String(totalPriceClp),
      }));

      Alert.alert("Total actualizado", message || "Total guardado.");
      await loadDriverData();
    } catch (error) {
      Alert.alert(
        "Error de total",
        error.message || "No se pudo guardar el total del viaje."
      );
    } finally {
      setLoading(false);
    }
  };

  const getApplicationStatusLabel = (status) => {
    switch (status) {
      case "draft":
        return "Borrador";
      case "submitted":
        return "Enviada";
      case "under_review":
        return "En revision";
      case "approved":
        return "Aprobada";
      case "rejected":
        return "Rechazada";
      default:
        return status || "Sin estado";
    }
  };

  const renderLanding = () => (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <TouchableOpacity
        style={styles.bigActionCard}
        onPress={() => setScreenMode("driver")}
        activeOpacity={0.9}
      >
        <Text style={styles.bigActionTitle}>Ya soy chofer</Text>
        <Text style={styles.bigActionText}>
          Entrar al panel operativo del chofer.
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.bigActionCard}
        onPress={() => {
          setApplicationStep(1);
          setScreenMode("apply");
        }}
        activeOpacity={0.9}
      >
        <Text style={styles.bigActionTitle}>Quiero inscribirme</Text>
        <Text style={styles.bigActionText}>
          Completar la postulacion paso a paso.
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.bigActionCard}
        onPress={() => {
          setApplicationStatusResult(null);
          setScreenMode("status");
        }}
        activeOpacity={0.9}
      >
        <Text style={styles.bigActionTitle}>Ver estado de mi postulacion</Text>
        <Text style={styles.bigActionText}>
          Consultar si la postulacion esta enviada, en revision o aprobada.
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderApplicationStep = () => (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Inscripcion de chofer</Text>
        <Text style={styles.cardText}>Paso {applicationStep} de 5</Text>
      </View>

      {applicationStep === 1 && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Datos personales</Text>
          <TextInput
            style={styles.input}
            placeholder="Nombre completo"
            value={applicationForm.fullName}
            onChangeText={(text) => updateApplicationField("fullName", text)}
          />
          <TextInput
            style={styles.input}
            placeholder="Telefono"
            value={applicationForm.phone}
            onChangeText={(text) => updateApplicationField("phone", text)}
          />
          <TextInput
            style={styles.input}
            placeholder="Correo"
            autoCapitalize="none"
            keyboardType="email-address"
            value={applicationForm.email}
            onChangeText={(text) => updateApplicationField("email", text)}
          />
          <TextInput
            style={styles.input}
            placeholder="Ciudad o zona base"
            value={applicationForm.city}
            onChangeText={(text) => updateApplicationField("city", text)}
          />
          <TextInput
            style={[styles.input, styles.multilineInput]}
            placeholder="Experiencia o nota opcional"
            multiline
            value={applicationForm.notes}
            onChangeText={(text) => updateApplicationField("notes", text)}
          />
        </View>
      )}

      {applicationStep === 2 && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Vehiculo</Text>
          <TextInput
            style={styles.input}
            placeholder="Tipo de vehiculo"
            value={applicationForm.vehicleType}
            onChangeText={(text) => updateApplicationField("vehicleType", text)}
          />
          <TextInput
            style={styles.input}
            placeholder="Marca"
            value={applicationForm.vehicleBrand}
            onChangeText={(text) => updateApplicationField("vehicleBrand", text)}
          />
          <TextInput
            style={styles.input}
            placeholder="Modelo"
            value={applicationForm.vehicleModel}
            onChangeText={(text) => updateApplicationField("vehicleModel", text)}
          />
          <TextInput
            style={styles.input}
            placeholder="Patente"
            value={applicationForm.vehiclePlate}
            onChangeText={(text) => updateApplicationField("vehiclePlate", text)}
          />
          <TextInput
            style={styles.input}
            placeholder="Capacidad o tamano"
            value={applicationForm.vehicleCapacity}
            onChangeText={(text) => updateApplicationField("vehicleCapacity", text)}
          />

          <TouchableOpacity
            style={[
              styles.toggleCard,
              applicationForm.availableNow && styles.toggleCardActive,
            ]}
            onPress={() =>
              updateApplicationField("availableNow", !applicationForm.availableNow)
            }
          >
            <Text style={styles.toggleCardTitle}>Disponible para operar ya</Text>
            <Text style={styles.toggleCardText}>
              {applicationForm.availableNow ? "Si" : "No"}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {applicationStep === 3 && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Documentos</Text>
          <Text style={styles.cardText}>
            En esta primera version solo vamos a marcarlos como disponibles.
          </Text>

          <TouchableOpacity
            style={[
              styles.toggleCard,
              applicationForm.hasIdDocument && styles.toggleCardActive,
            ]}
            onPress={() =>
              updateApplicationField("hasIdDocument", !applicationForm.hasIdDocument)
            }
          >
            <Text style={styles.toggleCardTitle}>Cedula disponible</Text>
            <Text style={styles.toggleCardText}>
              {applicationForm.hasIdDocument ? "Marcado" : "Pendiente"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.toggleCard,
              applicationForm.hasLicenseDocument && styles.toggleCardActive,
            ]}
            onPress={() =>
              updateApplicationField(
                "hasLicenseDocument",
                !applicationForm.hasLicenseDocument
              )
            }
          >
            <Text style={styles.toggleCardTitle}>Licencia disponible</Text>
            <Text style={styles.toggleCardText}>
              {applicationForm.hasLicenseDocument ? "Marcado" : "Pendiente"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.toggleCard,
              applicationForm.hasVehicleDocument && styles.toggleCardActive,
            ]}
            onPress={() =>
              updateApplicationField(
                "hasVehicleDocument",
                !applicationForm.hasVehicleDocument
              )
            }
          >
            <Text style={styles.toggleCardTitle}>Documento del vehiculo</Text>
            <Text style={styles.toggleCardText}>
              {applicationForm.hasVehicleDocument ? "Marcado" : "Pendiente"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.toggleCard,
              applicationForm.hasInsuranceDocument && styles.toggleCardActive,
            ]}
            onPress={() =>
              updateApplicationField(
                "hasInsuranceDocument",
                !applicationForm.hasInsuranceDocument
              )
            }
          >
            <Text style={styles.toggleCardTitle}>Seguro o permiso</Text>
            <Text style={styles.toggleCardText}>
              {applicationForm.hasInsuranceDocument ? "Marcado" : "Pendiente"}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {applicationStep === 4 && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Cobertura y disponibilidad</Text>
          <TextInput
            style={[styles.input, styles.multilineInput]}
            placeholder="Comunas o zonas donde opera"
            multiline
            value={applicationForm.zones}
            onChangeText={(text) => updateApplicationField("zones", text)}
          />
          <TextInput
            style={[styles.input, styles.multilineInput]}
            placeholder="Horario general"
            multiline
            value={applicationForm.scheduleText}
            onChangeText={(text) => updateApplicationField("scheduleText", text)}
          />

          <TouchableOpacity
            style={[
              styles.toggleCard,
              applicationForm.acceptsLastMile && styles.toggleCardActive,
            ]}
            onPress={() =>
              updateApplicationField(
                "acceptsLastMile",
                !applicationForm.acceptsLastMile
              )
            }
          >
            <Text style={styles.toggleCardTitle}>Acepta ultima milla</Text>
            <Text style={styles.toggleCardText}>
              {applicationForm.acceptsLastMile ? "Si" : "No"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.toggleCard,
              applicationForm.acceptsStandard && styles.toggleCardActive,
            ]}
            onPress={() =>
              updateApplicationField(
                "acceptsStandard",
                !applicationForm.acceptsStandard
              )
            }
          >
            <Text style={styles.toggleCardTitle}>Acepta flete estandar</Text>
            <Text style={styles.toggleCardText}>
              {applicationForm.acceptsStandard ? "Si" : "No"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.toggleCard,
              applicationForm.acceptsAssisted && styles.toggleCardActive,
            ]}
            onPress={() =>
              updateApplicationField(
                "acceptsAssisted",
                !applicationForm.acceptsAssisted
              )
            }
          >
            <Text style={styles.toggleCardTitle}>Acepta mudanza asistida</Text>
            <Text style={styles.toggleCardText}>
              {applicationForm.acceptsAssisted ? "Si" : "No"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.toggleCard,
              applicationForm.acceptsFragile && styles.toggleCardActive,
            ]}
            onPress={() =>
              updateApplicationField(
                "acceptsFragile",
                !applicationForm.acceptsFragile
              )
            }
          >
            <Text style={styles.toggleCardTitle}>Acepta carga delicada</Text>
            <Text style={styles.toggleCardText}>
              {applicationForm.acceptsFragile ? "Si" : "No"}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {applicationStep === 5 && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Resumen</Text>
          <Text style={styles.cardText}>Nombre: {applicationForm.fullName || "-"}</Text>
          <Text style={styles.cardText}>Telefono: {applicationForm.phone || "-"}</Text>
          <Text style={styles.cardText}>Correo: {applicationForm.email || "-"}</Text>
          <Text style={styles.cardText}>Ciudad: {applicationForm.city || "-"}</Text>
          <Text style={styles.cardText}>
            Vehiculo: {applicationForm.vehicleType || "-"} /{" "}
            {applicationForm.vehicleBrand || "-"} /{" "}
            {applicationForm.vehicleModel || "-"}
          </Text>
          <Text style={styles.cardText}>
            Patente: {applicationForm.vehiclePlate || "-"}
          </Text>
          <Text style={styles.cardText}>
            Cobertura: {applicationForm.zones || "-"}
          </Text>
          <Text style={styles.cardText}>
            Horario: {applicationForm.scheduleText || "-"}
          </Text>
        </View>
      )}

      <View style={styles.bottomButtonsRow}>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => {
            if (applicationStep === 1) {
              setScreenMode("landing");
            } else {
              goToPreviousApplicationStep();
            }
          }}
        >
          <Text style={styles.secondaryButtonText}>
            {applicationStep === 1 ? "Volver" : "Atras"}
          </Text>
        </TouchableOpacity>

        {applicationStep < 5 ? (
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={goToNextApplicationStep}
          >
            <Text style={styles.primaryButtonText}>Continuar</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={submitDriverApplication}
          >
            <Text style={styles.primaryButtonText}>
              {applicationLoading ? "Enviando..." : "Enviar postulacion"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );

  const renderApplicationStatus = () => (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Estado de postulacion</Text>

        <TextInput
          style={styles.input}
          placeholder="Correo usado en la inscripcion"
          autoCapitalize="none"
          keyboardType="email-address"
          value={applicationStatusEmail}
          onChangeText={setApplicationStatusEmail}
        />

        <TouchableOpacity
          style={styles.primaryButtonFull}
          onPress={loadApplicationStatus}
        >
          <Text style={styles.primaryButtonText}>
            {applicationLoading ? "Consultando..." : "Consultar estado"}
          </Text>
        </TouchableOpacity>
      </View>

      {applicationStatusResult && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Resultado</Text>
          <Text style={styles.cardText}>Nombre: {applicationStatusResult.full_name}</Text>
          <Text style={styles.cardText}>Correo: {applicationStatusResult.email}</Text>
          <Text style={styles.cardText}>
            Vehiculo: {applicationStatusResult.vehicle_type} /{" "}
            {applicationStatusResult.vehicle_brand} /{" "}
            {applicationStatusResult.vehicle_model}
          </Text>
          <Text style={styles.cardText}>
            Patente: {applicationStatusResult.vehicle_plate}
          </Text>
          <Text style={styles.cardText}>
            Estado:{" "}
            {getApplicationStatusLabel(applicationStatusResult.application_status)}
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={styles.secondaryButtonFull}
        onPress={() => setScreenMode("landing")}
      >
        <Text style={styles.secondaryButtonText}>Volver</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderDriverOperations = () => (
    <View style={{ flex: 1 }}>
      <View style={[styles.card, isCompact && styles.cardCompact]}>
        <Text style={styles.driverPanelTitle}>Panel operativo del chofer</Text>

        <View style={styles.driverTopActions}>
          <TouchableOpacity
            style={[
              styles.driverTopActionPrimary,
              !isOnline && styles.driverTopActionPrimaryOffline,
            ]}
            onPress={toggleDriverOnline}
            activeOpacity={0.9}
          >
            <Text style={styles.driverTopActionPrimaryText}>
              {isOnline ? "Activo — buscando fletes" : "Desconectado"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.driverTopActionSecondary}
            onPress={() => setScreenMode("landing")}
            activeOpacity={0.9}
          >
            <Text style={styles.driverTopActionSecondaryText}>Salir</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.kpiRow}>
          <View style={styles.kpiItem}>
            <Text style={styles.kpiLabel}>Ganancias hoy</Text>
            <Text style={styles.kpiValue}>${Number(todayEarned).toLocaleString("es-CL")}</Text>
          </View>
          <View style={styles.kpiItem}>
            <Text style={styles.kpiLabel}>Viajes hoy</Text>
            <Text style={styles.kpiValue}>{todayTrips}</Text>
          </View>
          <View style={styles.kpiItem}>
            <Text style={styles.kpiLabel}>Rating</Text>
            <Text style={styles.kpiValue}>{Number(driverRating || 0).toFixed(1)} ⭐</Text>
          </View>
        </View>

        <View style={styles.trackingCard}>
          <Text style={styles.trackingTitle}>Tracking en tiempo real</Text>
          <Text style={styles.trackingMetaText}>
            Estado: {locationSharingEnabled ? "Activo" : "Pausado"}
          </Text>
          <TouchableOpacity
            style={styles.trackingToggleButton}
            onPress={() => setLocationSharingEnabled((prev) => !prev)}
            activeOpacity={0.9}
            disabled={!isOnline}
          >
            <Text style={styles.trackingToggleButtonText}>
              {locationSharingEnabled ? "Pausar tracking" : "Activar tracking"}
            </Text>
          </TouchableOpacity>
          <Text style={styles.trackingMetaText}>
            Ultima sincronizacion: {lastLocationSyncAt ? getTimeSinceLastSync(lastLocationSyncAt) : "Nunca"}
          </Text>
          {locationSharingError ? (
            <Text style={styles.trackingErrorText}>{locationSharingError}</Text>
          ) : null}
          {isOnline && lastPanelSyncAt ? (
            <Text style={styles.trackingMetaText}>{getTimeSinceLastSync(lastPanelSyncAt)}</Text>
          ) : null}
        </View>
      </View>

      {loading && (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Procesando...</Text>
        </View>
      )}

      {!isOnline ? (
        <View style={[styles.card, isCompact && styles.cardCompact]}>
          <Text style={styles.sectionTitle}>Driver desconectado</Text>
          <Text style={styles.cardText}>
            Activa "En linea" para cargar solicitudes y viajes.
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.driverScrollContent,
            isDesktop && styles.driverScrollContentDesktop,
          ]}
          showsVerticalScrollIndicator
        >
          <View
            style={[
              styles.driverGrid,
              isDesktop && styles.driverGridDesktop,
            ]}
          >
            <View style={[styles.driverColumn, isDesktop && styles.driverColumnLeft]}>
              <View style={[styles.card, isCompact && styles.cardCompact]}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.driverSectionTitle}>Solicitudes pendientes</Text>
                  <Chip
                    label={`${pendingRequests.length} en espera`}
                    tone={pendingRequests.length > 0 ? "warning" : "neutral"}
                  />
                </View>

                {pendingRequests.length === 0 ? (
                  <View style={styles.emptyOfferBox}>
                    {driverPanelState === "online_no_requests" ? (
                      <ActivityIndicator size="small" color="#e67e22" />
                    ) : null}
                    <Text style={styles.cardText}>
                      {driverPanelState === "online_no_requests"
                        ? "Online y buscando solicitudes pendientes..."
                        : "No hay solicitudes pendientes."}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.rowsWrap}>
                    {pendingRequests.map((requestItem) => {
                      const serviceLabel = getOfferServiceLabel(requestItem);
                      const inventoryLabel =
                        requestItem.inventory_summary ||
                        getRequestInventoryLabel(requestItem) ||
                        "Sin detalle";
                      const pickup =
                        requestItem.origin_text || requestItem.pickup_address || "-";
                      const dropoff =
                        requestItem.destination_text || requestItem.dropoff_address || "-";
                      const detail = tripDetails[requestItem.id] || {};
                      const isAssisted =
                        String(requestItem.service_type || "").toLowerCase() === "assisted" ||
                        String(requestItem.service_type || "").toLowerCase() ===
                          "mudanza_asistida";
                      const paymentStatusLabel =
                        requestItem.payment_status || detail.paymentStatus || "pending";
                      const estimatedPrice = formatCurrencyClp(
                        detail.totalPriceClp || requestItem.estimated_price_clp
                      );
                      const isAcceptingCurrent = acceptingRequestId === requestItem.id;

                      return (
                        <View key={requestItem.id} style={styles.offerCard}>
                          <View style={styles.rowMain}>
                            <View style={styles.rowTitleWrap}>
                              <Text style={styles.offerPriceValue} numberOfLines={1}>
                                {estimatedPrice}
                              </Text>
                              <Text style={styles.rowTitle} numberOfLines={1}>
                                {serviceLabel}
                              </Text>
                              <View style={styles.rowChips}>
                                <Chip label={`ID ${String(requestItem.id).slice(0, 8)}`} />
                                {isAssisted ? (
                                  <Chip label="♿ Asistida" tone="warning" />
                                ) : null}
                              </View>
                            </View>

                            <Text style={styles.rowMeta} numberOfLines={1}>Origen: {pickup}</Text>
                            <Text style={styles.rowMeta} numberOfLines={1}>Destino: {dropoff}</Text>
                            <Text style={styles.rowMeta} numberOfLines={2}>Inventario: {inventoryLabel}</Text>
                            <Text style={styles.rowMeta} numberOfLines={1}>Pago: {paymentStatusLabel}</Text>
                            <Text style={styles.rowMeta} numberOfLines={1}>
                              Cliente: {detail.customerName || "Cliente"}
                            </Text>

                            {/* User Info */}
                            {detail.customerName && (
                              <View style={styles.tripDetailSection}>
                                <Text style={styles.tripDetailLabel}>Cliente:</Text>
                                <Text style={styles.tripDetailValue}>
                                  {detail.customerName}
                                  {detail.customerPhone && ` (${detail.customerPhone})`}
                                </Text>
                              </View>
                            )}

                            {/* Inventory Items */}
                            {detail.inventoryItems && detail.inventoryItems.length > 0 && (
                              <View style={styles.tripDetailSection}>
                                <Text style={styles.tripDetailLabel}>Inventario:</Text>
                                {detail.inventoryItems.map((item) => (
                                  <Text key={item.id} style={styles.tripDetailValue}>
                                    {item.itemName} x{item.quantity}
                                    {item.category && ` (${item.category})`}
                                    {item.notes && ` - ${item.notes}`}
                                  </Text>
                                ))}
                              </View>
                            )}

                            {/* Special Requirements */}
                            {detail.specialRequirements && detail.specialRequirements.length > 0 && (
                              <View style={styles.tripDetailSection}>
                                <Text style={styles.tripDetailLabel}>Requisitos:</Text>
                                <Text style={styles.tripDetailValue}>
                                  {detail.specialRequirements.join(" | ")}
                                </Text>
                              </View>
                            )}

                          </View>

                          <View style={styles.rowActions}>
                            <TouchableOpacity
                              style={styles.rowPrimaryButton}
                              onPress={() => acceptRequestWithRealDriver(requestItem)}
                              activeOpacity={0.9}
                              disabled={Boolean(acceptingRequestId)}
                            >
                              <Text style={styles.rowPrimaryButtonText}>
                                {isAcceptingCurrent ? "Aceptando..." : "Aceptar viaje"}
                              </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              style={styles.rowDangerButton}
                              onPress={() => declinePendingRequest(requestItem)}
                              activeOpacity={0.9}
                              disabled={Boolean(acceptingRequestId)}
                            >
                              <Text style={styles.rowDangerButtonText}>Rechazar</Text>
                            </TouchableOpacity>

                            {!isDesktop ? (
                              <SwipeAcceptButton
                                onAccept={() => acceptRequestWithRealDriver(requestItem)}
                                disabled={Boolean(acceptingRequestId)}
                              />
                            ) : null}
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            </View>

            <View style={[styles.driverColumn, isDesktop && styles.driverColumnRight]}>
              <View style={[styles.card, isCompact && styles.cardCompact]}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.driverSectionTitle}>Viajes activos</Text>
                  <Chip
                    label={`${activeTrips.length} en curso`}
                    tone={activeTrips.length > 0 ? "primary" : "neutral"}
                  />
                </View>

                {activeTrips.length === 0 ? (
                  <Text style={styles.cardText}>No hay viajes activos.</Text>
                ) : (
                  <View style={styles.rowsWrap}>
                    {activeTrips.map((tripItem) => {
                      const tripIdShort = String(tripItem.id).slice(0, 8);
                      const statusLabel = getDriverTripHeadline(tripItem);
                      const totalLabel = Number(
                        tripItem.total_price_clp || 0
                      ).toLocaleString("es-CL");
                      const paymentLabel = getPaymentLabel(
                        tripItem.payment_status,
                        tripItem.payment_method
                      );

                      const tripTone =
                        String(tripItem.trip_status || "") === "completed"
                          ? "success"
                          : "primary";
                      const paymentTone =
                        String(tripItem.payment_status || "") === "paid"
                          ? "success"
                          : String(tripItem.payment_status || "") === "pending" &&
                              String(tripItem.payment_method || "") === "webpay_plus"
                            ? "warning"
                            : "neutral";

                      const canAdvance = String(tripItem.trip_status || "") !== "completed";
                      const canShareLocationNow = TRACKABLE_TRIP_STATUSES.has(
                        String(tripItem.trip_status || "")
                      );
                      const canEditTotal =
                        String(tripItem.payment_status || "") !== "paid";

                      const detail = tripDetails[tripItem.id] || {};

                      return (
                        <View key={tripItem.id} style={styles.rowCard}>
                          <View style={styles.rowMain}>
                            <View style={styles.rowTitleWrap}>
                              <Text style={styles.rowTitle} numberOfLines={1}>
                                Viaje #{tripIdShort}
                              </Text>
                              <View style={styles.rowChips}>
                                <Chip label={statusLabel} tone={tripTone} />
                                <Chip label={paymentLabel} tone={paymentTone} />
                              </View>
                            </View>

                            <Text style={styles.rowMeta} numberOfLines={1}>
                              Total: ${totalLabel}
                            </Text>
                            <Text style={styles.rowMeta} numberOfLines={1}>
                              Estado: {getStatusLabel(tripItem.trip_status)}
                            </Text>
                            <Text style={styles.rowMeta} numberOfLines={1}>
                              Chofer: {tripItem.display_driver_name || "-"}
                              {tripItem.display_driver_phone
                                ? ` (${tripItem.display_driver_phone})`
                                : ""}
                            </Text>
                            <Text style={styles.rowMeta} numberOfLines={1}>
                              Vehiculo: {tripItem.display_vehicle_name || "-"}
                              {tripItem.display_plate
                                ? ` (${tripItem.display_plate})`
                                : ""}
                            </Text>
                            <Text style={styles.rowMeta} numberOfLines={1}>
                              Pago: {paymentLabel}
                            </Text>
                            {(tripItem.origin_text || tripItem.destination_text) && (
                              <Text style={styles.rowRoute} numberOfLines={1}>
                                {tripItem.origin_text || "Origen"} → {tripItem.destination_text || "Destino"}
                              </Text>
                            )}
                            <Text style={styles.rowHint} numberOfLines={2}>
                              {getDriverNextActionLabel(tripItem)}
                            </Text>

                            {/* User Info */}
                            {detail.customerName && (
                              <View style={styles.tripDetailSection}>
                                <Text style={styles.tripDetailLabel}>Cliente:</Text>
                                <Text style={styles.tripDetailValue}>
                                  {detail.customerName}
                                  {detail.customerPhone && ` (${detail.customerPhone})`}
                                </Text>
                              </View>
                            )}

                            {/* Inventory Items */}
                            {detail.inventoryItems && detail.inventoryItems.length > 0 && (
                              <View style={styles.tripDetailSection}>
                                <Text style={styles.tripDetailLabel}>Inventario:</Text>
                                {detail.inventoryItems.map((item, index) => (
                                  <Text key={item.id} style={styles.tripDetailValue}>
                                    {item.itemName} x{item.quantity}
                                    {item.category && ` (${item.category})`}
                                    {item.notes && ` - ${item.notes}`}
                                  </Text>
                                ))}
                              </View>
                            )}

                            {/* Special Requirements */}
                            {detail.specialRequirements && detail.specialRequirements.length > 0 && (
                              <View style={styles.tripDetailSection}>
                                <Text style={styles.tripDetailLabel}>Requisitos:</Text>
                                <Text style={styles.tripDetailValue}>
                                  {detail.specialRequirements.join(" | ")}
                                </Text>
                              </View>
                            )}

                            {canEditTotal && (
                              <View style={styles.totalEditorBox}>
                                <Text style={styles.tripDetailLabel}>
                                  Total real del viaje (CLP)
                                </Text>
                                <TextInput
                                  style={styles.totalEditorInput}
                                  keyboardType="number-pad"
                                  value={String(tripPriceInputs[tripItem.id] || "")}
                                  onChangeText={(value) =>
                                    updateTripPriceInput(tripItem.id, value)
                                  }
                                  placeholder="Ej: 18990"
                                />
                                <TouchableOpacity
                                  style={styles.rowSecondaryButton}
                                  onPress={() => saveTripTotalPrice(tripItem)}
                                  activeOpacity={0.9}
                                  disabled={loading}
                                >
                                  <Text style={styles.rowSecondaryButtonText}>
                                    Guardar total
                                  </Text>
                                </TouchableOpacity>
                              </View>
                            )}
                          </View>

                          <View style={styles.rowActionsColumn}>
                            <View style={styles.rowActionsRow}>
                              {canAdvance ? (
                                <TouchableOpacity
                                  style={[styles.rowPrimaryButton, styles.rowActionFlex]}
                                  onPress={() =>
                                    moveTripToNextStatus(
                                      tripItem.id,
                                      tripItem.trip_status,
                                      tripItem.request_id
                                    )
                                  }
                                  activeOpacity={0.9}
                                >
                                  <Text style={styles.rowPrimaryButtonText}>
                                    Avanzar estado
                                  </Text>
                                </TouchableOpacity>
                              ) : (
                                <View style={[styles.rowDonePill, styles.rowActionFlex]}>
                                  <Text style={styles.rowDoneText}>OK</Text>
                                </View>
                              )}

                              {canShareLocationNow ? (
                                <TouchableOpacity
                                  style={[styles.rowSecondaryButton, styles.rowActionFlex]}
                                  onPress={() => shareDriverLiveLocationNow(tripItem)}
                                  activeOpacity={0.9}
                                  disabled={
                                    locationSharingBusy ||
                                    !locationSharingEnabled ||
                                    !isOnline
                                  }
                                >
                                  <Text style={styles.rowSecondaryButtonText}>
                                    {locationSharingBusy
                                      ? "Sincronizando..."
                                      : "Compartir ubicacion ahora"}
                                  </Text>
                                </TouchableOpacity>
                              ) : (
                                <View style={styles.rowActionFlex} />
                              )}
                            </View>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            </View>
          </View>
        </ScrollView>
      )}

      {paymentSheetTrip && (
        <View style={styles.paymentOverlay}>
          <Pressable
            style={styles.paymentOverlayBackdrop}
            onPress={() => {
              if (!loading) {
                closePaymentSheet();
              }
            }}
          />
          <Animated.View
            style={[
              styles.paymentCardCenter,
              {
                opacity: paymentCardOpacity,
                transform: [{ translateY: paymentCardTranslateY }],
              },
            ]}
          >
            <Text style={styles.paymentCardTitle}>¡Viaje finalizado!</Text>
            <Text style={styles.paymentCardTotal}>
              Total: ${Number(paymentSheetTrip.total_price_clp || 0).toLocaleString("es-CL")}
            </Text>

            <Text style={styles.paymentCardMethodLabel}>Método de pago (chofer)</Text>
            <View style={styles.paymentMethodChips}>
              <TouchableOpacity
                style={[
                  styles.paymentMethodChip,
                  driverPaymentMethod === "efectivo" && styles.paymentMethodChipActive,
                ]}
                onPress={() => setDriverPaymentMethod("efectivo")}
                activeOpacity={0.9}
              >
                <Text
                  style={[
                    styles.paymentMethodChipText,
                    driverPaymentMethod === "efectivo" && styles.paymentMethodChipTextActive,
                  ]}
                >
                  Efectivo
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.paymentMethodChip,
                  driverPaymentMethod === "transferencia" &&
                    styles.paymentMethodChipActive,
                ]}
                onPress={() => setDriverPaymentMethod("transferencia")}
                activeOpacity={0.9}
              >
                <Text
                  style={[
                    styles.paymentMethodChipText,
                    driverPaymentMethod === "transferencia" &&
                      styles.paymentMethodChipTextActive,
                  ]}
                >
                  Transferencia
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.paymentConfirmButton}
              onPress={() => saveRealPayment(paymentSheetTrip, driverPaymentMethod)}
              activeOpacity={0.9}
              disabled={loading}
            >
              <Text style={styles.paymentConfirmButtonText}>Registrar pago real</Text>
            </TouchableOpacity>

            <Text style={styles.paymentCardHint}>
              El pago se registra en el historial del viaje.
            </Text>

            <TouchableOpacity
              style={styles.paymentCancelButton}
              onPress={closePaymentSheet}
              activeOpacity={0.9}
              disabled={loading}
            >
              <Text style={styles.paymentCancelButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.headerShell,
          isWeb && styles.headerShellWeb,
          isDesktop && styles.headerShellDesktop,
        ]}
      >
        <View style={styles.headerTop}>
          <Text style={styles.title}>CHOFERES</Text>
          <Text style={styles.subtitle}>
            Inscripcion y operacion del chofer en un solo lugar
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.homeButton, isCompact && styles.homeButtonCompact]}
          onPress={goHome}
          activeOpacity={0.9}
        >
          <Text style={styles.homeButtonText}>Volver al inicio</Text>
        </TouchableOpacity>
      </View>

      {screenMode === "landing" && renderLanding()}
      {screenMode === "apply" && renderApplicationStep()}
      {screenMode === "status" && renderApplicationStatus()}
      {screenMode === "driver" && renderDriverOperations()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#eef3f7",
    paddingTop: 56,
    paddingHorizontal: isSmallScreen ? 14 : 20,
  },
  headerShell: {
    marginBottom: 6,
  },
  headerShellWeb: {
    position: "sticky",
    top: 0,
    zIndex: 10,
    backgroundColor: "#eef3f7",
    paddingTop: 18,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#dbe5ef",
  },
  headerShellDesktop: {
    alignSelf: "center",
    width: "100%",
    maxWidth: 1200,
  },
  headerTop: {
    marginBottom: 12,
  },
  title: {
    fontSize: isSmallScreen ? 28 : 32,
    fontWeight: "900",
    color: "#10243e",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: isSmallScreen ? 15 : 16,
    color: "#4f637d",
    marginBottom: 10,
  },
  homeButton: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#d0d9e3",
    marginBottom: 14,
    maxWidth: 1200,
    width: "100%",
    alignSelf: "center",
  },
  homeButtonCompact: {
    paddingVertical: 12,
    marginBottom: 10,
  },
  homeButtonText: {
    color: "#17314f",
    fontWeight: "800",
    fontSize: isSmallScreen ? 15 : 16,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  driverScrollContent: {
    paddingBottom: 46,
    alignItems: "center",
  },
  driverScrollContentDesktop: {
    paddingTop: 6,
  },
  driverGrid: {
    width: "100%",
    maxWidth: 1200,
  },
  driverGridDesktop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 16,
  },
  driverColumn: {
    width: "100%",
  },
  driverColumnLeft: {
    flex: 3,
  },
  driverColumnRight: {
    flex: 2,
  },
  driverPanelTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#10243e",
    marginBottom: 12,
  },
  driverSectionTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#10243e",
  },
  driverTopActions: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  driverTopActionPrimary: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: "#133b5c",
  },
  driverTopActionPrimaryOffline: {
    backgroundColor: "#8a97a8",
  },
  driverTopActionPrimaryText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#ffffff",
  },
  driverTopActionSecondary: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#d0d9e3",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  driverTopActionSecondaryText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#17314f",
  },
  kpiRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  kpiItem: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#dbe5ef",
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  kpiLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#5f6c79",
  },
  kpiValue: {
    marginTop: 4,
    fontSize: 17,
    fontWeight: "900",
    color: "#10243e",
  },
  trackingCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#dbe5ef",
  },
  trackingTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#10243e",
    marginBottom: 8,
  },
  trackingToggleButton: {
    backgroundColor: "#0f2740",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  trackingToggleButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "800",
  },
  trackingMetaText: {
    fontSize: 14,
    color: "#44566c",
    marginTop: 8,
  },
  trackingErrorText: {
    fontSize: 13,
    color: "#b42318",
    marginTop: 6,
    fontWeight: "700",
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  rowsWrap: {
    gap: 10,
  },
  emptyOfferBox: {
    gap: 8,
    alignItems: "center",
    paddingVertical: 10,
  },
  offerCard: {
    backgroundColor: "#f8fbff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e4edf5",
    flexDirection: "column",
    gap: 12,
  },
  offerPriceValue: {
    fontSize: 30,
    fontWeight: "900",
    color: "#10243e",
  },
  rowCard: {
    backgroundColor: "#f8fbff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e4edf5",
    flexDirection: "column",
    gap: 12,
  },
  rowMain: {
    flex: 1,
    gap: 6,
  },
  rowTitleWrap: {
    gap: 8,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#10243e",
  },
  rowMeta: {
    fontSize: 14,
    fontWeight: "700",
    color: "#44566c",
  },
  rowRoute: {
    fontSize: 12,
    fontWeight: "600",
    color: "#5f6c79",
  },
  rowHint: {
    fontSize: 13,
    lineHeight: 18,
    color: "#4f637d",
    fontWeight: "600",
  },
  tripDetailSection: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  tripDetailLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#44566c",
    marginBottom: 4,
  },
  tripDetailValue: {
    fontSize: 13,
    lineHeight: 18,
    color: "#4f637d",
    marginBottom: 2,
  },
  rowChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  rowActions: {
    width: "100%",
    alignItems: "stretch",
    justifyContent: "flex-start",
  },
  rowActionsColumn: {
    width: "100%",
  },
  rowActionsRow: {
    flexDirection: "row",
    gap: 8,
  },
  rowActionFlex: {
    flex: 1,
  },
  rowPrimaryButton: {
    backgroundColor: "#0f2740",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
  },
  rowPrimaryButtonText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 14,
    textAlign: "center",
  },
  rowDangerButton: {
    marginTop: 8,
    backgroundColor: "#fff1f0",
    borderWidth: 1,
    borderColor: "#f0b8b2",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  rowDangerButtonText: {
    color: "#8a1f12",
    fontWeight: "800",
    fontSize: 13,
  },
  swipeTrack: {
    marginTop: 8,
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#d0d9e3",
    backgroundColor: "#f7f9fb",
    overflow: "hidden",
    justifyContent: "center",
  },
  swipeTrackDisabled: {
    opacity: 0.6,
  },
  swipeFill: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "#d4a373",
  },
  swipeLabel: {
    textAlign: "center",
    fontSize: 13,
    fontWeight: "800",
    color: "#17314f",
  },
  rowSecondaryButton: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#d0d9e3",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
  },
  rowSecondaryButtonText: {
    color: "#17314f",
    fontWeight: "700",
    fontSize: 13,
    textAlign: "center",
  },
  rowDonePill: {
    borderRadius: 999,
    backgroundColor: "#e8f7ef",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#a7e0c0",
    minWidth: 92,
    alignItems: "center",
  },
  rowDoneText: {
    fontWeight: "900",
    color: "#0f2740",
    fontSize: 14,
  },
  paymentOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  paymentOverlayBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  paymentCardCenter: {
    width: "100%",
    maxWidth: 520,
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 24,
  },
  paymentCardTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: "#22313f",
  },
  paymentCardTotal: {
    fontSize: 28,
    fontWeight: "900",
    color: "#e67e22",
    marginTop: 12,
  },
  paymentCardMethodLabel: {
    fontSize: 16,
    fontWeight: "800",
    color: "#22313f",
    marginTop: 24,
  },
  paymentMethodChips: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  paymentMethodChip: {
    borderWidth: 1,
    borderColor: "#d8e0e8",
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#ffffff",
  },
  paymentMethodChipActive: {
    borderColor: "#e67e22",
    backgroundColor: "#fff7ef",
  },
  paymentMethodChipText: {
    color: "#22313f",
    fontWeight: "700",
    fontSize: 14,
  },
  paymentMethodChipTextActive: {
    color: "#e67e22",
  },
  paymentConfirmButton: {
    backgroundColor: "#e67e22",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 24,
  },
  paymentConfirmButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "800",
  },
  paymentCardHint: {
    fontSize: 13,
    color: "#667085",
    textAlign: "center",
    marginTop: 12,
  },
  paymentCancelButton: {
    marginTop: 12,
    borderWidth: 2,
    borderColor: "#d7dde5",
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  paymentCancelButtonText: {
    color: "#22313f",
    fontSize: 14,
    fontWeight: "700",
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#d0d9e3",
    backgroundColor: "#f8fbff",
    maxWidth: 220,
  },
  chipText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#17314f",
  },
  chipPrimary: {
    backgroundColor: "#e8f2fb",
    borderColor: "#b9d4ef",
  },
  chipTextPrimary: {
    color: "#0f2740",
  },
  chipSuccess: {
    backgroundColor: "#e8f7ef",
    borderColor: "#a7e0c0",
  },
  chipTextSuccess: {
    color: "#0f3a24",
  },
  chipWarning: {
    backgroundColor: "#fff7ef",
    borderColor: "#f0d2b2",
  },
  chipTextWarning: {
    color: "#7a3e00",
  },
  chipDanger: {
    backgroundColor: "#fff1f0",
    borderColor: "#f0b8b2",
  },
  chipTextDanger: {
    color: "#8a1f12",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: isSmallScreen ? 16 : 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#dbe5ef",
    maxWidth: 1200,
    width: "100%",
    alignSelf: "center",
  },
  cardCompact: {
    padding: 16,
    borderRadius: 18,
    marginBottom: 12,
  },
  panelHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  panelHeaderTextWrap: {
    flex: 1,
  },
  panelHeaderActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
  },
  statusPillOnline: {
    backgroundColor: "#e8f7ef",
    borderColor: "#a7e0c0",
  },
  statusPillOffline: {
    backgroundColor: "#f4f8ed",
    borderColor: "#d6e2bf",
  },
  statusPillText: {
    fontWeight: "900",
    color: "#0f2740",
    fontSize: 14,
  },
  syncStatusChip: {
    backgroundColor: "#e8f7ef",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#a7e0c0",
  },
  syncStatusText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#0f3a24",
  },
  sectionTitle: {
    fontSize: isSmallScreen ? 20 : 22,
    fontWeight: "900",
    color: "#10243e",
    marginBottom: 12,
  },
  cardText: {
    fontSize: isSmallScreen ? 14 : 15,
    color: "#44566c",
    marginBottom: 8,
    lineHeight: 20,
  },
  bigActionCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#dbe5ef",
    maxWidth: 1200,
    width: "100%",
    alignSelf: "center",
  },
  bigActionTitle: {
    fontSize: isSmallScreen ? 18 : 20,
    fontWeight: "900",
    color: "#10243e",
    marginBottom: 8,
  },
  bigActionText: {
    fontSize: isSmallScreen ? 14 : 15,
    color: "#44566c",
    lineHeight: 20,
  },
  input: {
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e8eef3",
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    color: "#17314f",
    marginBottom: 12,
  },
  multilineInput: {
    minHeight: 96,
    textAlignVertical: "top",
  },
  toggleCard: {
    backgroundColor: "transparent",
    borderRadius: 8,
    padding: 14,
    marginBottom: 12,
    borderWidth: 0,
    borderBottomWidth: 1,
    borderBottomColor: "#e8eef3",
  },
  toggleCardActive: {
    backgroundColor: "#e8f2fb",
  },
  toggleCardTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#17314f",
    marginBottom: 6,
  },
  toggleCardText: {
    fontSize: 14,
    color: "#44566c",
  },
  bottomButtonsRow: {
    flexDirection: "row",
    marginBottom: 30,
  },
  topRow: {
    flexDirection: "row",
    marginTop: 12,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: "#0f2740",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 6,
  },
  primaryButtonFull: {
    backgroundColor: "#0f2740",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: isSmallScreen ? 15 : 16,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#d0d9e3",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 6,
  },
  secondaryButtonCompact: {
    minWidth: 100,
  },
  secondaryButtonText: {
    color: "#17314f",
    fontWeight: "700",
    fontSize: isSmallScreen ? 14 : 15,
  },
  secondaryButtonFull: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#e8eef3",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  loadingBox: {
    backgroundColor: "transparent",
    borderRadius: 8,
    padding: 18,
    marginBottom: 18,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    color: "#44566c",
    fontSize: 15,
  },
  statusButton: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 6,
  },
  online: {
    backgroundColor: "#133b5c",
  },
  offline: {
    backgroundColor: "#8a97a8",
  },
  statusButtonText: {
    color: "#ffffff",
    fontWeight: "800",
    fontSize: isSmallScreen ? 15 : 16,
  },
  requestBox: {
    backgroundColor: "#f8fbff",
    borderRadius: 16,
    padding: isSmallScreen ? 14 : 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#d7e3ef",
  },
  requestTitle: {
    fontSize: isSmallScreen ? 17 : 18,
    fontWeight: "800",
    color: "#17314f",
    marginBottom: 8,
  },
  operationHintBox: {
    backgroundColor: "#fff7ef",
    borderRadius: 14,
    padding: 12,
    marginTop: 10,
    marginBottom: 2,
    borderWidth: 1,
    borderColor: "#f0d2b2",
  },
  operationHintLabel: {
    fontSize: isSmallScreen ? 12 : 13,
    fontWeight: "800",
    color: "#6b7280",
    marginBottom: 6,
  },
  operationHintText: {
    fontSize: isSmallScreen ? 14 : 15,
    lineHeight: 20,
    color: "#17314f",
    fontWeight: "700",
  },
  paymentDoneBox: {
    backgroundColor: "#e8f5ec",
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#b8dec3",
  },
  paymentDoneText: {
    color: "#245c35",
    fontWeight: "800",
    fontSize: isSmallScreen ? 14 : 15,
  },
  errorText: {
    color: "#b02a37",
    fontWeight: "700",
    fontSize: isSmallScreen ? 13 : 14,
    marginTop: 8,
  },
  totalEditorBox: {
    marginTop: 10,
  },
  totalEditorInput: {
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e8eef3",
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#17314f",
    marginBottom: 10,
  },
});
