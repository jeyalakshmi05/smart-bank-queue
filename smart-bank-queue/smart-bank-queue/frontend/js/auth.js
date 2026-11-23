
function checkStaffLogin() {
    const token = sessionStorage.getItem("smartbankToken");
    const userData = sessionStorage.getItem("smartbankUser");

    if (!token || !userData) {
        window.location.href = "staff-login.html";
        return false;
    }

    try {
        const user = JSON.parse(userData);

        if (user.role !== "Staff" || !user.counter) {
            sessionStorage.clear();
            window.location.href = "staff-login.html";
            return false;
        }

        return true;

    } catch (error) {
        sessionStorage.clear();
        window.location.href = "staff-login.html";
        return false;
    }
}
