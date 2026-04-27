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
  const fallbackMessage = error?.message || "No se pudo ejecutar el pago.";

  try {
    if (typeof error?.context?.json === "function") {
      const payload = await error.context.json();

      if (payload?.error) {
        return payload.error;
      }
    }
  } catch (_innerError) {
    // Si no se puede leer el body, dejamos el mensaje original.
  }

  return fallbackMessage;
}

async function invokePaymentFunction(functionName, body) {
  assertTestEnv();

  const { data, error } = await supabase.functions.invoke(functionName, {
    body,
  });

  if (error) {
    throw new Error(
      (await extractEdgeFunctionErrorMessage(error)) ||
        `Fallo la funcion ${functionName}.`
    );
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  return data;
}

export async function createTripPayment({ tripId, requestId, amountClp }) {
  return invokePaymentFunction("create-trip-payment", {
    tripId,
    requestId,
    amountClp: Number(amountClp),
  });
}

export async function getPaymentStatus({ paymentId, tripId }) {
  return invokePaymentFunction("get-payment-status", {
    paymentId,
    tripId,
  });
}

export async function registerUserPayment({ tripId, paymentMethod }) {
  assertTestEnv();

  const normalizedMethod =
    paymentMethod === "transferencia" ? "transferencia" : "efectivo";

  const { data, error } = await supabase.functions.invoke("driver-operations", {
    body: {
      action: "registerPayment",
      tripId,
      paymentMethod: normalizedMethod,
    },
  });

  if (error) {
    throw new Error(
      (await extractEdgeFunctionErrorMessage(error)) ||
        "No se pudo registrar el pago del usuario."
    );
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  return data;
}
