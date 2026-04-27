import { APP_ENV, IS_TEST_ENV } from "../lib/appEnv";
import { supabase } from "../lib/supabase";
import { buildInventorySummary, normalizeInventoryItems } from "../inventoryApi";
import { replaceInventoryForRequest } from "../inventoryApi";

const TEST_CUSTOMER_PROFILE_ID = "a8b92058-4005-4572-bad4-57e9b35304e6";

function assertTestEnv() {
  if (!IS_TEST_ENV) {
    throw new Error(
      `Operacion bloqueada: esta fase solo puede ejecutarse en TEST. Entorno actual: ${APP_ENV}.`
    );
  }
}

async function invokeUserFlow(functionName, body) {
  assertTestEnv();

  const { data, error } = await supabase.functions.invoke(functionName, {
    body,
  });

  if (error) {
    throw new Error(error.message || `Fallo la funcion ${functionName}.`);
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  return data;
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

function normalizeEstimatedPriceClp(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed) : 0;
}

function buildExpectedInventoryPayload(input) {
  const inventoryMethod = String(input.inventoryMethod || "").trim() || "manual";
  const inventoryItems = normalizeInventoryItems(input.inventoryItems || []);
  const inventorySpecialNeeds = Array.isArray(input.inventorySpecialNeeds)
    ? input.inventorySpecialNeeds
    : [];
  const inventorySummary =
    String(input.inventorySummary || "").trim() ||
    buildInventorySummary({
      method: inventoryMethod,
      items: inventoryItems,
      specialNeeds: inventorySpecialNeeds,
    });

  return {
    inventoryMethod,
    inventoryItems,
    inventorySpecialNeeds,
    inventorySummary,
    estimatedPriceClp: normalizeEstimatedPriceClp(input.estimatedPriceClp),
  };
}

async function createUserRequestDirect(input) {
  const {
    inventoryMethod,
    inventoryItems,
    inventorySpecialNeeds,
    inventorySummary,
    estimatedPriceClp,
  } = buildExpectedInventoryPayload(input);

  const { data, error } = await supabase
    .from("requests")
    .insert([
      {
        customer_id: TEST_CUSTOMER_PROFILE_ID,
        service_type: input.serviceType,
        assistance_type: null,
        origin_text: input.originText,
        destination_text: input.destinationText,
        inventory_method: inventoryMethod,
        inventory_summary: inventorySummary,
        estimated_price_clp: estimatedPriceClp,
        status: "pending",
        requested_at: new Date().toISOString(),
      },
    ])
    .select("id, status, inventory_summary, estimated_price_clp")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "No se pudo crear la solicitud en TEST.");
  }

  if (inventoryItems.length > 0) {
    const inventoryRows = inventoryItems.map((item) => ({
      request_id: data.id,
      item_name: item.name,
      quantity: item.quantity,
      category: item.category,
      notes: [item.notes, ...inventorySpecialNeeds]
        .filter(Boolean)
        .join(" | "),
    }));

    const { error: itemsError } = await supabase
      .from("inventory_items")
      .insert(inventoryRows);

    if (itemsError) {
      await supabase.from("requests").delete().eq("id", data.id);
      throw new Error(
        itemsError.message ||
          "No se pudo guardar inventory_items en el fallback TEST."
      );
    }
  }

  return {
    requestId: data.id,
    status: data.status || "new",
    inventorySummary: data.inventory_summary || inventorySummary,
    estimatedPriceClp:
      normalizeEstimatedPriceClp(data.estimated_price_clp) || estimatedPriceClp,
    inventoryItemCount: inventoryItems.length,
  };
}

