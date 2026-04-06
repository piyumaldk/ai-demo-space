/**
 * Resolves a configuration value with the following priority:
 *  1. Runtime config injected by entrypoint.sh via window.__RUNTIME_CONFIG__
 *  2. Build-time Vite env variable (import.meta.env)
 *  3. The provided default value
 */
export const getEnvOrDefault = <T>(envKey: string, defaultValue: T): T => {
  // 1. Runtime config (highest priority — works in Docker / Choreo)
  const runtimeValue =
    typeof window !== "undefined" &&
    (window as { __RUNTIME_CONFIG__?: Record<string, string> }).__RUNTIME_CONFIG__
      ? (window as { __RUNTIME_CONFIG__?: Record<string, string> }).__RUNTIME_CONFIG__![envKey]
      : undefined;

  if (runtimeValue !== undefined && runtimeValue !== null && runtimeValue !== "") {
    if (typeof defaultValue === "boolean") {
      return (runtimeValue === "true" || runtimeValue === "1") as T;
    }
    if (typeof defaultValue === "number") {
      const num = Number(runtimeValue);
      return (isNaN(num) ? defaultValue : num) as T;
    }
    return runtimeValue as T;
  }

  // 2. Build-time Vite env variable
  const envValue = import.meta.env[envKey];
  if (envValue !== undefined && envValue !== null && envValue !== "") {
    if (typeof defaultValue === "boolean") {
      return (envValue === "true" || envValue === "1") as T;
    }
    if (typeof defaultValue === "number") {
      const num = Number(envValue);
      return (isNaN(num) ? defaultValue : num) as T;
    }
    return envValue as T;
  }

  // 3. Default
  return defaultValue;
};
