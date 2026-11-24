async function loadServices() {
  try {
    const services = await api("/api/services");
    const select = document.getElementById("service");
    select.innerHTML = services.filter(s => s.active).map(s =>
      `<option value="${s._id}">${s.name} (~${s.averageTime} min)</option>`
    ).join("");
  } catch (e) { alert(e.message); }
}

async function generateToken() {
  const name = document.getElementById("name").value.trim();
  const mobile = document.getElementById("mobile").value.trim();
  const serviceId = document.getElementById("service").value;
  const priority = document.getElementById("priority").value;

  if (!name || !mobile || !serviceId) return alert("Please fill all required fields.");

  try {
    const t = await api("/api/tokens/generate", {
      method: "POST",
      body: JSON.stringify({ name, mobile, serviceId, priority })
    });
    localStorage.setItem("smartbankTokenId", t._id);

    const result = document.getElementById("result");
    result.classList.remove("hidden");
    result.innerHTML = `
      <div>Your Token</div>
      <h2>${t.tokenNumber}</h2>
      <p><b>${t.service.name}</b></p>
      <p>Average service time: ${t.service.averageTime} minutes</p>
      <p>Status: <span class="status waiting">Waiting</span></p>
      <p>Save this token ID to track your status:</p>
      <code>${t._id}</code>
      <br><br>
      <a href="token.html?id=${t._id}" style="color:white;text-decoration:underline;">Track Token</a>
    `;
  } catch (e) { alert(e.message); }
}
loadServices();
