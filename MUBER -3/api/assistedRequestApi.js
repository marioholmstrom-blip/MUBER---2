import { APP_ENV, IS_TEST_ENV } from "../lib/appEnv";
import { supabase } from "../lib/supabase";
import { createRequestWithInventory } from "./userRequestApi";

function assertTestEnv() {
  if (!IS_TEST_ENV) {
    throw new Error(
      `Operacion bloqueada: esta fase solo puede ejecutarse en TEST. Entorno actual: ${APP_ENV}.`
    );
  }
}

function parseDriverInfo(noteText) {
  if (!noteText) {
    return null;
  }

  const acceptedMarker = "Solicitud aceptada por ";
  const assignedMarker = "Chofer real asignado: ";
  let raw = noteText;

  if (noteText.startsWith(acceptedMarker)) {
    raw = noteText.replace(acceptedMarker, "");
  } else if (noteText.startsWith(assignedMarker)) {
    raw = noteText.replace(assignedMarker, "");
  }

  const parts = raw.split(" - ");

  return {
    driverName: parts[0] || "",
    vehicle: parts[1] || "",
    plate: parts[2] || "",
  };
}

function normalizeAssistType(assistType) {
  if (assistType === "adultomayor") return "adulto_mayor";
  if (assistType === "movilidad") return "movilidad";
  return "carga_delicada";
}

function normalizeInventoryMethod(inventoryMethod) {
  if (inventoryMethod === "manual") return "manual";
  if (inventoryMethod === "scanner") return "scanner";
  return "voz";
}

export async function createAssistedRequest(input) {
  assertTestEnv();

  const inventoryMethod = normalizeInventoryMethod(input.inventoryMethod);
  const assistanceType = normalizeAssistType(input.assistType);
  const inventoryItemsFromUi = Array.isArray(input.inventoryItems)
    ? input.inventoryItems
    : [];
  const inventorySpecialNeedsFromUi = Array.isArray(input.inventorySpecialNeeds)
    ? input.inventorySpecialNeeds
    : [];
  const inventoryItems =
    inventoryItemsFromUi.length > 0
      ? inventoryItemsFromUi
      : [
          {
            name: "Apoyo asistido",
            quantity: 1,
            category: "otro",
            notes: `Tipo de asistencia: ${assistanceType}`,
          },
        ];

  const data = await createRequestWithInventory({
    serviceType: "asistida",
    originText: input.origin,
    destinationText: input.destination,
    inventoryMethod,
    inventoryItems,
    inventorySpecialNeeds: [
      assistanceType,
      ...inventorySpecialNeedsFromUi,
    ],
  });

  return {
    requestId: data.requestId,
    status: data.status || "pending",
  };
}

export async function getAssistedRequestTracking(requestId) {
  assertTestEnv();

  const { data: requestData, error: requestError } = await supabase
    .from("requests")
    .select("id, status")
    .eq("id", requestId)
    .single();

  if (requestError || !requestData) {
    throw new Error(
      requestError?.message || "No se pudo leer la solicitud asistida."
    );
  }

  const tracking = {
    requestId: requestData.id,
    requestStatus: requestData.status || "pending",
    tripId: null,
    tripStatus: null,
    totalPriceClp: 0,
    paymentStatus: "pending",
    paymentMethod: null,
    driverInfo: null,
  };

  if (requestData.status !== "accepted") {
    return tracking;
  }

  const { data: tripData, error: tripError } = await supabase
    .from("trips")
    .select("id, trip_status, total_price_clp, payment_status, payment_method")
    .eq("request_id", requestId)
    .single();

  if (tripError || !tripData) {
    return tracking;
  }

  tracking.tripId = tripData.id;
  tracking.tripStatus = tripData.trip_status || null;
  tracking.totalPriceClp = Number(tripData.total_price_clp || 0);
  tracking.paymentStatus = tripData.payment_status || "pending";
  tracking.paymentMethod = tripData.payment_method || null;

  const { data: historyData, error: historyError } = await supabase
    .from("trip_status_history")
    .select("note")
    .eq("trip_id", tripData.id)
    .eq("status", "driver_assigned")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!historyError && historyData?.note) {
    tracking.driverInfo = parseDriverInfo(historyData.note);
  }

  return tracking;
}
