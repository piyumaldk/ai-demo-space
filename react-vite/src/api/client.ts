import { BFF_BASE } from "../config/config";

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
