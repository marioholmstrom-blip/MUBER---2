import { APP_ENV, IS_TEST_ENV } from "../lib/appEnv";
import { supabase } from "../lib/supabase";

function assertTestEnv() {
  if (!IS_TEST_ENV) {
    throw new Error(
      `Operacion bloqueada: esta fase solo puede ejecutarse en TEST. Entorno actual: ${APP_ENV}.`
    );
  }
}

function isoDay(dateLike) {
  if (!dateLike) {
    return "";
  }
  const date = new Date(dateLike);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toISOString().slice(0, 10);
}

function todayIso() {
  return isoDay(new Date());
}

function addDays(dateInput, days) {
  const next = new Date(dateInput);
  next.setDate(next.getDate() + days);
  return next;
}

function toClp(value) {
  const normalized = Number(value || 0);
  return Number.isFinite(normalized) ? normalized : 0;
}

function normalizeTripOverviewRows(rows) {
  return (rows || []).map((row) => ({
    id: row.id,
    customer_name: row.customer_name || row.customerName || "-",
    origin_text: row.origin_text || row.originText || "-",
    destination_text: row.destination_text || row.destinationText || "-",
    service_type: row.service_type || row.serviceType || "-",
    trip_status: row.trip_status || row.tripStatus || "-",
    total_price_clp: toClp(row.total_price_clp || row.totalPriceClp),
    muber_income_clp: toClp(row.muber_income_clp || row.muberIncomeClp),
    driver_net_clp: toClp(row.driver_net_clp || row.driverNetClp),
    payment_status: row.payment_status || row.paymentStatus || "-",
    simulated_driver_name:
      row.simulated_driver_name || row.simulatedDriverName || "-",
    created_at: row.created_at || row.createdAt || null,
  }));
}

async function loadTripOverviewFromView(limit = 120) {
  const { data, error } = await supabase
    .from("v_trip_overview")
    .select(
      "id, customer_name, origin_text, destination_text, service_type, trip_status, total_price_clp, muber_income_clp, driver_net_clp, payment_status, simulated_driver_name, created_at"
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return normalizeTripOverviewRows(data || []);
}

async function loadTripOverviewFromTables(limit = 120) {
  const { data: trips, error: tripsError } = await supabase
    .from("trips")
    .select(
      "id, request_id, trip_status, total_price_clp, muber_income_clp, driver_net_clp, payment_status, simulated_driver_name, created_at"
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (tripsError) {
    throw new Error(tripsError.message || "No se pudo leer tabla trips.");
  }

  const requestIds = Array.from(
    new Set((trips || []).map((item) => item.request_id).filter(Boolean))
  );

  let requestsMap = new Map();
  if (requestIds.length > 0) {
    const { data: requests, error: requestsError } = await supabase
      .from("requests")
      .select("id, customer_id, origin_text, destination_text, service_type")
      .in("id", requestIds);

    if (requestsError) {
      throw new Error(requestsError.message || "No se pudo leer tabla requests.");
    }

    requestsMap = new Map((requests || []).map((request) => [request.id, request]));
  }

  const customerIds = Array.from(
    new Set(
      (Array.from(requestsMap.values()) || [])
        .map((request) => request?.customer_id)
        .filter(Boolean)
    )
  );

  let profilesMap = new Map();
  if (customerIds.length > 0) {
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", customerIds);

    if (profilesError) {
      throw new Error(profilesError.message || "No se pudo leer tabla profiles.");
    }

    profilesMap = new Map((profiles || []).map((profile) => [profile.id, profile]));
  }

  const rows = (trips || []).map((trip) => {
    const request = requestsMap.get(trip.request_id) || {};
    const customer = profilesMap.get(request.customer_id) || {};
    const totalPrice = toClp(trip.total_price_clp);
    const muberIncome = toClp(trip.muber_income_clp) || Math.round(totalPrice * 0.3);
    const driverNet = toClp(trip.driver_net_clp) || Math.round(totalPrice * 0.7);

    return {
      id: trip.id,
      customer_name: customer.full_name || "-",
      origin_text: request.origin_text || "-",
      destination_text: request.destination_text || "-",
      service_type: request.service_type || "-",
      trip_status: trip.trip_status || "-",
      total_price_clp: totalPrice,
      muber_income_clp: muberIncome,
      driver_net_clp: driverNet,
      payment_status: trip.payment_status || "-",
      simulated_driver_name: trip.simulated_driver_name || "-",
      created_at: trip.created_at,
    };
  });

  return rows;
}

export async function loadRevenueSummary() {
  assertTestEnv();

  try {
    const { data, error } = await supabase.rpc("get_revenue_summary");
    if (!error && data) {
      const first = Array.isArray(data) ? data[0] : data;
      return {
        gross_clp: toClp(first?.gross_clp),
        muber_income: toClp(first?.muber_income),
        driver_net: toClp(first?.driver_net),
        completed_trips: Number(first?.completed_trips || 0),
      };
    }
  } catch (_rpcError) {
    // fallback below
  }

  const trips = await loadTripOverviewFromTables(500);
  const completedTrips = trips.filter((trip) => String(trip.trip_status) === "completed");

  const gross = completedTrips.reduce(
    (sum, trip) => sum + toClp(trip.total_price_clp),
    0
  );
  const muber = completedTrips.reduce(
    (sum, trip) => sum + toClp(trip.muber_income_clp || Math.round(toClp(trip.total_price_clp) * 0.3)),
    0
  );
  const driverNet = completedTrips.reduce(
    (sum, trip) => sum + toClp(trip.driver_net_clp || Math.round(toClp(trip.total_price_clp) * 0.7)),
    0
  );

  return {
    gross_clp: gross,
    muber_income: muber,
    driver_net: driverNet,
    completed_trips: completedTrips.length,
  };
}

export async function loadDailyMetrics(days = 7) {
  assertTestEnv();

  try {
    const { data, error } = await supabase.rpc("get_daily_metrics", {
      p_days: days,
    });

    if (!error && Array.isArray(data) && data.length > 0) {
      return data.map((item) => ({
        day: item.day || item.metric_day || "",
        gross_clp: toClp(item.gross_clp),
      }));
    }
  } catch (_rpcError) {
    // fallback below
  }

  const fromDate = addDays(new Date(), -(days - 1));
  const fromIso = fromDate.toISOString();

  const { data: trips, error } = await supabase
    .from("trips")
    .select("created_at, total_price_clp")
    .gte("created_at", fromIso)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message || "No se pudieron cargar métricas diarias.");
  }

  const dayMap = new Map();
  for (let i = 0; i < days; i += 1) {
    const day = isoDay(addDays(fromDate, i));
    dayMap.set(day, 0);
  }

  (trips || []).forEach((trip) => {
    const day = isoDay(trip.created_at);
    if (!dayMap.has(day)) {
      return;
    }
    dayMap.set(day, dayMap.get(day) + toClp(trip.total_price_clp));
  });

  return Array.from(dayMap.entries()).map(([day, gross_clp]) => ({
    day,
    gross_clp,
  }));
}

