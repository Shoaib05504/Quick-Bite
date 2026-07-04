import React, { useContext, useEffect } from 'react'
import './Verify.css'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { StoreContext } from './../../components/context/StoreContext';
import axios from 'axios';
import toast from 'react-hot-toast';

const Verify = () => {

    const [searchParams, setSearchParams] = useSearchParams();
    const success = searchParams.get("success")
    const orderId = searchParams.get("orderId")
    const {url} = useContext(StoreContext);
    const navigate = useNavigate();

    const verifyPayment = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(
                url + "/api/order/verify",
                { success, orderId },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (response.data.success) {
                toast.success('✅ Order placed successfully! Preparing your delicious meal 🍽️', {
                  position: 'top-right',
                  duration: 3000,
                });
                navigate('/myorders');
            } else {
                navigate('/');
            }
        } catch (error) {
            console.error('Payment verification error:', error.message);
            navigate('/');
        }
    }

    useEffect(()=>{
        verifyPayment();
    },[])
   
  return (
    <div className='verify'>
        <div className="spinner"></div>
    </div>
  )
}

export default Verify