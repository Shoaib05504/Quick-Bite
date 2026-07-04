import React from "react";
import Navbar from "./components/Navbar/Navbar";
import Sidebar from "./components/Sidebar/Sidebar";
import { Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard/Dashboard";
import Add from "./pages/Add/Add";
import List from "./pages/List/List";
import Orders from "./pages/Orders/Orders";
import Logout from "./pages/Logout/Logout";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const url = import.meta.env.VITE_API_URL || "http://localhost:8000";

const App = () => {
  return (
    <div>
      <ToastContainer />
      <Navbar />

      <div style={{ display: "flex", width: "100%" }}>
        <Sidebar />

        <div style={{ flex: 1, padding: "24px 26px", minHeight: '100vh', background: '#090b17' }}>
          <Routes>
            <Route path="/" element={<Dashboard url={url} />} />
            <Route path="/dashboard" element={<Dashboard url={url} />} />
            <Route path="/add" element={<Add url={url} />} />
            <Route path="/list" element={<List url={url} />} />
            <Route path="/orders" element={<Orders url={url} />} />
            <Route path="/logout" element={<Logout />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default App;