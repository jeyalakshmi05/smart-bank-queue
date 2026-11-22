
const staffLoginForm = document.getElementById("staffLoginForm");

staffLoginForm.addEventListener("submit", async (event) => {
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

        if (result.user.role !== "Staff") {
            throw new Error("This login is only for Staff accounts.");
        }

        if (!result.user.counter) {
            throw new Error("No counter assigned. Contact Admin.");
        }

        sessionStorage.setItem("smartbankToken", result.token);
        sessionStorage.setItem(
            "smartbankUser",
            JSON.stringify(result.user)
        );

        window.location.href = "staff.html";

    } catch (error) {
        message.textContent = error.message;
        button.disabled = false;
        button.textContent = "Staff Login";
    }
});
