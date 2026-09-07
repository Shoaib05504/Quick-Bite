import React, { useEffect } from "react";

const Admin = () => {
  useEffect(() => {
    window.location.href = "https://quickbite-9qd2.onrender.com/admin/";
  }, []);

  return (
    <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8" }}>
      <p>Redirecting to Admin Dashboard…</p>
    </div>
  );
};

export default Admin;