export async function loadAdminTrips(limit = 120) {
  assertTestEnv();

  try {
    return await loadTripOverviewFromView(limit);
  } catch (_viewError) {
    return loadTripOverviewFromTables(limit);
  }
}

export async function loadAdminDrivers() {
  assertTestEnv();

  const { data, error } = await supabase
    .from("drivers")
    .select(
      "id, profile_id, is_online, rating, current_commission_percent, aaa_bonus_enabled, notes, profiles:profile_id(full_name, phone, email)"
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message || "No se pudo cargar tabla de conductores.");
  }

  return (data || []).map((driver) => ({
    id: driver.id,
    profile_id: driver.profile_id,
    full_name: driver.profiles?.full_name || "-",
    phone: driver.profiles?.phone || "-",
    email: driver.profiles?.email || "-",
    is_online: Boolean(driver.is_online),
    rating: Number(driver.rating || 0),
    current_commission_percent: Number(driver.current_commission_percent || 70),
    aaa_bonus_enabled: Boolean(driver.aaa_bonus_enabled),
    notes: driver.notes || "",
  }));
}

export async function loadAdminApplications(limit = 150) {
  assertTestEnv();

  const { data, error } = await supabase
    .from("driver_applications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message || "No se pudo cargar driver_applications.");
  }

  return data || [];
}

export async function loadAdminRequests(limit = 150) {
  assertTestEnv();

  const { data, error } = await supabase
    .from("requests")
    .select(
      "id, customer_id, service_type, origin_text, destination_text, inventory_summary, estimated_price_clp, status, requested_at"
    )
    .order("requested_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message || "No se pudo cargar requests.");
  }

  const customerIds = Array.from(
    new Set((data || []).map((item) => item.customer_id).filter(Boolean))
  );

  let profilesMap = new Map();
  if (customerIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", customerIds);

    profilesMap = new Map((profiles || []).map((profile) => [profile.id, profile]));
  }

  return (data || []).map((item) => ({
    ...item,
    customer_name: profilesMap.get(item.customer_id)?.full_name || "-",
  }));
}

export async function loadAdminDashboardData() {
  assertTestEnv();

  const [revenueSummary, dailyMetrics, trips, drivers, applications, requests] =
    await Promise.all([
      loadRevenueSummary(),
      loadDailyMetrics(7),
      loadAdminTrips(120),
      loadAdminDrivers(),
      loadAdminApplications(150),
      loadAdminRequests(150),
    ]);

  return {
    revenueSummary,
    dailyMetrics,
    trips,
    drivers,
    applications,
    requests,
    loadedAt: new Date().toISOString(),
    today: todayIso(),
  };
}

export async function toggleDriverOnlineByAdmin(driverId, isOnline) {
  assertTestEnv();

  const { data, error } = await supabase
    .from("drivers")
    .update({ is_online: Boolean(isOnline) })
    .eq("id", driverId)
    .select("id, is_online")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "No se pudo cambiar estado online del conductor.");
  }

  return data;
}

