import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const SIZE_OPTIONS = ["Pequeño", "Mediano", "Grande", "Muy grande"];

function createDraftItem() {
  return {
    id: `inv-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: "",
    quantity: "1",
    size: "Mediano",
    fragile: false,
    notes: "",
    photoPending: false,
  };
}

function normalizeQuantity(inputValue) {
  const parsed = Number(String(inputValue || "").replace(/[^0-9]/g, ""));
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 1;
  }
  return Math.min(parsed, 99);
}

function buildInventorySummary(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return "Sin objetos agregados";
  }

  return items
    .map((item) => `${normalizeQuantity(item.quantity)} ${item.name} (${item.size})`)
    .join(", ");
}

function mapSizeToCategory(sizeLabel) {
  const normalized = String(sizeLabel || "").toLowerCase();
  if (normalized.includes("muy")) return "muy_grande";
  if (normalized.includes("gran")) return "grande";
  if (normalized.includes("med")) return "mediano";
  return "pequeno";
}

function buildNotes(item) {
  const notesParts = [];

  if (item.fragile) {
    notesParts.push("Frágil");
  }

  if (item.photoPending) {
    notesParts.push("Foto pendiente (Storage no implementado)");
  }

  if (item.notes?.trim()) {
    notesParts.push(item.notes.trim());
  }

  return notesParts.join(" | ");
}

export default function InventoryStepRefactor({
  onBack,
  onConfirm,
  serviceTypeLabel = "Servicio",
}) {
  const [inventoryMethod, setInventoryMethod] = useState("manual");
  const [voiceActive, setVoiceActive] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draftItem, setDraftItem] = useState(createDraftItem());
  const [editingItemId, setEditingItemId] = useState(null);
  const [itemList, setItemList] = useState([]);
  const [summaryText, setSummaryText] = useState("Sin objetos agregados");
  const [summaryTouched, setSummaryTouched] = useState(false);

  const hasItems = itemList.length > 0;
  const screenState = saving
    ? "saving"
    : voiceActive
      ? "voice_active"
      : hasItems
        ? "with_items"
        : "empty";

  const autoSummary = useMemo(() => buildInventorySummary(itemList), [itemList]);

  useEffect(() => {
    if (!summaryTouched) {
      setSummaryText(autoSummary);
    }
  }, [autoSummary, summaryTouched]);

  const resetDraft = () => {
    setDraftItem(createDraftItem());
    setEditingItemId(null);
  };

  const updateDraft = (field, value) => {
    setDraftItem((prev) => ({ ...prev, [field]: value }));
  };

  const startVoiceRecognition = () => {
    setInventoryMethod("voice");
    setVoiceActive(true);

    setTimeout(() => {
      setVoiceActive(false);
      if (!draftItem.name.trim()) {
        updateDraft("name", "Objeto dictado por voz");
      }
      Alert.alert("Voz", "Texto de voz aplicado al nombre del objeto.");
    }, 1300);
  };

  const openCamera = () => {
    setInventoryMethod("photo");
    updateDraft("photoPending", true);
    Alert.alert(
      "Foto pendiente",
      "La carga a Supabase Storage se implementará en una siguiente fase."
    );
  };

  const validateDraft = () => {
    if (!draftItem.name.trim()) {
      Alert.alert("Dato requerido", "Debes ingresar el nombre del objeto.");
      return false;
    }

    if (normalizeQuantity(draftItem.quantity) < 1) {
      Alert.alert("Cantidad inválida", "La cantidad debe ser mayor o igual a 1.");
      return false;
    }

    return true;
  };

  const addOrUpdateItem = () => {
    if (!validateDraft()) {
      return;
    }

    setInventoryMethod((prev) => (prev === "manual" ? "manual" : prev));

    const payload = {
      ...draftItem,
      name: draftItem.name.trim(),
      quantity: String(normalizeQuantity(draftItem.quantity)),
      notes: draftItem.notes.trim(),
    };

    if (editingItemId) {
      setItemList((prev) =>
        prev.map((item) => (item.id === editingItemId ? { ...payload, id: editingItemId } : item))
      );
      resetDraft();
      return;
    }

    setItemList((prev) => [...prev, { ...payload, id: createDraftItem().id }]);
    resetDraft();
  };

  const editItem = (itemId) => {
    const item = itemList.find((row) => row.id === itemId);
    if (!item) {
      return;
    }

    setEditingItemId(itemId);
    setDraftItem({ ...item });
  };

  const deleteItem = (itemId) => {
    setItemList((prev) => prev.filter((item) => item.id !== itemId));
    if (editingItemId === itemId) {
      resetDraft();
    }
  };

  const handleContinue = async () => {
    if (!hasItems) {
      return;
    }

    const inventorySpecialNeeds = itemList.some((item) => item.fragile)
      ? ["Frágil"]
      : [];

    const inventoryItems = itemList.map((item) => ({
      name: item.name,
      quantity: normalizeQuantity(item.quantity),
      category: mapSizeToCategory(item.size),
      notes: buildNotes(item),
    }));

    const payload = {
      inventoryMethod,
      inventoryItems,
      inventorySpecialNeeds,
      inventorySummary: summaryText.trim() || autoSummary,
    };

    try {
      setSaving(true);
      await Promise.resolve(onConfirm(payload));
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.9}
            accessibilityRole="button"
            accessibilityLabel="Volver a la pantalla anterior"
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>

          <View style={styles.headerTitleWrap}>
            <Text style={styles.title}>¿Qué necesitas mover?</Text>
            <Text style={styles.subtitle}>Estado: {screenState.replace("_", " ")}</Text>
          </View>

          <View style={styles.badge}>
            <Text style={styles.badgeText}>{serviceTypeLabel}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.voiceButton, voiceActive && styles.voiceButtonActive]}
          onPress={startVoiceRecognition}
          activeOpacity={0.9}
          accessibilityRole="button"
          accessibilityLabel="Comando de voz"
        >
          <Text style={styles.voiceButtonTitle}>🎤 Comando de voz</Text>
          <Text style={styles.voiceButtonSubtitle}>Toca y habla para dictar</Text>
        </TouchableOpacity>

        <View style={styles.formCard}>
          <Text style={styles.label}>Nombre del objeto *</Text>
          <TextInput
            style={styles.input}
            value={draftItem.name}
            onChangeText={(text) => updateDraft("name", text)}
            placeholder="Ej: Cama matrimonial, refrigerador..."
            placeholderTextColor="#7b8794"
          />

          <Text style={styles.label}>Cantidad</Text>
          <TextInput
            style={styles.input}
            value={draftItem.quantity}
            onChangeText={(text) => updateDraft("quantity", text.replace(/[^0-9]/g, ""))}
            keyboardType="number-pad"
            placeholder="1"
            placeholderTextColor="#7b8794"
          />

          <Text style={styles.label}>Tamaño</Text>
          <View style={styles.chipRow}>
            {SIZE_OPTIONS.map((size) => (
              <TouchableOpacity
                key={size}
                style={[styles.chip, draftItem.size === size && styles.chipSelected]}
                onPress={() => updateDraft("size", size)}
                activeOpacity={0.9}
              >
                <Text
                  style={[
                    styles.chipText,
                    draftItem.size === size && styles.chipTextSelected,
                  ]}
                >
                  {size}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.toggleRow}>
            <Text style={styles.label}>¿Es frágil?</Text>
            <Switch
              value={draftItem.fragile}
              onValueChange={(value) => updateDraft("fragile", value)}
              trackColor={{ false: "#d7dde5", true: "#f2b37c" }}
              thumbColor={draftItem.fragile ? "#e67e22" : "#ffffff"}
            />
          </View>

          <TouchableOpacity
            style={styles.photoButton}
            onPress={openCamera}
            activeOpacity={0.9}
            accessibilityRole="button"
            accessibilityLabel="Agregar foto del objeto"
          >
            <Text style={styles.photoButtonText}>📷 Agregar foto</Text>
            <Text style={styles.photoButtonHint}>
              Supabase Storage aún no implementado
            </Text>
          </TouchableOpacity>

          <Text style={styles.label}>Notas adicionales</Text>
          <TextInput
            style={[styles.input, styles.notesInput]}
            value={draftItem.notes}
            onChangeText={(text) => updateDraft("notes", text)}
            placeholder="Ej: Requiere desmontaje, muy pesado..."
            placeholderTextColor="#7b8794"
            multiline
          />

          <TouchableOpacity
            style={styles.addButton}
            onPress={addOrUpdateItem}
            activeOpacity={0.9}
          >
            <Text style={styles.addButtonText}>
              {editingItemId ? "Guardar cambios" : "+ Agregar objeto"}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.listCard}>
          <Text style={styles.sectionTitle}>Objetos agregados ({itemList.length})</Text>

          {!hasItems ? (
            <Text style={styles.emptyListText}>
              Aún no agregas objetos. El botón continuar se habilita al agregar al menos uno.
            </Text>
          ) : (
            itemList.map((item) => (
              <View key={item.id} style={styles.listRow}>
                <View style={styles.listRowInfo}>
                  <Text style={styles.listRowTitle}>
                    {normalizeQuantity(item.quantity)}x {item.name}
                  </Text>
                  <Text style={styles.listRowMeta}>
                    {item.size}{item.fragile ? " · Frágil" : ""}
                  </Text>
                </View>

                <View style={styles.listActions}>
                  <TouchableOpacity
                    style={styles.rowActionButton}
                    onPress={() => editItem(item.id)}
                    activeOpacity={0.9}
                  >
                    <Text style={styles.rowActionText}>Editar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.rowActionButton}
                    onPress={() => deleteItem(item.id)}
                    activeOpacity={0.9}
                  >
                    <Text style={styles.rowActionText}>Eliminar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.sectionTitle}>Resumen de inventario (auto-generado)</Text>
          <TextInput
            style={[styles.input, styles.summaryInput]}
            value={summaryText}
            onChangeText={(text) => {
              setSummaryTouched(true);
              setSummaryText(text);
            }}
            multiline
          />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.navigation}>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={onBack}
            activeOpacity={0.9}
            disabled={saving}
          >
            <Text style={styles.secondaryButtonText}>Volver</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.primaryButton, (!hasItems || saving) && styles.primaryButtonDisabled]}
            onPress={handleContinue}
            activeOpacity={0.9}
            disabled={!hasItems || saving}
          >
            {saving ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.primaryButtonText}>Continuar →</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 110,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f2f5f8",
  },
  backButtonText: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1f2d3a",
  },
  headerTitleWrap: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "900",
    color: "#1f2d3a",
  },
  subtitle: {
    fontSize: 14,
    color: "#6a7682",
    marginTop: 4,
    fontWeight: "600",
  },
  badge: {
    backgroundColor: "#fff7ef",
    borderWidth: 1,
    borderColor: "#f0d2b2",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  badgeText: {
    color: "#8a4d12",
    fontSize: 12,
    fontWeight: "800",
  },
  voiceButton: {
    minHeight: 60,
    backgroundColor: "#1f2d3a",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
    justifyContent: "center",
  },
  voiceButtonActive: {
    backgroundColor: "#e67e22",
  },
  voiceButtonTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "800",
  },
  voiceButtonSubtitle: {
    color: "#dbe6f1",
    fontSize: 14,
    marginTop: 4,
    fontWeight: "700",
  },
  formCard: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#d8e0e8",
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  label: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1f2d3a",
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#d8e0e8",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#1f2d3a",
  },
  notesInput: {
    minHeight: 78,
    textAlignVertical: "top",
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },
  chip: {
    borderWidth: 1,
    borderColor: "#d8e0e8",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#ffffff",
  },
  chipSelected: {
    borderColor: "#e67e22",
    backgroundColor: "#fff7ef",
  },
  chipText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#4a5568",
  },
  chipTextSelected: {
    color: "#e67e22",
  },
  toggleRow: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  photoButton: {
    marginTop: 12,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#d8e0e8",
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
  },
  photoButtonText: {
    color: "#1f2d3a",
    fontSize: 15,
    fontWeight: "800",
  },
  photoButtonHint: {
    color: "#6a7682",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
  },
  addButton: {
    marginTop: 14,
    borderWidth: 1,
    borderColor: "#1f2d3a",
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  addButtonText: {
    color: "#1f2d3a",
    fontSize: 15,
    fontWeight: "800",
  },
  listCard: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#d8e0e8",
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#1f2d3a",
    marginBottom: 10,
  },
  emptyListText: {
    color: "#6a7682",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
  },
  listRow: {
    borderTopWidth: 1,
    borderTopColor: "#edf2f7",
    paddingTop: 10,
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  listRowInfo: {
    flex: 1,
  },
  listRowTitle: {
    color: "#1f2d3a",
    fontSize: 15,
    fontWeight: "800",
  },
  listRowMeta: {
    marginTop: 2,
    color: "#5f6c79",
    fontSize: 13,
    fontWeight: "600",
  },
  listActions: {
    flexDirection: "row",
    gap: 8,
  },
  rowActionButton: {
    borderWidth: 1,
    borderColor: "#d8e0e8",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#f8fafc",
  },
  rowActionText: {
    color: "#2c3e50",
    fontSize: 12,
    fontWeight: "700",
  },
  summaryCard: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#d8e0e8",
    borderRadius: 16,
    padding: 14,
  },
  summaryInput: {
    minHeight: 68,
    textAlignVertical: "top",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#ffffff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#e8ecf0",
  },
  navigation: {
    flexDirection: "row",
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    minHeight: 50,
    backgroundColor: "#e67e22",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonDisabled: {
    opacity: 0.45,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "800",
  },
  secondaryButton: {
    flex: 1,
    minHeight: 50,
    backgroundColor: "#ffffff",
    borderWidth: 2,
    borderColor: "#d7dde5",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    color: "#2c3e50",
    fontSize: 16,
    fontWeight: "800",
  },
});