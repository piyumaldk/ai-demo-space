import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AcrylicPurpleTheme, OxygenUIThemeProvider } from "@wso2/oxygen-ui";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { AuthProvider } from "./auth/AuthContext";
import { GOOGLE_CLIENT_ID } from "./config/config";
import App from "./App";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <OxygenUIThemeProvider
          themes={[
            {
              key: "acrylicPurple",
              label: "Acrylic Purple Theme",
              theme: AcrylicPurpleTheme,
            },
          ]}
          initialTheme="acrylicPurple"
        >
          <App />
        </OxygenUIThemeProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  </StrictMode>
);