export async function editDriverCommission(driverId, commissionPercent) {
  assertTestEnv();

  const normalized = Number(commissionPercent);
  if (!Number.isFinite(normalized) || normalized < 0 || normalized > 100) {
    throw new Error("Comisión inválida. Debe estar entre 0 y 100.");
  }

  const { data, error } = await supabase
    .from("drivers")
    .update({ current_commission_percent: Math.round(normalized) })
    .eq("id", driverId)
    .select("id, current_commission_percent")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "No se pudo editar comisión del conductor.");
  }

  return data;
}

export async function rejectApplication(applicationId, reviewNotes = "") {
  assertTestEnv();

  const { data, error } = await supabase
    .from("driver_applications")
    .update({
      application_status: "rejected",
      review_notes: String(reviewNotes || "").trim() || "Rechazada por administración",
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", applicationId)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "No se pudo rechazar la postulación.");
  }

  return data;
}

export async function approveApplication(applicationId, reviewNotes = "") {
  assertTestEnv();

  const { data: application, error: appError } = await supabase
    .from("driver_applications")
    .select("*")
    .eq("id", applicationId)
    .single();

  if (appError || !application) {
    throw new Error(appError?.message || "No se encontró la postulación a aprobar.");
  }

  let approvedProfileId =
    application.approved_profile_id || application.applicant_profile_id || null;

  if (!approvedProfileId && application.email) {
    const { data: profileByEmail } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", String(application.email).toLowerCase())
      .limit(1)
      .maybeSingle();

    approvedProfileId = profileByEmail?.id || null;
  }

  if (!approvedProfileId) {
    throw new Error(
      "No se pudo aprobar: la postulación no está vinculada a un perfil existente. Primero crea o vincula el perfil del chofer en TEST."
    );
  }

  let approvedDriverId = application.approved_driver_id || null;

  if (!approvedDriverId) {
    const { data: existingDriver } = await supabase
      .from("drivers")
      .select("id")
      .eq("profile_id", approvedProfileId)
      .maybeSingle();

    if (existingDriver?.id) {
      approvedDriverId = existingDriver.id;
    } else {
      const { data: insertedDriver, error: driverInsertError } = await supabase
        .from("drivers")
        .insert([
          {
            profile_id: approvedProfileId,
            is_active: true,
            is_online: false,
            current_commission_percent: 70,
          },
        ])
        .select("id")
        .single();

      if (driverInsertError || !insertedDriver?.id) {
        throw new Error(
          driverInsertError?.message || "No se pudo crear el conductor al aprobar."
        );
      }
      approvedDriverId = insertedDriver.id;
    }
  }

  let approvedVehicleId = application.approved_vehicle_id || null;

  if (!approvedVehicleId && approvedDriverId) {
    let existingVehicle = null;

    if (application.vehicle_plate) {
      const { data: vehicleByPlate } = await supabase
        .from("vehicles")
        .select("id")
        .eq("plate", String(application.vehicle_plate).toUpperCase())
        .maybeSingle();
      existingVehicle = vehicleByPlate;
    }

    if (!existingVehicle) {
      const { data: vehicleByDriver } = await supabase
        .from("vehicles")
        .select("id")
        .eq("driver_id", approvedDriverId)
        .limit(1)
        .maybeSingle();
      existingVehicle = vehicleByDriver;
    }

    if (existingVehicle?.id) {
      approvedVehicleId = existingVehicle.id;
    } else {
      const plate = String(application.vehicle_plate || "").trim().toUpperCase();
      const fallbackPlate = `TMP-${String(approvedDriverId).slice(0, 8).toUpperCase()}`;

      const { data: insertedVehicle, error: vehicleInsertError } = await supabase
        .from("vehicles")
        .insert([
          {
            driver_id: approvedDriverId,
            brand: application.vehicle_brand || "Por definir",
            model: application.vehicle_model || "Por definir",
            plate: plate || fallbackPlate,
            vehicle_type: application.vehicle_type || "flete_estandar",
            capacity_notes: application.vehicle_capacity || "",
          },
        ])
        .select("id")
        .single();

      if (vehicleInsertError || !insertedVehicle?.id) {
        throw new Error(
          vehicleInsertError?.message || "No se pudo crear el vehículo al aprobar."
        );
      }
      approvedVehicleId = insertedVehicle.id;
    }
  }

  const { data: updatedApplication, error: updateError } = await supabase
    .from("driver_applications")
    .update({
      application_status: "approved",
      reviewed_at: new Date().toISOString(),
      review_notes: String(reviewNotes || "").trim() || "Aprobada por administración",
      approved_profile_id: approvedProfileId,
      approved_driver_id: approvedDriverId,
      approved_vehicle_id: approvedVehicleId,
    })
    .eq("id", applicationId)
    .select("*")
    .single();

  if (updateError || !updatedApplication) {
    throw new Error(updateError?.message || "No se pudo finalizar aprobación.");
  }

  return updatedApplication;
}
