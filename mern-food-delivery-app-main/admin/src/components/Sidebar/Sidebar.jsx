import React from "react";
import "./Sidebar.css";
import { NavLink, useLocation } from "react-router-dom";

const Sidebar = () => {
  const location = useLocation();
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
  const isLogoutActive = path === "/logout" || path === "/admin/logout";

  const getTarget = (targetPath) => (path.startsWith("/admin") ? `/admin${targetPath}` : targetPath);

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

      <NavLink
        to={getTarget("/logout")}
        className={isLogoutActive ? 'sidebar-item active logout-item' : 'sidebar-item logout-item'}
      >
        <span>🚪</span>
        <span>Logout</span>
      </NavLink>
    </div>
  );
};

export default Sidebar;