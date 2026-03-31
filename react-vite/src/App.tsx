import React from "react";
import { CssBaseline } from "@wso2/oxygen-ui";
import Dashboard from "./components/Dashboard";

const App: React.FC = () => {
  return (
    <>
      <CssBaseline />
      <Dashboard />
    </>
  );
};

export default App;
