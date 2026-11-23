const API_BASE = "http://localhost:5000";

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