import { getEnvOrDefault } from "../utils/getEnvOrDefault";

const BFF_BASE = getEnvOrDefault("VITE_BFF_URL", "http://localhost:8000");

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
  messages: ChatMessage[]
): Promise<ChatResponse> {
  const res = await fetch(`${BFF_BASE}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key_id: apiKeyId,
      context,
      model,
      messages,
    }),
  });
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
