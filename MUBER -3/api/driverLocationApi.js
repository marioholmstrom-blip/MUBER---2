import { APP_ENV, IS_TEST_ENV } from "../lib/appEnv";
import { supabase } from "../lib/supabase";

function assertTestEnv() {
  if (!IS_TEST_ENV) {
    throw new Error(
      `Operacion bloqueada: esta fase solo puede ejecutarse en TEST. Entorno actual: ${APP_ENV}.`
    );
  }
}

/**
 * Update driver live location for an active trip
 * @param {Object} params
 * @param {string} params.tripId - The trip ID
 * @param {string} params.driverId - The driver ID
 * @param {number} params.latitude - Latitude
 * @param {number} params.longitude - Longitude
 * @param {number|null} params.heading - Heading in degrees (0-360)
 * @param {number|null} params.speed - Speed in km/h
 * @param {number|null} params.accuracy - Accuracy in meters
 * @returns {Promise<Object>} Result of the update operation
 */
export async function updateDriverLiveLocation({
  tripId,
  driverId,
  latitude,
  longitude,
  heading = null,
  speed = null,
  accuracy = null,
}) {
  assertTestEnv();

  const { data, error } = await supabase
    .from("driver_live_locations")
    .upsert(
      {
        trip_id: tripId,
        driver_id: driverId,
        latitude,
        longitude,
        heading,
        speed,
        accuracy,
        is_active: true,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "trip_id",
      }
    )
    .select()
    .single();

  if (error) {
    throw new Error(`No se pudo actualizar ubicación: ${error.message}`);
  }

  // Also insert into history table
  await supabase.from("trip_location_history").insert({
    trip_id: tripId,
    driver_id: driverId,
    latitude,
    longitude,
    heading,
    speed,
    accuracy,
    recorded_at: new Date().toISOString(),
  });

  return data;
}

/**
 * Deactivate driver live location for a completed trip
 * @param {Object} params
 * @param {string} params.tripId - The trip ID
 * @param {string} params.driverId - The driver ID
 * @returns {Promise<Object>} Result of the update operation
 */
export async function deactivateDriverLiveLocation({ tripId, driverId }) {
  assertTestEnv();

  const { data, error } = await supabase
    .from("driver_live_locations")
    .update({
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq("trip_id", tripId)
    .eq("driver_id", driverId)
    .select()
    .single();

  if (error) {
    throw new Error(`No se pudo desactivar ubicación: ${error.message}`);
  }

  return data;
}

/**
 * Get current driver live location for a trip
 * @param {Object} params
 * @param {string} params.tripId - The trip ID
 * @returns {Promise<Object|null>} Current driver location or null
 */
export async function getDriverLiveLocation({ tripId }) {
  assertTestEnv();

  const { data, error } = await supabase
    .from("driver_live_locations")
    .select("*")
    .eq("trip_id", tripId)
    .eq("is_active", true)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      // No rows returned
      return null;
    }
    throw new Error(`No se pudo obtener ubicación: ${error.message}`);
  }

  return data;
}

/**
 * Subscribe to driver live location changes for a trip
 * @param {Object} params
 * @param {string} params.tripId - The trip ID
 * @param {Function} params.onUpdate - Callback function when location updates
 * @returns {Object} Subscription object
 */
export function subscribeToDriverLocation({ tripId, onUpdate }) {
  assertTestEnv();

  const subscription = supabase
    .channel(`driver_location_${tripId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "driver_live_locations",
        filter: `trip_id=eq.${tripId}`,
      },
      (payload) => {
        if (payload.eventType === "UPDATE" || payload.eventType === "INSERT") {
          onUpdate(payload.new);
        }
      }
    )
    .subscribe();

  return subscription;
}

/**
 * Unsubscribe from driver location updates
 * @param {Object} subscription - Subscription object from subscribeToDriverLocation
 */
export function unsubscribeFromDriverLocation(subscription) {
  if (subscription) {
    supabase.removeChannel(subscription);
  }
}

/**
 * Delete driver live location for a trip (cleanup)
 * @param {Object} params
 * @param {string} params.tripId - The trip ID
 * @param {string} params.driverId - The driver ID
 * @returns {Promise<Object>} Result of the delete operation
 */
export async function deleteDriverLiveLocation({ tripId, driverId }) {
  assertTestEnv();

  const { error } = await supabase
    .from("driver_live_locations")
    .delete()
    .eq("trip_id", tripId)
    .eq("driver_id", driverId);

  if (error) {
    throw new Error(`No se pudo eliminar ubicación: ${error.message}`);
  }

  return { success: true };
}
