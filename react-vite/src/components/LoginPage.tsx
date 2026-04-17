import React, { useRef } from "react";
import {
  Box,
  ColorSchemeImage,
  ColorSchemeToggle,
  Grid,
  Paper,
  ParticleBackground,
  Stack,
  Typography,
  alpha,
  useTheme,
} from "@wso2/oxygen-ui";
import { GoogleLogin } from "@react-oauth/google";
import type { CredentialResponse } from "@react-oauth/google";
import {
  Cloud,
  Shield,
  Zap,
  Lock,
  Bot,
} from "@wso2/oxygen-ui-icons-react";
import { useAuth } from "../auth/AuthContext";
import loginImage from "../assets/login.svg";
import loginImageInverted from "../assets/login-inverted.svg";

const LoginPage: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const { signIn: authSignIn } = useAuth();

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
    authSignIn(
      payload.email,
      payload.name,
      payload.picture,
      credentialResponse.credential,
      expiresIn
    );
  }

  const sloganItems = [
    {
      icon: <Bot size={20} style={{ color: theme.palette.text.secondary }} />,
      title: "Chat with AI models through the WSO2 AI Gateway",
    },
    {
      icon: <Shield size={20} style={{ color: theme.palette.text.secondary }} />,
      title: "Experience guardrails protecting against harmful content",
    },
    {
      icon: <Lock size={20} style={{ color: theme.palette.text.secondary }} />,
      title: "See PII masking and URL guardrails in action",
    },
    {
      icon: <Zap size={20} style={{ color: theme.palette.text.secondary }} />,
      title: "Compare model responses with and without guardrails",
    },
    {
      icon: <Cloud size={20} style={{ color: theme.palette.text.secondary }} />,
      title: "Powered by WSO2 AI Gateway with enterprise-grade security",
    },
  ];

  return (
    <Box sx={{ height: "100vh", display: "flex" }}>
      <ParticleBackground opacity={0.5} />
      <Grid container sx={{ flex: 1 }}>
        {/* Left panel — branding + slogan */}
        <Grid
          size={{ xs: 12, md: 8 }}
          sx={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "flex-start",
            padding: 18,
            textAlign: "left",
            position: "relative",
          }}
        >
          <Box>
            <Stack
              direction="column"
              alignItems="flex-start"
              gap={2}
              maxWidth={580}
              display={{ xs: "none", md: "flex" }}
            >
              {/* Logo / brand name */}
              <Box sx={{ my: 1 }}>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 800,
                    letterSpacing: "-0.5px",
                    color: "text.primary",
                  }}
                >
                  WSO2 AI DEMO
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: "text.secondary", fontSize: "0.85rem" }}
                >
                  Tryout Console
                </Typography>
              </Box>

              {/* Main headline */}
              <Typography variant="h3" sx={{ fontWeight: "bold", mb: 0 }}>
                AI Gateway Demo for Testing Guardrails and Policies
              </Typography>

              <Typography variant="body1" sx={{ color: "text.secondary" }}>
                A hands-on demo console to explore WSO2 AI Gateway capabilities — test guardrails, compare model behaviours, and see enterprise AI security in action
              </Typography>

              {/* Feature list */}
              <Stack sx={{ gap: 2 }}>
                {sloganItems.map((item) => (
                  <Stack
                    key={item.title}
                    direction="row"
                    sx={{ gap: 2, alignItems: "flex-start" }}
                  >
                    {item.icon}
                    <Box>
                      <Typography gutterBottom sx={{ fontWeight: "medium" }}>
                        {item.title}
                      </Typography>
                    </Box>
                  </Stack>
                ))}
              </Stack>
            </Stack>
          </Box>

          {/* Background illustration */}
          <ColorSchemeImage
            src={{
              light: loginImage,
              dark: loginImageInverted,
            }}
            alt={{
              light: "Login Screen Image (Light)",
              dark: "Login Screen Image (Dark)",
            }}
            height={450}
            width="auto"
            sx={{ position: "absolute", bottom: 50, right: -100 }}
          />
        </Grid>

        {/* Right panel — sign in box */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper
            sx={{
              display: "flex",
              padding: 4,
              width: "100%",
              height: "100%",
              flexDirection: "column",
              position: "relative",
              textAlign: "left",
            }}
          >
            <Box display="flex" justifyContent="flex-end">
              <ColorSchemeToggle />
            </Box>

            <Box
              sx={{
                alignItems: "center",
                justifyContent: "center",
                padding: 4,
                width: "100%",
                maxWidth: 500,
                margin: "auto",
              }}
            >
              {/* Sign-in heading */}
              <Box sx={{ mb: 10 }}>
                <Typography variant="h3" gutterBottom>
                  Sign in to WSO2 AI Demo
                </Typography>
                <Typography color="text.secondary">
                  Use your authorized Google account to access the demo console
                </Typography>
              </Box>

              {/* Google sign-in button (our existing implementation) */}
              <Box display="flex" flexDirection="column" gap={3}>
                <Box sx={{ position: "relative" }}>
                  <Box
                    component="button"
                    onClick={() => {
                      const btn = googleButtonRef.current?.querySelector<HTMLElement>(
                        "div[role=button]"
                      );
                      btn?.click();
                    }}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 1.5,
                      width: "100%",
                      py: 1.5,
                      px: 3,
                      border: "1px solid",
                      borderColor: isDark ? alpha("#fff", 0.2) : "divider",
                      borderRadius: 1,
                      bgcolor: isDark ? alpha("#fff", 0.05) : "background.paper",
                      color: "text.primary",
                      cursor: "pointer",
                      fontFamily: "inherit",
                      fontSize: "0.95rem",
                      fontWeight: 500,
                      transition: "all 0.15s",
                      "&:hover": {
                        borderColor: isDark ? alpha("#fff", 0.4) : "text.secondary",
                        bgcolor: isDark ? alpha("#fff", 0.08) : "action.hover",
                      },
                    }}
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 18 18"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
                        fill="#4285F4"
                      />
                      <path
                        d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
                        fill="#34A853"
                      />
                      <path
                        d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z"
                        fill="#EA4335"
                      />
                    </svg>
                    Continue with Google
                  </Box>

                  {/* Hidden Google OAuth component */}
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
              </Box>

              {/* Footer */}
              <Box component="footer" sx={{ mt: 8 }}>
                <Typography sx={{ textAlign: "center", color: "text.secondary", fontSize: "0.85rem" }}>
                  © Copyright {new Date().getFullYear()} WSO2 LLC. All Rights Reserved.
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default LoginPage;
