import React from 'react'
import './Orders.css'
import { useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify';
import { useEffect } from 'react';
import { assets } from './../../../../frontend/src/assets/assets';

const Orders = ({url}) => {

  const [orders, setOrders] = useState([])

  const fetchAllOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(url + "/api/order/list", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setOrders(response.data.data);
      } else {
        toast.error(response.data.message || "Failed to load orders");
      }
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error("Session expired. Please login again.");
      } else if (error.response?.status === 403) {
        toast.error("Access forbidden. Admin role required.");
      } else {
        toast.error("Error loading orders.");
      }
    }
  }

  const statusHandler = async (event, orderId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        url + "/api/order/status",
        { orderId, status: event.target.value },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        toast.success("Order status updated.");
        await fetchAllOrders();
      } else {
        toast.error(response.data.message || "Error updating status.");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Error updating status.");
    }
  }

  useEffect(()=>{
    fetchAllOrders()
  },[])
  return (
    <div className='order add'>
      <h3>Order Page</h3>
      <div className="order-list">
        {orders.map((order, index)=>(
          <div key={index} className="order-item">
            <img src={assets.parcel_icon} alt="" />
            <div>
              <p className="order-item-food">
                {order.items.map((item,index)=>{
                  if(index===order.items.length-1){
                    return item.name + " x " + item.quantity
                  }else{
                    return item.name + " x " + item.quantity + " , "
                  }
                })}
              </p>
              <p className="order-item-name">{order.address.firstName + " "+order.address.lastName}</p>
              <div className="order-item-address">
                <p>{order.address.state + ","}</p>
                <p>{order.address.city+" ,"+ order.address.state+" ,"+order.address.country+" ,"+order.address.zipcode}</p>
              </div>
              <p className='order-item-phone'>{order.address.phone}</p>
            </div>
            <p>Itmes: {order.items.length}</p>
            <p>${order.amount}</p>
            <select onChange={(event)=> statusHandler(event,order._id)} value={order.status} >
              <option value="Food Processing">Food Processing</option>
              <option value="Out for delivery">Out for delivery</option>
              <option value="Delivered">Delivered</option>
            </select>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Orders