async function getRequestTrackingDirect(requestId) {
  const { data: requestData, error: requestError } = await supabase
    .from("requests")
    .select("id, status")
    .eq("id", requestId)
    .single();

  if (requestError || !requestData) {
    throw new Error(
      requestError?.message || "No se pudo leer el request real en TEST."
    );
  }

  const payload = {
    requestId: requestData.id,
    requestStatus: requestData.status || "new",
    tripId: null,
    tripStatus: null,
    totalPriceClp: 0,
    paymentStatus: "pending",
    paymentMethod: null,
    latestPaymentId: null,
    driverInfo: null,
    liveLocation: null,
  };

  const { data: tripData, error: tripError } = await supabase
    .from("trips")
    .select("id, trip_status, total_price_clp, payment_status, payment_method")
    .eq("request_id", requestId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (tripError || !tripData) {
    return payload;
  }

  payload.tripId = tripData.id;
  payload.tripStatus = tripData.trip_status || null;
  payload.totalPriceClp = Number(tripData.total_price_clp || 0);
  payload.paymentStatus = tripData.payment_status || "pending";
  payload.paymentMethod = tripData.payment_method || null;

  const { data: paymentData, error: paymentError } = await supabase
    .from("payments")
    .select("id")
    .eq("trip_id", tripData.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!paymentError && paymentData?.id) {
    payload.latestPaymentId = paymentData.id;
  }

  const { data: liveLocationData, error: liveLocationError } = await supabase
    .from("driver_live_locations")
    .select(
      "latitude, longitude, heading, speed_kph, accuracy_meters, recorded_at"
    )
    .eq("trip_id", tripData.id)
    .single();

  if (!liveLocationError && liveLocationData) {
    payload.liveLocation = {
      latitude: Number(liveLocationData.latitude),
      longitude: Number(liveLocationData.longitude),
      heading: liveLocationData.heading,
      speedKph: liveLocationData.speed_kph,
      accuracyMeters: liveLocationData.accuracy_meters,
      recordedAt: liveLocationData.recorded_at,
    };
  }

  const { data: historyData, error: historyError } = await supabase
    .from("trip_status_history")
    .select("note")
    .eq("trip_id", tripData.id)
    .eq("status", "driver_assigned")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!historyError && historyData?.note) {
    payload.driverInfo = parseDriverInfo(historyData.note);
  }

  return payload;
}

export async function createUserRequest(input) {
  const expectedInventory = buildExpectedInventoryPayload(input);

  try {
    const data = await invokeUserFlow("create-user-request", input);
    let reconciledInventory = null;

    if (IS_TEST_ENV && data?.requestId) {
      try {
        reconciledInventory = await replaceInventoryForRequest({
          requestId: data.requestId,
          inventoryMethod: expectedInventory.inventoryMethod,
          inventoryItems: expectedInventory.inventoryItems,
          inventorySpecialNeeds: expectedInventory.inventorySpecialNeeds,
          estimatedPriceClp: expectedInventory.estimatedPriceClp,
        });
      } catch (reconcileError) {
        console.warn(
          "No se pudo reconciliar inventario del request TEST despues de create-user-request:",
          reconcileError?.message || reconcileError
        );
      }
    }

    if (
      IS_TEST_ENV &&
      (String(
        reconciledInventory?.inventorySummary || data?.inventorySummary || ""
      ).trim() !== expectedInventory.inventorySummary ||
        normalizeEstimatedPriceClp(data?.estimatedPriceClp) !==
          expectedInventory.estimatedPriceClp)
    ) {
      console.warn(
        "create-user-request en TEST parece desactualizada: request creado, pero la function no devolvio inventory_summary o estimated_price_clp consistentes."
      );
    }

    return {
      ...data,
      inventorySummary:
        String(
          reconciledInventory?.inventorySummary || data?.inventorySummary || ""
        ).trim() ||
        expectedInventory.inventorySummary,
      estimatedPriceClp:
        normalizeEstimatedPriceClp(
          reconciledInventory?.estimatedPriceClp ?? data?.estimatedPriceClp
        ) ||
        expectedInventory.estimatedPriceClp,
      inventoryItemCount:
        Array.isArray(reconciledInventory?.inventoryItems)
          ? reconciledInventory.inventoryItems.length
          : Number.isFinite(Number(data?.inventoryItemCount)) &&
              Number(data.inventoryItemCount) >= 0
            ? Number(data.inventoryItemCount)
            : expectedInventory.inventoryItems.length,
    };
  } catch (error) {
    if (!IS_TEST_ENV) {
      throw error;
    }

    console.warn(
      "Fallback TEST createUserRequest directo a Supabase:",
      error?.message || error
    );

    return createUserRequestDirect(input);
  }
}

export async function getRequestTracking(requestId) {
  try {
    return await invokeUserFlow("get-request-tracking", { requestId });
  } catch (error) {
    if (!IS_TEST_ENV) {
      throw error;
    }

    console.warn(
      "Fallback TEST getRequestTracking directo a Supabase:",
      error?.message || error
    );

    return getRequestTrackingDirect(requestId);
  }
}

export async function createRequestWithInventory({
  serviceType,
  originText,
  destinationText,
  inventoryMethod = "manual",
  inventoryItems = [],
  inventorySpecialNeeds = [],
}) {
  const { data, error } = await supabase.functions.invoke("create-request-with-inventory", {
    body: {
      serviceType,
      originText,
      destinationText,
      inventoryMethod,
      inventoryItems,
      inventorySpecialNeeds,
    },
  });

  if (error) {
    throw new Error(error.message || "No se pudo crear la solicitud con inventario.");
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  return {
    requestId: data.requestId,
    status: data.status || "pending",
    inventorySummary: data.inventorySummary,
  };
}
