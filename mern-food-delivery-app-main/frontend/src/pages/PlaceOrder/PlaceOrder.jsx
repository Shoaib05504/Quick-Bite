import React, { useContext, useEffect, useMemo, useState } from 'react';
import './PlaceOrder.css';
import { StoreContext } from '../../components/context/StoreContext';
import { profileAPI, addressAPI } from '../../services/apiService';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { FiEdit2, FiTrash2, FiStar, FiMapPin, FiPlus, FiCheck } from 'react-icons/fi';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 15 } },
};

const PlaceOrder = () => {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
  }, []);

  const navigate = useNavigate();

  const { getTotalCartAmount, token, food_list, cartItems, url, userProfile, setUserProfile } = useContext(StoreContext);

  const [data, setData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    street: '',
    city: '',
    state: '',
    zipcode: '',
    country: '',
    phone: '',
  });

  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [addressFormData, setAddressFormData] = useState({
    addressId: '',
    type: 'Home',
    firstName: '',
    lastName: '',
    email: '',
    street: '',
    city: '',
    state: '',
    zipcode: '',
    country: '',
    phone: '',
    isDefault: false,
  });

  const cartLines = useMemo(
    () =>
      food_list
        .filter((item) => cartItems[item._id] > 0)
        .map((item) => ({
          _id: item._id,
          name: item.name,
          price: item.price,
          quantity: cartItems[item._id],
        })),
    [food_list, cartItems]
  );

  const onChangeHandler = (event) => {
    const name = event.target.name;
    const value = event.target.value;
    setData((data) => ({ ...data, [name]: value }));
  };

  const fillDataFromAddress = (address) => {
    setData({
      firstName: address.firstName || address.name?.split(' ')[0] || '',
      lastName: address.lastName || address.name?.split(' ').slice(1).join(' ') || '',
      email: address.email || '',
      street: address.street || '',
      city: address.city || '',
      state: address.state || '',
      zipcode: address.pincode || '',
      country: address.country || '',
      phone: address.phone || '',
    });
  };

  const normalizeAddresses = (addresses) => {
    if (!Array.isArray(addresses)) return [];
    return addresses.map((addr) => ({
      ...addr,
      id: String(addr.id || addr._id || addr.addressId || ''),
      pincode: addr.pincode || addr.zipcode || addr.postalCode || addr.zip || '',
    }));
  };

  useEffect(() => {
    if (userProfile && Array.isArray(userProfile.addresses)) {
      const saved = normalizeAddresses(userProfile.addresses);
      setSavedAddresses(saved);
      const hasSelected = saved.some(addr => String(addr.id) === String(selectedAddressId));
      if (!hasSelected || !selectedAddressId) {
        const defaultAddress = saved.find((addr) => addr.isDefault) || saved[0];
        if (defaultAddress) {
          setSelectedAddressId(String(defaultAddress.id));
          setSelectedAddress(defaultAddress);
          fillDataFromAddress(defaultAddress);
        } else {
          setSelectedAddressId('');
          setSelectedAddress(null);
        }
      }
    } else {
      setSavedAddresses([]);
    }
  }, [userProfile]);

  const loadSavedAddresses = async () => {
    if (!token) return;
    try {
      const response = await profileAPI.getProfile();
      if (response.success && response.user) {
        const raw = Array.isArray(response.user.addresses) ? response.user.addresses : [];
        const saved = normalizeAddresses(raw);
        setSavedAddresses(saved);
        if (typeof setUserProfile === 'function') {
          setUserProfile(response.user);
        }
        const defaultAddress = saved.find((addr) => addr.isDefault) || saved[0];
        if (defaultAddress) {
          setSelectedAddressId(String(defaultAddress.id));
          setSelectedAddress(defaultAddress);
          fillDataFromAddress(defaultAddress);
        }
      } else {
        setSavedAddresses([]);
      }
    } catch (error) {
      console.log('Load addresses failed', error);
      setSavedAddresses([]);
    }
  };

  const handleSelectAddress = (addressId) => {
    const id = String(addressId);
    const address = savedAddresses.find((addr) => String(addr.id) === id);
    if (!address) return;
    setSelectedAddressId(id);
    setSelectedAddress(address);
    fillDataFromAddress(address);
    setShowAddressForm(false);
    setIsEditingAddress(false);
    toast.success(`Selected delivery address: ${address.type || 'Home'}`);
  };

  const openNewAddressForm = () => {
    setIsEditingAddress(false);
    setShowAddressForm(true);
    setAddressFormData({
      addressId: '',
      type: 'Home',
      firstName: '',
      lastName: '',
      email: '',
      street: '',
      city: '',
      state: '',
      zipcode: '',
      country: '',
      phone: '',
      isDefault: false,
    });
  };

  const handleAddressFormChange = (event) => {
    const { name, value, type, checked } = event.target;
    setAddressFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSaveAddress = async (event) => {
    if (event && event.preventDefault) {
      event.preventDefault();
    }
    if (!token) {
      toast.error('Please login before saving an address');
      return;
    }

    const payload = {
      type: addressFormData.type,
      firstName: addressFormData.firstName,
      lastName: addressFormData.lastName,
      email: addressFormData.email,
      name: `${addressFormData.firstName} ${addressFormData.lastName}`.trim(),
      phone: addressFormData.phone,
      street: addressFormData.street,
      city: addressFormData.city,
      state: addressFormData.state,
      country: addressFormData.country,
      pincode: addressFormData.zipcode,
      isDefault: addressFormData.isDefault,
    };

    let response;
    if (isEditingAddress && addressFormData.addressId) {
      response = await addressAPI.editAddress({ addressId: addressFormData.addressId, ...payload });
    } else {
      response = await addressAPI.addAddress(payload);
    }

    if (response.success) {
      const raw = Array.isArray(response.addresses) ? response.addresses : [];
      const saved = normalizeAddresses(raw);
      setSavedAddresses(saved);
      if (typeof setUserProfile === 'function') {
        setUserProfile((prev) => ({
          ...prev,
          addresses: raw,
        }));
      }
      const selected = isEditingAddress
        ? saved.find((addr) => String(addr.id) === String(addressFormData.addressId))
        : saved.length ? saved[saved.length - 1] : null;
      if (selected) {
        setSelectedAddressId(String(selected.id));
        setSelectedAddress(selected);
        fillDataFromAddress(selected);
      }
      setShowAddressForm(false);
      setIsEditingAddress(false);
      toast.success(isEditingAddress ? 'Address updated successfully' : 'Address added successfully');
    } else {
      toast.error(response.message || 'Unable to save address');
    }
  };

  const handleEditAddress = (addressId) => {
    const address = savedAddresses.find((addr) => addr.id === addressId);
    if (!address) return;
    setIsEditingAddress(true);
    setShowAddressForm(true);
    setAddressFormData({
      addressId: address.id,
      type: address.type || 'Home',
      firstName: address.firstName || address.name?.split(' ')[0] || '',
      lastName: address.lastName || address.name?.split(' ').slice(1).join(' ') || '',
      email: address.email || '',
      street: address.street || '',
      city: address.city || '',
      state: address.state || '',
      zipcode: address.pincode || '',
      country: address.country || '',
      phone: address.phone || '',
      isDefault: Boolean(address.isDefault),
    });
  };

  const handleDeleteAddress = async (addressId) => {
    const response = await addressAPI.deleteAddress(addressId);
    if (response.success) {
      const raw = Array.isArray(response.addresses) ? response.addresses : [];
      const saved = normalizeAddresses(raw);
      setSavedAddresses(saved);
      if (typeof setUserProfile === 'function') {
        setUserProfile((prev) => ({
          ...prev,
          addresses: raw,
        }));
      }
      if (String(addressId) === String(selectedAddressId)) {
        const defaultAddress = saved.find((addr) => addr.isDefault) || saved[0];
        if (defaultAddress) {
          setSelectedAddressId(String(defaultAddress.id));
          setSelectedAddress(defaultAddress);
          fillDataFromAddress(defaultAddress);
        } else {
          setSelectedAddressId('');
          setSelectedAddress(null);
          setData({ firstName: '', lastName: '', email: '', street: '', city: '', state: '', zipcode: '', country: '', phone: '' });
        }
      }
      toast.success('Address deleted successfully');
    } else {
      toast.error(response.message || 'Unable to delete address');
    }
  };

  const handleChangeAddress = () => {
    setSelectedAddressId('');
    setSelectedAddress(null);
    setShowAddressForm(false);
    setIsEditingAddress(false);
    setData({
      firstName: '',
      lastName: '',
      email: '',
      street: '',
      city: '',
      state: '',
      zipcode: '',
      country: '',
      phone: '',
    });
  };

  const handleSetDefaultAddress = async (addressId) => {
    const address = savedAddresses.find((addr) => addr.id === addressId);
    if (!address) return;
    const response = await addressAPI.editAddress({
      addressId,
      isDefault: true,
      ...{
        type: address.type,
        firstName: address.firstName,
        lastName: address.lastName,
        email: address.email,
        name: address.name,
        phone: address.phone,
        street: address.street,
        city: address.city,
        state: address.state,
        country: address.country,
        pincode: address.pincode,
        landmark: address.landmark || '',
      },
    });
    if (response.success) {
      const raw = Array.isArray(response.addresses) ? response.addresses : [];
      const saved = normalizeAddresses(raw);
      setSavedAddresses(saved);
      if (typeof setUserProfile === 'function') {
        setUserProfile((prev) => ({
          ...prev,
          addresses: raw,
        }));
      }
      const updatedAddress = saved.find((addr) => addr.id === addressId);
      if (updatedAddress) {
        setSelectedAddressId(String(updatedAddress.id));
        setSelectedAddress(updatedAddress);
        fillDataFromAddress(updatedAddress);
      }
      toast.success('Default address updated');
    } else {
      toast.error(response.message || 'Unable to set default address');
    }
  };

  useEffect(() => {
    loadSavedAddresses();
  }, [token]);

  const placeOrder = async (event) => {
    event.preventDefault();

    if (!token) {
      toast.error('Please login before placing an order');
      return;
    }

    const orderItems = food_list
      .filter((item) => cartItems[item._id] > 0)
      .map((item) => ({ ...item, quantity: cartItems[item._id] }));

    if (orderItems.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    const activeAddress = savedAddresses.find((addr) => String(addr.id) === String(selectedAddressId));
    const addressPayload = activeAddress
      ? {
          firstName: activeAddress.firstName || activeAddress.name?.split(' ')[0] || '',
          lastName: activeAddress.lastName || activeAddress.name?.split(' ').slice(1).join(' ') || '',
          email: activeAddress.email || '',
          street: activeAddress.street || '',
          city: activeAddress.city || '',
          state: activeAddress.state || '',
          zipcode: activeAddress.pincode || activeAddress.zipcode || '',
          pincode: activeAddress.pincode || activeAddress.zipcode || '',
          country: activeAddress.country || '',
          phone: activeAddress.phone || '',
          type: activeAddress.type || 'Home',
        }
      : data;

    let orderData = {
      address: addressPayload,
      items: orderItems,
      paymentMethod: 'UPI',
    };

    try {
      let response = await axios.post(
        url + '/api/order/place',
        orderData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (response.data.success) {
        const { order_id, orderId, amount } = response.data;

        if (!window.Razorpay) {
          toast.error('Razorpay checkout is not loaded yet. Please wait a moment and try again.');
          return;
        }

        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_placeholder',
          amount: amount,
          currency: 'INR',
          name: 'QuickBite',
          description: 'Order Payment',
          order_id: order_id,

          handler: async function (paymentResponse) {
            try {
              const verifyRes = await axios.post(
                url + '/api/order/verify',
                {
                  orderId: orderId,
                  razorpay_order_id: paymentResponse.razorpay_order_id,
                  razorpay_payment_id: paymentResponse.razorpay_payment_id,
                  razorpay_signature: paymentResponse.razorpay_signature,
                },
                { headers: { Authorization: `Bearer ${token}` } }
              );

              if (verifyRes.data.success) {
                toast.success('✅ Order placed successfully! Preparing your delicious meal 🍽️', {
                  position: 'top-right',
                  duration: 3000,
                });
                navigate('/success');
              } else {
                toast.error('Payment Failed ❌');
              }
            } catch (error) {
              console.log(error);
              toast.error('Verification Error');
            }
          },
          modal: {
            ondismiss: function () {
              toast.error('Payment Cancelled ❌');
            },
          },
          prefill: {
            name: data.firstName + ' ' + data.lastName,
            email: data.email,
            contact: data.phone,
          },
          theme: {
            color: '#2563EB',
          },
        };
        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        toast.error(`Backend Error: ${response?.data?.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.log('API ERROR:', error);
      toast.error(`API Failed: ${error.response?.data?.message || error.message || 'Unknown error'}`);
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      onSubmit={placeOrder}
      className='place-order'
    >
      <div className="place-order-left">
        {/* SAVED ADDRESSES SECTION */}
        <div>
          <div className="saved-addresses-header">
            <div>
              <p className="section-label">Delivery Location</p>
              <h2>Choose or add an address</h2>
            </div>
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: '0 8px 25px rgba(37, 99, 235, 0.3)' }}
              whileTap={{ scale: 0.98 }}
              type="button"
              className="add-address-btn"
              onClick={openNewAddressForm}
            >
              <FiPlus style={{ marginRight: '6px' }} /> Add New Address
            </motion.button>
          </div>

          {/* ADDRESSES GRID */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="addresses-grid"
          >
            {savedAddresses.length > 0 ? (
              savedAddresses.map((address) => (
                <motion.div
                  variants={cardVariants}
                  whileHover={{ y: -5, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  key={address.id}
                  className={`address-card ${selectedAddressId === address.id ? 'selected' : ''}`}
                  onClick={() => handleSelectAddress(address.id)}
                >
                  <div className="address-card-top">
                    <span className="address-type">{address.type || 'Home'}</span>
                    {address.isDefault && <span className="address-pill">Default</span>}
                  </div>
                  <h4>
                    {address.firstName || address.name || 'Guest'} {address.lastName || ''}
                  </h4>
                  <p>{address.street}, {address.city}</p>
                  <p>{address.phone}</p>

                  <div className="address-card-actions">
                    <button
                      type="button"
                      className="icon-button edit"
                      title="Edit"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditAddress(address.id);
                      }}
                    >
                      <FiEdit2 size={15} />
                    </button>
                    <button
                      type="button"
                      className="icon-button delete"
                      title="Delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteAddress(address.id);
                      }}
                    >
                      <FiTrash2 size={15} />
                    </button>
                    {!address.isDefault && (
                      <button
                        type="button"
                        className="icon-button default"
                        title="Set as Default"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSetDefaultAddress(address.id);
                        }}
                      >
                        <FiStar size={15} />
                      </button>
                    )}
                  </div>

                  <AnimatePresence>
                    {selectedAddressId === address.id && (
                      <motion.span
                        initial={{ scale: 0, rotate: -45 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, rotate: -45 }}
                        className="address-checkmark"
                      >
                        <FiCheck size={14} />
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))
            ) : (
              <div className="address-empty">
                <p>No saved addresses yet. Add one to speed up checkout.</p>
              </div>
            )}
          </motion.div>
        </div>

        {/* SELECTED ADDRESS SUMMARY */}
        {selectedAddress && !showAddressForm && (
          <div className="selected-address-summary">
            <div className="summary-header">
              <FiMapPin className="location-icon" /> Delivering To
            </div>
            <div className="summary-content">
              <div className="summary-type">{selectedAddress.type || 'HOME'}</div>
              <div className="summary-name">
                {selectedAddress.firstName} {selectedAddress.lastName}
              </div>
              <div className="summary-address">
                {selectedAddress.street}, {selectedAddress.city}
              </div>
              <div className="summary-phone">{selectedAddress.phone}</div>
            </div>
            <div className="summary-actions">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                className="change-address-btn"
                onClick={handleChangeAddress}
              >
                Change Address
              </motion.button>
            </div>
          </div>
        )}

        {/* ADD/EDIT ADDRESS FORM */}
        {showAddressForm && (
          <div className="address-form-card">
            <div className="address-form-heading">
              <div>
                <p className="section-label">{isEditingAddress ? 'Edit Address' : 'Add New Address'}</p>
                <h3>{isEditingAddress ? 'Update your saved address' : 'Save a new delivery address'}</h3>
              </div>
            </div>
            <div className="address-form">
              <div className="form-row">
                <input
                  required
                  name="firstName"
                  value={addressFormData.firstName}
                  onChange={handleAddressFormChange}
                  type="text"
                  placeholder="First Name"
                />
                <input
                  required
                  name="lastName"
                  value={addressFormData.lastName}
                  onChange={handleAddressFormChange}
                  type="text"
                  placeholder="Last Name"
                />
              </div>
              <input
                required
                name="email"
                value={addressFormData.email}
                onChange={handleAddressFormChange}
                type="email"
                placeholder="Email address"
              />
              <input
                required
                name="street"
                value={addressFormData.street}
                onChange={handleAddressFormChange}
                type="text"
                placeholder="Street"
              />
              <div className="form-row">
                <input
                  required
                  name="city"
                  value={addressFormData.city}
                  onChange={handleAddressFormChange}
                  type="text"
                  placeholder="City"
                />
                <input
                  required
                  name="state"
                  value={addressFormData.state}
                  onChange={handleAddressFormChange}
                  type="text"
                  placeholder="State"
                />
              </div>
              <div className="form-row">
                <input
                  required
                  name="zipcode"
                  value={addressFormData.zipcode}
                  onChange={handleAddressFormChange}
                  type="text"
                  placeholder="Zip code"
                />
                <input
                  required
                  name="country"
                  value={addressFormData.country}
                  onChange={handleAddressFormChange}
                  type="text"
                  placeholder="Country"
                />
              </div>
              <input
                required
                name="phone"
                value={addressFormData.phone}
                onChange={handleAddressFormChange}
                type="text"
                placeholder="Phone number"
              />
              <div className="address-type-selector">
                {['Home', 'Hostel', 'Office', 'Other'].map((typeOption) => (
                  <button
                    key={typeOption}
                    type="button"
                    className={`address-type-button ${addressFormData.type === typeOption ? 'active' : ''}`}
                    onClick={() => setAddressFormData((prev) => ({ ...prev, type: typeOption }))}
                  >
                    {typeOption}
                  </button>
                ))}
              </div>
              <label className="address-default-toggle">
                <input
                  type="checkbox"
                  name="isDefault"
                  checked={addressFormData.isDefault}
                  onChange={handleAddressFormChange}
                />
                Set as default address
              </label>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                className="save-address-btn"
                onClick={handleSaveAddress}
              >
                {isEditingAddress ? 'Update Address' : 'Save Address'}
              </motion.button>
            </div>
          </div>
        )}
      </div>

      {/* CART TOTAL SECTION */}
      <div className="place-order-right">
        <div className="cart-total">
          <h2>Cart Total</h2>
          <div className="cart-total-details">
            <div className="cart-total-detail">
              <p>Subtotal</p>
              <p>₹{getTotalCartAmount()}</p>
            </div>
            <hr />
            <div className="cart-total-detail">
              <p>Delivery Fee</p>
              <p>₹{getTotalCartAmount() === 0 ? 0 : 2}</p>
            </div>
            <hr />
            <div className="cart-total-detail total-row">
              <b>Total</b>
              <b>₹{getTotalCartAmount() === 0 ? 0 : getTotalCartAmount() + 2}</b>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.03, boxShadow: '0 8px 30px rgba(37, 99, 235, 0.4)' }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            className="proceed-btn"
          >
            Proceed to Payment
          </motion.button>
        </div>
      </div>
    </motion.form>
  );
};

export default PlaceOrder;
