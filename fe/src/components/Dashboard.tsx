import React, { useEffect, useState, useRef } from "react";
import {
  Box,
  Drawer,
  Typography,
  Select,
  MenuItem,
  Chip,
  List,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Divider,
  TextField,
  IconButton,
  Paper,
  Button,
  CircularProgress,
  Stack,
  alpha,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import SmartToyOutlinedIcon from "@mui/icons-material/SmartToyOutlined";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import { GUARDRAIL_APIS } from "../config/guardrails";
import type { GuardrailApi } from "../config/guardrails";
import { sendChat, checkGatewayStatus } from "../api/client";
import type { ChatMessage } from "../api/client";

const DRAWER_WIDTH = 280;

interface DisplayMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const Dashboard: React.FC = () => {
  const [gatewayConnected, setGatewayConnected] = useState(false);
  const [model] = useState("gpt-4o-mini");
  const [selectedGuardrail, setSelectedGuardrail] = useState<GuardrailApi>(
    GUARDRAIL_APIS[0]
  );
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkGatewayStatus().then((s) => setGatewayConnected(s.connected));
    const interval = setInterval(() => {
      checkGatewayStatus().then((s) => setGatewayConnected(s.connected));
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (text?: string) => {
    const msg = text || input.trim();
    if (!msg || loading) return;

    const userMsg: DisplayMessage = {
      role: "user",
      content: msg,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const chatMessages: ChatMessage[] = [
        ...messages.map((m) => ({ role: m.role, content: m.content })),
        { role: "user" as const, content: msg },
      ];

      const res = await sendChat(
        selectedGuardrail.id,
        selectedGuardrail.context,
        selectedGuardrail.model,
        chatMessages
      );

      let content: string;
      if (res.error) {
        content = `⚠️ ${res.content}`;
      } else {
        content = res.content;
      }

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content, timestamp: new Date() },
      ]);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `❌ Request failed: ${errorMsg}`,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleGuardrailSwitch = (g: GuardrailApi) => {
    setSelectedGuardrail(g);
    setMessages([
      {
        role: "assistant",
        content: `Switched to ${g.name}.\n\n${g.desc}\n\n*Try the test prompts below to see this guardrail in action.*`,
        timestamp: new Date(),
      },
    ]);
  };

  const clearChat = () => {
    setMessages([]);
  };

  return (
    <Box sx={{ display: "flex", height: "100vh", bgcolor: "background.default" }}>
      {/* Sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: DRAWER_WIDTH,
            boxSizing: "border-box",
            bgcolor: "#0d1117",
            borderRight: "1px solid",
            borderColor: "divider",
            display: "flex",
            flexDirection: "column",
          },
        }}
      >
        {/* Logo */}
        <Box sx={{ p: 2.5, pb: 1 }}>
          <Typography variant="h6" sx={{ color: "#fff", fontWeight: 700, fontSize: "1.1rem" }}>
            WSO2 AI Gateway Demo
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.7rem" }}>
            WSO2 API Manager — Guardrails
          </Typography>
        </Box>

        {/* Gateway Status */}
        <Box sx={{ px: 2.5, py: 1.5 }}>
          <Chip
            label={gatewayConnected ? "Gateway connected" : "Gateway disconnected"}
            size="small"
            sx={{
              width: "100%",
              bgcolor: gatewayConnected
                ? alpha("#3fb950", 0.15)
                : alpha("#f85149", 0.15),
              color: gatewayConnected ? "#3fb950" : "#f85149",
              fontWeight: 600,
              fontSize: "0.75rem",
              "& .MuiChip-label": { px: 1 },
              "&::before": {
                content: '""',
                width: 8,
                height: 8,
                borderRadius: "50%",
                bgcolor: gatewayConnected ? "#3fb950" : "#f85149",
                ml: 1,
                display: "inline-block",
              },
            }}
          />
        </Box>

        {/* Model selector */}
        <Box sx={{ px: 2.5, py: 1 }}>
          <Typography
            variant="caption"
            sx={{ color: "text.secondary", mb: 0.5, display: "block", fontWeight: 600 }}
          >
            Model
          </Typography>
          <Select
            value={model}
            size="small"
            fullWidth
            sx={{
              bgcolor: alpha("#fff", 0.05),
              color: "#58a6ff",
              fontSize: "0.8rem",
              fontWeight: 600,
              borderRadius: 2,
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: alpha("#fff", 0.1),
              },
              "&:hover .MuiOutlinedInput-notchedOutline": {
                borderColor: alpha("#fff", 0.2),
              },
            }}
          >
            <MenuItem value="gpt-4o-mini">gpt-4o-mini</MenuItem>
          </Select>
        </Box>

        <Divider sx={{ my: 1.5, borderColor: "divider" }} />

        {/* Guardrails */}
        <Box sx={{ px: 2.5, pb: 1 }}>
          <Typography
            variant="caption"
            sx={{ color: "text.secondary", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}
          >
            Guardrails
          </Typography>
        </Box>

        <List sx={{ px: 1, flex: 1, overflow: "auto" }}>
          {GUARDRAIL_APIS.map((g) => (
            <ListItemButton
              key={g.id}
              selected={selectedGuardrail.id === g.id}
              onClick={() => handleGuardrailSwitch(g)}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                py: 1,
                px: 1.5,
                "&.Mui-selected": {
                  bgcolor: alpha("#ff7300", 0.15),
                  "&:hover": {
                    bgcolor: alpha("#ff7300", 0.2),
                  },
                },
                "&:hover": {
                  bgcolor: alpha("#fff", 0.05),
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 28 }}>
                <Typography fontSize="1rem">
                  {g.name.split(" ")[0]}
                </Typography>
              </ListItemIcon>
              <ListItemText
                primary={g.name.split(" ").slice(1).join(" ")}
                primaryTypographyProps={{
                  fontSize: "0.82rem",
                  fontWeight: selectedGuardrail.id === g.id ? 600 : 400,
                  color:
                    selectedGuardrail.id === g.id
                      ? "#ff7300"
                      : "text.primary",
                }}
              />
            </ListItemButton>
          ))}
        </List>
      </Drawer>

      {/* Main Content */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
        }}
      >
        {/* Header */}
        <Box
          sx={{
            px: 4,
            py: 2.5,
            borderBottom: "1px solid",
            borderColor: "divider",
            bgcolor: "#0d1117",
          }}
        >
          <Typography variant="h5" sx={{ color: "#fff", mb: 0.5 }}>
            {selectedGuardrail.name}
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", fontSize: "0.85rem" }}>
            {selectedGuardrail.desc}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: "text.secondary",
              mt: 0.5,
              display: "block",
              fontFamily: "monospace",
              fontSize: "0.7rem",
            }}
          >
            API: {selectedGuardrail.context}
          </Typography>

          {/* Test Prompts */}
          <Box sx={{ mt: 2 }}>
            <Typography
              variant="caption"
              sx={{ color: "text.secondary", mb: 1, display: "block" }}
            >
              Test prompts — click to try:
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {selectedGuardrail.test_prompts.map((tp, idx) => (
                <Button
                  key={idx}
                  variant="outlined"
                  size="small"
                  onClick={() => handleSend(tp.text)}
                  disabled={loading}
                  sx={{
                    borderColor: alpha("#fff", 0.12),
                    color: "text.primary",
                    fontSize: "0.78rem",
                    px: 2,
                    py: 0.8,
                    "&:hover": {
                      borderColor: "#ff7300",
                      bgcolor: alpha("#ff7300", 0.08),
                    },
                  }}
                >
                  {tp.label}
                </Button>
              ))}
            </Stack>
          </Box>
        </Box>

        {/* Messages */}
        <Box
          sx={{
            flex: 1,
            overflow: "auto",
            px: 4,
            py: 3,
          }}
        >
          {messages.length === 0 && (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                opacity: 0.5,
              }}
            >
              <SmartToyOutlinedIcon sx={{ fontSize: 48, mb: 2, color: "text.secondary" }} />
              <Typography color="text.secondary">
                Select a guardrail and send a message to get started
              </Typography>
            </Box>
          )}

          {messages.map((msg, idx) => (
            <Box
              key={idx}
              sx={{
                display: "flex",
                gap: 1.5,
                mb: 2.5,
                alignItems: "flex-start",
              }}
            >
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor:
                    msg.role === "user"
                      ? alpha("#ff7300", 0.15)
                      : alpha("#40e0d0", 0.15),
                  flexShrink: 0,
                  mt: 0.5,
                }}
              >
                {msg.role === "user" ? (
                  <PersonOutlinedIcon
                    sx={{ fontSize: 18, color: "#ff7300" }}
                  />
                ) : (
                  <SmartToyOutlinedIcon
                    sx={{ fontSize: 18, color: "#40e0d0" }}
                  />
                )}
              </Box>
              <Paper
                elevation={0}
                sx={{
                  px: 2.5,
                  py: 1.5,
                  bgcolor:
                    msg.role === "user"
                      ? alpha("#ff7300", 0.06)
                      : alpha("#fff", 0.03),
                  border: "1px solid",
                  borderColor:
                    msg.role === "user"
                      ? alpha("#ff7300", 0.15)
                      : alpha("#fff", 0.06),
                  borderRadius: 3,
                  maxWidth: "80%",
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    color: "text.primary",
                    whiteSpace: "pre-wrap",
                    lineHeight: 1.6,
                    fontSize: "0.88rem",
                  }}
                >
                  {msg.content}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: "text.secondary",
                    display: "block",
                    mt: 0.5,
                    fontSize: "0.65rem",
                  }}
                >
                  {msg.timestamp.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Typography>
              </Paper>
            </Box>
          ))}

          {loading && (
            <Box sx={{ display: "flex", gap: 1.5, mb: 2.5, alignItems: "flex-start" }}>
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor: alpha("#40e0d0", 0.15),
                  flexShrink: 0,
                }}
              >
                <SmartToyOutlinedIcon sx={{ fontSize: 18, color: "#40e0d0" }} />
              </Box>
              <Paper
                elevation={0}
                sx={{
                  px: 2.5,
                  py: 1.5,
                  bgcolor: alpha("#fff", 0.03),
                  border: "1px solid",
                  borderColor: alpha("#fff", 0.06),
                  borderRadius: 3,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <CircularProgress size={16} sx={{ color: "#40e0d0" }} />
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  Thinking...
                </Typography>
              </Paper>
            </Box>
          )}
          <div ref={messagesEndRef} />
        </Box>

        {/* Input area */}
        <Box
          sx={{
            px: 4,
            py: 2,
            borderTop: "1px solid",
            borderColor: "divider",
            bgcolor: "#0d1117",
            display: "flex",
            gap: 1,
            alignItems: "center",
          }}
        >
          <TextField
            fullWidth
            placeholder="Type a message..."
            variant="outlined"
            size="small"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            disabled={loading}
            sx={{
              "& .MuiOutlinedInput-root": {
                bgcolor: alpha("#fff", 0.04),
                borderRadius: 3,
                color: "text.primary",
                "& fieldset": {
                  borderColor: alpha("#fff", 0.1),
                },
                "&:hover fieldset": {
                  borderColor: alpha("#fff", 0.2),
                },
                "&.Mui-focused fieldset": {
                  borderColor: "#ff7300",
                },
              },
            }}
          />
          <IconButton
            onClick={() => handleSend()}
            disabled={loading || !input.trim()}
            sx={{
              bgcolor: "#ff7300",
              color: "#fff",
              width: 40,
              height: 40,
              "&:hover": { bgcolor: "#e06800" },
              "&.Mui-disabled": {
                bgcolor: alpha("#ff7300", 0.3),
                color: alpha("#fff", 0.3),
              },
            }}
          >
            <SendIcon sx={{ fontSize: 18 }} />
          </IconButton>
          <Button
            onClick={clearChat}
            size="small"
            startIcon={<DeleteOutlineIcon />}
            sx={{
              color: "text.secondary",
              whiteSpace: "nowrap",
              "&:hover": { color: "#f85149" },
            }}
          >
            Clear Chat
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default Dashboard;
