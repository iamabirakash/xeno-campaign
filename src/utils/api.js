const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

export async function api(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return response.json();
}

export const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0
});

export function percent(value, total, withSymbol = true) {
  if (!total) return withSymbol ? "0%" : 0;
  const result = Math.round((value / total) * 100);
  return withSymbol ? `${result}%` : result;
}

export function labelize(value) {
  return value.replace(/([A-Z])/g, " $1").replace(/^./, (letter) => letter.toUpperCase());
}

export function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
