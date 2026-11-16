(() => {
  const endpoint = document.currentScript?.dataset.endpoint;
  const path = location.pathname.replace(/\/+$/, "") || "/";
  if (!endpoint || !new Set(["/", "/usuarios", "/choferes"]).has(path)) return;
  if (!crypto.randomUUID) return;

  fetch(endpoint, {
    method: "POST",
    mode: "cors",
    credentials: "omit",
    keepalive: true,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      event_id: crypto.randomUUID(),
      event_source_url: location.origin + path,
    }),
  }).catch(() => {});
})();
