import React, { useContext, useMemo, useState } from 'react'
import './Cart.css'
import { StoreContext } from '../../components/context/StoreContext'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { toast as toastify } from 'react-toastify'
import { FaMinus, FaPlus, FaTrash, FaShoppingBag } from 'react-icons/fa'
import GroupOrderModal from '../../components/GroupOrderModal/GroupOrderModal'

const Cart = () => {
  const [promoCode, setPromoCode] = useState('')
  const [discount, setDiscount] = useState(0)
  const [showGroupModal, setShowGroupModal] = useState(false)

  const {
    cartItems,
    food_list,
    addToCart,
    removeFromCart,
    setCartQuantity,
    deleteFromCart,
    getTotalCartAmount,
    url,
  } = useContext(StoreContext)

  const navigate = useNavigate()

  const cartLines = useMemo(
    () =>
      food_list
        .filter((item) => cartItems[item._id] > 0)
        .map((item) => ({
          ...item,
          quantity: cartItems[item._id],
          lineTotal: item.price * cartItems[item._id],
        })),
    [food_list, cartItems]
  )

  const subtotal = getTotalCartAmount()
  const deliveryFee = subtotal > 0 ? 2 : 0
  const total = subtotal === 0 ? 0 : subtotal + deliveryFee - discount

  const getImageSrc = (image) =>
    image && image.startsWith('http') ? image : `${url}/images/${image}`

  const handlePromoSubmit = () => {
    if (promoCode === 'SAVE10') {
      setDiscount(20)
      toastify.success('🎉 Promo code applied successfully! Discount added', {
        position: "top-right",
        autoClose: 3000,
        pauseOnHover: false,
        closeOnClick: true,
        hideProgressBar: false,
        style: {
          background: "linear-gradient(135deg, #4C1D95, #2563EB)",
          color: "#ffffff",
        },
      })
    } else {
      setDiscount(0)
      toastify.error('❌ Invalid promo code. Please try again', {
        position: "top-right",
        autoClose: 3000,
        pauseOnHover: false,
        closeOnClick: true,
        hideProgressBar: false,
        style: {
          background: "linear-gradient(135deg, #7F1D1D, #DC2626)",
          color: "#ffffff",
        },
      })
    }
  }

  const handleCheckout = () => {
    if (cartLines.length === 0) {
      toast.error('Your cart is empty')
      return
    }
    navigate('/order')
  }

  if (cartLines.length === 0) {
    return (
      <div className="cart cart-empty">
        <FaShoppingBag className="cart-empty-icon" />
        <h2>Your cart is empty</h2>
        <p>Add delicious meals from the menu to get started.</p>
        <button type="button" className="cart-empty-btn" onClick={() => navigate('/home')}>
          Browse Menu
        </button>
      </div>
    )
  }

  return (
    <div className="cart">
      <h2 className="cart-heading">Your Cart ({cartLines.length} items)</h2>
      <div className="cart-items">
        <div className="cart-items-title">
          <p>Image</p>
          <p>Title</p>
          <p>Price</p>
          <p>Quantity</p>
          <p>Total</p>
          <p>Remove</p>
        </div>
        <hr />
        {cartLines.map((item) => (
          <div key={item._id}>
            <div className="cart-items-title cart-items-item">
              <img src={getImageSrc(item.image)} alt={item.name} />
              <p>{item.name}</p>
              <p>₹{item.price}</p>
              <div className="cart-qty-controls">
                <button
                  type="button"
                  className="qty-btn"
                  onClick={() => removeFromCart(item._id)}
                  aria-label="Decrease quantity"
                >
                  <FaMinus />
                </button>
                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => {
                    const value = parseInt(e.target.value, 10)
                    if (!Number.isNaN(value) && value > 0) {
                      setCartQuantity(item._id, value)
                    }
                  }}
                  className="cart-qty-input"
                />
                <button
                  type="button"
                  className="qty-btn"
                  onClick={() => addToCart(item._id)}
                  aria-label="Increase quantity"
                >
                  <FaPlus />
                </button>
              </div>
              <p>₹{item.lineTotal}</p>
              <button
                type="button"
                className="cart-remove-btn"
                onClick={() => {
                  deleteFromCart(item._id)
                  toast.success(`${item.name} removed`)
                }}
                aria-label="Remove item"
              >
                <FaTrash />
              </button>
            </div>
            <hr />
          </div>
        ))}
      </div>

      <div className="cart-bottom">
        <div className="cart-total">
          <h2>Cart Total</h2>
          <div>
            <div className="cart-total-detail">
              <p>Subtotal</p>
              <p>₹{subtotal}</p>
            </div>
            <hr />
            <div className="cart-total-detail">
              <p>Discount</p>
              <p>-₹{discount}</p>
            </div>
            <hr />
            <div className="cart-total-detail">
              <p>Delivery Fee</p>
              <p>₹{deliveryFee}</p>
            </div>
            <hr />
            <div className="cart-total-detail">
              <b>Total</b>
              <b>₹{total}</b>
            </div>
          </div>
          <button type="button" onClick={handleCheckout}>PROCEED TO CHECKOUT</button>
          <button type="button" className="group-order-btn" onClick={() => setShowGroupModal(true)}>
            START GROUP ORDER 👥
          </button>
        </div>
        <div className="cart-promocode">
          <div>
            <p>If you have a promo code, enter it here</p>
            <div className="cart-promocode-input">
              <input
                type="text"
                placeholder="Enter Promo code"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
              />
              <button type="button" onClick={handlePromoSubmit}>Submit</button>
            </div>
          </div>
        </div>
      </div>
      {showGroupModal && (
        <GroupOrderModal cartLines={cartLines} onClose={() => setShowGroupModal(false)} />
      )}
    </div>
  )
}

export default Cart

