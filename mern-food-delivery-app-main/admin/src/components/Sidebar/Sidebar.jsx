import React from "react";
import "./Sidebar.css";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { clearAuthUser } from "../../services/storageService";

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;

  const isDashboardActive =
    path === "/" ||
    path === "/admin" ||
    path === "/admin/" ||
    path === "/dashboard" ||
    path === "/admin/dashboard";

  const isAddActive = path === "/add" || path === "/admin/add";
  const isListActive = path === "/list" || path === "/admin/list";
  const isOrdersActive = path === "/orders" || path === "/admin/orders";

  const getTarget = (targetPath) => (path.startsWith("/admin") ? `/admin${targetPath}` : targetPath);

  const handleLogout = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    const isApkSession =
      (typeof localStorage !== "undefined" && localStorage.getItem("admin_apk_session") === "true") ||
      (typeof window !== "undefined" && window.location.search.includes("source=apk")) ||
      (typeof navigator !== "undefined" && /Capacitor|Android/i.test(navigator.userAgent));

    await clearAuthUser();
    if (typeof localStorage !== "undefined") localStorage.clear();
    if (typeof sessionStorage !== "undefined") sessionStorage.clear();
    window.dispatchEvent(new Event("storage"));

    if (isApkSession) {
      console.log("🚪 APK Logout — Redirecting back to QuickBite APK via quickbite://home");
      window.location.href = "quickbite://home";
    } else {
      window.location.href = window.location.origin + "/";
    }
  };

  return (
    <div className="sidebar">
      <div className="sidebar-brand">
        <span className="brand-glow" />
        <h2>QuickBite</h2>
      </div>

      <NavLink
        to={getTarget("/dashboard")}
        className={isDashboardActive ? 'sidebar-item active' : 'sidebar-item'}
      >
        <span>🏠</span>
        <span>Dashboard</span>
      </NavLink>

      <NavLink
        to={getTarget("/add")}
        className={isAddActive ? 'sidebar-item active' : 'sidebar-item'}
      >
        <span>➕</span>
        <span>Add Items</span>
      </NavLink>

      <NavLink
        to={getTarget("/list")}
        className={isListActive ? 'sidebar-item active' : 'sidebar-item'}
      >
        <span>📋</span>
        <span>List Items</span>
      </NavLink>

      <NavLink
        to={getTarget("/orders")}
        className={isOrdersActive ? 'sidebar-item active' : 'sidebar-item'}
      >
        <span>🧾</span>
        <span>Orders</span>
      </NavLink>

      <button
        type="button"
        onClick={handleLogout}
        className="sidebar-item logout-item"
        style={{ cursor: 'pointer', width: '100%', border: 'none', background: 'transparent', textAlign: 'left' }}
      >
        <span>🚪</span>
        <span>Logout</span>
      </button>
    </div>
  );
};

export default Sidebar;