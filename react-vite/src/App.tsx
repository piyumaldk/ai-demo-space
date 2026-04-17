import React from "react";
import { CssBaseline } from "@wso2/oxygen-ui";
import Dashboard from "./components/Dashboard";
import LoginPage from "./components/LoginPage";
import { useAuth } from "./auth/AuthContext";

const App: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <>
      <CssBaseline />
      {isAuthenticated ? <Dashboard /> : <LoginPage />}
    </>
  );
};

export default App;
