import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import {
  approveApplication,
  editDriverCommission,
  loadAdminDashboardData,
  rejectApplication,
  toggleDriverOnlineByAdmin,
} from "./api/adminApi";

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "trips", label: "Viajes" },
  { key: "drivers", label: "Conductores" },
  { key: "requests", label: "Pedidos" },
];

function formatClp(value) {
  return `$${Number(value || 0).toLocaleString("es-CL")}`;
}

function formatDate(value) {
  if (!value) {
    return "-";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }
  return date.toLocaleString("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function AdminTable({ headers, rows, rowKey, renderRow }) {
  return (
    <View style={styles.tableContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator>
        <View>
          <View style={styles.tableHeadRow}>
            {headers.map((header) => (
              <Text key={header.key} style={[styles.tableHeadCell, header.style]}>
                {header.label}
              </Text>
            ))}
          </View>

          {rows.map((item) => (
            <View key={rowKey(item)} style={styles.tableBodyRow}>
              {renderRow(item)}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function WeeklyBarChart({ metrics }) {
  const max = metrics.reduce(
    (highest, item) => Math.max(highest, Number(item.gross_clp || 0)),
    1
  );

  return (
    <View style={styles.chartCard}>
      <Text style={styles.sectionTitle}>Ingresos brutos · últimos 7 días</Text>
      <View style={styles.chartBarsRow}>
        {metrics.map((item) => {
          const value = Number(item.gross_clp || 0);
          const ratio = Math.max(0.04, value / max);
          const dayLabel = String(item.day || "").slice(5);

          return (
            <View key={item.day} style={styles.chartBarItem}>
              <Text style={styles.chartValueText}>{formatClp(value)}</Text>
              <View style={styles.chartBarTrack}>
                <View style={[styles.chartBarFill, { height: `${ratio * 100}%` }]} />
              </View>
              <Text style={styles.chartDayText}>{dayLabel || "--"}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

export default function AdminDashboard({ goHome }) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  const isTablet = width >= 768 && width < 1024;
  const [activeTab, setActiveTab] = useState("overview");
  const [screenState, setScreenState] = useState("loading");
  const [loading, setLoading] = useState(false);
  const [loadedAt, setLoadedAt] = useState("");
  const [revenueSummary, setRevenueSummary] = useState({
    gross_clp: 0,
    muber_income: 0,
    driver_net: 0,
    completed_trips: 0,
  });
  const [dailyMetrics, setDailyMetrics] = useState([]);
  const [trips, setTrips] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [applications, setApplications] = useState([]);
  const [requests, setRequests] = useState([]);

  const loadDashboard = async ({ silent = false } = {}) => {
    try {
      if (!silent) {
        setLoading(true);
        setScreenState("loading");
      }

      const data = await loadAdminDashboardData();
      setRevenueSummary(data.revenueSummary || {});
      setDailyMetrics(data.dailyMetrics || []);
      setTrips(data.trips || []);
      setDrivers(data.drivers || []);
      setApplications(data.applications || []);
      setRequests(data.requests || []);
      setLoadedAt(data.loadedAt || new Date().toISOString());
      setScreenState(activeTab);
    } catch (error) {
      Alert.alert(
        "Dashboard admin",
        error?.message || "No se pudo cargar el dashboard desde Supabase TEST."
      );
      setScreenState(activeTab);
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    setScreenState(activeTab);
  }, [activeTab]);

  useEffect(() => {
    const id = setInterval(() => {
      loadDashboard({ silent: true });
    }, 30000);

    return () => clearInterval(id);
  }, [activeTab]);

  const kpis = useMemo(
    () => [
      {
        key: "gross",
        label: "Total bruto",
        value: formatClp(revenueSummary.gross_clp),
      },
      {
        key: "muber",
        label: "MUBER (30%)",
        value: formatClp(revenueSummary.muber_income),
      },
      {
        key: "driver",
        label: "Conductores (70%)",
        value: formatClp(revenueSummary.driver_net),
      },
      {
        key: "completed",
        label: "Viajes completados",
        value: String(revenueSummary.completed_trips || 0),
      },
    ],
    [revenueSummary]
  );

  const handleToggleDriverOnline = async (driverItem) => {
    try {
      await toggleDriverOnlineByAdmin(driverItem.id, !driverItem.is_online);
      await loadDashboard({ silent: true });
    } catch (error) {
      Alert.alert(
        "Conductores",
        error?.message || "No se pudo cambiar el estado online."
      );
    }
  };

  const handleEditCommission = (driverItem) => {
    const current = Number(driverItem.current_commission_percent || 70);
    let inputValue = String(current);

    if (Platform.OS === "web") {
      const raw = window.prompt(
        `Nueva comisión para ${driverItem.full_name || "conductor"} (0-100)`,
        inputValue
      );

      if (raw === null) {
        return;
      }

      inputValue = raw;
      const next = Number(inputValue);
      if (!Number.isFinite(next)) {
        Alert.alert("Comisión", "Ingresa un número válido.");
        return;
      }

      editDriverCommission(driverItem.id, next)
        .then(() => loadDashboard({ silent: true }))
        .catch((error) => {
          Alert.alert(
            "Comisión",
            error?.message || "No se pudo actualizar la comisión."
          );
        });
      return;
    }

    Alert.alert(
      "Editar comisión",
      `Para ${driverItem.full_name || "conductor"} se aplicará ${current}%.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Aplicar",
          onPress: async () => {
            try {
              await editDriverCommission(driverItem.id, current);
              await loadDashboard({ silent: true });
            } catch (error) {
              Alert.alert(
                "Comisión",
                error?.message || "No se pudo actualizar la comisión."
              );
            }
          },
        },
      ]
    );
  };

  const handleApproveApplication = async (application) => {
    const note = `Aprobada por Mario Holmstrom (${new Date().toLocaleDateString("es-CL")})`;
    try {
      await approveApplication(application.id, note);
      await loadDashboard({ silent: true });
    } catch (error) {
      Alert.alert(
        "Postulaciones",
        error?.message || "No se pudo aprobar la postulación."
      );
    }
  };

  const handleRejectApplication = async (application) => {
    const defaultNote = "Rechazada por revisión administrativa";

    if (Platform.OS === "web") {
      const note = window.prompt("Motivo de rechazo", defaultNote);
      if (note === null) {
        return;
      }

      try {
        await rejectApplication(application.id, note);
        await loadDashboard({ silent: true });
      } catch (error) {
        Alert.alert(
          "Postulaciones",
          error?.message || "No se pudo rechazar la postulación."
        );
      }
      return;
    }

    Alert.alert("Rechazar postulación", defaultNote, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Rechazar",
        style: "destructive",
        onPress: async () => {
          try {
            await rejectApplication(application.id, defaultNote);
            await loadDashboard({ silent: true });
          } catch (error) {
            Alert.alert(
              "Postulaciones",
              error?.message || "No se pudo rechazar la postulación."
            );
          }
        },
      },
    ]);
  };

  const renderOverview = () => (
    <View style={styles.sectionWrap}>
      <View
        style={[
          styles.kpiGrid,
          isDesktop && styles.kpiGridDesktop,
          isTablet && styles.kpiGridTablet,
        ]}
      >
        {kpis.map((kpi) => (
          <View key={kpi.key} style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>{kpi.label}</Text>
            <Text style={styles.kpiValue}>{kpi.value}</Text>
          </View>
        ))}
      </View>
      <WeeklyBarChart metrics={dailyMetrics} />
    </View>
  );

  const renderTrips = () => (
    <View style={styles.sectionWrap}>
      <Text style={styles.sectionTitle}>Viajes</Text>
      <AdminTable
        headers={[
          { key: "customer", label: "Cliente", style: styles.cellWide },
          { key: "origin", label: "Origen", style: styles.cellWide },
          { key: "destination", label: "Destino", style: styles.cellWide },
          { key: "service", label: "Servicio", style: styles.cellMedium },
          { key: "status", label: "Estado", style: styles.cellMedium },
          { key: "total", label: "Total", style: styles.cellMedium },
          { key: "muber", label: "MUBER", style: styles.cellMedium },
          { key: "driver", label: "Conductor", style: styles.cellMedium },
          { key: "payment", label: "Pago", style: styles.cellMedium },
          { key: "name", label: "Chofer", style: styles.cellWide },
          { key: "created", label: "Creado", style: styles.cellMedium },
        ]}
        rows={trips}
        rowKey={(item) => item.id}
        renderRow={(item) => (
          <>
            <Text style={[styles.tableBodyCell, styles.cellWide]}>{item.customer_name}</Text>
            <Text style={[styles.tableBodyCell, styles.cellWide]}>{item.origin_text}</Text>
            <Text style={[styles.tableBodyCell, styles.cellWide]}>{item.destination_text}</Text>
            <Text style={[styles.tableBodyCell, styles.cellMedium]}>{item.service_type}</Text>
            <Text style={[styles.tableBodyCell, styles.cellMedium]}>{item.trip_status}</Text>
            <Text style={[styles.tableBodyCell, styles.cellMedium]}>{formatClp(item.total_price_clp)}</Text>
            <Text style={[styles.tableBodyCell, styles.cellMedium]}>{formatClp(item.muber_income_clp)}</Text>
            <Text style={[styles.tableBodyCell, styles.cellMedium]}>{formatClp(item.driver_net_clp)}</Text>
            <Text style={[styles.tableBodyCell, styles.cellMedium]}>{item.payment_status}</Text>
            <Text style={[styles.tableBodyCell, styles.cellWide]}>{item.simulated_driver_name}</Text>
            <Text style={[styles.tableBodyCell, styles.cellMedium]}>{formatDate(item.created_at)}</Text>
          </>
        )}
      />
    </View>
  );

  const renderDrivers = () => (
    <View style={styles.sectionWrap}>
      <Text style={styles.sectionTitle}>Conductores</Text>
      <AdminTable
        headers={[
          { key: "name", label: "Nombre", style: styles.cellWide },
          { key: "phone", label: "Teléfono", style: styles.cellMedium },
          { key: "online", label: "Online", style: styles.cellSmall },
          { key: "rating", label: "Rating", style: styles.cellSmall },
          { key: "commission", label: "Comisión", style: styles.cellSmall },
          { key: "bonus", label: "AAA", style: styles.cellSmall },
          { key: "actions", label: "Acciones", style: styles.cellWide },
        ]}
        rows={drivers}
        rowKey={(item) => item.id}
        renderRow={(item) => (
          <>
            <Text style={[styles.tableBodyCell, styles.cellWide]}>{item.full_name}</Text>
            <Text style={[styles.tableBodyCell, styles.cellMedium]}>{item.phone}</Text>
            <Text style={[styles.tableBodyCell, styles.cellSmall]}>
              {item.is_online ? "Sí" : "No"}
            </Text>
            <Text style={[styles.tableBodyCell, styles.cellSmall]}>
              {Number(item.rating || 0).toFixed(1)}
            </Text>
            <Text style={[styles.tableBodyCell, styles.cellSmall]}>
              {item.current_commission_percent}%
            </Text>
            <Text style={[styles.tableBodyCell, styles.cellSmall]}>
              {item.aaa_bonus_enabled ? "ON" : "OFF"}
            </Text>
            <View style={[styles.tableBodyCell, styles.cellWide, styles.actionsCell]}>
              <Pressable
                style={styles.actionButton}
                onPress={() => handleToggleDriverOnline(item)}
              >
                <Text style={styles.actionButtonText}>
                  {item.is_online ? "Poner offline" : "Poner online"}
                </Text>
              </Pressable>
              <Pressable
                style={styles.actionButtonGhost}
                onPress={() => handleEditCommission(item)}
              >
                <Text style={styles.actionButtonGhostText}>Editar comisión</Text>
              </Pressable>
            </View>
          </>
        )}
      />

      <Text style={styles.sectionTitle}>Postulaciones</Text>
      <AdminTable
        headers={[
          { key: "name", label: "Nombre", style: styles.cellWide },
          { key: "phone", label: "Teléfono", style: styles.cellMedium },
          { key: "vehicle", label: "Vehículo", style: styles.cellMedium },
          { key: "status", label: "Estado", style: styles.cellMedium },
          { key: "created", label: "Creado", style: styles.cellMedium },
          { key: "actions", label: "Acciones", style: styles.cellWide },
        ]}
        rows={applications}
        rowKey={(item) => item.id}
        renderRow={(item) => (
          <>
            <Text style={[styles.tableBodyCell, styles.cellWide]}>{item.full_name || "-"}</Text>
            <Text style={[styles.tableBodyCell, styles.cellMedium]}>{item.phone || "-"}</Text>
            <Text style={[styles.tableBodyCell, styles.cellMedium]}>{item.vehicle_type || "-"}</Text>
            <Text style={[styles.tableBodyCell, styles.cellMedium]}>{item.application_status || "-"}</Text>
            <Text style={[styles.tableBodyCell, styles.cellMedium]}>{formatDate(item.created_at)}</Text>
            <View style={[styles.tableBodyCell, styles.cellWide, styles.actionsCell]}>
              <Pressable
                style={styles.actionButton}
                onPress={() => handleApproveApplication(item)}
              >
                <Text style={styles.actionButtonText}>Aprobar</Text>
              </Pressable>
              <Pressable
                style={styles.actionButtonDanger}
                onPress={() => handleRejectApplication(item)}
              >
                <Text style={styles.actionButtonText}>Rechazar</Text>
              </Pressable>
            </View>
          </>
        )}
      />
    </View>
  );

  const renderRequests = () => (
    <View style={styles.sectionWrap}>
      <Text style={styles.sectionTitle}>Pedidos de clientes</Text>
      <AdminTable
        headers={[
          { key: "customer", label: "Cliente", style: styles.cellWide },
          { key: "service", label: "Servicio", style: styles.cellMedium },
          { key: "origin", label: "Origen", style: styles.cellWide },
          { key: "destination", label: "Destino", style: styles.cellWide },
          { key: "inventory", label: "Inventario", style: styles.cellWide },
          { key: "price", label: "Estimado", style: styles.cellMedium },
          { key: "status", label: "Estado", style: styles.cellMedium },
          { key: "requested", label: "Solicitado", style: styles.cellMedium },
        ]}
        rows={requests}
        rowKey={(item) => item.id}
        renderRow={(item) => (
          <>
            <Text style={[styles.tableBodyCell, styles.cellWide]}>{item.customer_name}</Text>
            <Text style={[styles.tableBodyCell, styles.cellMedium]}>{item.service_type}</Text>
            <Text style={[styles.tableBodyCell, styles.cellWide]}>{item.origin_text}</Text>
            <Text style={[styles.tableBodyCell, styles.cellWide]}>{item.destination_text}</Text>
            <Text style={[styles.tableBodyCell, styles.cellWide]}>{item.inventory_summary || "-"}</Text>
            <Text style={[styles.tableBodyCell, styles.cellMedium]}>{formatClp(item.estimated_price_clp)}</Text>
            <Text style={[styles.tableBodyCell, styles.cellMedium]}>{item.status}</Text>
            <Text style={[styles.tableBodyCell, styles.cellMedium]}>{formatDate(item.requested_at)}</Text>
          </>
        )}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerWrap}>
        <View>
          <Text style={styles.breadcrumb}>Panel Director / Dashboard</Text>
          <Text style={styles.title}>Admin Dashboard</Text>
          <Text style={styles.subtitle}>Director · Mario Holmstrom</Text>
          <Text style={styles.testBadge}>Entorno: TEST</Text>
          <Text style={styles.loadedHint}>Última actualización: {formatDate(loadedAt)}</Text>
          <Text style={styles.loadedHint}>Estado: {screenState}</Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.secondaryButton} onPress={goHome} activeOpacity={0.9}>
            <Text style={styles.secondaryButtonText}>← Volver al Panel Director</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => setActiveTab("overview")}
            activeOpacity={0.9}
          >
            <Text style={styles.secondaryButtonText}>Inicio Dashboard</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => loadDashboard()}
            activeOpacity={0.9}
          >
            <Text style={styles.primaryButtonText}>Refrescar</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsRow}
      >
        {TABS.map((tab) => (
          <Pressable
            key={tab.key}
            onPress={() => setActiveTab(tab.key)}
            style={[
              styles.tabButton,
              activeTab === tab.key && styles.tabButtonActive,
            ]}
          >
            <Text
              style={[
                styles.tabButtonText,
                activeTab === tab.key && styles.tabButtonTextActive,
              ]}
            >
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {loading ? (
        <View style={styles.loadingCard}>
          <ActivityIndicator size="large" color="#d89d4b" />
          <Text style={styles.loadingText}>Cargando datos reales de Supabase TEST...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.bodyContent}
          showsVerticalScrollIndicator
        >
          {activeTab === "overview" && renderOverview()}
          {activeTab === "trips" && renderTrips()}
          {activeTab === "drivers" && renderDrivers()}
          {activeTab === "requests" && renderRequests()}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f1efe9",
    paddingTop: 34,
    paddingHorizontal: 14,
  },
  headerWrap: {
    backgroundColor: "#10243e",
    borderRadius: 18,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  title: {
    color: "#f9f2df",
    fontSize: 26,
    fontWeight: "900",
  },
  breadcrumb: {
    color: "#d5deea",
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 4,
  },
  subtitle: {
    color: "#f5d9a8",
    fontSize: 14,
    fontWeight: "700",
    marginTop: 4,
  },
  testBadge: {
    alignSelf: "flex-start",
    marginTop: 8,
    backgroundColor: "#d89d4b",
    color: "#10243e",
    fontSize: 11,
    fontWeight: "900",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    overflow: "hidden",
  },
  loadedHint: {
    color: "#d5deea",
    fontSize: 12,
    marginTop: 4,
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  primaryButton: {
    backgroundColor: "#d89d4b",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  primaryButtonText: {
    color: "#182a43",
    fontWeight: "900",
    fontSize: 13,
  },
  secondaryButton: {
    backgroundColor: "#1b385e",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  secondaryButtonText: {
    color: "#d9e8f8",
    fontWeight: "900",
    fontSize: 13,
  },
  tabsRow: {
    gap: 8,
    paddingTop: 12,
    paddingBottom: 6,
    paddingRight: 20,
  },
  tabButton: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#d7d2c5",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  tabButtonActive: {
    backgroundColor: "#10243e",
    borderColor: "#10243e",
  },
  tabButtonText: {
    color: "#253a55",
    fontWeight: "800",
    fontSize: 13,
  },
  tabButtonTextActive: {
    color: "#ffffff",
  },
  loadingCard: {
    marginTop: 14,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#d8d3c9",
    padding: 22,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    color: "#3c4a59",
    fontSize: 14,
    fontWeight: "700",
  },
  bodyContent: {
    paddingTop: 10,
    paddingBottom: 38,
  },
  sectionWrap: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#132942",
  },
  kpiGrid: {
    flexDirection: "column",
    gap: 10,
  },
  kpiGridTablet: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  kpiGridDesktop: {
    flexDirection: "row",
  },
  kpiCard: {
    flex: 1,
    minWidth: 160,
    backgroundColor: "#ffffff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#d8d3c9",
    padding: 14,
  },
  kpiLabel: {
    fontSize: 13,
    color: "#556273",
    fontWeight: "700",
  },
  kpiValue: {
    fontSize: 25,
    color: "#132942",
    fontWeight: "900",
    marginTop: 6,
  },
  chartCard: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#d8d3c9",
    padding: 14,
  },
  chartBarsRow: {
    marginTop: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: 8,
  },
  chartBarItem: {
    flex: 1,
    alignItems: "center",
  },
  chartValueText: {
    fontSize: 11,
    color: "#526273",
    marginBottom: 4,
    fontWeight: "700",
  },
  chartBarTrack: {
    width: "100%",
    maxWidth: 38,
    height: 130,
    borderRadius: 10,
    backgroundColor: "#ece6d9",
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  chartBarFill: {
    width: "100%",
    backgroundColor: "#d89d4b",
    borderRadius: 10,
  },
  chartDayText: {
    marginTop: 6,
    fontSize: 11,
    color: "#495a6e",
    fontWeight: "800",
  },
  tableContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#d8d3c9",
    overflow: "hidden",
  },
  tableHeadRow: {
    flexDirection: "row",
    backgroundColor: "#efe8da",
    borderBottomWidth: 1,
    borderBottomColor: "#d8d3c9",
  },
  tableHeadCell: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    fontSize: 12,
    fontWeight: "900",
    color: "#1e3552",
  },
  tableBodyRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#eee7dc",
    alignItems: "center",
  },
  tableBodyCell: {
    paddingHorizontal: 10,
    paddingVertical: 9,
    fontSize: 12,
    color: "#243a54",
  },
  cellSmall: {
    width: 90,
  },
  cellMedium: {
    width: 130,
  },
  cellWide: {
    width: 190,
  },
  actionsCell: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
  },
  actionButton: {
    backgroundColor: "#1f446f",
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 7,
  },
  actionButtonDanger: {
    backgroundColor: "#a3322f",
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 7,
  },
  actionButtonGhost: {
    backgroundColor: "#f6f2ea",
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: "#d8d3c9",
  },
  actionButtonText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "800",
  },
  actionButtonGhostText: {
    color: "#1f446f",
    fontSize: 11,
    fontWeight: "800",
  },
  inputInline: {
    borderWidth: 1,
    borderColor: "#c9c2b5",
    borderRadius: 8,
    minWidth: 80,
    paddingHorizontal: 8,
    paddingVertical: 6,
    color: "#1f3550",
    fontSize: 12,
    backgroundColor: "#ffffff",
  },
});
