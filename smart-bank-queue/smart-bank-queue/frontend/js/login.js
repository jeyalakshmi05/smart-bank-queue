
const loginForm = document.getElementById("loginForm");

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const button = document.getElementById("loginButton");
  const message = document.getElementById("message");

  button.disabled = true;
  button.textContent = "Logging in...";
  message.textContent = "";

  try {
    const result = await api("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });

    sessionStorage.setItem("smartbankToken", result.token);
    sessionStorage.setItem("smartbankUser", JSON.stringify(result.user));

    if (result.user.role === "Admin") {
      window.location.href = "admin.html";
    } else if (result.user.role === "Staff") {
      window.location.href = "staff.html";
    } else {
      throw new Error("Unknown user role");
    }

  } catch (error) {
    message.textContent = error.message;
    button.disabled = false;
    button.textContent = "Login";
  }
});
