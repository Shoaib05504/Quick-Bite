import React, { useState } from "react";
import "./Add.css";
import axios from "axios";

const Add = ({ url }) => {
  const [data, setData] = useState({
  name: "",
  description: "",
  price: "",
  category: "Salad",
  image: "",
});
const apiUrl = url || import.meta.env.VITE_API_URL || "http://localhost:8000";

 const handleSubmit = async (e) => {
  e.preventDefault();

  // Validate required fields
  if (!data.name || !data.description || !data.price || !data.image) {
    alert('Please fill in all fields');
    return;
  }

  if (isNaN(data.price) || Number(data.price) <= 0) {
    alert('Price must be a valid positive number');
    return;
  }

  try {
    const token = localStorage.getItem('token');
    const response = await axios.post(
      `${apiUrl}/api/food/add`,
      {
        name: data.name,
        description: data.description,
        price: Number(data.price),
        category: data.category,
        image: data.image
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    console.log(response.data);
   if (response.data.success) {
  alert("Item Added Successfully✅");
  setData({
    name: "",
    description: "",
    price: "",
    category: "Salad",
    image: ""
  });
} else {
  alert(response.data.message || "Error adding item");
} 

  } catch (error) {
    console.log(error);
    alert(error.response?.data?.message || error.message || "Error adding item ❌");
  }
};

  return (
    <div className="add-page">
      <div className="add-card">
        <div className="add-card-header">
          <h2>Add New Product</h2>
          <p className="add-card-subtitle">Fill in the details below to add a new dish to the QuickBite menu</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="food-image-url">Image URL</label>
            <input
              id="food-image-url"
              type="text"
              placeholder="Enter image URL (e.g. https://...)"
              value={data.image || ""}
              onChange={(e) =>
                setData({ ...data, image: e.target.value })
              }
            />
          </div>

          <div className="form-group">
            <label htmlFor="food-product-name">Product Name</label>
            <input
              id="food-product-name"
              type="text"
              placeholder="Enter product name"
              value={data.name}
              onChange={(e) =>
                setData({ ...data, name: e.target.value })
              }
            />
          </div>

          <div className="form-group">
            <label htmlFor="food-description">Description</label>
            <textarea
              id="food-description"
              placeholder="Enter product description"
              value={data.description}
              onChange={(e) =>
                setData({ ...data, description: e.target.value })
              }
            />
          </div>

          <div className="row">
            <div className="form-group">
              <label htmlFor="food-category">Category</label>
              <select
                id="food-category"
                value={data.category}
                onChange={(e) =>
                  setData({ ...data, category: e.target.value })
                }
              >
                <option value="Salad">Salad</option>
                <option value="Rolls">Rolls</option>
                <option value="Deserts">Deserts</option>
                <option value="Sandwich">Sandwich</option>
                <option value="Cake">Cake</option>
                <option value="Pure Veg">Pure Veg</option>
                <option value="Pasta">Pasta</option>
                <option value="Noodles">Noodles</option>
                <option value="Pizza">Pizza</option>
                <option value="☕ Coffee & Refreshments">☕ Coffee & Refreshments</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="food-price">Price (₹)</label>
              <input
                id="food-price"
                type="number"
                placeholder="100"
                value={data.price}
                onChange={(e) =>
                  setData({ ...data, price: e.target.value })
                }
              />
            </div>
          </div>

          <button type="submit" className="add-submit-btn">ADD ITEM</button>
        </form>
      </div>
    </div>
  );
};

export default Add;