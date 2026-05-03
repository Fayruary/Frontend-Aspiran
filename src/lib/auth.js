export function getUser() {
  if (typeof window === "undefined") return null;
  return JSON.parse(localStorage.getItem("user"));
}

export function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}