(() => {
  const script = document.currentScript;
  const endpoint = script?.dataset.endpoint || "";
  const allowedPaths = new Set(["/", "/usuarios", "/choferes"]);
  const path = location.pathname.replace(/\/+$/, "") || "/";
  if (!endpoint || !allowedPaths.has(path)) return;

  const consentKey = "muber_analytics_consent_v1";
  const sendView = () => {
    if (!crypto.randomUUID) return;
    fetch(endpoint, {
      method: "POST",
      mode: "cors",
      credentials: "omit",
      keepalive: true,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        consent: true,
        event_id: crypto.randomUUID(),
        event_source_url: location.origin + path,
      }),
    }).catch(() => {});
  };

  const showSettings = () => {
    const settings = document.createElement("button");
    settings.type = "button";
    settings.textContent = "Privacidad";
    settings.setAttribute("aria-label", "Cambiar preferencias de analítica");
    settings.style.cssText = "position:fixed;right:12px;bottom:12px;z-index:9999;padding:6px 10px;border:1px solid #d4a373;border-radius:6px;background:#0a192f;color:#fff;cursor:pointer;font:12px system-ui,sans-serif";
    settings.addEventListener("click", () => {
      try { localStorage.removeItem(consentKey); } catch {}
      location.reload();
    });
    (document.body || document.documentElement).append(settings);
  };

  let consent;
  try { consent = localStorage.getItem(consentKey); } catch { consent = null; }
  if (consent === "yes" || consent === "no") {
    showSettings();
    if (consent === "yes") sendView();
    return;
  }

  const banner = document.createElement("div");
  banner.setAttribute("role", "region");
  banner.setAttribute("aria-label", "Preferencias de analítica");
  banner.style.cssText = "position:fixed;inset:auto 12px 12px;z-index:9999;max-width:560px;margin:auto;padding:16px;border-radius:12px;background:#0a192f;color:#fff;box-shadow:0 8px 28px #0005;font:14px/1.5 system-ui,sans-serif";
  const message = document.createElement("p");
  message.textContent = "¿Nos permite medir las visitas a MUBER con Meta? Puede rechazar esta analítica.";
  message.style.margin = "0 0 10px";
  const privacy = document.createElement("a");
  privacy.href = "/legal/privacidad.html";
  privacy.textContent = "Política de privacidad";
  privacy.style.cssText = "color:#d4a373;display:inline-block;margin-right:16px";
  const accept = document.createElement("button");
  accept.type = "button";
  accept.textContent = "Aceptar";
  const reject = document.createElement("button");
  reject.type = "button";
  reject.textContent = "Rechazar";
  for (const button of [accept, reject]) {
    button.style.cssText = "padding:8px 14px;margin:4px;border:0;border-radius:6px;cursor:pointer;font:inherit";
  }
  accept.style.background = "#d4a373";
  reject.style.background = "#fff";
  accept.addEventListener("click", () => {
    try { localStorage.setItem(consentKey, "yes"); } catch {}
    banner.remove();
    showSettings();
    sendView();
  });
  reject.addEventListener("click", () => {
    try { localStorage.setItem(consentKey, "no"); } catch {}
    banner.remove();
    showSettings();
  });
  banner.append(message, privacy, accept, reject);
  (document.body || document.documentElement).append(banner);
})();
