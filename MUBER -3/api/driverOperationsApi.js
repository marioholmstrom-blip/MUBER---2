import { APP_ENV, IS_TEST_ENV } from "../lib/appEnv";
import { supabase } from "../lib/supabase";

function assertTestEnv() {
  if (!IS_TEST_ENV) {
    throw new Error(
      `Operacion bloqueada: esta fase solo puede ejecutarse en TEST. Entorno actual: ${APP_ENV}.`
    );
  }
}

async function extractEdgeFunctionErrorMessage(error) {
  const fallbackMessage =
    error?.message || "No se pudo ejecutar la operacion Driver.";

  try {
    if (typeof error?.context?.json === "function") {
      const payload = await error.context.json();

      if (payload?.error) {
        return payload.error;
      }
    }
  } catch (_innerError) {
    // Si el body no se puede leer, devolvemos el mensaje genérico.
  }

  return fallbackMessage;
}

async function invokeDriverOperation(action, payload = {}) {
  assertTestEnv();

  const { data, error } = await supabase.functions.invoke("driver-operations", {
    body: {
      action,
      ...payload,
    },
  });

  if (error) {
    throw new Error(
      (await extractEdgeFunctionErrorMessage(error)) ||
        `Fallo la operacion Driver: ${action}.`
    );
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  return data;
}

export async function loadDriverPanelData() {
  return invokeDriverOperation("loadPanel");
}

export async function acceptDriverRequest(requestId) {
  return invokeDriverOperation("acceptRequest", { requestId });
}

export async function advanceDriverTrip(tripId, currentStatus, requestId) {
  return invokeDriverOperation("advanceTrip", {
    tripId,
    currentStatus,
    requestId,
  });
}

export async function registerDriverTripPayment(tripId, paymentMethod) {
  return invokeDriverOperation("registerPayment", {
    tripId,
    paymentMethod,
  });
}

export async function updateDriverTripTotal(tripId, totalPriceClp) {
  return invokeDriverOperation("updateTripTotal", {
    tripId,
    totalPriceClp,
  });
}

export async function updateDriverLiveLocation(
  tripId,
  requestId,
  liveLocationPayload
) {
  return invokeDriverOperation("updateLiveLocation", {
    tripId,
    requestId,
    ...liveLocationPayload,
  });
}

export async function getDriverTripDetail({ requestId, tripId }) {
  assertTestEnv();

  const payload = {
    requestId,
    tripId,
    customerId: null,
    customerName: null,
    customerPhone: null,
    originLabel: null,
    destinationLabel: null,
    serviceType: null,
    requestStatus: null,
    tripStatus: null,
    totalPriceClp: null,
    paymentStatus: null,
    paymentMethod: null,
    inventoryItems: [],
    specialRequirements: [],
  };

  try {
    // Fetch request details
    if (requestId) {
      const { data: requestData, error: requestError } = await supabase
        .from("requests")
        .select("id, user_id, service_type, origin_text, destination_text, estimated_price_clp, total_price_clp, status")
        .eq("id", requestId)
        .single();

      if (!requestError && requestData) {
        payload.requestId = requestData.id;
        payload.customerId = requestData.user_id;
        payload.serviceType = requestData.service_type;
        payload.originLabel = requestData.origin_text;
        payload.destinationLabel = requestData.destination_text;
        payload.requestStatus = requestData.status;
        // Use total_price_clp if available, otherwise estimated_price_clp
        payload.totalPriceClp = Number(requestData.total_price_clp || requestData.estimated_price_clp || 0);
      }
    }

    // Fetch trip details
    if (tripId) {
      const { data: tripData, error: tripError } = await supabase
        .from("trips")
        .select("id, request_id, trip_status, total_price_clp, payment_status, payment_method")
        .eq("id", tripId)
        .single();

      if (!tripError && tripData) {
        payload.tripId = tripData.id;
        payload.requestId = tripData.request_id || payload.requestId;
        payload.tripStatus = tripData.trip_status;
        // Trip total_price_clp takes precedence over request price
        if (tripData.total_price_clp && Number(tripData.total_price_clp) > 0) {
          payload.totalPriceClp = Number(tripData.total_price_clp);
        }
        payload.paymentStatus = tripData.payment_status;
        payload.paymentMethod = tripData.payment_method;
      }
    }

    // Fetch payment amount if trip exists and payment is made
    if (tripId && payload.paymentStatus === "paid") {
      const { data: paymentData, error: paymentError } = await supabase
        .from("payments")
        .select("amount_clp")
        .eq("trip_id", tripId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (!paymentError && paymentData && paymentData.amount_clp) {
        payload.totalPriceClp = Number(paymentData.amount_clp);
      }
    }

    // Fetch user/customer info if customerId exists
    if (payload.customerId) {
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("full_name, phone")
        .eq("id", payload.customerId)
        .single();

      if (!profileError && profileData) {
        payload.customerName = profileData.full_name;
        payload.customerPhone = profileData.phone;
      }
    }

    // Fetch inventory items
    if (payload.requestId) {
      const { data: inventoryData, error: inventoryError } = await supabase
        .from("inventory_items")
        .select("id, item_name, quantity, category, notes")
        .eq("request_id", payload.requestId);

      if (!inventoryError && inventoryData) {
        payload.inventoryItems = inventoryData.map((item) => ({
          id: item.id,
          itemName: item.item_name,
          quantity: item.quantity,
          category: item.category,
          notes: item.notes,
        }));

        // Extract special requirements from inventory notes
        const specialRequirements = new Set();
        inventoryData.forEach((item) => {
          if (item.notes) {
            const notes = String(item.notes).toLowerCase();
            if (notes.includes("carga pesada")) specialRequirements.add("Carga pesada");
            if (notes.includes("ayuda para subir") || notes.includes("ayuda para bajar")) {
              specialRequirements.add("Ayuda para subir/bajar");
            }
            if (notes.includes("embalaje") || notes.includes("desembalaje")) {
              specialRequirements.add("Embalar/Desembalar");
            }
          }
        });
        payload.specialRequirements = Array.from(specialRequirements);
      }
    }
  } catch (error) {
    console.warn("Error fetching driver trip detail:", error?.message || error);
  }

  return payload;
}
