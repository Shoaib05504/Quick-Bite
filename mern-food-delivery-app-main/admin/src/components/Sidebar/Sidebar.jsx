import React from "react";
import "./Sidebar.css";
import { NavLink } from "react-router-dom";

const Sidebar = () => {
  return (
    <div className="sidebar">
      <div className="sidebar-brand">
        <span className="brand-glow" />
        <h2>QuickBite</h2>
      </div>

      <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'sidebar-item active' : 'sidebar-item'}>
        <span>🏠</span>
        <span>Dashboard</span>
      </NavLink>

      <NavLink to="/add" className={({ isActive }) => isActive ? 'sidebar-item active' : 'sidebar-item'}>
        <span>➕</span>
        <span>Add Items</span>
      </NavLink>

      <NavLink to="/list" className={({ isActive }) => isActive ? 'sidebar-item active' : 'sidebar-item'}>
        <span>📋</span>
        <span>List Items</span>
      </NavLink>

      <NavLink to="/orders" className={({ isActive }) => isActive ? 'sidebar-item active' : 'sidebar-item'}>
        <span>🧾</span>
        <span>Orders</span>
      </NavLink>

      <NavLink to="/logout" className={({ isActive }) => isActive ? 'sidebar-item active logout-item' : 'sidebar-item logout-item'}>
        <span>🚪</span>
        <span>Logout</span>
      </NavLink>
    </div>
  );
};

export default Sidebar;