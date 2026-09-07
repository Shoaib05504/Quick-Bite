import React, { useEffect } from "react";

const Admin = () => {
  useEffect(() => {
    if (window.location.port === "5173") {
      window.location.href = "http://localhost:5174/admin/";
    } else {
      window.location.href = "/admin/";
    }
  }, []);

  return (
    <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8" }}>
      <p>Redirecting to Admin Dashboard…</p>
    </div>
  );
};

export default Admin;