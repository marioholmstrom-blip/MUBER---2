import { APP_ENV, IS_TEST_ENV } from "../lib/appEnv";
import { supabase } from "../lib/supabase";

const DECLINED_MARKER = "[muber_declined_requests]:";

function assertTestEnv() {
  if (!IS_TEST_ENV) {
    throw new Error(
      `Operacion bloqueada: esta fase solo puede ejecutarse en TEST. Entorno actual: ${APP_ENV}.`
    );
  }
}

function parseDeclinedRequestIdsFromNotes(notes) {
  const rawNotes = String(notes || "");
  const markerIndex = rawNotes.indexOf(DECLINED_MARKER);

  if (markerIndex === -1) {
    return [];
  }

  const markerLine = rawNotes
    .slice(markerIndex)
    .split("\n")
    .find((line) => line.startsWith(DECLINED_MARKER));

  if (!markerLine) {
    return [];
  }

  const csv = markerLine.replace(DECLINED_MARKER, "").trim();
  if (!csv) {
    return [];
  }

  return Array.from(
    new Set(
      csv
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    )
  );
}

function upsertDeclinedMarkerInNotes(notes, requestIds) {
  const rawNotes = String(notes || "");
  const cleanedLines = rawNotes
    .split("\n")
    .filter((line) => !line.startsWith(DECLINED_MARKER));
  const markerLine = `${DECLINED_MARKER}${requestIds.join(",")}`;
  const base = cleanedLines.join("\n").trim();

  if (!base) {
    return markerLine;
  }

  return `${base}\n${markerLine}`;
}

async function getCurrentDriverRow() {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session?.user?.id) {
    throw new Error(
      sessionError?.message ||
        "No se pudo validar la sesión del chofer para actualizar estado online."
    );
  }

  const { data: driverRow, error: driverError } = await supabase
    .from("drivers")
    .select("id, profile_id, is_online, notes")
    .eq("profile_id", session.user.id)
    .single();

  if (driverError || !driverRow) {
    throw new Error(
      driverError?.message ||
        "No se pudo cargar el perfil del chofer en Supabase TEST."
    );
  }

  return driverRow;
}

export async function setDriverOnline(isOnline) {
  assertTestEnv();

  const driverRow = await getCurrentDriverRow();

  const { data, error } = await supabase
    .from("drivers")
    .update({ is_online: Boolean(isOnline) })
    .eq("id", driverRow.id)
    .select("id, is_online")
    .single();

  if (error || !data) {
    throw new Error(
      error?.message ||
        "No se pudo actualizar is_online del chofer en Supabase TEST."
    );
  }

  return {
    driverId: data.id,
    isOnline: Boolean(data.is_online),
  };
}

export async function getDeclinedDriverRequestIds() {
  assertTestEnv();

  const driverRow = await getCurrentDriverRow();
  return parseDeclinedRequestIdsFromNotes(driverRow.notes);
}

export async function declineDriverRequest(requestId) {
  assertTestEnv();

  const normalizedRequestId = String(requestId || "").trim();
  if (!normalizedRequestId) {
    throw new Error("Debes indicar una solicitud válida para rechazar.");
  }

  const driverRow = await getCurrentDriverRow();
  const existingDeclined = parseDeclinedRequestIdsFromNotes(driverRow.notes);

  if (existingDeclined.includes(normalizedRequestId)) {
    return {
      driverId: driverRow.id,
      declinedRequestIds: existingDeclined,
    };
  }

  const nextDeclined = [normalizedRequestId, ...existingDeclined].slice(0, 300);
  const nextNotes = upsertDeclinedMarkerInNotes(driverRow.notes, nextDeclined);

  const { data, error } = await supabase
    .from("drivers")
    .update({ notes: nextNotes })
    .eq("id", driverRow.id)
    .select("id, notes")
    .single();

  if (error || !data) {
    throw new Error(
      error?.message ||
        "No se pudo guardar el rechazo de la solicitud en Supabase TEST."
    );
  }

  return {
    driverId: data.id,
    declinedRequestIds: parseDeclinedRequestIdsFromNotes(data.notes),
  };
}
