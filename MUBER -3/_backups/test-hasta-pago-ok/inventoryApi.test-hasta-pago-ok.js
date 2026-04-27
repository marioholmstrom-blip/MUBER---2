import { supabase } from "./lib/supabase";

export const INVENTORY_METHODS = [
  {
    id: "manual",
    label: "Manual",
    description: "Agregar objetos o bultos uno por uno.",
    enabled: true,
  },
  {
    id: "scanner",
    label: "Escaner",
    description: "Lectura asistida de objetos. Proximamente.",
    enabled: false,
  },
  {
    id: "voz",
    label: "Voz",
    description: "Registro por voz guiado. Proximamente.",
    enabled: false,
  },
];

export const INVENTORY_SPECIAL_NEEDS = [
  "Fragil",
  "Carga pesada",
  "Ayuda para subir o bajar",
  "Embalaje extra",
];

export function createEmptyInventoryItem() {
  return {
    localId: `inventory-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: "",
    quantity: "1",
    category: "objeto",
    notes: "",
    estimatedWeightKg: null,
    estimatedVolumeM3: null,
    estimationSource: "",
  };
}

export function normalizeInventoryItems(items = []) {
  return items
    .map((item, index) => {
      const name = String(item?.name || "").trim();
      const quantityValue = Number.parseInt(String(item?.quantity || "1"), 10);
      const quantity =
        Number.isFinite(quantityValue) && quantityValue > 0 ? quantityValue : 1;
      const category = String(item?.category || "objeto").trim() || "objeto";
      const notes = String(item?.notes || "").trim();

      if (!name) {
        return null;
      }

      return {
        localId: String(item?.localId || `inventory-item-${index}`),
        name,
        quantity,
        category,
        notes,
        estimatedWeightKg:
          item?.estimatedWeightKg == null
            ? null
            : Number(item.estimatedWeightKg),
        estimatedVolumeM3:
          item?.estimatedVolumeM3 == null
            ? null
            : Number(item.estimatedVolumeM3),
        estimationSource: String(item?.estimationSource || "").trim(),
      };
    })
    .filter(Boolean);
}

export function buildInventorySizingInput(items = []) {
  return normalizeInventoryItems(items).map((item) => ({
    name: item.name,
    category: item.category,
    quantity: item.quantity,
    notes: item.notes,
    estimatedWeightKg: item.estimatedWeightKg,
    estimatedVolumeM3: item.estimatedVolumeM3,
    estimationSource: item.estimationSource || null,
  }));
}

export function buildInventorySummary({
  method,
  items = [],
  specialNeeds = [],
} = {}) {
  const normalizedItems = normalizeInventoryItems(items);
  const cleanNeeds = (specialNeeds || [])
    .map((value) => String(value || "").trim())
    .filter(Boolean);

  const totalUnits = normalizedItems.reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0
  );

  const itemLines = normalizedItems.map((item) => {
    const base = `${item.quantity}x ${item.name}`;
    const detail =
      item.category && item.category !== "objeto"
        ? ` (${item.category})`
        : "";
    return `${base}${detail}`;
  });

  const parts = [
    `Metodo: ${String(method || "manual").trim() || "manual"}`,
    `Items: ${normalizedItems.length}`,
    `Unidades: ${totalUnits}`,
  ];

  if (itemLines.length > 0) {
    parts.push(`Detalle: ${itemLines.join(", ")}`);
  }

  if (cleanNeeds.length > 0) {
    parts.push(`Necesidades: ${cleanNeeds.join(", ")}`);
  }

  return parts.join(" | ");
}

function buildInventoryItemInsertCandidates({ requestId, items, specialNeeds }) {
  const cleanNeeds = (specialNeeds || []).join(", ");

  const baseRows = items.map((item, index) => ({
    request_id: requestId,
    item_name: item.name,
    quantity: item.quantity,
    category: item.category,
    notes: [item.notes, cleanNeeds].filter(Boolean).join(" | "),
    sort_order: index,
  }));

  return [
    baseRows,
    baseRows.map((row) => ({
      request_id: row.request_id,
      name: row.item_name,
      quantity: row.quantity,
      category: row.category,
      notes: row.notes,
      position: row.sort_order,
    })),
    baseRows.map((row) => ({
      request_id: row.request_id,
      description: row.item_name,
      quantity: row.quantity,
      category: row.category,
      notes: row.notes,
      order_index: row.sort_order,
    })),
    items.map((item, index) => ({
      request_id: requestId,
      inventory_item: item.name,
      quantity: item.quantity,
      details: JSON.stringify({
        category: item.category,
        notes: item.notes,
        specialNeeds,
        sortOrder: index,
      }),
    })),
  ];
}

async function insertInventoryItemsWithFallback({
  requestId,
  items,
  specialNeeds,
}) {
  if (!items.length) {
    return [];
  }

  let lastError = null;

  for (const candidateRows of buildInventoryItemInsertCandidates({
    requestId,
    items,
    specialNeeds,
  })) {
    const { data, error } = await supabase
      .from("inventory_items")
      .insert(candidateRows)
      .select();

    if (!error) {
      return data || [];
    }

    lastError = error;
  }

  throw new Error(
    lastError?.message ||
      "No se pudo insertar inventory_items con el esquema disponible."
  );
}

export async function replaceInventoryForRequest({
  requestId,
  inventoryMethod,
  inventoryItems,
  inventorySpecialNeeds,
  estimatedPriceClp,
}) {
  const normalizedItems = normalizeInventoryItems(inventoryItems);
  const summary = buildInventorySummary({
    method: inventoryMethod,
    items: normalizedItems,
    specialNeeds: inventorySpecialNeeds,
  });
  const nextEstimatedPriceClp =
    estimatedPriceClp == null ? undefined : Number(estimatedPriceClp);
  const requestPatch = {
    inventory_method: inventoryMethod,
    inventory_summary: summary,
  };

  if (
    nextEstimatedPriceClp != null &&
    Number.isFinite(nextEstimatedPriceClp) &&
    nextEstimatedPriceClp >= 0
  ) {
    requestPatch.estimated_price_clp = Math.round(nextEstimatedPriceClp);
  }

  const { error: requestError } = await supabase
    .from("requests")
    .update(requestPatch)
    .eq("id", requestId);

  if (requestError) {
    throw new Error(
      requestError.message || "No se pudo actualizar el resumen de inventario."
    );
  }

  const { error: deleteError } = await supabase
    .from("inventory_items")
    .delete()
    .eq("request_id", requestId);

  if (deleteError) {
    throw new Error(
      deleteError.message || "No se pudo limpiar inventory_items previos."
    );
  }

  const insertedItems = await insertInventoryItemsWithFallback({
    requestId,
    items: normalizedItems,
    specialNeeds: inventorySpecialNeeds,
  });

  return {
    inventorySummary: summary,
    inventoryItems: insertedItems,
    estimatedPriceClp:
      requestPatch.estimated_price_clp == null
        ? null
        : requestPatch.estimated_price_clp,
  };
}

export async function loadInventoryForRequest(requestId) {
  const { data: requestData, error: requestError } = await supabase
    .from("requests")
    .select("inventory_method, inventory_summary")
    .eq("id", requestId)
    .single();

  if (requestError) {
    throw new Error(
      requestError.message || "No se pudo leer el request de inventario."
    );
  }

  const { data: itemRows, error: itemsError } = await supabase
    .from("inventory_items")
    .select("*")
    .eq("request_id", requestId)
    .order("id", { ascending: true });

  if (itemsError) {
    throw new Error(itemsError.message || "No se pudo leer inventory_items.");
  }

  const items = (itemRows || []).map((row, index) => ({
    localId: String(row.id || `inventory-row-${index}`),
    name: String(
      row.item_name || row.name || row.description || row.inventory_item || ""
    ).trim(),
    quantity: String(row.quantity || 1),
    category: String(row.category || "objeto").trim() || "objeto",
    notes: String(row.notes || row.details || "").trim(),
  }));

  return {
    inventoryMethod: String(requestData?.inventory_method || "").trim(),
    inventorySummary: String(requestData?.inventory_summary || "").trim(),
    inventoryItems: normalizeInventoryItems(items),
  };
}
