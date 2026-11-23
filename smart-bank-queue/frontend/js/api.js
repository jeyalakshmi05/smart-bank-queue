const API_BASE = "https://your-service-name.onrender.com";
async function api(url, options = {}) {
    const token = sessionStorage.getItem("smartbankToken");

    const fullUrl = url.startsWith("http") ? url : API_BASE + url;

    const response = await fetch(fullUrl, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(options.headers || {})
        }
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(data.message || "Request failed");
    }

    return data;
}