let editingId = null;

async function loadServices() {
  const services = await api("/api/services");
  document.getElementById("serviceTable").innerHTML = `<table><tr><th>Name</th><th>Prefix</th><th>Avg Time</th><th>Status</th><th>Actions</th></tr>` +
    services.map(s => `<tr>
      <td>${s.name}</td><td>${s.prefix}</td><td>${s.averageTime} min</td>
      <td>${s.active ? "Active" : "Inactive"}</td>
      <td><button onclick='editService(${JSON.stringify(s)})'>Edit</button>
      <button class="danger" onclick="deleteService('${s._id}')">Delete</button></td>
    </tr>`).join("") + "</table>";
}

function editService(s) {
  editingId = s._id;
  document.getElementById("serviceName").value = s.name;
  document.getElementById("prefix").value = s.prefix;
  document.getElementById("averageTime").value = s.averageTime;
  document.getElementById("formTitle").textContent = "Edit Service";
}

async function saveService() {
  const body = {
    name: document.getElementById("serviceName").value.trim(),
    prefix: document.getElementById("prefix").value.trim(),
    averageTime: Number(document.getElementById("averageTime").value)
  };
  if (!body.name || !body.prefix) return alert("Enter service name and prefix.");
  try {
    await api(editingId ? `/api/services/${editingId}` : "/api/services", {
      method: editingId ? "PUT" : "POST",
      body: JSON.stringify(body)
    });
    editingId = null;
    document.getElementById("serviceName").value = "";
    document.getElementById("prefix").value = "";
    document.getElementById("averageTime").value = 5;
    document.getElementById("formTitle").textContent = "Add Service";
    loadServices();
  } catch(e) { alert(e.message); }
}

async function deleteService(id) {
  if (!confirm("Delete this service?")) return;
  try { await api(`/api/services/${id}`, { method: "DELETE" }); loadServices(); }
  catch(e) { alert(e.message); }
}
loadServices();
