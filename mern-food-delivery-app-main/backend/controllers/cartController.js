import userModel from './../models/userModel.js';

const getCartData = async (userId) => {
    const userData = await userModel.findById(userId);
    if (!userData) {
        return null;
    }
    return userData.cartData || {};
};

// add items to user cart
const addToCart = async (req, res) => {
    try {
        const cartData = await getCartData(req.body.userId);
        if (!cartData) {
            return res.json({ success: false, message: 'User not found' });
        }

        if (!cartData[req.body.itemId]) {
            cartData[req.body.itemId] = 1;
        } else {
            cartData[req.body.itemId] += 1;
        }

        await userModel.findByIdAndUpdate(req.body.userId, { cartData });
        res.json({ success: true, message: 'Added to cart', cartData });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: 'Error' });
    }
};

// remove one item from user cart
const removeFromCart = async (req, res) => {
    try {
        const cartData = await getCartData(req.body.userId);
        if (!cartData) {
            return res.json({ success: false, message: 'User not found' });
        }

        if (cartData[req.body.itemId] > 0) {
            cartData[req.body.itemId] -= 1;
            if (cartData[req.body.itemId] <= 0) {
                delete cartData[req.body.itemId];
            }
        }

        await userModel.findByIdAndUpdate(req.body.userId, { cartData });
        res.json({ success: true, message: 'Removed from cart', cartData });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: 'Error' });
    }
};

// set exact quantity for a cart item
const updateCartItem = async (req, res) => {
    try {
        const { itemId, quantity } = req.body;
        const cartData = await getCartData(req.body.userId);
        if (!cartData) {
            return res.json({ success: false, message: 'User not found' });
        }

        const qty = Number(quantity);
        if (!itemId || Number.isNaN(qty) || qty < 0) {
            return res.json({ success: false, message: 'Invalid cart item data' });
        }

        if (qty === 0) {
            delete cartData[itemId];
        } else {
            cartData[itemId] = qty;
        }

        await userModel.findByIdAndUpdate(req.body.userId, { cartData });
        res.json({ success: true, message: 'Cart updated', cartData });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: 'Error' });
    }
};

// remove item completely from cart
const deleteCartItem = async (req, res) => {
    try {
        const cartData = await getCartData(req.body.userId);
        if (!cartData) {
            return res.json({ success: false, message: 'User not found' });
        }

        delete cartData[req.body.itemId];
        await userModel.findByIdAndUpdate(req.body.userId, { cartData });
        res.json({ success: true, message: 'Item removed', cartData });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: 'Error' });
    }
};

// sync full cart (used for reorder)
const syncCart = async (req, res) => {
    try {
        const { cartData } = req.body;
        if (!cartData || typeof cartData !== 'object') {
            return res.json({ success: false, message: 'Invalid cart data' });
        }

        const sanitized = Object.entries(cartData).reduce((acc, [key, value]) => {
            const qty = Number(value);
            if (qty > 0) {
                acc[key] = qty;
            }
            return acc;
        }, {});

        await userModel.findByIdAndUpdate(req.body.userId, { cartData: sanitized });
        res.json({ success: true, message: 'Cart synced', cartData: sanitized });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: 'Error' });
    }
};

// fetch user cart data
const getCart = async (req, res) => {
    try {
        const cartData = await getCartData(req.body.userId);
        if (!cartData) {
            return res.json({ success: false, message: 'User not found' });
        }
        res.json({ success: true, cartData });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: 'Error' });
    }
};

export { addToCart, removeFromCart, getCart, updateCartItem, deleteCartItem, syncCart };
