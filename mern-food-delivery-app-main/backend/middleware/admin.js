/**
 * Admin-only middleware.
 * Must be used AFTER authMiddleware so req.user is populated.
 * Rejects any request where the authenticated user's role is not 'admin'.
 */
const adminMiddleware = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Forbidden. Admin access required.' });
  }
  next();
};

export default adminMiddleware;
