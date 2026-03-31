import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AcrylicPurpleTheme, OxygenUIThemeProvider } from "@wso2/oxygen-ui";
import App from "./App";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
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
  </StrictMode>
);
