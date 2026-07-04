import express from 'express'
import { 
    loginUser, 
    registerUser, 
    getUserProfile, 
    updateProfile, 
    changePassword, 
    addAddress, 
    editAddress, 
    deleteAddress, 
    getNotifications, 
    markNotificationAsRead 
} from '../controllers/userController.js'
import authMiddleware from '../middleware/auth.js'

const userRouter = express.Router();

// Authentication routes
userRouter.post('/register', registerUser)
userRouter.post('/login', loginUser)

// Profile routes (protected)
userRouter.get('/profile', authMiddleware, getUserProfile)
userRouter.post('/profile/update', authMiddleware, updateProfile)
userRouter.post('/password/change', authMiddleware, changePassword)

// Address routes (protected)
userRouter.post('/address/add', authMiddleware, addAddress)
userRouter.post('/address/edit', authMiddleware, editAddress)
userRouter.post('/address/delete', authMiddleware, deleteAddress)

// Notification routes (protected)
userRouter.get('/notifications', authMiddleware, getNotifications)
userRouter.post('/notifications/read', authMiddleware, markNotificationAsRead)

export default userRouter;
