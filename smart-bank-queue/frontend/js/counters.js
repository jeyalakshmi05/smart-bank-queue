async function loadCounterForm() {
  const services = await api("/api/services");
  document.getElementById("serviceChecks").innerHTML = services.map(s =>
    `<label><input type="checkbox" value="${s._id}"> ${s.name}</label>`
  ).join("");
}

async function loadCounters() {
  const counters = await api("/api/counters");
  document.getElementById("counterTable").innerHTML = counters.length
    ? `<table><tr><th>Counter</th><th>Services</th><th>Status</th><th>Action</th></tr>` +
      counters.map(c => `<tr>
        <td>Counter ${c.counterNumber}</td>
        <td>${c.services.map(s => s.name).join(", ") || "-"}</td>
        <td>${c.status}</td>
        <td><button class="danger" onclick="deleteCounter('${c._id}')">Delete</button></td>
      </tr>`).join("") + "</table>"
    : "<p>No counters created.</p>";
}

async function saveCounter() {
  const serviceIds = [...document.querySelectorAll("#serviceChecks input:checked")].map(x => x.value);
  const counterNumber = Number(document.getElementById("counterNumber").value);
  const status = document.getElementById("counterStatus").value;
  if (!counterNumber || !serviceIds.length) return alert("Enter counter number and select at least one service.");

  try {
    await api("/api/counters", { method: "POST", body: JSON.stringify({ counterNumber, services: serviceIds, status }) });
    document.getElementById("counterNumber").value = "";
    document.querySelectorAll("#serviceChecks input").forEach(x => x.checked = false);
    loadCounters();
  } catch(e) { alert(e.message); }
}

async function deleteCounter(id) {
  if (!confirm("Delete this counter?")) return;
  try { await api(`/api/counters/${id}`, { method: "DELETE" }); loadCounters(); }
  catch(e) { alert(e.message); }
}

loadCounterForm();
loadCounters();
