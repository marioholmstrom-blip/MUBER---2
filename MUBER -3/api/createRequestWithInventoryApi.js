import { supabase } from "../lib/supabase";

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