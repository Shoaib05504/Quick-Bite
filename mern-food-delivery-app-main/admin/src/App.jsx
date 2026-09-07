import React, { useState, useEffect } from "react";
import Navbar from "./components/Navbar/Navbar";
import Sidebar from "./components/Sidebar/Sidebar";
import { Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard/Dashboard";
import Add from "./pages/Add/Add";
import List from "./pages/List/List";
import Orders from "./pages/Orders/Orders";
import Logout from "./pages/Logout/Logout";
import Login from "./pages/Login/Login";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const getBackendUrl = () => {
  const customUrl = typeof localStorage !== "undefined" ? localStorage.getItem("quickbite_api_url") : null;
  if (customUrl && customUrl.trim()) return customUrl.trim().replace(/\/api\/?$/, "").replace(/\/$/, "");
  const envUrl = import.meta.env.VITE_PRODUCTION_API_URL || import.meta.env.VITE_API_URL;
  if (envUrl && envUrl.trim() && !envUrl.includes("localhost") && !envUrl.includes("127.0.0.1")) {
    return envUrl.trim().replace(/\/api\/?$/, "").replace(/\/$/, "");
  }
  return "https://quickbite-9qd2.onrender.com";
};

const url = getBackendUrl();

const App = () => {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [role, setRole] = useState(localStorage.getItem("role") || "");

  useEffect(() => {
    const currentToken = localStorage.getItem("token") || "";
    const currentUserId = localStorage.getItem("userId") || "None";
    const currentRole = localStorage.getItem("role") || "None";

    console.log("📱 [Admin Auth Debug] Current API URL:", url);
    console.log("📱 [Admin Auth Debug] Token Exists:", Boolean(currentToken));
    console.log("📱 [Admin Auth Debug] Current Authenticated User ID:", currentUserId);
    console.log("📱 [Admin Auth Debug] Saved User Role:", currentRole);

    const handleStorageChange = () => {
      setToken(localStorage.getItem("token") || "");
      setRole(localStorage.getItem("role") || "");
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const handleLoginSuccess = (newToken) => {
    setToken(newToken);
    setRole("admin");
    localStorage.setItem("token", newToken);
    localStorage.setItem("role", "admin");
  };

  const isAdminAuthenticated = Boolean(token && (role === "admin" || !role));

  if (!isAdminAuthenticated) {
    return (
      <div>
        <ToastContainer />
        <Login url={url} onLoginSuccess={handleLoginSuccess} />
      </div>
    );
  }

  return (
    <div>
      <ToastContainer />
      <Navbar />

      <div className="app-content">
        <Sidebar />

        <div className="admin-main-content">
          <Routes>
            {/* Dashboard routes */}
            <Route path="/" element={<Dashboard url={url} />} />
            <Route path="/admin" element={<Dashboard url={url} />} />
            <Route path="/admin/" element={<Dashboard url={url} />} />
            <Route path="/dashboard" element={<Dashboard url={url} />} />
            <Route path="/admin/dashboard" element={<Dashboard url={url} />} />

            {/* Add item routes */}
            <Route path="/add" element={<Add url={url} />} />
            <Route path="/admin/add" element={<Add url={url} />} />

            {/* List items routes */}
            <Route path="/list" element={<List url={url} />} />
            <Route path="/admin/list" element={<List url={url} />} />

            {/* Orders routes */}
            <Route path="/orders" element={<Orders url={url} />} />
            <Route path="/admin/orders" element={<Orders url={url} />} />

            {/* Logout routes */}
            <Route path="/logout" element={<Logout />} />
            <Route path="/admin/logout" element={<Logout />} />

            {/* Catch-all route to prevent blank page on refresh */}
            <Route path="*" element={<Dashboard url={url} />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default App;