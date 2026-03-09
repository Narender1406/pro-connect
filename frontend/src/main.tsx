import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { JobTrackerProvider } from "./context/JobTrackerContext";
import "./index.css";
import "./components/theme.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <JobTrackerProvider>
      <BrowserRouter>
        <AuthProvider>
          <ThemeProvider>
            <App />
            <Toaster position="top-right" />
          </ThemeProvider>
        </AuthProvider>
      </BrowserRouter>
    </JobTrackerProvider>
  </React.StrictMode>
);
