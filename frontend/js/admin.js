
// =====================================
// LOAD ADMIN DASHBOARD
// =====================================
const adminToken = sessionStorage.getItem("smartbankToken");
const adminUser = JSON.parse(sessionStorage.getItem("smartbankUser") || "null");

if (!adminToken || !adminUser || adminUser.role !== "Admin") {
  window.location.href = "login.html";
  throw new Error("Not authorized");
}

async function loadAdmin() {
  try {
    const stats = await api("/api/queue/stats/today");

    document.getElementById("stats").innerHTML = [
      ["Total Customers", stats.total],
      ["Waiting", stats.waiting],
      ["Serving", stats.serving],
      ["Completed", stats.completed]
    ].map(x =>
      `<div class="stat">
        <small>${x[0]}</small>
        <strong>${x[1]}</strong>
      </div>`
    ).join("");

    const tokens = await api("/api/tokens");
    const recent = tokens.slice(0, 15);

    document.getElementById("tokens").innerHTML = recent.length
      ? `<table>
          <tr>
            <th>Token</th>
            <th>Customer</th>
            <th>Service</th>
            <th>Status</th>
          </tr>` +
        recent.map(t =>
          `<tr>
            <td><b>${t.tokenNumber}</b></td>
            <td>${t.customer?.name || "-"}</td>
            <td>${t.service?.name || "-"}</td>
            <td>
              <span class="status ${t.status.toLowerCase()}">
                ${t.status}
              </span>
            </td>
          </tr>`
        ).join("") +
        "</table>"
      : "<p>No tokens yet.</p>";

  } catch (error) {
    alert("Dashboard error: " + error.message);
  }
}


// =====================================
// LOAD BANK COUNTERS
// =====================================
async function loadStaffCounters() {
  try {
    const counters = await api("/api/counters");
    const dropdown = document.getElementById("staffCounter");

    dropdown.innerHTML = '<option value="">Select Counter</option>';

    counters.forEach(counter => {
      const option = document.createElement("option");

      option.value = counter._id;
      option.textContent = `Counter ${counter.counterNumber}`;

      dropdown.appendChild(option);
    });

  } catch (error) {
    alert("Unable to load counters: " + error.message);
  }
}


// =====================================
// CREATE STAFF ACCOUNT
// =====================================
async function createStaff(event) {
  event.preventDefault();

  const name = document.getElementById("staffName").value.trim();
  const email = document.getElementById("staffEmail").value.trim();
  const password = document.getElementById("staffPassword").value;
  const counter = document.getElementById("staffCounter").value;

  if (!counter) {
    alert("Please select a bank counter.");
    return;
  }

  try {
    await api("/api/users", {
      method: "POST",
      body: JSON.stringify({
        name,
        email,
        password,
        role: "Staff",
        counter
      })
    });

    alert("Staff account created successfully!");

    document.getElementById("staffForm").reset();

    await loadStaffMembers();

  } catch (error) {
    alert("Staff creation failed: " + error.message);
  }
}


// =====================================
// RESET STAFF PASSWORD
// =====================================
async function resetStaffPassword(userId, staffName) {

  const newPassword = prompt(
    `Enter a new password for ${staffName}:`
  );

  if (newPassword === null) {
    return;
  }

  if (newPassword.length < 6) {
    alert("Password must contain at least 6 characters.");
    return;
  }

  const confirmReset = confirm(
    `Are you sure you want to reset ${staffName}'s password?`
  );

  if (!confirmReset) {
    return;
  }

  try {
    const result = await api(
      `/api/users/${userId}/reset-password`,
      {
        method: "PUT",
        body: JSON.stringify({
          newPassword
        })
      }
    );

    alert(result.message);

  } catch (error) {
    alert("Password reset failed: " + error.message);
  }
}


// =====================================
// DISPLAY STAFF MEMBERS
// =====================================
async function loadStaffMembers() {
  try {
    const users = await api("/api/users");

    const staff = users.filter(user => user.role === "Staff");

    document.getElementById("staffList").innerHTML = staff.length
      ? `<table>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Assigned Counter</th>
            <th>Action</th>
          </tr>` +

        staff.map(user =>
          `<tr>
            <td>${user.name}</td>

            <td>${user.email}</td>

            <td>
              ${user.counter
                ? "Counter " + user.counter.counterNumber
                : "Not Assigned"}
            </td>

            <td>
              <button
                type="button"
                onclick="resetStaffPassword('${user._id}', '${user.name.replace(/'/g, "\\'")}')">
                Reset Password
              </button>
            </td>
          </tr>`
        ).join("") +

        "</table>"

      : "<p>No staff accounts created yet.</p>";

  } catch (error) {
    alert("Unable to load staff: " + error.message);
  }
}


// =====================================
// INITIALIZE ADMIN DASHBOARD
// =====================================
document.getElementById("staffForm")
  .addEventListener("submit", createStaff);

async function initializeAdmin() {
  await loadAdmin();
  await loadStaffCounters();
  await loadStaffMembers();
}

initializeAdmin();
