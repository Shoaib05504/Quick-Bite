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

import { getAuthUser, setAuthUser, clearAuthUser } from "./services/storageService";
import axios from "axios";

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
  const [token, setToken] = useState("");
  const [role, setRole] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      setLoading(true);
      try {
        const { token: savedToken, userId: savedUserId, role: savedRole } = await getAuthUser();

        console.log("API URL:", url);
        console.log("AUTH TOKEN EXISTS:", !!savedToken);
        console.log("CURRENT USER ID:", savedUserId || "Not loaded yet");

        if (savedToken) {
          setToken(savedToken);
          setRole(savedRole);

          // Verify token against backend profile API
          try {
            const res = await axios.get(`${url}/api/user/profile`, {
              headers: { Authorization: `Bearer ${savedToken}` },
              timeout: 45000,
            });

            if (res.data?.success && res.data?.user) {
              const u = res.data.user;
              setCurrentUser(u);
              setRole(u.role || savedRole || "admin");
              console.log("CURRENT USER ID:", u._id);
              console.log("CURRENT USER:", u);

              await setAuthUser({
                token: savedToken,
                userId: u._id,
                role: u.role || "admin",
                adminName: u.name,
              });
            } else {
              console.warn("Profile check response unsuccessful:", res.data);
            }
          } catch (profileErr) {
            console.warn("Profile fetch warning:", profileErr.message || profileErr);
          }
        } else {
          console.log("CURRENT USER:", null);
        }
      } catch (err) {
        console.error("Init auth error:", err);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    const handleStorageChange = async () => {
      const { token: t, role: r } = await getAuthUser();
      setToken(t);
      setRole(r);
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const handleLoginSuccess = async (newToken, userDetails) => {
    setToken(newToken);
    setRole("admin");
    await setAuthUser({
      token: newToken,
      userId: userDetails?.userId,
      role: "admin",
      adminName: userDetails?.adminName || "Admin",
    });
  };

  const isAdminAuthenticated = Boolean(token && (role === "admin" || !role));

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#090d16", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8" }}>
        <p>Loading Admin Session…</p>
      </div>
    );
  }

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