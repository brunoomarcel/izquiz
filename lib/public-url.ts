export const PUBLIC_DOMAIN = (process.env.NEXT_PUBLIC_APP_DOMAIN ?? "izquiz.stuffshub.com").replace(/^https?:\/\//, "").replace(/\/$/, "").toLowerCase();

export function getPublicBaseUrl() {
  if (typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")) return window.location.origin;
  return `https://${PUBLIC_DOMAIN}`;
}

export function getDomainBaseUrl(hostname: string) {
  if (typeof window !== "undefined" && hostname.endsWith(".localhost")) return `http://${hostname}${window.location.port ? `:${window.location.port}` : ""}`;
  return `https://${hostname}`;
}
