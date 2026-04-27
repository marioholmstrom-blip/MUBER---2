import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  PanResponder,
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
import MapView, { Marker, Polyline } from "react-native-maps";
import {
  cancelUserRequest,
  createUserRequest,
  getRequestTracking,
} from "./api/userRequestApi";
import { registerUserPayment } from "./api/paymentApi";
import { supabase } from "./lib/supabase";
import {
  subscribeToDriverLocation,
  unsubscribeFromDriverLocation,
} from "./api/driverLocationApi";
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

function getTripPhaseIndex(tripStatus) {
  const status = String(tripStatus || "").toLowerCase();

  if (status === "completed") return 4;
  if (status === "heading_to_dropoff" || status === "in_transit" || status === "arrived_dropoff") return 3;
  if (status === "cargo_picked_up" || status === "picked_up") return 2;
  if (status === "heading_to_pickup" || status === "arrived_pickup") return 1;
  if (status === "driver_assigned" || status === "accepted") return 0;
  return 0;
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

function getTimeSinceLocationUpdate(lastLocationUpdate, nowMs = Date.now()) {
  if (!lastLocationUpdate) return "Sin actualización";
  const diffMs = nowMs - lastLocationUpdate.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return `Ubicación hace ${diffSec}s`;
  const diffMin = Math.floor(diffSec / 60);
  return `Ubicación hace ${diffMin} min`;
}

function formatTripDurationLabel(startIso, endIso) {
  if (!startIso || !endIso) {
    return "Sin datos";
  }

  const startMs = new Date(startIso).getTime();
  const endMs = new Date(endIso).getTime();

  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) {
    return "Sin datos";
  }

  const diffMinutes = Math.max(1, Math.round((endMs - startMs) / 60000));
  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes} min`;
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

function getServiceSummaryLabel(serviceType) {
  switch (String(serviceType || "").toLowerCase()) {
    case "standard":
    case "flete":
      return "🚚 Logística estándar";
    case "assisted":
    case "mudanza_asistida":
      return "♿ Mudanza asistida";
    case "ultima_milla":
      return "📦 Última milla";
    default:
      return "Sin servicio";
  }
}

function buildInventorySummaryFromItems(items) {
  const validItems = (items || []).filter((item) => item?.name?.trim());

  if (validItems.length === 0) {
    return "Sin inventario";
  }

  return validItems
    .map((item) => `${item.quantity || 1} ${item.name.trim()}`)
    .join(", ");
}

function normalizeInventoryMethodForUi(methodValue) {
  const method = String(methodValue || "").toLowerCase();
  if (method === "voz" || method === "voice") return "voz";
  if (method === "foto" || method === "photo") return "foto";
  return "texto";
}

function mapInventoryMethodToRequest(methodValue) {
  const method = String(methodValue || "").toLowerCase();
  if (method === "voz") return "voice";
  if (method === "foto") return "photo";
  return "manual";
}

function clampEstimatedPrice(value) {
  const min = 5000;
  const max = 150000;
  const step = 1000;
  const numeric = Number(value);
  const safe = Number.isFinite(numeric) ? numeric : min;
  const clamped = Math.max(min, Math.min(max, safe));
  return Math.round(clamped / step) * step;
}

export default function UserScreen({ goHome, initialService = "" }) {
  const [step, setStep] = useState(initialService ? "route" : "service");
  const [service, setService] = useState(initialService);
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [assistanceType, setAssistanceType] = useState("");
  const [inventoryMethod, setInventoryMethod] = useState("texto");
  const [inventoryItems, setInventoryItems] = useState([]);
  const [inventorySpecialNeeds, setInventorySpecialNeeds] = useState([]);
  const [inventorySummary, setInventorySummary] = useState("Sin inventario");
  const [isInventoryExpanded, setIsInventoryExpanded] = useState(false);
  const [editingSummaryField, setEditingSummaryField] = useState(null);
  const [estimatedPriceClp, setEstimatedPriceClp] = useState(5000);
  const [requestPaymentMethod, setRequestPaymentMethod] = useState("");
  const [isAdjustingPrice, setIsAdjustingPrice] = useState(false);
  const [sliderTrackWidth, setSliderTrackWidth] = useState(0);
  const [requestCreatedAt, setRequestCreatedAt] = useState(null);
  const [requestScreenBusy, setRequestScreenBusy] = useState(false);

  const getServicePrice = (serviceType) => {
    switch (serviceType) {
      case "flete":
        return 8990;
      case "mudanza_asistida":
        return 12990;
      case "ultima_milla":
        return 5990;
      default:
        return 0;
    }
  };

  const estimatedPrice = getServicePrice(service);
  const [loading, setLoading] = useState(false);

  const [requestId, setRequestId] = useState(null);
  const [tripId, setTripId] = useState(null);
  const [requestStatus, setRequestStatus] = useState("new");
  const [tripStatus, setTripStatus] = useState(null);
  const [tripDriverId, setTripDriverId] = useState(null);
  const [tripStatusHistory, setTripStatusHistory] = useState([]);
  const [driverInfo, setDriverInfo] = useState(null);
  const [liveLocation, setLiveLocation] = useState(null);
  const [tripTotalPrice, setTripTotalPrice] = useState(0);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [latestPaymentId, setLatestPaymentId] = useState(null);
  const [userPaymentMethod, setUserPaymentMethod] = useState("efectivo");
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentSuccessVisible, setPaymentSuccessVisible] = useState(false);
  const [lastPollTime, setLastPollTime] = useState(null);
  const [locationSubscription, setLocationSubscription] = useState(null);
  const [lastLocationUpdate, setLastLocationUpdate] = useState(null);
  const [locationClockTick, setLocationClockTick] = useState(Date.now());

  useEffect(() => {
    if (initialService) {
      setService(initialService);
      setStep("route");
    }
  }, [initialService]);

  useEffect(() => {
    const fallback = estimatedPrice > 0 ? estimatedPrice : 5000;
    setEstimatedPriceClp(clampEstimatedPrice(fallback));
  }, [estimatedPrice]);

  const stepConfig = {
    service: { number: 1, total: 6, label: "Servicio" },
    route: { number: 2, total: 6, label: "Ruta" },
    inventory: { number: 3, total: 6, label: "Inventario" },
    summary: { number: 4, total: 6, label: "Resumen" },
    pricing: { number: 5, total: 6, label: "Precio" },
    request: { number: 6, total: 6, label: "Solicitar" },
    tracking: { number: 6, total: 6, label: "Tracking" },
    payment: { number: 6, total: 6, label: "Pago" },
  };

  const hasRequiredSummaryFields =
    origin.trim().length > 0 && destination.trim().length > 0;

  const summaryScreenState =
    editingSummaryField === "origin"
      ? "editing_origin"
      : editingSummaryField === "destination"
        ? "editing_destination"
        : !hasRequiredSummaryFields
          ? "incomplete"
          : isInventoryExpanded
            ? "reviewing"
            : "ready";

  const updatePriceFromRatio = (ratioValue) => {
    const safeRatio = Math.max(0, Math.min(1, Number(ratioValue) || 0));
    const nextValue = 5000 + safeRatio * (150000 - 5000);
    setEstimatedPriceClp(clampEstimatedPrice(nextValue));
  };

  const handleSliderTouch = (locationX) => {
    if (!sliderTrackWidth) {
      return;
    }
    updatePriceFromRatio(locationX / sliderTrackWidth);
  };

  const sliderPanResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (event) => {
      setIsAdjustingPrice(true);
      handleSliderTouch(event.nativeEvent.locationX);
    },
    onPanResponderMove: (event) => {
      handleSliderTouch(event.nativeEvent.locationX);
    },
    onPanResponderRelease: () => {
      setIsAdjustingPrice(false);
    },
    onPanResponderTerminate: () => {
      setIsAdjustingPrice(false);
    },
  });

  const sliderProgress =
    (clampEstimatedPrice(estimatedPriceClp) - 5000) / (150000 - 5000);

  const pricingScreenState = loading
    ? "submitting"
    : requestPaymentMethod
      ? "payment_selected"
      : isAdjustingPrice
        ? "adjusting"
        : "default";

  const driverShareClp = Math.round(clampEstimatedPrice(estimatedPriceClp) * 0.7);
  const muberShareClp = Math.round(clampEstimatedPrice(estimatedPriceClp) * 0.3);
  const requestStatusNormalized = String(requestStatus || "pending").toLowerCase();
  const hasAssignedTrip =
    Boolean(tripId) &&
    tripStatus &&
    String(tripStatus).toLowerCase() !== "searching";
  const requestWaitingMs = requestCreatedAt
    ? Math.max(0, locationClockTick - requestCreatedAt.getTime())
    : 0;
  const requestScreenState =
    requestStatusNormalized === "cancelled"
      ? "cancelled"
      : hasAssignedTrip || requestStatusNormalized === "accepted"
        ? "assigned"
        : requestWaitingMs >= 15 * 60 * 1000
          ? "no_drivers"
          : "pending";
  const requestPaymentMethodLabel =
    requestPaymentMethod === "webpay"
      ? "WebPay"
      : requestPaymentMethod === "transferencia"
        ? "Transferencia"
        : "Efectivo";
  const requestIdShort = requestId ? `${String(requestId).slice(0, 8)}...` : "-";
  const phaseSteps = ["Asignado", "En camino", "Recogido", "En transito", "Completado"];
  const currentPhaseIndex = getTripPhaseIndex(tripStatus);
  const showDriverCard = Boolean(driverInfo?.driverName || tripDriverId);
  const canCallDriver = Boolean(tripDriverId);
  const routeOrigin = { latitude: -33.0472, longitude: -71.6127 };
  const routeDestination = { latitude: -33.0245, longitude: -71.5518 };
  const mapRegion = {
    latitude: liveLocation?.latitude
      ? Number((Number(liveLocation.latitude) + routeDestination.latitude) / 2)
      : -33.036,
    longitude: liveLocation?.longitude
      ? Number((Number(liveLocation.longitude) + routeDestination.longitude) / 2)
      : -71.582,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };
  const timelineItems = Array.isArray(tripStatusHistory)
    ? [...tripStatusHistory].sort((a, b) => {
        const timeA = new Date(a?.createdAt || 0).getTime();
        const timeB = new Date(b?.createdAt || 0).getTime();
        return timeA - timeB;
      })
    : [];

  const applyTrackingSnapshot = (tracking) => {
    if (!tracking) {
      return;
    }

    if (tracking?.requestStatus) {
      setRequestStatus(tracking.requestStatus);
    }

    setTripId(tracking?.tripId || null);
    setTripDriverId(tracking?.driverId || null);
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
    setTripStatusHistory(
      Array.isArray(tracking?.statusHistory) ? tracking.statusHistory : []
    );
    setLastPollTime(new Date());
  };

  useEffect(() => {
    if (step !== "tracking" || !requestId) {
      return;
    }

    let intervalId;
    let subscription = null;

    const checkRequestStatus = async () => {
      try {
        const tracking = await getRequestTracking(requestId);
        applyTrackingSnapshot(tracking);
      } catch (error) {
        console.warn(
          "No se pudo actualizar tracking TEST:",
          error?.message || error
        );
      }
    };

    const subscribeToLocation = async () => {
      try {
        const tracking = await getRequestTracking(requestId);
        const nextTripId = tracking?.tripId;

        if (nextTripId) {
          subscription = subscribeToDriverLocation({
            tripId: nextTripId,
            onUpdate: (locationData) => {
              if (locationData?.is_active) {
                setLiveLocation({
                  latitude: Number(locationData.latitude),
                  longitude: Number(locationData.longitude),
                  heading: locationData.heading,
                  speedKph: locationData.speed,
                  accuracyMeters: locationData.accuracy,
                  recordedAt: locationData.updated_at,
                });
                setLastLocationUpdate(new Date());
              }
            },
          });
          setLocationSubscription(subscription);
        }
      } catch (error) {
        console.warn(
          "No se pudo suscribir a ubicacion en tiempo real:",
          error?.message || error
        );
      }
    };

    checkRequestStatus();
    intervalId = setInterval(checkRequestStatus, 3000);
    subscribeToLocation();

    return () => {
      clearInterval(intervalId);
      if (subscription) {
        unsubscribeFromDriverLocation(subscription);
      }
    };
  }, [step, requestId]);

  useEffect(() => {
    if (step !== "tracking" || !tripId) {
      return;
    }

    const upsertHistoryItem = (item) => {
      const normalizedItem = {
        status: item?.status || null,
        createdAt: item?.createdAt || item?.created_at || null,
        reason: item?.reason || null,
      };

      setTripStatusHistory((prev) => {
        const base = Array.isArray(prev) ? prev : [];
        const key = `${normalizedItem.status || "unknown"}:${normalizedItem.createdAt || ""}`;
        const exists = base.some(
          (entry) => `${entry?.status || "unknown"}:${entry?.createdAt || ""}` === key
        );

        if (exists) {
          return base;
        }

        return [...base, normalizedItem];
      });
    };

    const channel = supabase
      .channel(`trip_${tripId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "trips",
          filter: `id=eq.${tripId}`,
        },
        (payload) => {
          const row = payload?.new || {};
          if (row.trip_status) {
            setTripStatus(row.trip_status);
          }
          if (row.driver_id) {
            setTripDriverId(row.driver_id);
          }
          if (row.total_price_clp !== undefined) {
            setTripTotalPrice(Number(row.total_price_clp || 0));
          }
          if (row.payment_status) {
            setPaymentStatus(String(row.payment_status));
          }
          if (row.payment_method) {
            setPaymentMethod(String(row.payment_method));
          }
          setLastPollTime(new Date());
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "trip_status_history",
          filter: `trip_id=eq.${tripId}`,
        },
        (payload) => {
          const row = payload?.new || {};
          upsertHistoryItem(row);
          if (row.status) {
            setTripStatus(row.status);
          }
          setLastPollTime(new Date());
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "trip_status_history",
          filter: `trip_id=eq.${tripId}`,
        },
        (payload) => {
          const row = payload?.new || {};
          upsertHistoryItem(row);
          if (row.status) {
            setTripStatus(row.status);
          }
          setLastPollTime(new Date());
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [step, tripId]);

  useEffect(() => {
    if (step !== "request" || !requestId) {
      return;
    }

    let isMounted = true;

    const syncRequestStatus = async () => {
      try {
        const tracking = await getRequestTracking(requestId);
        if (!isMounted) {
          return;
        }

        applyTrackingSnapshot(tracking);

        const nextRequestStatus = String(tracking?.requestStatus || "").toLowerCase();
        const nextTripStatus = String(tracking?.tripStatus || "").toLowerCase();

        if (
          (tracking?.tripId && nextTripStatus && nextTripStatus !== "searching") ||
          nextRequestStatus === "accepted"
        ) {
          setStep("tracking");
        }
      } catch (error) {
        console.warn(
          "No se pudo actualizar estado de solicitud en espera:",
          error?.message || error
        );
      }
    };

    syncRequestStatus();
    const intervalId = setInterval(syncRequestStatus, 3000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [step, requestId]);

  useEffect(() => {
    const timer = setInterval(() => {
      setLocationClockTick(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (step === "tracking" && String(tripStatus || "").toLowerCase() === "completed") {
      setStep("payment");
    }
  }, [step, tripStatus]);

  const handleCreateRequest = async () => {
    try {
      setLoading(true);

      const data = await createUserRequest({
        serviceType: service,
        originText: origin,
        destinationText: destination,
        inventoryMethod: mapInventoryMethodToRequest(inventoryMethod),
        inventoryItems,
        inventorySpecialNeeds,
        inventorySummary,
        estimatedPriceClp: clampEstimatedPrice(estimatedPriceClp),
        paymentMethod: requestPaymentMethod,
      });

      setRequestId(data.requestId);
      setTripId(null);
      setRequestStatus(data.status || "new");
      setTripStatus(null);
      setTripDriverId(null);
      setTripStatusHistory([]);
      setTripTotalPrice(0);
      setPaymentStatus(null);
      setPaymentMethod(null);
      setLatestPaymentId(null);
      setUserPaymentMethod(requestPaymentMethod || "efectivo");
      setDriverInfo(null);
      setLiveLocation(null);
      setRequestCreatedAt(new Date());
      setStep("request");
    } catch (err) {
      Alert.alert(
        "Error",
        err.message || "No se pudo crear la solicitud"
      );
    } finally {
      setLoading(false);
    }
  };

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

    const totalToPay = Number(tripTotalPrice || estimatedPriceClp || estimatedPrice || 0);
    if (!totalToPay || totalToPay <= 0) {
      Alert.alert("Monto no valido", "Este viaje no tiene monto total cargado.");
      return;
    }

    if (paymentStatus === "paid") {
      Alert.alert("Pago ya confirmado", "Este viaje ya tiene pago confirmado.");
      return;
    }

    try {
      setPaymentLoading(true);

      await registerUserPayment({
        tripId,
        paymentMethod: userPaymentMethod,
      });

      setPaymentStatus("paid");
      const tracking = await getRequestTracking(requestId);
      applyTrackingSnapshot(tracking);
      setStep("payment");
    } catch (error) {
      Alert.alert(
        "Error de pago",
        error?.message || "No se pudo registrar el pago."
      );
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleCancelPendingRequest = () => {
    if (!requestId || requestScreenState !== "pending") {
      return;
    }

    Alert.alert(
      "Cancelar solicitud",
      "¿Seguro que deseas cancelar esta solicitud pendiente?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Sí, cancelar",
          style: "destructive",
          onPress: async () => {
            try {
              setRequestScreenBusy(true);
              const result = await cancelUserRequest(requestId);
              setRequestStatus(result?.status || "cancelled");
              setRequestId(null);
              setTripId(null);
              setTripStatus(null);
              setRequestCreatedAt(null);
              setStep("service");
            } catch (error) {
              Alert.alert(
                "No se pudo cancelar",
                error?.message || "No fue posible cancelar la solicitud."
              );
            } finally {
              setRequestScreenBusy(false);
            }
          },
        },
      ]
    );
  };

  const handleContactSupport = async () => {
    const supportUrl = "tel:+56900000000";

    try {
      const canOpen = await Linking.canOpenURL(supportUrl);
      if (!canOpen) {
        throw new Error("No hay app de llamadas disponible en este dispositivo.");
      }
      await Linking.openURL(supportUrl);
    } catch (error) {
      Alert.alert(
        "Soporte",
        error?.message || "No se pudo abrir el canal de soporte."
      );
    }
  };

  const handleCallDriver = async () => {
    if (!canCallDriver) {
      return;
    }

    const phone = String(driverInfo?.phone || "").trim();

    if (!phone) {
      Alert.alert(
        "Contacto conductor",
        "El número del conductor aún no está disponible."
      );
      return;
    }

    const driverCallUrl = `tel:${phone}`;

    try {
      const canOpen = await Linking.canOpenURL(driverCallUrl);
      if (!canOpen) {
        throw new Error("No hay app de llamadas disponible en este dispositivo.");
      }
      await Linking.openURL(driverCallUrl);
    } catch (error) {
      Alert.alert(
        "Contacto conductor",
        error?.message || "No se pudo abrir la llamada al conductor."
      );
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
      ? Number(tripTotalPrice || estimatedPriceClp || estimatedPrice || 0)
      : Number(estimatedPriceClp || estimatedPrice || 0);
  const paymentAmountFormatted = Number(paymentAmountValue || 0).toLocaleString(
    "es-CL"
  );
  const paymentScreenState = paymentLoading
    ? "processing"
    : isPaymentPaid
      ? "paid"
      : "pending_payment";
  const paymentMethodDisplay =
    String(paymentMethod || userPaymentMethod || requestPaymentMethod || "efectivo").toLowerCase() ===
    "transferencia"
      ? "Transferencia"
      : "Efectivo";
  const driverNetClp = Math.round(Number(paymentAmountValue || 0) * 0.7);
  const muberIncomeClp = Math.round(Number(paymentAmountValue || 0) * 0.3);
  const assignedEvent = timelineItems.find((item) => {
    const status = String(item?.status || "").toLowerCase();
    return status === "driver_assigned" || status === "accepted";
  });
  const completedEvent = [...timelineItems]
    .reverse()
    .find((item) => String(item?.status || "").toLowerCase() === "completed");
  const tripDurationLabel = formatTripDurationLabel(
    assignedEvent?.createdAt,
    completedEvent?.createdAt
  );

  const resetToServiceSelection = () => {
    setStep("service");
    setService("");
    setOrigin("");
    setDestination("");
    setAssistanceType("");
    setInventoryMethod("texto");
    setInventoryItems([]);
    setInventorySpecialNeeds([]);
    setInventorySummary("Sin inventario");
    setIsInventoryExpanded(false);
    setEditingSummaryField(null);
    setRequestPaymentMethod("");
    setRequestId(null);
    setRequestStatus("new");
    setRequestCreatedAt(null);
    setTripId(null);
    setTripDriverId(null);
    setTripStatus(null);
    setTripStatusHistory([]);
    setDriverInfo(null);
    setLiveLocation(null);
    setTripTotalPrice(0);
    setPaymentStatus(null);
    setPaymentMethod(null);
    setLatestPaymentId(null);
    setUserPaymentMethod("efectivo");
    setPaymentLoading(false);
    setPaymentSuccessVisible(false);
  };

  const handleStartNewTrip = () => {
    resetToServiceSelection();
    goHome();
  };

  useEffect(() => {
    if (step !== "payment" || paymentStatus !== "paid") {
      setPaymentSuccessVisible(false);
      return;
    }

    setPaymentSuccessVisible(true);
    const timer = setTimeout(() => {
      handleStartNewTrip();
    }, 3000);

    return () => clearTimeout(timer);
  }, [step, paymentStatus]);

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
          {step === "payment" ? (
            <View style={styles.backButtonGhost} />
          ) : (
            <TouchableOpacity
              style={styles.backButton}
              onPress={goHome}
              activeOpacity={0.9}
            >
              <Text style={styles.backButtonText}>{"<"}</Text>
            </TouchableOpacity>
          )}

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

        {step === "tracking" && (lastPollTime || lastLocationUpdate) && (
          <View style={styles.pollingStatusContainer}>
            <Text style={styles.pollingStatusLabel}>
              {getTimeSinceLastPoll(lastPollTime)}
              {lastLocationUpdate && ` • ${getTimeSinceLocationUpdate(lastLocationUpdate, locationClockTick)}`}
            </Text>
          </View>
        )}

        {step === "tracking" ? (
          <View style={styles.trackingOverlay}>
            <View style={styles.trackingMapWrapper}>
              <MapView style={styles.trackingMapFull} region={mapRegion}>
                <Polyline
                  coordinates={[routeOrigin, routeDestination]}
                  strokeColor="#e67e22"
                  strokeWidth={4}
                />
                <Marker coordinate={routeOrigin} pinColor="#2ecc71" title="Origen" />
                <Marker
                  coordinate={routeDestination}
                  pinColor="#e74c3c"
                  title="Destino"
                />
                {liveLocation ? (
                  <Marker
                    coordinate={{
                      latitude: Number(liveLocation.latitude),
                      longitude: Number(liveLocation.longitude),
                    }}
                    pinColor="#D4A373"
                    title={driverInfo?.driverName || "Conductor"}
                    description={getTripTrackingLabel(tripStatus, requestStatus)}
                  />
                ) : null}
              </MapView>
            </View>
            
            <View style={styles.trackingBottomSheet}>
              <Text style={styles.sheetTitle}>6. Viaje en seguimiento</Text>
              <Text style={styles.sheetSubtitle}>
                {isAccepted
                  ? "Tu solicitud fue aceptada por un chofer."
                  : "Tu solicitud fue creada correctamente en Supabase."}
              </Text>

              <View style={styles.phaseProgressWrap} accessibilityLabel="Progreso del viaje">
                {phaseSteps.map((phase, index) => {
                  const isDone = index <= currentPhaseIndex;

                  return (
                    <View key={phase} style={styles.phaseStepItem}>
                      <View
                        style={[
                          styles.phaseStepDot,
                          isDone ? styles.phaseStepDotActive : styles.phaseStepDotIdle,
                        ]}
                      />
                      <Text
                        style={[
                          styles.phaseStepLabel,
                          isDone && styles.phaseStepLabelActive,
                        ]}
                      >
                        {phase}
                      </Text>
                      {index < phaseSteps.length - 1 ? (
                        <View
                          style={[
                            styles.phaseConnector,
                            index < currentPhaseIndex
                              ? styles.phaseConnectorActive
                              : styles.phaseConnectorIdle,
                          ]}
                        />
                      ) : null}
                    </View>
                  );
                })}
              </View>

              <View style={styles.statusCard}>
                <Text style={styles.statusTitle}>Estado</Text>
                <Text style={styles.statusValue}>
                  {getTripTrackingLabel(tripStatus, requestStatus)}
                </Text>
                <Text style={styles.statusHint}>
                  {isAccepted
                    ? "La app revisa el estado real del viaje."
                    : "Esta pantalla revisa automáticamente el estado real."}
                </Text>

                {showDriverCard && (
                  <View style={styles.driverInfoInlineBox}>
                    <Text style={styles.driverInfoLabel}>Chofer</Text>
                    <Text style={styles.driverInfoValue}>{driverInfo?.driverName || "Conductor asignado"}</Text>
                    <Text style={styles.driverInfoLabel}>Vehículo</Text>
                    <Text style={styles.driverInfoValue}>{driverInfo?.vehicle || "Por confirmar"}</Text>
                    <Text style={styles.driverInfoLabel}>Patente</Text>
                    <Text style={styles.driverInfoValue}>{driverInfo?.plate || "Por confirmar"}</Text>
                    <Text style={styles.driverInfoLabel}>Rating</Text>
                    <Text style={styles.driverInfoValue}>
                      {Number.isFinite(Number(driverInfo?.rating))
                        ? `${Number(driverInfo.rating).toFixed(1)} ⭐`
                        : "Sin rating"}
                    </Text>

                    {canCallDriver ? (
                      <TouchableOpacity
                        style={styles.callDriverButton}
                        onPress={handleCallDriver}
                        activeOpacity={0.9}
                      >
                        <Text style={styles.callDriverButtonText}>📞 Llamar al conductor</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                )}

                {isAccepted && liveLocation && (
                  <View style={styles.locationInfoBox}>
                    <Text style={styles.driverInfoLabel}>Última ubicación</Text>
                    <Text style={styles.driverInfoValue}>
                      {`${Number(liveLocation.latitude).toFixed(5)}, ${Number(
                        liveLocation.longitude
                      ).toFixed(5)}`}
                    </Text>
                    <Text style={styles.statusHint}>
                      Última actualización: {liveLocation.recordedAt || "sin registro"}
                    </Text>
                  </View>
                )}

                {String(tripStatus || "").toLowerCase() === "completed" ? (
                  <View style={styles.paymentInfoBox}>
                    <Text style={styles.driverInfoLabel}>Precio total</Text>
                    <Text style={styles.driverInfoValue}>${paymentAmountFormatted}</Text>
                    <Text style={styles.driverInfoLabel}>Estado de pago</Text>
                    <Text style={styles.driverInfoValue}>{paymentPanelStatusLabel}</Text>
                  </View>
                ) : null}
              </View>

              <View style={styles.statusTimelineCard}>
                <Text style={styles.statusTitle}>Historial de estados</Text>

                {timelineItems.length === 0 ? (
                  <Text style={styles.statusHint}>Aun no hay eventos de estado para este viaje.</Text>
                ) : (
                  timelineItems.map((eventItem, index) => (
                    <View key={`${eventItem.status || "status"}-${eventItem.createdAt || index}`} style={styles.timelineRow}>
                      <View style={styles.timelineDot} />
                      <View style={styles.timelineContent}>
                        <Text style={styles.timelineStatusText}>
                          {getTripTrackingLabel(eventItem.status, requestStatus)}
                        </Text>
                        <Text style={styles.timelineTimeText}>
                          {eventItem.createdAt
                            ? new Date(eventItem.createdAt).toLocaleString("es-CL")
                            : "Sin hora"}
                        </Text>
                      </View>
                    </View>
                  ))
                )}
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
              <Text style={styles.sheetTitle}>1. Elegir servicio</Text>
              <Text style={styles.sheetSubtitle}>
                Selecciona el tipo de traslado que necesitas.
              </Text>

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
                  ]}>Flete estándar</Text>
                  <Text style={styles.serviceOptionDesc}>Mudanzas comunes, cajas y muebles</Text>
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
                  <Text style={styles.serviceOptionDesc}>Paquetes, compras y entregas rápidas</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.mainButton, !service && styles.buttonDisabledSoft]}
                onPress={() => service && setStep("route")}
                activeOpacity={0.9}
                disabled={!service}
              >
                <Text style={styles.mainButtonText}>Continuar</Text>
              </TouchableOpacity>
            </>
          )}

          {step === "route" && (
            <>
              <Text style={styles.sheetTitle}>2. Origen y destino</Text>
              <Text style={styles.sheetSubtitle}>
                Indica desde donde sale y hacia donde va el traslado.
              </Text>

              <Text style={styles.routeLabel}>Origen</Text>
              <TextInput
                value={origin}
                onChangeText={setOrigin}
                placeholder="Ej: Playa Ancha, Valparaíso"
                placeholderTextColor="#8a97a6"
                style={styles.routeInput}
              />

              <Text style={styles.routeLabel}>Destino</Text>
              <TextInput
                value={destination}
                onChangeText={setDestination}
                placeholder="Ej: Viña del Mar centro"
                placeholderTextColor="#8a97a6"
                style={styles.routeInput}
              />

              <TouchableOpacity
                style={[
                  styles.mainButton,
                  (!origin || !destination) && styles.buttonDisabledSoft,
                ]}
                onPress={() => origin && destination && setStep("inventory")}
                activeOpacity={0.9}
                disabled={!origin || !destination}
              >
                <Text style={styles.mainButtonText}>Continuar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.routeBackButton}
                onPress={() => setStep("service")}
                activeOpacity={0.9}
              >
                <Text style={styles.routeBackButtonText}>Volver</Text>
              </TouchableOpacity>
            </>
          )}

          {step === "inventory" && (
            <InventoryStepRefactor
              onBack={() => setStep("route")}
              onConfirm={({ inventoryMethod, inventoryItems, inventorySpecialNeeds, inventorySummary }) => {
                setInventoryMethod(normalizeInventoryMethodForUi(inventoryMethod));
                setInventoryItems(inventoryItems);
                setInventorySpecialNeeds(inventorySpecialNeeds);
                setInventorySummary(
                  inventorySummary?.trim() || buildInventorySummaryFromItems(inventoryItems)
                );
                setStep("summary");
              }}
            />
          )}

          {step === "summary" && (
            <>
              <Text style={styles.sheetTitle}>Resumen de tu mudanza</Text>
              <Text style={styles.sheetSubtitle}>
                Revisa y edita cualquier dato antes de continuar a precio.
              </Text>

              <View style={styles.summaryCardDetailed}>
                <View style={styles.summaryRowHeader}>
                  <View>
                    <Text style={styles.summaryRowLabel}>Tipo de servicio</Text>
                    <Text style={styles.summaryRowValue}>
                      {getServiceSummaryLabel(service)}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.inlineEditButton}
                    onPress={() => setStep("service")}
                    activeOpacity={0.9}
                  >
                    <Text style={styles.inlineEditButtonText}>Editar</Text>
                  </TouchableOpacity>
                </View>

                {(service === "assisted" || service === "mudanza_asistida") && (
                  <View style={styles.summaryFieldBlock}>
                    <Text style={styles.summaryRowLabel}>Asistencia requerida</Text>
                    <TextInput
                      style={styles.summaryInput}
                      value={assistanceType}
                      onChangeText={setAssistanceType}
                      placeholder="Ej: Ayuda para embalar"
                      placeholderTextColor="#8a97a6"
                    />
                  </View>
                )}

                <View style={styles.summaryFieldBlock}>
                  <Text style={styles.summaryRowLabel}>Dirección de origen</Text>
                  <TextInput
                    style={styles.summaryInput}
                    value={origin}
                    onChangeText={setOrigin}
                    onFocus={() => setEditingSummaryField("origin")}
                    onBlur={() => setEditingSummaryField(null)}
                    placeholder="Ej: Juan Lafontaine 26, Cerro Alegre, Valparaíso"
                    placeholderTextColor="#8a97a6"
                  />
                </View>

                <View style={styles.summaryFieldBlock}>
                  <Text style={styles.summaryRowLabel}>Dirección de destino</Text>
                  <TextInput
                    style={styles.summaryInput}
                    value={destination}
                    onChangeText={setDestination}
                    onFocus={() => setEditingSummaryField("destination")}
                    onBlur={() => setEditingSummaryField(null)}
                    placeholder="Ej: Av. Argentina 400, Plan, Valparaíso"
                    placeholderTextColor="#8a97a6"
                  />
                </View>

                <View style={styles.summaryExpandableCard}>
                  <View style={styles.summaryRowHeader}>
                    <View style={styles.expandTitleWrap}>
                      <Text style={styles.summaryRowLabel}>Inventario</Text>
                      <Text style={styles.summaryRowValueCompact}>
                        {inventorySummary || buildInventorySummaryFromItems(inventoryItems)}
                      </Text>
                    </View>
                    <View style={styles.summaryInlineActions}>
                      <TouchableOpacity
                        style={styles.inlineEditButton}
                        onPress={() => setStep("inventory")}
                        activeOpacity={0.9}
                      >
                        <Text style={styles.inlineEditButtonText}>Editar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.inlineEditButton}
                        onPress={() => setIsInventoryExpanded((prev) => !prev)}
                        activeOpacity={0.9}
                      >
                        <Text style={styles.inlineEditButtonText}>
                          {isInventoryExpanded ? "Ocultar" : "Ver"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {isInventoryExpanded && (
                    <View style={styles.inventoryExpandedList}>
                      {inventoryItems.length === 0 ? (
                        <Text style={styles.inventoryExpandedEmpty}>Sin objetos agregados.</Text>
                      ) : (
                        inventoryItems.map((item, index) => (
                          <Text key={`${item?.name || "item"}-${index}`} style={styles.inventoryExpandedRow}>
                            • {item.quantity || 1}x {item.name}
                          </Text>
                        ))
                      )}
                    </View>
                  )}
                </View>

                <View style={styles.summaryFieldBlock}>
                  <Text style={styles.summaryRowLabel}>Método de inventario</Text>
                  <Text style={styles.inventoryMethodHint}>
                    Registra cómo ingresó el inventario el usuario.
                  </Text>
                  <View style={styles.inventoryMethodChipRow}>
                    {["texto", "voz", "foto"].map((option) => (
                      <TouchableOpacity
                        key={option}
                        style={[
                          styles.inventoryMethodChip,
                          inventoryMethod === option && styles.inventoryMethodChipActive,
                        ]}
                        onPress={() => setInventoryMethod(option)}
                        activeOpacity={0.9}
                      >
                        <Text
                          style={[
                            styles.inventoryMethodChipText,
                            inventoryMethod === option &&
                              styles.inventoryMethodChipTextActive,
                          ]}
                        >
                          {option}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <Text style={styles.summaryStateLabel}>Estado: {summaryScreenState}</Text>
              </View>

              <TouchableOpacity
                style={[styles.mainButton, !hasRequiredSummaryFields && styles.buttonDisabledSoft]}
                onPress={() => hasRequiredSummaryFields && setStep("pricing")}
                activeOpacity={0.9}
                disabled={!hasRequiredSummaryFields}
              >
                <Text style={styles.mainButtonText}>Continuar a precio →</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.routeBackButton}
                onPress={() => setStep("inventory")}
                activeOpacity={0.9}
              >
                <Text style={styles.routeBackButtonText}>Volver</Text>
              </TouchableOpacity>
            </>
          )}

          {step === "pricing" && (
            <>
              <Text style={styles.sheetTitle}>Precio estimado</Text>
              <Text style={styles.sheetSubtitle}>
                Ajusta el precio y revisa el desglose antes de confirmar.
              </Text>

              <View style={styles.pricingHeroCard}>
                <Text style={styles.pricingHeroLabel}>Precio estimado</Text>
                <Text style={styles.pricingHeroValue}>
                  ${clampEstimatedPrice(estimatedPriceClp).toLocaleString("es-CL")}
                </Text>
              </View>

              <View style={styles.pricingSliderCard}>
                <Text style={styles.summaryRowLabel}>Ajustar precio</Text>

                <View
                  style={styles.sliderTrackTouchArea}
                  onLayout={(event) => {
                    setSliderTrackWidth(event.nativeEvent.layout.width || 0);
                  }}
                  accessibilityRole="adjustable"
                  accessibilityLabel="Deslizar para ajustar precio estimado"
                  {...sliderPanResponder.panHandlers}
                >
                  <View style={styles.sliderTrackBase}>
                    <View
                      style={[
                        styles.sliderTrackFill,
                        { width: `${Math.max(0, Math.min(100, sliderProgress * 100))}%` },
                      ]}
                    />
                  </View>
                  <View
                    style={[
                      styles.sliderThumb,
                      { left: `${Math.max(0, Math.min(100, sliderProgress * 100))}%` },
                    ]}
                  />
                </View>

                <View style={styles.sliderBoundsRow}>
                  <Text style={styles.sliderBoundText}>$5.000</Text>
                  <Text style={styles.sliderBoundText}>$150.000</Text>
                </View>
              </View>

              <View style={styles.pricingBreakdownCard}>
                <Text style={styles.summaryRowLabel}>Desglose transparente</Text>

                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabelNeutral}>Total del servicio</Text>
                  <Text style={styles.breakdownValueNeutral}>
                    ${clampEstimatedPrice(estimatedPriceClp).toLocaleString("es-CL")}
                  </Text>
                </View>

                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabelDriver}>Conductor (70%)</Text>
                  <Text style={styles.breakdownValueDriver}>
                    ${driverShareClp.toLocaleString("es-CL")}
                  </Text>
                </View>

                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabelMuber}>Comisión MUBER (30%)</Text>
                  <Text style={styles.breakdownValueMuber}>
                    ${muberShareClp.toLocaleString("es-CL")}
                  </Text>
                </View>
              </View>

              <View style={styles.pricingPaymentCard}>
                <Text style={styles.summaryRowLabel}>Método de pago</Text>

                <TouchableOpacity
                  style={[
                    styles.paymentOptionRow,
                    requestPaymentMethod === "efectivo" && styles.paymentOptionRowActive,
                  ]}
                  onPress={() => setRequestPaymentMethod("efectivo")}
                  activeOpacity={0.9}
                >
                  <Text style={styles.paymentOptionText}>💵 Efectivo al conductor</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.paymentOptionRow,
                    requestPaymentMethod === "transferencia" && styles.paymentOptionRowActive,
                  ]}
                  onPress={() => setRequestPaymentMethod("transferencia")}
                  activeOpacity={0.9}
                >
                  <Text style={styles.paymentOptionText}>🏦 Transferencia bancaria</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.paymentOptionRow,
                    requestPaymentMethod === "webpay" && styles.paymentOptionRowActive,
                  ]}
                  onPress={() => setRequestPaymentMethod("webpay")}
                  activeOpacity={0.9}
                >
                  <Text style={styles.paymentOptionText}>💳 WebPay</Text>
                </TouchableOpacity>

                <Text style={styles.summaryStateLabel}>Estado: {pricingScreenState}</Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.requestPrimaryButton,
                  (loading || !requestPaymentMethod) && styles.buttonDisabledSoft,
                ]}
                onPress={handleCreateRequest}
                activeOpacity={0.9}
                disabled={loading || !requestPaymentMethod}
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.requestPrimaryButtonText}>Confirmar solicitud →</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.routeBackButton}
                onPress={() => setStep("summary")}
                activeOpacity={0.9}
              >
                <Text style={styles.routeBackButtonText}>Volver</Text>
              </TouchableOpacity>
            </>
          )}

          {step === "request" && (
            <>
              <Text style={styles.sheetTitle}>Solicitud enviada</Text>
              <Text style={styles.sheetSubtitle}>
                Estado en tiempo real de tu solicitud.
              </Text>

              <View style={styles.requestHeroCard}>
                <Text style={styles.requestHeroIcon}>
                  {requestScreenState === "assigned"
                    ? "✅"
                    : requestScreenState === "cancelled"
                      ? "❌"
                      : "🔍"}
                </Text>
                <Text style={styles.requestHeroTitle}>
                  {requestScreenState === "assigned"
                    ? "¡Conductor asignado!"
                    : requestScreenState === "cancelled"
                      ? "Solicitud cancelada"
                      : requestScreenState === "no_drivers"
                        ? "Sin conductores por ahora"
                        : "Buscando conductor..."}
                </Text>
                <Text style={styles.requestHeroSubtitle}>
                  {requestScreenState === "assigned"
                    ? "Tu conductor está en camino. Te llevamos al tracking."
                    : requestScreenState === "cancelled"
                      ? "Puedes volver a solicitar cuando quieras."
                      : requestScreenState === "no_drivers"
                        ? "Aún no hay conductor disponible. Puedes reintentar desde servicio."
                        : "Te notificaremos cuando alguien acepte tu flete."}
                </Text>
                {(requestScreenState === "pending" || requestScreenState === "no_drivers") && (
                  <ActivityIndicator style={styles.requestSpinner} size="small" color="#e67e22" />
                )}
              </View>

              <View style={styles.requestStatusCard}>
                <Text style={styles.requestStatusLabel}>Servicio</Text>
                <Text style={styles.requestStatusHint}>{getServiceSummaryLabel(service)}</Text>

                <Text style={styles.requestStatusLabel}>Origen</Text>
                <Text style={styles.requestStatusHint}>{origin || "-"}</Text>

                <Text style={styles.requestStatusLabel}>Destino</Text>
                <Text style={styles.requestStatusHint}>{destination || "-"}</Text>

                <Text style={styles.requestStatusLabel}>Inventario</Text>
                <Text style={styles.requestStatusHint}>{inventorySummary || "Sin inventario"}</Text>

                <Text style={styles.requestStatusLabel}>Precio estimado</Text>
                <Text style={styles.requestStatusHint}>
                  ${clampEstimatedPrice(estimatedPriceClp).toLocaleString("es-CL")}
                </Text>

                <Text style={styles.requestStatusLabel}>Pago</Text>
                <Text style={styles.requestStatusHint}>{requestPaymentMethodLabel}</Text>

                <View style={styles.requestStatusRowInline}>
                  <Text style={styles.requestStatusLabel}>Estado</Text>
                  <View
                    style={[
                      styles.requestBadge,
                      requestScreenState === "assigned"
                        ? styles.requestBadgeAssigned
                        : requestScreenState === "cancelled"
                          ? styles.requestBadgeCancelled
                          : styles.requestBadgePending,
                    ]}
                  >
                    <Text style={styles.requestBadgeText}>{requestScreenState}</Text>
                  </View>
                </View>

                <Text style={styles.requestStatusLabel}>ID Solicitud</Text>
                <Text style={styles.requestStatusHint}>{requestIdShort}</Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.requestDangerButton,
                  (requestScreenState !== "pending" || requestScreenBusy) &&
                    styles.buttonDisabledSoft,
                ]}
                onPress={handleCancelPendingRequest}
                activeOpacity={0.9}
                disabled={requestScreenState !== "pending" || requestScreenBusy}
              >
                <Text style={styles.requestDangerButtonText}>Cancelar solicitud</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.requestSupportButton}
                onPress={handleContactSupport}
                activeOpacity={0.9}
              >
                <Text style={styles.requestSupportButtonText}>📞 Soporte con un clic</Text>
              </TouchableOpacity>
            </>
          )}

          {step === "payment" && (
            <>
              <Text style={styles.sheetTitle}>Confirmar pago</Text>
              <Text style={styles.sheetSubtitle}>
                Cierre final del viaje completado.
              </Text>

              {isPaymentPaid ? (
                <View style={styles.paymentSuccessBadgeInline}>
                  <Text style={styles.paymentSuccessBadgeIcon}>✅</Text>
                  <Text style={styles.paymentSuccessBadgeText}>Pago confirmado</Text>
                </View>
              ) : null}

              <View style={styles.paymentTripSummaryCard}>
                <Text style={styles.requestStatusLabel}>Origen</Text>
                <Text style={styles.requestStatusHint}>{origin || "-"}</Text>

                <Text style={styles.requestStatusLabel}>Destino</Text>
                <Text style={styles.requestStatusHint}>{destination || "-"}</Text>

                <Text style={styles.requestStatusLabel}>Conductor</Text>
                <Text style={styles.requestStatusHint}>
                  {driverInfo?.driverName || "Conductor asignado"}
                </Text>

                <Text style={styles.requestStatusLabel}>Duración</Text>
                <Text style={styles.requestStatusHint}>{tripDurationLabel}</Text>
              </View>

              <View style={styles.paymentHeroAmountCard}>
                <Text style={styles.paymentHeroAmountLabel}>Total a pagar</Text>
                <Text style={styles.paymentHeroAmountValue}>${paymentAmountFormatted}</Text>
              </View>

              <View style={styles.paymentMethodCard}>
                <Text style={styles.requestStatusLabel}>Método de pago</Text>
                <View style={styles.userPaymentMethodRow}>
                  <TouchableOpacity
                    style={[
                      styles.userPaymentChip,
                      userPaymentMethod === "efectivo" && styles.userPaymentChipActive,
                    ]}
                    onPress={() => setUserPaymentMethod("efectivo")}
                    activeOpacity={0.9}
                    disabled={isPaymentPaid}
                  >
                    <Text
                      style={[
                        styles.userPaymentChipText,
                        userPaymentMethod === "efectivo" && styles.userPaymentChipTextActive,
                      ]}
                    >
                      Efectivo
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.userPaymentChip,
                      userPaymentMethod === "transferencia" && styles.userPaymentChipActive,
                    ]}
                    onPress={() => setUserPaymentMethod("transferencia")}
                    activeOpacity={0.9}
                    disabled={isPaymentPaid}
                  >
                    <Text
                      style={[
                        styles.userPaymentChipText,
                        userPaymentMethod === "transferencia" && styles.userPaymentChipTextActive,
                      ]}
                    >
                      Transferencia
                    </Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.paymentMethodHint}>Método seleccionado: {paymentMethodDisplay}</Text>
              </View>

              <View style={styles.paymentBreakdownCard}>
                <Text style={styles.summaryRowLabel}>Desglose final</Text>
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabelNeutral}>Total servicio</Text>
                  <Text style={styles.breakdownValueNeutral}>${paymentAmountFormatted}</Text>
                </View>
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabelDriver}>Conductor (70%)</Text>
                  <Text style={styles.breakdownValueDriver}>${driverNetClp.toLocaleString("es-CL")}</Text>
                </View>
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabelMuber}>Comisión MUBER (30%)</Text>
                  <Text style={styles.breakdownValueMuber}>${muberIncomeClp.toLocaleString("es-CL")}</Text>
                </View>
              </View>

              {!isPaymentPaid ? (
                <TouchableOpacity
                  style={[styles.requestPrimaryButton, paymentLoading && styles.buttonDisabledSoft]}
                  onPress={handleUserPayment}
                  activeOpacity={0.9}
                  disabled={paymentLoading || tripStatus !== "completed"}
                >
                  {paymentLoading ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Text style={styles.requestPrimaryButtonText}>CONFIRMAR PAGO</Text>
                  )}
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.paymentNewTripButton}
                  onPress={handleStartNewTrip}
                  activeOpacity={0.9}
                >
                  <Text style={styles.paymentNewTripButtonText}>Solicitar nuevo flete</Text>
                </TouchableOpacity>
              )}

              {paymentScreenState === "pending_payment" ? (
                <TouchableOpacity
                  style={styles.routeBackButton}
                  onPress={() => setStep("tracking")}
                  activeOpacity={0.9}
                  disabled={paymentLoading}
                >
                  <Text style={styles.routeBackButtonText}>Volver al tracking</Text>
                </TouchableOpacity>
              ) : null}

              {paymentSuccessVisible ? (
                <View style={styles.paymentSuccessOverlay}>
                  <Text style={styles.paymentSuccessOverlayIcon}>✅</Text>
                  <Text style={styles.paymentSuccessOverlayTitle}>Pago confirmado</Text>
                  <Text style={styles.paymentSuccessOverlayHint}>
                    Redirigiendo a solicitar nuevo flete...
                  </Text>
                </View>
              ) : null}
            </>
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
  backButtonGhost: {
    width: 48,
    height: 48,
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
    backgroundColor: "#f8fafb",
    borderWidth: 1,
    borderColor: "#dbe3ea",
    borderRadius: 20,
    padding: 22,
    marginBottom: 6,
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
    marginTop: 14,
    backgroundColor: "#fff7ef",
    borderWidth: 1,
    borderColor: "#f0d2b2",
    borderRadius: 18,
    padding: 16,
  },
  locationInfoBox: {
    marginTop: 14,
    backgroundColor: "#eef6ff",
    borderWidth: 1,
    borderColor: "#c7d9f0",
    borderRadius: 18,
    padding: 16,
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
    height: 220,
    borderRadius: 16,
    marginTop: 12,
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
  routeLabel: {
    fontSize: 15,
    fontWeight: "800",
    color: "#22313f",
    marginBottom: 8,
    marginTop: 4,
  },
  routeInput: {
    backgroundColor: "#f3f6f8",
    borderWidth: 1,
    borderColor: "#d8e0e8",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 15,
    color: "#22313f",
    marginBottom: 14,
  },
  routeBackButton: {
    backgroundColor: "#ffffff",
    borderWidth: 2,
    borderColor: "#d7dde5",
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: "center",
    marginTop: 12,
  },
  routeBackButtonText: {
    color: "#2c3e50",
    fontSize: 15,
    fontWeight: "700",
  },
  buttonDisabledSoft: {
    opacity: 0.45,
  },
  summaryCompact: {
    backgroundColor: "#f8fafb",
    borderWidth: 1,
    borderColor: "#dbe3ea",
    borderRadius: 20,
    padding: 20,
    marginBottom: 6,
  },
  summaryLabelSmall: {
    fontSize: 14,
    fontWeight: "800",
    color: "#6a7682",
    marginTop: 6,
  },
  summaryValueSmall: {
    fontSize: 17,
    fontWeight: "700",
    color: "#22313f",
    marginBottom: 4,
  },
  summaryCardDetailed: {
    backgroundColor: "#f8fafb",
    borderWidth: 1,
    borderColor: "#dbe3ea",
    borderRadius: 20,
    padding: 16,
    marginBottom: 8,
  },
  summaryRowHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  summaryRowLabel: {
    fontSize: 13,
    fontWeight: "800",
    color: "#6a7682",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  summaryRowValue: {
    fontSize: 16,
    fontWeight: "800",
    color: "#22313f",
  },
  summaryRowValueCompact: {
    fontSize: 14,
    fontWeight: "700",
    color: "#22313f",
    lineHeight: 20,
  },
  summaryFieldBlock: {
    marginTop: 12,
  },
  summaryInput: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#d8e0e8",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    color: "#22313f",
  },
  inlineEditButton: {
    borderWidth: 1,
    borderColor: "#d8e0e8",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#ffffff",
  },
  inlineEditButtonText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#22313f",
  },
  summaryExpandableCard: {
    marginTop: 12,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e1e7ee",
    borderRadius: 14,
    padding: 12,
  },
  expandTitleWrap: {
    flex: 1,
    paddingRight: 8,
  },
  summaryInlineActions: {
    flexDirection: "row",
    gap: 6,
  },
  inventoryExpandedList: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#edf2f7",
    paddingTop: 8,
    gap: 4,
  },
  inventoryExpandedRow: {
    color: "#22313f",
    fontSize: 14,
    fontWeight: "600",
  },
  inventoryExpandedEmpty: {
    color: "#6a7682",
    fontSize: 14,
    fontWeight: "600",
  },
  inventoryMethodChipRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  inventoryMethodHint: {
    color: "#6a7682",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
  },
  inventoryMethodChip: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#d8e0e8",
    borderRadius: 999,
    paddingVertical: 10,
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  inventoryMethodChipActive: {
    borderColor: "#e67e22",
    backgroundColor: "#fff7ef",
  },
  inventoryMethodChipText: {
    color: "#22313f",
    fontSize: 13,
    fontWeight: "700",
  },
  inventoryMethodChipTextActive: {
    color: "#e67e22",
  },
  summaryStateLabel: {
    marginTop: 12,
    color: "#6a7682",
    fontSize: 12,
    fontWeight: "700",
  },
  pricingHeroCard: {
    backgroundColor: "#1f2d3a",
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 16,
    alignItems: "center",
    marginBottom: 10,
  },
  pricingHeroLabel: {
    color: "#dbe6f1",
    fontSize: 14,
    fontWeight: "700",
  },
  pricingHeroValue: {
    color: "#D4A373",
    fontSize: 44,
    fontWeight: "900",
    marginTop: 2,
  },
  pricingSliderCard: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#dbe3ea",
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  sliderTrackTouchArea: {
    marginTop: 4,
    paddingVertical: 14,
    justifyContent: "center",
  },
  sliderTrackBase: {
    height: 8,
    borderRadius: 999,
    backgroundColor: "#E2E8F0",
    overflow: "hidden",
  },
  sliderTrackFill: {
    height: "100%",
    backgroundColor: "#D4A373",
  },
  sliderThumb: {
    position: "absolute",
    top: 8,
    marginLeft: -11,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#ffffff",
    borderWidth: 2,
    borderColor: "#D4A373",
  },
  sliderBoundsRow: {
    marginTop: 6,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sliderBoundText: {
    color: "#6a7682",
    fontSize: 12,
    fontWeight: "700",
  },
  pricingBreakdownCard: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#dbe3ea",
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  breakdownRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  breakdownLabelNeutral: {
    color: "#5f6c79",
    fontSize: 14,
    fontWeight: "700",
  },
  breakdownValueNeutral: {
    color: "#22313f",
    fontSize: 14,
    fontWeight: "800",
  },
  breakdownLabelDriver: {
    color: "#10B981",
    fontSize: 14,
    fontWeight: "800",
  },
  breakdownValueDriver: {
    color: "#10B981",
    fontSize: 15,
    fontWeight: "900",
  },
  breakdownLabelMuber: {
    color: "#D4A373",
    fontSize: 14,
    fontWeight: "800",
  },
  breakdownValueMuber: {
    color: "#D4A373",
    fontSize: 15,
    fontWeight: "900",
  },
  pricingPaymentCard: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#dbe3ea",
    borderRadius: 16,
    padding: 14,
    marginBottom: 6,
  },
  paymentOptionRow: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#d8e0e8",
    borderRadius: 12,
    backgroundColor: "#ffffff",
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  paymentOptionRowActive: {
    borderColor: "#D4A373",
    backgroundColor: "#fff7ef",
  },
  paymentOptionRowDisabled: {
    backgroundColor: "#f3f6f8",
    opacity: 0.8,
  },
  paymentOptionText: {
    color: "#22313f",
    fontSize: 14,
    fontWeight: "700",
  },
  paymentOptionTextDisabled: {
    color: "#8a97a6",
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
    fontSize: 28,
    fontWeight: "900",
    color: "#e67e22",
    marginTop: 2,
    marginBottom: 8,
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
  requestStatusCard: {
    backgroundColor: "#f8fafb",
    borderWidth: 1,
    borderColor: "#dbe3ea",
    borderRadius: 20,
    padding: 22,
    marginBottom: 6,
  },
  requestStatusLabel: {
    fontSize: 15,
    fontWeight: "800",
    color: "#6a7682",
    marginBottom: 6,
  },
  requestStatusTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#22313f",
    marginBottom: 6,
  },
  requestStatusHint: {
    fontSize: 15,
    color: "#5f6c79",
    fontWeight: "600",
  },
  requestHeroCard: {
    backgroundColor: "#f8fafb",
    borderWidth: 1,
    borderColor: "#dbe3ea",
    borderRadius: 20,
    padding: 18,
    marginBottom: 10,
    alignItems: "center",
  },
  requestHeroIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  requestHeroTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#22313f",
    textAlign: "center",
  },
  requestHeroSubtitle: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
    color: "#5f6c79",
    textAlign: "center",
  },
  requestSpinner: {
    marginTop: 10,
  },
  requestStatusRowInline: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  requestBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  requestBadgePending: {
    backgroundColor: "#eef3f7",
  },
  requestBadgeAssigned: {
    backgroundColor: "#def7ec",
  },
  requestBadgeCancelled: {
    backgroundColor: "#fde8e8",
  },
  requestBadgeText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#22313f",
    textTransform: "uppercase",
  },
  requestDangerButton: {
    backgroundColor: "#c0392b",
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  requestDangerButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "800",
  },
  requestSupportButton: {
    backgroundColor: "#ffffff",
    borderWidth: 2,
    borderColor: "#d7dde5",
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 10,
  },
  requestSupportButtonText: {
    color: "#2c3e50",
    fontSize: 15,
    fontWeight: "700",
  },
  requestPrimaryButton: {
    backgroundColor: "#1f2d3a",
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: "center",
    marginTop: 8,
  },
  requestPrimaryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "800",
  },
  paymentTripSummaryCard: {
    backgroundColor: "#f8fafb",
    borderWidth: 1,
    borderColor: "#dbe3ea",
    borderRadius: 18,
    padding: 16,
    marginBottom: 10,
  },
  paymentHeroAmountCard: {
    backgroundColor: "#1f2d3a",
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: "center",
    marginBottom: 10,
  },
  paymentHeroAmountLabel: {
    color: "#dbe6f1",
    fontSize: 14,
    fontWeight: "700",
  },
  paymentHeroAmountValue: {
    color: "#ffffff",
    fontSize: 48,
    fontWeight: "900",
    marginTop: 4,
  },
  paymentMethodCard: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#dbe3ea",
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  paymentMethodHint: {
    marginTop: 8,
    color: "#6a7682",
    fontSize: 13,
    fontWeight: "600",
  },
  paymentBreakdownCard: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#dbe3ea",
    borderRadius: 16,
    padding: 14,
    marginBottom: 8,
  },
  paymentSuccessBadgeInline: {
    backgroundColor: "#def7ec",
    borderWidth: 1,
    borderColor: "#8fd7b6",
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  paymentSuccessBadgeIcon: {
    fontSize: 16,
  },
  paymentSuccessBadgeText: {
    color: "#0f3a24",
    fontSize: 14,
    fontWeight: "800",
  },
  paymentNewTripButton: {
    backgroundColor: "#ffffff",
    borderWidth: 2,
    borderColor: "#d7dde5",
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  paymentNewTripButtonText: {
    color: "#2c3e50",
    fontSize: 15,
    fontWeight: "700",
  },
  paymentSuccessOverlay: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "rgba(17, 24, 39, 0.68)",
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  paymentSuccessOverlayIcon: {
    fontSize: 46,
    marginBottom: 8,
  },
  paymentSuccessOverlayTitle: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "900",
    textAlign: "center",
  },
  paymentSuccessOverlayHint: {
    marginTop: 8,
    color: "#dbe6f1",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
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
  trackingOverlay: {
    flex: 1,
  },
  phaseProgressWrap: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
    paddingVertical: 4,
  },
  phaseStepItem: {
    flex: 1,
    alignItems: "center",
    position: "relative",
  },
  phaseStepDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: 6,
  },
  phaseStepDotActive: {
    backgroundColor: "#e67e22",
  },
  phaseStepDotIdle: {
    backgroundColor: "#d8e0e8",
  },
  phaseStepLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#7b8794",
    textAlign: "center",
  },
  phaseStepLabelActive: {
    color: "#22313f",
  },
  phaseConnector: {
    position: "absolute",
    top: 5,
    left: "55%",
    width: "90%",
    height: 2,
  },
  phaseConnectorActive: {
    backgroundColor: "#e67e22",
  },
  phaseConnectorIdle: {
    backgroundColor: "#d8e0e8",
  },
  callDriverButton: {
    marginTop: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#d7dde5",
    backgroundColor: "#ffffff",
    paddingVertical: 11,
    alignItems: "center",
  },
  callDriverButtonText: {
    color: "#22313f",
    fontSize: 14,
    fontWeight: "700",
  },
  statusTimelineCard: {
    backgroundColor: "#f8fafb",
    borderWidth: 1,
    borderColor: "#dbe3ea",
    borderRadius: 18,
    padding: 14,
    marginTop: 10,
  },
  timelineRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 8,
  },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#e67e22",
    marginTop: 6,
    marginRight: 10,
  },
  timelineContent: {
    flex: 1,
  },
  timelineStatusText: {
    color: "#22313f",
    fontSize: 14,
    fontWeight: "700",
  },
  timelineTimeText: {
    marginTop: 2,
    color: "#6a7682",
    fontSize: 12,
    fontWeight: "600",
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
    borderRadius: 28,
    padding: 28,
    marginBottom: 6,
    minHeight: 500,
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
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: "center",
    marginTop: 8,
  },
});
