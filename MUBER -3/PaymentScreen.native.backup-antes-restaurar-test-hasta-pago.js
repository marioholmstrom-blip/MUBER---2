import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";

let WebViewComponent = null;

try {
  WebViewComponent = require("react-native-webview").WebView;
} catch (_error) {
  WebViewComponent = null;
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function buildWebpayHtml({ providerUrl, providerToken }) {
  const safeProviderUrl = escapeHtml(providerUrl);
  const safeProviderToken = escapeHtml(providerToken);

  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Redirigiendo a Webpay</title>
    <style>
      html, body {
        margin: 0;
        padding: 0;
        background: #16202b;
        color: #ffffff;
        font-family: Arial, sans-serif;
      }
      .shell {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
        box-sizing: border-box;
      }
      .card {
        width: 100%;
        max-width: 480px;
        background: #ffffff;
        color: #1f2d3a;
        border-radius: 20px;
        padding: 24px;
        box-sizing: border-box;
      }
      h1 {
        margin: 0 0 10px 0;
        font-size: 24px;
      }
      p {
        margin: 0 0 12px 0;
        line-height: 1.5;
      }
      button {
        width: 100%;
        border: 0;
        border-radius: 14px;
        padding: 15px 18px;
        background: #e67e22;
        color: #22313f;
        font-size: 16px;
        font-weight: 800;
      }
    </style>
  </head>
  <body>
    <div class="shell">
      <div class="card">
        <h1>Redirigiendo a Webpay</h1>
        <p>Se abrira el formulario de pago con debito o credito.</p>
        <p>Si no avanza solo, usa el boton inferior.</p>
        <form id="webpay-form" method="post" action="${safeProviderUrl}">
          <input type="hidden" name="token_ws" value="${safeProviderToken}" />
          <button type="submit">Ir a pagar</button>
        </form>
      </div>
    </div>
    <script>
      window.addEventListener("DOMContentLoaded", function () {
        var form = document.getElementById("webpay-form");
        if (form) {
          form.submit();
        }
      });
    </script>
  </body>
</html>`;
}

export default function PaymentScreen({
  paymentSession,
  paymentLoading,
  onBack,
  onRefresh,
  onPaymentReturn,
}) {
  const [webviewError, setWebviewError] = useState("");
  const [connectionPhase, setConnectionPhase] = useState("initial");
  const returnHandledRef = useRef(false);
  const { height: windowHeight } = useWindowDimensions();
  const scrollMaxHeight = Math.max(360, Math.min(560, windowHeight - 230));

  const paymentHtml = useMemo(() => {
    if (!paymentSession?.providerUrl || !paymentSession?.providerToken) {
      return "";
    }

    return buildWebpayHtml({
      providerUrl: paymentSession.providerUrl,
      providerToken: paymentSession.providerToken,
    });
  }, [paymentSession]);

  useEffect(() => {
    returnHandledRef.current = false;
    setWebviewError("");
    setConnectionPhase("initial");
  }, [paymentSession?.paymentId]);

  useEffect(() => {
    if (paymentLoading) {
      setConnectionPhase("connecting");
    } else if (paymentHtml && !webviewError) {
      setConnectionPhase("waiting");
    } else if (webviewError) {
      setConnectionPhase("error");
    }
  }, [paymentLoading, paymentHtml, webviewError]);

  const handleMaybeReturn = (currentUrl) => {
    const confirmUrl = String(paymentSession?.confirmUrl || "").trim();
    const normalizedUrl = String(currentUrl || "").trim();

    if (!normalizedUrl || returnHandledRef.current) {
      return;
    }

    if (
      (confirmUrl && normalizedUrl.startsWith(confirmUrl)) ||
      normalizedUrl.includes("/functions/v1/confirm-trip-payment")
    ) {
      returnHandledRef.current = true;
      onPaymentReturn?.();
    }
  };

  const handleOpenExternalFallback = async () => {
    if (!paymentSession?.redirectUrl) {
      return;
    }

    await Linking.openURL(paymentSession.redirectUrl);
  };

  const getPaymentStatusInfo = () => {
    switch (connectionPhase) {
      case "connecting":
        return {
          label: "Conectando con Webpay...",
          hint: "Estamos estableciendo conexion segura con Webpay Plus.",
        };
      case "waiting":
        return {
          label: "Esperando confirmacion...",
          hint: "Completa el pago en Webpay. Volveras automaticamente al terminar.",
        };
      case "error":
        return {
          label: "Error de conexion",
          hint: "Hubo un problema al conectar con Webpay. Intenta nuevamente.",
        };
      default:
        return {
          label: paymentLoading ? "Preparando el cobro" : "Pago en curso",
          hint: paymentLoading
            ? "Estamos abriendo el checkout seguro para que completes el pago."
            : "Cuando Webpay termine, volveras automaticamente al seguimiento del viaje.",
        };
    }
  };

  const { label: checkoutStatusLabel, hint: checkoutStatusHint } = getPaymentStatusInfo();

  return (
    <ScrollView
      style={[styles.scrollView, { maxHeight: scrollMaxHeight }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>7. Pago</Text>
      <Text style={styles.subtitle}>
        Completa el cobro seguro del servicio desde esta misma etapa.
      </Text>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Estado</Text>
        <Text style={styles.summaryValue}>{checkoutStatusLabel}</Text>

        <Text style={styles.summaryLabel}>Monto</Text>
        <Text style={styles.summaryValue}>
          ${Number(paymentSession?.amountClp || 0).toLocaleString("es-CL")}
        </Text>

        <Text style={styles.summaryLabel}>Metodo</Text>
        <Text style={styles.summaryValue}>Webpay Plus</Text>

        <Text style={styles.statusHint}>
          {checkoutStatusHint}
        </Text>
      </View>

      {WebViewComponent && paymentHtml ? (
        <View style={styles.webviewCard}>
          <WebViewComponent
            originWhitelist={["*"]}
            source={{ html: paymentHtml }}
            javaScriptEnabled
            domStorageEnabled
            startInLoadingState
            renderLoading={() => (
              <View style={styles.loadingWrap}>
                <ActivityIndicator size="large" color="#e67e22" />
                <Text style={styles.loadingText}>Abriendo el checkout seguro...</Text>
              </View>
            )}
            onLoadEnd={(event) =>
              handleMaybeReturn(event?.nativeEvent?.url || "")
            }
            onNavigationStateChange={(navState) =>
              handleMaybeReturn(navState?.url || "")
            }
            onError={(event) => {
              setWebviewError(
                event?.nativeEvent?.description ||
                  "No se pudo cargar el checkout de pago."
              );
            }}
            style={styles.webview}
          />
        </View>
      ) : (
        <View style={styles.paymentInfoBox}>
          <Text style={styles.driverInfoLabel}>WebView no disponible</Text>
          <Text style={styles.statusHint}>
            Esta build no tiene el modulo nativo de WebView. Puedes usar el
            fallback externo mientras se instala la dependencia correcta.
          </Text>
        </View>
      )}

      {webviewError ? (
        <View style={styles.locationInfoBox}>
          <Text style={styles.driverInfoLabel}>Error de carga</Text>
          <Text style={styles.statusHint}>{webviewError}</Text>
        </View>
      ) : null}

      <TouchableOpacity
        style={[styles.lightButton, paymentLoading && styles.buttonDisabled]}
        onPress={onRefresh}
        activeOpacity={0.9}
        disabled={paymentLoading}
      >
        <Text style={styles.lightButtonText}>
          {paymentLoading ? "Revisando..." : "Revisar estado del pago"}
        </Text>
      </TouchableOpacity>

      {!WebViewComponent && paymentSession?.redirectUrl ? (
        <TouchableOpacity
          style={styles.orangeButton}
          onPress={handleOpenExternalFallback}
          activeOpacity={0.9}
        >
          <Text style={styles.orangeButtonText}>Abrir fallback externo</Text>
        </TouchableOpacity>
      ) : null}

      <TouchableOpacity
        style={styles.darkButton}
        onPress={() => {
          Alert.alert(
            "Confirmar salida",
            "¿Seguro que quieres salir del pago? Podrás volver a intentar el pago más tarde.",
            [
              { text: "Cancelar", style: "cancel" },
              {
                text: "Salir",
                style: "destructive",
                onPress: onBack,
              },
            ]
          );
        }}
        activeOpacity={0.9}
      >
        <Text style={styles.darkButtonText}>Volver al seguimiento</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    width: "100%",
  },
  scrollContent: {
    paddingBottom: 28,
  },
  title: { fontSize: 24, fontWeight: "900", color: "#22313f", marginBottom: 8 },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: "#5f6c79",
    marginBottom: 18,
    fontWeight: "600",
  },
  summaryCard: {
    backgroundColor: "#f8fafb",
    borderWidth: 1,
    borderColor: "#dbe3ea",
    borderRadius: 20,
    padding: 20,
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: "800",
    color: "#6a7682",
    marginTop: 6,
  },
  summaryValue: {
    fontSize: 17,
    fontWeight: "700",
    color: "#22313f",
    marginTop: 4,
  },
  statusHint: {
    fontSize: 15,
    lineHeight: 22,
    color: "#5f6c79",
    fontWeight: "600",
    marginTop: 8,
  },
  webviewCard: {
    overflow: "hidden",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#dbe3ea",
    backgroundColor: "#ffffff",
    height: 420,
    marginBottom: 12,
  },
  webview: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 15,
    fontWeight: "700",
    color: "#22313f",
  },
  driverInfoLabel: {
    fontSize: 13,
    fontWeight: "800",
    color: "#6a7682",
    marginTop: 4,
  },
  paymentInfoBox: {
    marginBottom: 12,
    backgroundColor: "#f4f8ed",
    borderWidth: 1,
    borderColor: "#d6e2bf",
    borderRadius: 18,
    padding: 16,
  },
  locationInfoBox: {
    marginBottom: 12,
    backgroundColor: "#eef6ff",
    borderWidth: 1,
    borderColor: "#c7d9f0",
    borderRadius: 18,
    padding: 16,
  },
  darkButton: {
    backgroundColor: "#1f2d3a",
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: "center",
    marginTop: 8,
  },
  darkButtonText: { color: "#ffffff", fontSize: 17, fontWeight: "800" },
  orangeButton: {
    backgroundColor: "#e67e22",
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: "center",
    marginTop: 8,
  },
  orangeButtonText: { color: "#22313f", fontSize: 17, fontWeight: "900" },
  lightButton: {
    backgroundColor: "#ffffff",
    borderWidth: 2,
    borderColor: "#d7dde5",
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: "center",
    marginTop: 4,
  },
  lightButtonText: { color: "#2c3e50", fontSize: 17, fontWeight: "800" },
  buttonDisabled: { opacity: 0.45 },
});
