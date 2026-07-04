import React from "react";
import "./Navbar.css";
import logo from "../../assets/logo.png";

const Navbar = () => {
  return (
    <div className="navbar">
      <div className="nav-left">
        <img src={logo} alt="logo" className="logo" />
        <h2>QuickBite Admin</h2>
      </div>

      <div className="nav-right">
        <img
          src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
          alt="profile"
          className="profile"
        />
      </div>
    </div>
  );
};

export default Navbar;