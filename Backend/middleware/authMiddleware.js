import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Authorization token missing or invalid' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'codeinyourself_secret_key_2026');
    const userId = decoded.id || decoded.userId || decoded._id;
    const user = await User.findById(userId).select('-password');

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found or session expired' });
    }

    if (user.status === 'blocked') {
      return res.status(403).json({ success: false, message: 'Your account has been deactivated' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token', error: error.message });
  }
}

export async function optionalAuthMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'codeinyourself_secret_key_2026');
      const userId = decoded.id || decoded.userId || decoded._id;
      const user = await User.findById(userId).select('-password');
      if (user && user.status !== 'blocked') {
        req.user = user;
      }
    }
  } catch (error) {
    // Ignore invalid token for optional auth
  }
  next();
}
