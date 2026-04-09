import { getEnvOrDefault } from "../utils/getEnvOrDefault";

export const BFF_BASE = getEnvOrDefault("VITE_BFF_URL", "");
export const GOOGLE_CLIENT_ID = getEnvOrDefault("VITE_GOOGLE_CLIENT_ID", "");
