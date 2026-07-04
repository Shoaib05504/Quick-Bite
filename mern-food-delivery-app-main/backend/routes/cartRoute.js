import express from 'express'
import { addToCart, removeFromCart, getCart, updateCartItem, deleteCartItem, syncCart } from '../controllers/cartController.js'
import authMiddleware from '../middleware/auth.js';

const cartRouter = express.Router();

cartRouter.post("/add", authMiddleware, addToCart)
cartRouter.post("/remove",authMiddleware, removeFromCart)
cartRouter.post("/get",authMiddleware, getCart)
cartRouter.post("/update", authMiddleware, updateCartItem)
cartRouter.post("/delete", authMiddleware, deleteCartItem)
cartRouter.post("/sync", authMiddleware, syncCart)

export default cartRouter;
