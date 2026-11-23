async function loadReport() {
  try {
    const s = await api("/api/queue/stats/today");
    document.getElementById("reportStats").innerHTML = [
      ["Total", s.total], ["Waiting", s.waiting], ["Serving", s.serving],
      ["Completed", s.completed], ["Cancelled", s.cancelled], ["Skipped", s.skipped]
    ].map(x => `<div class="stat"><small>${x[0]}</small><strong>${x[1]}</strong></div>`).join("");

    const tokens = await api("/api/tokens");
    document.getElementById("history").innerHTML = `<table><tr><th>Token</th><th>Service</th><th>Customer</th><th>Status</th><th>Created</th></tr>` +
      tokens.map(t => `<tr><td>${t.tokenNumber}</td><td>${t.service?.name || "-"}</td><td>${t.customer?.name || "-"}</td><td>${t.status}</td><td>${new Date(t.createdAt).toLocaleString()}</td></tr>`).join("") +
      "</table>";
  } catch(e) { alert(e.message); }
}
loadReport();
