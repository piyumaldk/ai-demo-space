import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AcrylicOrangeTheme, OxygenUIThemeProvider } from "@wso2/oxygen-ui";
import App from "./App";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <OxygenUIThemeProvider
      themes={[
        {
          key: "acrylicOrange",
          label: "Acrylic Orange Theme",
          theme: AcrylicOrangeTheme,
        },
      ]}
      initialTheme="acrylicOrange"
    >
      <App />
    </OxygenUIThemeProvider>
  </StrictMode>
);
