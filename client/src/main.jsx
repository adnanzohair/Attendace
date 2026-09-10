import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { EmployeeAuthProvider } from "./context/EmployeeAuthContext";
import App from "./App";
import "./index.css";
createRoot(document.getElementById("root")).render(
    <BrowserRouter>
      <AuthProvider>
        <EmployeeAuthProvider><App /></EmployeeAuthProvider>
      </AuthProvider>
    </BrowserRouter>
);
