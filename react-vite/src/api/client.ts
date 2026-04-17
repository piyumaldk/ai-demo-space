import { BFF_BASE } from "../config/config";

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ChatResponse {
  error: boolean;
  content: string;
}

export interface VerifyAuthResult {
  authorized: boolean;
  email: string;
  reason?: string;
}

export async function verifyAuth(token: string): Promise<VerifyAuthResult> {
  try {
    const res = await fetch(`${BFF_BASE}/api/verify-auth`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 401) {
      return { authorized: false, email: "", reason: "Your session is invalid. Please try signing in again." };
    }
    if (res.status === 403) {
      const data = await res.json();
      return { authorized: false, email: "", reason: data.detail ?? "Your account is not authorized to access this demo." };
    }
    if (!res.ok) {
      return { authorized: false, email: "", reason: "Unable to verify your account. Please try again." };
    }
    const data = await res.json();
    return { authorized: true, email: data.email };
  } catch {
    return { authorized: false, email: "", reason: "Could not reach the server. Please check your connection and try again." };
  }
}

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ChatResponse {
  error: boolean;
  content: string;
}

export async function sendChat(
  apiKeyId: string,
  context: string,
  model: string,
  messages: ChatMessage[],
  authToken?: string | null
): Promise<ChatResponse> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }

  const res = await fetch(`${BFF_BASE}/api/chat`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      api_key_id: apiKeyId,
      context,
      model,
      messages,
    }),
  });

  if (res.status === 401) {
    throw new Error("AUTH_EXPIRED");
  }

  return res.json();
}

export async function checkGatewayStatus(): Promise<{ connected: boolean; url: string }> {
  try {
    const res = await fetch(`${BFF_BASE}/api/gateway-status`);
    return res.json();
  } catch {
    return { connected: false, url: "" };
  }
}
