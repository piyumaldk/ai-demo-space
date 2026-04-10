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
  alpha,
  useTheme,
  Menu,
  Avatar,
  ColorSchemeToggle,
  useColorScheme,
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
  LogOut,
} from "@wso2/oxygen-ui-icons-react";
import { GoogleLogin } from "@react-oauth/google";
import type { CredentialResponse } from "@react-oauth/google";
import { useAuth } from "../auth/AuthContext";
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
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { mode } = useColorScheme();
  const colorSchemeLabel = "Theme";

  // Resolve dark state synchronously — avoids flash on first render when mode is "system"
  const resolvedIsDark = React.useMemo(() => {
    if (mode === 'dark') return true;
    if (mode === 'light') return false;
    return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }, [mode]);
  const [gatewayConnected, setGatewayConnected] = useState(false);
  const [model, setModel] = useState("gpt-4o-mini");
  const [selectedGuardrail, setSelectedGuardrail] = useState<GuardrailApi>(
    GUARDRAIL_APIS[0]
  );
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { user: authUser, token, isAuthenticated, signIn: authSignIn, signOut: authSignOut } = useAuth();
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);

  function decodeJwtPayload(credential: string): Record<string, string> {
    try {
      const base64 = credential.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
      return JSON.parse(atob(base64));
    } catch {
      return {};
    }
  }

  function handleGoogleSuccess(credentialResponse: CredentialResponse) {
    if (!credentialResponse.credential) return;
    const payload = decodeJwtPayload(credentialResponse.credential);
    const expiresIn = payload.exp
      ? Number(payload.exp) - Math.floor(Date.now() / 1000)
      : 3600;
    authSignIn(payload.email, payload.name, payload.picture, credentialResponse.credential, expiresIn);
  }

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

    if (!isAuthenticated) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Please sign in with an allowed email to proceed.",
          timestamp: new Date(),
        },
      ]);
      return;
    }

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
        chatMessages,
        token
      );

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: res.error ? `${res.content}` : res.content,
          timestamp: new Date(),
        },
      ]);
    } catch (err: unknown) {
      if (err instanceof Error && err.message === "AUTH_EXPIRED") {
        authSignOut();
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Your session has expired. Please sign in again.",
            timestamp: new Date(),
          },
        ]);
      } else {
        const errorMsg = err instanceof Error ? err.message : "Unknown error";
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `Request failed: ${errorMsg}`,
            timestamp: new Date(),
          },
        ]);
      }
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
            bgcolor: isDark ? "#0d0d0d" : "background.paper",
            borderRight: "1px solid",
            borderColor: isDark ? alpha("#fff", 0.08) : "divider",
            borderRadius: 0,
          },
        }}
      >
        {/* Logo / Title */}
        <Box sx={{ p: 2.5, pb: 1 }}>
          <Typography
            variant="h6"
            sx={{ fontWeight: 700, fontSize: "1.3rem", color: "text.primary" }}
          >
            WSO2 AI DEMO
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.8rem" }}>
            Tryout Console
          </Typography>
        </Box>

        {/* Gateway Status */}
        <Box sx={{ px: 2.5, py: 1.5, display: "flex", alignItems: "center", gap: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, fontSize: "0.88rem", color: "text.primary" }}>
            AI Gateway
          </Typography>
          <Chip
            label={gatewayConnected ? "Active" : "Not Active"}
            size="small"
            color={gatewayConnected ? "success" : "error"}
            variant="outlined"
            sx={{ fontWeight: 600, fontSize: "0.75rem", height: 22 }}
          />
        </Box>

        <Divider sx={{ my: 1.5 }} />

        {/* No Guardrail — above the Guardrails section */}
        <List sx={{ px: 1, pb: 0 }}>
          {GUARDRAIL_APIS.slice(0, 1).map((g) => (
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
                slotProps={{
                  primary: {
                    fontSize: "0.92rem",
                    fontWeight: selectedGuardrail.id === g.id ? 600 : 400,
                    color: selectedGuardrail.id === g.id ? "primary.main" : "text.primary",
                  },
                }}
              />
            </ListItemButton>
          ))}
        </List>

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
          {GUARDRAIL_APIS.slice(1).map((g) => (
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
                slotProps={{
                  primary: {
                    fontSize: "0.92rem",
                    fontWeight: selectedGuardrail.id === g.id ? 600 : 400,
                    color: selectedGuardrail.id === g.id ? "primary.main" : "text.primary",
                  },
                }}
              />
            </ListItemButton>
          ))}
        </List>
        <Divider />
        <Box sx={{ p: 2, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.75rem" }}>
            {colorSchemeLabel}
          </Typography>
          <ColorSchemeToggle size="small" />
        </Box>
      </Drawer>

      {/* Main Content */}
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Auth Header */}
        <Box
          sx={{
            px: 3,
            py: 1,
            borderBottom: "1px solid",
            borderColor: "divider",
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            minHeight: 48,
          }}
        >
          {isAuthenticated && authUser ? (
            <>
              <Box
                onClick={(e: React.MouseEvent<HTMLElement>) =>
                  setMenuAnchor(e.currentTarget)
                }
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  cursor: "pointer",
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 6,
                  border: "1px solid",
                  borderColor: isDark ? alpha("#fff", 0.12) : "divider",
                  "&:hover": {
                    bgcolor: isDark ? alpha("#fff", 0.05) : "action.hover",
                  },
                }}
              >
                <Avatar
                  src={authUser.picture}
                  sx={{ width: 28, height: 28 }}
                />
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 500, fontSize: "0.85rem", color: "text.primary" }}
                >
                  {authUser.name}
                </Typography>
              </Box>
              <Menu
                anchorEl={menuAnchor}
                open={Boolean(menuAnchor)}
                onClose={() => setMenuAnchor(null)}
                transformOrigin={{ horizontal: "right", vertical: "top" }}
                anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
                slotProps={{
                  paper: {
                    sx: { mt: 0.5, minWidth: 220 },
                  },
                }}
              >
                <Box sx={{ px: 2, py: 1.5 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, fontSize: "0.9rem" }}>
                    {authUser.name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "text.secondary" }}>
                    {authUser.email}
                  </Typography>
                </Box>
                <Divider />
                <MenuItem
                  onClick={() => {
                    authSignOut();
                    setMenuAnchor(null);
                  }}
                  sx={{ mt: 0.5 }}
                >
                  <ListItemIcon>
                    <LogOut size={16} />
                  </ListItemIcon>
                  <ListItemText>Log out</ListItemText>
                </MenuItem>
              </Menu>
            </>
          ) : (
            <Box sx={{ position: "relative" }}>
              <Button
                variant="outlined"
                size="small"
                onClick={() => {
                  const btn = googleButtonRef.current?.querySelector<HTMLElement>("div[role=button]");
                  btn?.click();
                }}
                sx={{
                  textTransform: "none",
                  fontWeight: 500,
                  fontSize: "0.85rem",
                  borderColor: isDark ? alpha("#fff", 0.2) : "divider",
                  color: "text.primary",
                  gap: 1,
                  "&:hover": {
                    borderColor: isDark ? alpha("#fff", 0.4) : "text.secondary",
                    bgcolor: isDark ? alpha("#fff", 0.05) : "action.hover",
                  },
                }}
              >
                <svg width="16" height="16" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                  <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                  <path d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#FBBC05"/>
                  <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                </svg>
                Sign in with Google
              </Button>

              <Box
                ref={googleButtonRef}
                sx={{
                  position: "absolute",
                  visibility: "hidden",
                  overflow: "hidden",
                  width: 0,
                  height: 0,
                }}
              >
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => console.error("Google login failed")}
                />
              </Box>
            </Box>
            
          )}
        </Box>

        {/* Guardrail Info Header — only show when conversation is active */}
        <Box
          sx={{
            px: 4,
            py: 2.5,
            borderBottom: "1px solid",
            borderColor: "divider",
            bgcolor: "transparent",
            display: messages.length === 0 ? "none" : "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
            {selectedGuardrail.name}
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.5 }}>
            <Typography
              variant="caption"
              sx={{
                color: "text.secondary",
                fontFamily: "monospace",
                fontSize: "0.8rem",
              }}
            >
              {selectedGuardrail.context}
            </Typography>
            <IconButton
              size="small"
              onClick={() => navigator.clipboard.writeText(selectedGuardrail.context)}
              title="Copy"
              sx={{ p: 0.3, color: "text.secondary", "&:hover": { color: "text.primary" } }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            </IconButton>
          </Box>
          </Box>
          <Button
            onClick={clearChat}
            size="small"
            startIcon={<Trash2 size={14} />}
            sx={{
              color: "text.secondary",
              whiteSpace: "nowrap",
              textTransform: "none",
              fontSize: "0.8rem",
              flexShrink: 0,
              "&:hover": { color: "error.main" },
            }}
          >
            Clear chat
          </Button>
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
                  borderColor: isDark ? alpha("#fff", 0.2) : "divider",
                  borderRadius: 2.5,
                  bgcolor: isDark ? alpha("#fff", 0.03) : "background.paper",
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
                  slotProps={{ input: { disableUnderline: true } }}
                  sx={{
                    px: 2,
                    pt: 1.5,
                    pb: 0.5,
                    "& .MuiInputBase-input::placeholder": {
                      color: isDark ? alpha("#fff", 0.4) : "text.disabled",
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
                      color: isDark ? alpha("#fff", 0.7) : "text.secondary",
                      borderColor: isDark ? alpha("#fff", 0.2) : "divider",
                      "&:hover": {
                        borderColor: isDark ? alpha("#fff", 0.5) : alpha(theme.palette.text.primary, 0.4),
                        bgcolor: isDark ? alpha("#fff", 0.05) : "action.hover",
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
              <Box sx={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column", alignItems: "center" }}>
                <Box sx={{ width: "100%", maxWidth: 1200, px: 4, py: 3 }}>
                {messages.map((msg, idx) => (
                  <Box
                    key={idx}
                    sx={{
                      display: "flex",
                      gap: 1.5,
                      mb: 2.5,
                      alignItems: "flex-start",
                      flexDirection: msg.role === "user" ? "row-reverse" : "row",
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
                        bgcolor: alpha(theme.palette.primary.main, isDark ? 0.15 : 0.18),
                        border: isDark ? "none" : "1px solid",
                        borderColor: alpha(theme.palette.primary.main, 0.3),
                        flexShrink: 0,
                        mt: 0.5,
                      }}
                    >
                      {msg.role === "user" ? (
                        <User size={16} color={theme.palette.primary.main} />
                      ) : (
                        <Bot size={16} color={theme.palette.primary.main} />
                      )}
                    </Box>
                    <Paper
                      elevation={0}
                      sx={{
                        px: 2.5,
                        py: 1.5,
                        bgcolor:
                          msg.role === "user"
                            ? alpha(theme.palette.primary.main, isDark ? 0.06 : 0.08)
                            : isDark ? alpha(theme.palette.action.hover, 0.4) : "background.default",
                        border: "1px solid",
                        borderColor:
                          msg.role === "user"
                            ? alpha(theme.palette.primary.main, isDark ? 0.15 : 0.25)
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
                        sx={{
                          color: "text.secondary",
                          display: "block",
                          mt: 0.5,
                          fontSize: "0.75rem",
                          textAlign: msg.role === "user" ? "right" : "left",
                        }}
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
                        bgcolor: alpha(theme.palette.primary.main, isDark ? 0.15 : 0.18),
                        border: isDark ? "none" : "1px solid",
                        borderColor: alpha(theme.palette.primary.main, 0.3),
                        flexShrink: 0,
                      }}
                    >
                      <Bot size={16} color={theme.palette.primary.main} />
                    </Box>
                    <Paper
                      elevation={0}
                      sx={{
                        px: 2.5,
                        py: 1.5,
                        bgcolor: isDark ? alpha(theme.palette.action.hover, 0.4) : "background.default",
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
              </Box>

              {/* Test prompts strip above input */}
              <Box sx={{ display: "flex", justifyContent: "center" }}>
              <Stack
                direction="row"
                spacing={1}
                flexWrap="wrap"
                useFlexGap
                sx={{ px: 4, pt: 1.5, pb: 0, width: "100%", maxWidth: 1200 }}
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
                      color: isDark ? alpha("#fff", 0.6) : "text.secondary",
                      borderColor: isDark ? alpha("#fff", 0.15) : "divider",
                      "&:hover": {
                        borderColor: isDark ? alpha("#fff", 0.4) : alpha(theme.palette.text.primary, 0.4),
                        bgcolor: isDark ? alpha("#fff", 0.05) : "action.hover",
                      },
                    }}
                  >
                    {tp.label}
                  </Button>
                ))}
              </Stack>
              </Box>

              {/* Bottom Input Bar */}
              <Box sx={{ display: "flex", justifyContent: "center" }}>
              <Box
                sx={{
                  px: 4,
                  py: 2,
                  bgcolor: "transparent",
                  width: "100%",
                  maxWidth: 1200,
                }}
              >
                <Box
                  sx={{
                    border: "1px solid",
                    borderColor: isDark ? alpha("#fff", 0.2) : "divider",
                    borderRadius: 2.5,
                    bgcolor: isDark ? alpha("#fff", 0.03) : "background.paper",
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
                    slotProps={{ input: { disableUnderline: true } }}
                    sx={{
                      px: 2,
                      pt: 1.5,
                      pb: 0.5,
                      "& .MuiInputBase-input::placeholder": {
                        color: isDark ? alpha("#fff", 0.4) : "text.disabled",
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
              </Box>
            </>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default Dashboard;
