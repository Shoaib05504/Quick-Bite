import React from "react";
import AddFood from "./AddFood.jsx";
import ListFood from "./ListFood.jsx";
import Orders from "./Orders.jsx";

const Admin = () => {
  return (
  <div className="admin-container">
    <h2 className="admin-title">Admin Panel</h2>

    {/* Add Food */}
    <div className="card">
      <h3>Add Food</h3>
      <div className="form-row">
        <input placeholder="Name" />
        <input placeholder="Description" />
        <input placeholder="Price" />
        <input placeholder="Category" />
        <input type="file" />
        <button>Add</button>
      </div>
    </div>

    {/* Food List */}
    <div className="card">
      <h3>Food List</h3>
      <div className="food-list">
       
      </div>
    </div>

    {/* Orders */}
    <div className="card">
      <h3>Orders</h3>
      
    </div>
  </div>
);
};

export default Admin;