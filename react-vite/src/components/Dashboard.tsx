import React, { useEffect, useState, useRef } from "react";
import {
  Box,
  Typography,
  Select,
  MenuItem,
  Chip,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  TextField,
  IconButton,
  Paper,
  Button,
  CircularProgress,
  Stack,
  AppBar,
  Toolbar,
  alpha,
  useTheme,
} from "@wso2/oxygen-ui";
import {
  Send,
  Trash2,
  Bot,
  User,
  Shield,
  Zap,
  Lock,
  Ruler,
} from "@wso2/oxygen-ui-icons-react";
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

const GUARDRAIL_ICONS: Record<string, React.ReactNode> = {
  APIM4OMINI: <Zap size={18} />,
  APIM4OMINIPIIMASKINGREGEX: <Lock size={18} />,
  APIM4OMINIURLGUARDRAIL: <Shield size={18} />,
  APIM4OMINIWORDCOUNTGUARDRAIL: <Ruler size={18} />,
};

const Dashboard: React.FC = () => {
  const theme = useTheme();
  const [gatewayConnected, setGatewayConnected] = useState(false);
  const [model, setModel] = useState("gpt-4o-mini");
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

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: res.error ? `⚠️ ${res.content}` : res.content,
          timestamp: new Date(),
        },
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
    setMessages([]);
    setInput("");
  };

  const clearChat = () => setMessages([]);

  return (
    <Box sx={{ display: "flex", height: "100vh" }}>
      {/* Sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: DRAWER_WIDTH,
            boxSizing: "border-box",
            bgcolor: "#0d0d0d",
            borderRight: "1px solid",
            borderColor: alpha("#fff", 0.08),
          },
        }}
      >
        {/* Logo / Title */}
        <Box sx={{ p: 2.5, pb: 1 }}>
          <Typography
            variant="h6"
            sx={{ fontWeight: 700, fontSize: "1.3rem", color: "text.primary" }}
          >
            WSO2AI Demo
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.8rem" }}>
            WSO2 API Manager — Guardrails
          </Typography>
        </Box>

        {/* Gateway Status */}
        <Box sx={{ px: 2.5, py: 1.5 }}>
          <Chip
            label={gatewayConnected ? "Gateway connected" : "Gateway disconnected"}
            size="small"
            color={gatewayConnected ? "success" : "error"}
            variant="outlined"
            sx={{ width: "100%", fontWeight: 600, fontSize: "0.85rem" }}
            icon={
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  bgcolor: gatewayConnected ? "success.main" : "error.main",
                  ml: 1,
                }}
              />
            }
          />
        </Box>

        <Divider sx={{ my: 1.5 }} />

        {/* Guardrails List */}
        <Box sx={{ px: 2.5, pb: 1 }}>
          <Typography
            variant="caption"
            sx={{
              color: "text.secondary",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 1,
            }}
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
                  bgcolor: alpha(theme.palette.primary.main, 0.15),
                  "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.2) },
                },
                "&:hover": {
                  bgcolor: alpha(theme.palette.action.hover, 0.08),
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 32, color: "text.secondary" }}>
                {GUARDRAIL_ICONS[g.id] || <Shield size={18} />}
              </ListItemIcon>
              <ListItemText
                primary={g.name}
                primaryTypographyProps={{
                  fontSize: "0.92rem",
                  fontWeight: selectedGuardrail.id === g.id ? 600 : 400,
                  color: selectedGuardrail.id === g.id ? "primary.main" : "text.primary",
                }}
              />
            </ListItemButton>
          ))}
        </List>
      </Drawer>

      {/* Main Content */}
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Guardrail Info Header — only show when conversation is active */}
        <Box
          sx={{
            px: 4,
            py: 2.5,
            borderBottom: "1px solid",
            borderColor: "divider",
            bgcolor: "transparent",
            display: messages.length === 0 ? "none" : "block",
          }}
        >
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
            {selectedGuardrail.name}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.95rem" }}>
            {selectedGuardrail.desc}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: "text.secondary",
              mt: 0.5,
              display: "block",
              fontFamily: "monospace",
              fontSize: "0.8rem",
            }}
          >
            API: {selectedGuardrail.context}
          </Typography>
        </Box>

        {/* Chat Area */}
        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            ...(messages.length === 0 && {
              justifyContent: "center",
              alignItems: "center",
            }),
          }}
        >
          {messages.length === 0 ? (
            /* Centered welcome + input when no messages */
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                width: "100%",
                maxWidth: 680,
                px: 4,
              }}
            >
              <Bot size={48} style={{ opacity: 0.4 }} />
              <Typography
                variant="h5"
                sx={{ mt: 2, mb: 0.5, fontWeight: 600, textAlign: "center" }}
              >
                {selectedGuardrail.name}
              </Typography>
              <Typography
                color="text.secondary"
                sx={{ mb: 3, opacity: 0.6, textAlign: "center", fontSize: "0.95rem" }}
              >
                {selectedGuardrail.desc}
              </Typography>
              <Box
                sx={{
                  width: "100%",
                  border: "1px solid",
                  borderColor: alpha("#fff", 0.2),
                  borderRadius: 2.5,
                  bgcolor: alpha("#fff", 0.03),
                  overflow: "hidden",
                  "&:focus-within": {
                    borderColor: "primary.main",
                  },
                }}
              >
                <TextField
                  fullWidth
                  placeholder="Type a message..."
                  variant="standard"
                  multiline
                  minRows={1}
                  maxRows={6}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  disabled={loading}
                  InputProps={{ disableUnderline: true }}
                  sx={{
                    px: 2,
                    pt: 1.5,
                    pb: 0.5,
                    "& .MuiInputBase-input::placeholder": {
                      color: alpha("#fff", 0.4),
                      opacity: 1,
                    },
                  }}
                />
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    px: 1.5,
                    py: 1,
                  }}
                >
                  <Select
                    value={model}
                    onChange={(e) => setModel(e.target.value as string)}
                    size="small"
                    variant="standard"
                    disableUnderline
                    sx={{
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      color: "text.secondary",
                      "& .MuiSelect-select": { py: 0.5, px: 1 },
                    }}
                  >
                    <MenuItem value="gpt-4o-mini">gpt-4o-mini</MenuItem>
                  </Select>
                  <IconButton
                    onClick={() => handleSend()}
                    disabled={loading || !input.trim()}
                    color="primary"
                    sx={{
                      bgcolor: "primary.main",
                      color: "primary.contrastText",
                      width: 36,
                      height: 36,
                      borderRadius: 2,
                      "&:hover": { bgcolor: "primary.dark" },
                      "&.Mui-disabled": {
                        bgcolor: alpha(theme.palette.primary.main, 0.3),
                        color: alpha(theme.palette.primary.contrastText, 0.3),
                      },
                    }}
                  >
                    <Send size={16} />
                  </IconButton>
                </Box>
              </Box>

              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 2, width: "100%", justifyContent: "center" }}>
                {selectedGuardrail.test_prompts.map((tp, idx) => (
                  <Button
                    key={idx}
                    variant="outlined"
                    size="small"
                    onClick={() => setInput(tp.text)}
                    disabled={loading}
                    sx={{
                      fontSize: "0.85rem",
                      px: 2,
                      py: 0.8,
                      textTransform: "none",
                      borderRadius: 3,
                      color: alpha("#fff", 0.7),
                      borderColor: alpha("#fff", 0.2),
                      "&:hover": {
                        borderColor: alpha("#fff", 0.5),
                        bgcolor: alpha("#fff", 0.05),
                      },
                    }}
                  >
                    {tp.label}
                  </Button>
                ))}
              </Stack>
            </Box>
          ) : (
            /* Messages + bottom input when conversation started */
            <>
              <Box sx={{ flex: 1, overflow: "auto", px: 4, py: 3 }}>
                {messages.map((msg, idx) => (
                  <Box
                    key={idx}
                    sx={{ display: "flex", gap: 1.5, mb: 2.5, alignItems: "flex-start" }}
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
                            ? alpha(theme.palette.primary.main, 0.15)
                            : alpha(theme.palette.secondary.main, 0.15),
                        flexShrink: 0,
                        mt: 0.5,
                      }}
                    >
                      {msg.role === "user" ? (
                        <User size={16} color={theme.palette.primary.main} />
                      ) : (
                        <Bot size={16} color={theme.palette.secondary.main} />
                      )}
                    </Box>
                    <Paper
                      elevation={0}
                      sx={{
                        px: 2.5,
                        py: 1.5,
                        bgcolor:
                          msg.role === "user"
                            ? alpha(theme.palette.primary.main, 0.06)
                            : alpha(theme.palette.action.hover, 0.4),
                        border: "1px solid",
                        borderColor:
                          msg.role === "user"
                            ? alpha(theme.palette.primary.main, 0.15)
                            : "divider",
                        borderRadius: 3,
                        maxWidth: "80%",
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{ whiteSpace: "pre-wrap", lineHeight: 1.6, fontSize: "1rem" }}
                      >
                        {msg.content}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ color: "text.secondary", display: "block", mt: 0.5, fontSize: "0.75rem" }}
                      >
                        {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
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
                        bgcolor: alpha(theme.palette.secondary.main, 0.15),
                        flexShrink: 0,
                      }}
                    >
                      <Bot size={16} color={theme.palette.secondary.main} />
                    </Box>
                    <Paper
                      elevation={0}
                      sx={{
                        px: 2.5,
                        py: 1.5,
                        bgcolor: alpha(theme.palette.action.hover, 0.4),
                        border: "1px solid",
                        borderColor: "divider",
                        borderRadius: 3,
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                      }}
                    >
                      <CircularProgress size={16} />
                      <Typography variant="body2" color="text.secondary">
                        Thinking...
                      </Typography>
                    </Paper>
                  </Box>
                )}
                <div ref={messagesEndRef} />
              </Box>

              {/* Test prompts strip above input */}
              <Stack
                direction="row"
                spacing={1}
                flexWrap="wrap"
                useFlexGap
                sx={{ px: 4, pt: 1.5, pb: 0 }}
              >
                {selectedGuardrail.test_prompts.map((tp, idx) => (
                  <Button
                    key={idx}
                    variant="outlined"
                    size="small"
                    onClick={() => setInput(tp.text)}
                    disabled={loading}
                    sx={{
                      fontSize: "0.8rem",
                      px: 1.5,
                      py: 0.5,
                      textTransform: "none",
                      borderRadius: 3,
                      color: alpha("#fff", 0.6),
                      borderColor: alpha("#fff", 0.15),
                      "&:hover": {
                        borderColor: alpha("#fff", 0.4),
                        bgcolor: alpha("#fff", 0.05),
                      },
                    }}
                  >
                    {tp.label}
                  </Button>
                ))}
              </Stack>

              {/* Bottom Input Bar */}
              <Box
                sx={{
                  px: 4,
                  py: 2,
                  bgcolor: "transparent",
                }}
              >
                <Box
                  sx={{
                    border: "1px solid",
                    borderColor: alpha("#fff", 0.2),
                    borderRadius: 2.5,
                    bgcolor: alpha("#fff", 0.03),
                    overflow: "hidden",
                    "&:focus-within": {
                      borderColor: "primary.main",
                    },
                  }}
                >
                  <TextField
                    fullWidth
                    placeholder="Type a message..."
                    variant="standard"
                    multiline
                    minRows={1}
                    maxRows={6}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    disabled={loading}
                    InputProps={{ disableUnderline: true }}
                    sx={{
                      px: 2,
                      pt: 1.5,
                      pb: 0.5,
                      "& .MuiInputBase-input::placeholder": {
                        color: alpha("#fff", 0.4),
                        opacity: 1,
                      },
                    }}
                  />
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      px: 1.5,
                      py: 1,
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Select
                        value={model}
                        onChange={(e) => setModel(e.target.value as string)}
                        size="small"
                        variant="standard"
                        disableUnderline
                        sx={{
                          fontSize: "0.8rem",
                          fontWeight: 600,
                          color: "text.secondary",
                          "& .MuiSelect-select": { py: 0.5, px: 1 },
                        }}
                      >
                        <MenuItem value="gpt-4o-mini">gpt-4o-mini</MenuItem>
                      </Select>
                      <Button
                        onClick={clearChat}
                        size="small"
                        startIcon={<Trash2 size={14} />}
                        sx={{
                          color: "text.secondary",
                          whiteSpace: "nowrap",
                          textTransform: "none",
                          fontSize: "0.8rem",
                          "&:hover": { color: "error.main" },
                        }}
                      >
                        Clear
                      </Button>
                    </Box>
                    <IconButton
                      onClick={() => handleSend()}
                      disabled={loading || !input.trim()}
                      color="primary"
                      sx={{
                        bgcolor: "primary.main",
                        color: "primary.contrastText",
                        width: 36,
                        height: 36,
                        borderRadius: 2,
                        "&:hover": { bgcolor: "primary.dark" },
                        "&.Mui-disabled": {
                          bgcolor: alpha(theme.palette.primary.main, 0.3),
                          color: alpha(theme.palette.primary.contrastText, 0.3),
                        },
                      }}
                    >
                      <Send size={16} />
                    </IconButton>
                  </Box>
                </Box>
              </Box>
            </>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default Dashboard;
