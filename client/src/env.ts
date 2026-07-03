/** Runtime configuration sourced from Vite env vars (with dev fallbacks). */
export const env = {
  API_URL: import.meta.env.VITE_API_URL ?? 'http://localhost:4000',
  SOCKET_URL: import.meta.env.VITE_SOCKET_URL ?? 'http://localhost:4000',
} as const;
