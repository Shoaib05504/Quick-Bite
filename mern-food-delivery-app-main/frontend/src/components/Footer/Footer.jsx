import React from 'react'
import './Footer.css'
import { assets } from '../../assets/assets'

const Footer = () => {
  return (
    <div className='footer' id='footer'>
        <div className="footer-content">
            <div className="footer-content-left">
                <img src={assets.logo} alt="" />
                <p>QuickBite delivers fresh and delicious food to your doorstep.
  Order your favourite meals anytime, anywhere with fast delivery
  and the best quality service.</p>
                <div className="footer-social-icons">
                    <img src={assets.facebook_icon} alt="" />
                    <img src={assets.twitter_icon} alt="" />
                    <img src={assets.linkedin_icon} alt="" />
                </div>
            </div>
            <div className="footer-content-center">
                <h2>COMPANY</h2>
                <ul>
                    <li>Home</li>
                    <li>About us</li>
                    <li>Delivery</li>
                    <li>Privacy Policy</li>
                </ul>
            </div>
            <div className="footer-content-right">
                <h2>GET IN TOUCH</h2>
                <ul>
                    <li>+91 7892344850</li>
                    <li>shoaibsw05786@gmail.com</li>
                </ul>
            </div>
           
        </div>
        <hr />
        <p className="footer-copyright">
            Copyright 2026 &copy; Shoaib - All Right Reserved.
        </p>
    </div>
  )
}

export default Footer