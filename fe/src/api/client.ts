const BFF_BASE = import.meta.env.VITE_BFF_URL || "http://localhost:8000";

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export async function sendChat(
  apiKeyId: string,
  context: string,
  messages: ChatMessage[]
): Promise<{ error?: boolean; detail?: string; choices?: Array<{ message: { content: string } }> }> {
  const res = await fetch(`${BFF_BASE}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key_id: apiKeyId,
      context,
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
