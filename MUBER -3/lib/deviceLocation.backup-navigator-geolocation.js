export async function getCurrentDevicePosition(options = {}) {
  const geolocation = globalThis?.navigator?.geolocation;

  if (!geolocation?.getCurrentPosition) {
    throw new Error(
      "Ubicacion no disponible en esta build TEST. Necesitas ejecutar la app en un entorno con geolocalizacion habilitada."
    );
  }

  return new Promise((resolve, reject) => {
    geolocation.getCurrentPosition(
      (position) => {
        const coords = position?.coords || {};

        resolve({
          latitude: Number(coords.latitude),
          longitude: Number(coords.longitude),
          heading:
            Number.isFinite(coords.heading) && coords.heading !== null
              ? Number(coords.heading)
              : null,
          speedKph:
            Number.isFinite(coords.speed) && coords.speed !== null
              ? Number(coords.speed) * 3.6
              : null,
          accuracyMeters:
            Number.isFinite(coords.accuracy) && coords.accuracy !== null
              ? Number(coords.accuracy)
              : null,
          recordedAt: new Date().toISOString(),
        });
      },
      (error) => {
        reject(
          new Error(
            error?.message || "No se pudo obtener la ubicacion actual del dispositivo."
          )
        );
      },
      {
        enableHighAccuracy: true,
        timeout: options.timeoutMs || 10000,
        maximumAge: options.maximumAgeMs || 5000,
      }
    );
  });
}
