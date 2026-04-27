import * as Location from "expo-location";

export async function getCurrentDevicePosition(options = {}) {
  const {
    accuracy = Location.Accuracy.Balanced,
  } = options;

  const permission = await Location.requestForegroundPermissionsAsync();

  if (permission?.status !== "granted") {
    throw new Error(
      "Permiso de ubicación requerido. Activa la ubicación para compartir el avance del viaje."
    );
  }

  const position = await Location.getCurrentPositionAsync({
    accuracy,
  });

  const coords = position?.coords || {};

  const latitude = Number(coords.latitude);
  const longitude = Number(coords.longitude);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new Error("No se pudo obtener una ubicación válida del dispositivo.");
  }

  const heading =
    typeof coords.heading === "number" && Number.isFinite(coords.heading)
      ? Number(coords.heading)
      : null;

  const speedMetersPerSecond =
    typeof coords.speed === "number" && Number.isFinite(coords.speed)
      ? Number(coords.speed)
      : null;

  const speedKph =
    speedMetersPerSecond !== null
      ? speedMetersPerSecond * 3.6
      : null;

  const accuracyMeters =
    typeof coords.accuracy === "number" && Number.isFinite(coords.accuracy)
      ? Number(coords.accuracy)
      : null;

  return {
    latitude,
    longitude,
    heading,

    // Compatibilidad con APIs que esperan speed en m/s.
    speed: speedMetersPerSecond,

    // Compatibilidad con código existente de MUBER que usa speedKph.
    speedKph,

    // Compatibilidad con APIs que esperan accuracy.
    accuracy: accuracyMeters,

    // Compatibilidad con código existente de MUBER que usa accuracyMeters.
    accuracyMeters,

    recordedAt: new Date(position.timestamp || Date.now()).toISOString(),
  };
}
