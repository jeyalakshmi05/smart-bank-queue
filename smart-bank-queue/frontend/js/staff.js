// =====================================
// AUTH GUARD (Staff only)
// =====================================
const staffToken = sessionStorage.getItem("smartbankToken");
const staffUser = JSON.parse(sessionStorage.getItem("smartbankUser") || "null");

if (!staffToken || !staffUser || staffUser.role !== "Staff") {
    window.location.href = "login.html";
    throw new Error("Not authorized");
}

// =====================================
// HELPERS
// =====================================
function getUser() {
    return JSON.parse(sessionStorage.getItem("smartbankUser"));
}

function priorityLabel(p) {
    if (p === 1) return "⭐ Disabled/Pregnant";
    if (p === 2) return "⭐ Senior Citizen";
    return "Normal";
}

// =====================================
// LOAD COUNTER
// =====================================
async function loadCounters() {
    try {
        const user = getUser();

        if (!user || !user.counter) {
            alert("No counter assigned. Contact Admin.");
            window.location.href = "login.html";
            return;
        }

        const counterSelect = document.getElementById("counterSelect");
        counterSelect.innerHTML = "";

        const option = document.createElement("option");
        option.value = user.counter._id;
        option.textContent = `Counter ${user.counter.counterNumber}`;
        counterSelect.appendChild(option);
        counterSelect.value = user.counter._id;
        counterSelect.disabled = true;

        await loadQueue();
    } catch (error) {
        console.error("Counter loading error:", error);
    }
}

// =====================================
// CURRENT CUSTOMER
// =====================================
async function loadCurrent() {
    try {
        const counterId = getUser().counter._id;
        const token = await api(`/api/queue/counter/${counterId}/current`);
        const box = document.getElementById("current");

        if (!token) {
            box.innerHTML = "<p>No customer currently assigned.</p>";
            return;
        }

        const startBtn = token.status === "Called"
            ? `<button onclick="startService('${token._id}')">▶ Start Service</button>`
            : "";
        const completeBtn = token.status === "Serving"
            ? `<button onclick="completeService('${token._id}')">✅ Complete</button>`
            : "";
        const holdBtn = token.status === "Serving"
            ? `<button onclick="holdCustomer('${token._id}')">⏸ Hold</button>`
            : "";
        const noShowBtn = token.status === "Called"
            ? `<button onclick="noShow('${token._id}')">🚫 No Show</button>`
            : "";
        const transferBtn = `<button onclick="transferCustomer('${token._id}')">🔀 Transfer</button>`;

        box.innerHTML = `
            <h3>Token ${token.tokenNumber} (${token.status})</h3>
            <p>Customer: ${token.customer?.name || "-"}</p>
            <p>Service: ${token.service?.name || "-"}</p>
            <p>Priority: ${priorityLabel(token.priority)}</p>
            <div style="display:flex; gap:10px; flex-wrap:wrap;">
                ${startBtn} ${completeBtn} ${holdBtn} ${noShowBtn} ${transferBtn}
            </div>
        `;
    } catch (error) {
        console.error("Current customer error:", error);
    }
}

// =====================================
// WAITING QUEUE
// =====================================
async function loadQueue() {
    try {
        const counterId = getUser().counter._id;
        const tokens = await api(`/api/queue/counter/${counterId}/waiting`);
        const queue = document.getElementById("queue");

        if (!tokens || tokens.length === 0) {
            queue.innerHTML = "<p>No waiting customers.</p>";
        } else {
            queue.innerHTML = `
                <table>
                    <tr>
                        <th>Token</th>
                        <th>Customer</th>
                        <th>Service</th>
                        <th>Priority</th>
                        <th>Status</th>
                    </tr>
                    ${tokens.map(token => `
                        <tr>
                            <td>${token.tokenNumber}</td>
                            <td>${token.customer?.name || "-"}</td>
                            <td>${token.service?.name || "-"}</td>
                            <td>${priorityLabel(token.priority)}</td>
                            <td>${token.status}</td>
                        </tr>
                    `).join("")}
                </table>
            `;
        }

        await loadCurrent();
        await loadHeld();
        await loadCounterStatus();
        await loadStaffStats();
    } catch (error) {
        console.error("Queue loading error:", error);
        document.getElementById("queue").innerHTML = `<p>${error.message}</p>`;
    }
}

