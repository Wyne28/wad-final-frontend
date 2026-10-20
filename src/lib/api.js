const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:3000"
).replace(/\/+$/, "");

export async function api(path, options = {}) {
  const headers = new Headers(options.headers);

  if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });

  const text = await response.text();
  let data;

  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error("The server returned an unexpected response.");
  }

  if (!response.ok) {
    const error = new Error(
      data.message || `Request failed (${response.status})`,
    );

    error.status = response.status;
    throw error;
  }

  return data;
}