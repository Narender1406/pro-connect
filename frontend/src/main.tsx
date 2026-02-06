import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import "./index.css";
import "./components/theme.css";
import { ThemeProvider } from "./context/ThemeContext";
import { JobTrackerProvider } from "./context/JobTrackerContext";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <JobTrackerProvider>
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
        <App />
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
    </JobTrackerProvider>
  </React.StrictMode>
);
