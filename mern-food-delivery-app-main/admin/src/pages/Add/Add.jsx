import React, { useState } from "react";
import "./Add.css";
import axios from "axios";

const Add = () => {
  const [data, setData] = useState({
  name: "",
  description: "",
  price: "",
  category: "Salad",
  image: "",   // ✅ added
});
const url = "http://localhost:8000";        // ✅ ADD

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
      url + "/api/food/add",
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
        <h2>Add New Product</h2>

        <form onSubmit={handleSubmit}>
          <label>Upload Image</label>
          <label>Image URL</label>
<input
  type="text"
  placeholder="Enter image URL"
  value={data.image || ""}
  onChange={(e) =>
    setData({ ...data, image: e.target.value })
  }
/>

          <label>Product Name</label>
          <input
            type="text"
            placeholder="Enter product name"
            value={data.name}
            onChange={(e) =>
              setData({ ...data, name: e.target.value })
            }
          />

          <label>Description</label>
          <textarea
            placeholder="Enter description"
            value={data.description}
            onChange={(e) =>
              setData({ ...data, description: e.target.value })
            }
          />

          <div className="row">
            <div>
              <label>Category</label>
              <select
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

            <div>
              <label>Price</label>
              <input
                type="number"
                placeholder="₹100"
                value={data.price}
                onChange={(e) =>
                  setData({ ...data, price: e.target.value })
                }
              />
            </div>
          </div>

          <button type="submit">ADD ITEM</button>
        </form>
      </div>
    </div>
  );
};

export default Add;