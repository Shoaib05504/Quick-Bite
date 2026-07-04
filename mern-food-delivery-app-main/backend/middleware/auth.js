import jwt from 'jsonwebtoken';

/**
 * Authentication middleware.
 * Reads the JWT from the standard `Authorization: Bearer <token>` header.
 * Attaches `req.user = { id, role }` and `req.body.userId = id` for downstream use.
 */
const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Not authorized. Please log in.' });
  }

  const token = authHeader.slice(7); // strip "Bearer "

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id, role: decoded.role || 'user' };
    req.body = req.body || {};
    req.body.userId = decoded.id;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Session expired. Please log in again.' });
    }
    return res.status(401).json({ success: false, message: 'Invalid token. Please log in again.' });
  }
};

export default authMiddleware;