// =====================================
// ACTIONS
// =====================================
async function callNext() {
    try {
        const counterId = getUser().counter._id;
        const result = await api(`/api/queue/call-next/${counterId}`, { method: "POST" });
        alert(result.message || "Next customer called!");
        await loadQueue();
    } catch (error) {
        alert(error.message);
    }
}

async function doAction(path, successMessage) {
    try {
        const result = await api(path, { method: "PUT" });
        alert(result.message || successMessage);
        await loadQueue();
    } catch (error) {
        alert(error.message);
    }
}

function startService(id) { doAction(`/api/queue/start/${id}`, "Service started"); }
function completeService(id) { doAction(`/api/queue/complete/${id}`, "Service completed"); }
function holdCustomer(id) { doAction(`/api/queue/hold/${id}`, "Customer on hold"); }
function noShow(id) { doAction(`/api/queue/no-show/${id}`, "Marked as No Show"); }
function recallCustomer(id) { doAction(`/api/queue/recall/${id}`, "Customer recalled"); }

// =====================================
// STATS
// =====================================
async function loadStaffStats() {
    try {
        const stats = await api("/api/queue/staff-stats");
        document.getElementById("waitingCount").textContent = stats.waiting;
        document.getElementById("holdCount").textContent = stats.onHold;
        document.getElementById("noShowCount").textContent = stats.noShow;
        document.getElementById("completedCount").textContent = stats.completed;
    } catch (error) {
        console.error("Staff statistics error:", error);
    }
}

// =====================================
// HELD CUSTOMERS
// =====================================
async function loadHeld() {
    try {
        const counterId = getUser().counter._id;
        const tokens = await api(`/api/queue/counter/${counterId}/held`);
        const box = document.getElementById("held");

        if (!box) return;

        if (!tokens || tokens.length === 0) {
            box.innerHTML = "<p>No customers on hold.</p>";
            return;
        }

        box.innerHTML = `
            <table>
                <tr>
                    <th>Token</th>
                    <th>Customer</th>
                    <th>Service</th>
                    <th>Action</th>
                </tr>
                ${tokens.map(token => `
                    <tr>
                        <td>${token.tokenNumber}</td>
                        <td>${token.customer?.name || "-"}</td>
                        <td>${token.service?.name || "-"}</td>
                        <td><button onclick="recallCustomer('${token._id}')">🔁 Recall</button></td>
                    </tr>
                `).join("")}
            </table>
        `;
    } catch (error) {
        console.error("Held customers error:", error);
    }
}

// =====================================
// TRANSFER
// =====================================
async function transferCustomer(tokenId) {
    try {
        const counters = await api(`/api/queue/transfer-options/${tokenId}`);

        if (!counters.length) {
            alert("No other counter supports this service right now.");
            return;
        }

        const list = counters
            .map(c => `Counter ${c.counterNumber} (${c.status})`)
            .join("\n");

        const number = prompt(`Transfer to which counter?\n\n${list}\n\nType the counter number:`);
        if (!number) return;

        const destination = counters.find(c => String(c.counterNumber) === number.trim());

        if (!destination) {
            alert("Invalid counter number");
            return;
        }

        const result = await api(`/api/queue/transfer/${tokenId}`, {
            method: "PUT",
            body: JSON.stringify({ destinationCounterId: destination._id })
        });

        alert(result.message);
        await loadQueue();
    } catch (error) {
        alert(error.message);
    }
}

// =====================================
// COUNTER STATUS (break / resume)
// =====================================
async function loadCounterStatus() {
    try {
        const info = await api("/api/queue/counter-status");
        const statusEl = document.getElementById("staffStatus");
        const counterEl = document.getElementById("staffCounter");

        if (statusEl) statusEl.textContent = info.status;
        if (counterEl) counterEl.textContent = `Counter ${info.counterNumber}`;
    } catch (error) {
        console.error("Counter status error:", error);
    }
}

async function goOnBreak() {
    try {
        const result = await api("/api/queue/counter-status", {
            method: "PUT",
            body: JSON.stringify({ status: "On Break" })
        });
        alert(result.message);
        await loadCounterStatus();
    } catch (error) {
        alert(error.message);
    }
}

async function resumeWork() {
    try {
        const result = await api("/api/queue/counter-status", {
            method: "PUT",
            body: JSON.stringify({ status: "Available" })
        });
        alert(result.message);
        await loadCounterStatus();
    } catch (error) {
        alert(error.message);
    }
}

// =====================================
// START
// =====================================
loadCounters();
