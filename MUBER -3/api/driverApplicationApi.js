import { APP_ENV, IS_TEST_ENV } from "../lib/appEnv";
import { supabase } from "../lib/supabase";

function assertTestEnv() {
  if (!IS_TEST_ENV) {
    throw new Error(
      `Operacion bloqueada: esta fase solo puede ejecutarse en TEST. Entorno actual: ${APP_ENV}.`
    );
  }
}

function buildDriverApplicationPayload(formData) {
  return {
    full_name: formData.fullName.trim(),
    phone: formData.phone.trim(),
    email: formData.email.trim().toLowerCase(),
    city: formData.city.trim(),
    notes: formData.notes.trim(),
    vehicle_type: formData.vehicleType.trim(),
    vehicle_brand: formData.vehicleBrand.trim(),
    vehicle_model: formData.vehicleModel.trim(),
    vehicle_plate: formData.vehiclePlate.trim().toUpperCase(),
    vehicle_capacity: formData.vehicleCapacity.trim(),
    available_now: formData.availableNow,
    zones: formData.zones.trim(),
    schedule_text: formData.scheduleText.trim(),
    accepts_last_mile: formData.acceptsLastMile,
    accepts_standard: formData.acceptsStandard,
    accepts_assisted: formData.acceptsAssisted,
    accepts_fragile: formData.acceptsFragile,
    has_id_document: formData.hasIdDocument,
    has_license_document: formData.hasLicenseDocument,
    has_vehicle_document: formData.hasVehicleDocument,
    has_insurance_document: formData.hasInsuranceDocument,
    application_status: "submitted",
  };
}

export async function submitDriverApplicationRecord(formData) {
  assertTestEnv();

  const payload = buildDriverApplicationPayload(formData);

  const { data, error } = await supabase
    .from("driver_applications")
    .insert([payload])
    .select()
    .single();

  if (error || !data) {
    throw new Error(error?.message || "No se pudo guardar la postulacion.");
  }

  return {
    application: data,
    email: payload.email,
  };
}

export async function findLatestDriverApplicationByEmail(email) {
  assertTestEnv();

  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail) {
    throw new Error("Escribe el correo con el que hiciste la inscripcion.");
  }

  const { data, error } = await supabase
    .from("driver_applications")
    .select("*")
    .eq("email", normalizedEmail)
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) {
    throw new Error(error.message || "No se pudo consultar el estado.");
  }

  if (!data || data.length === 0) {
    throw new Error("No encontramos una postulacion con ese correo.");
  }

  return {
    application: data[0],
    email: normalizedEmail,
  };
}
