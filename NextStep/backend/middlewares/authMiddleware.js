// middlewares/authMiddleware.js
import jwt from 'jsonwebtoken';

const authMiddleware = (req, res, next) => {
  // Get the token from the Authorization header
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  console.log('Received token:', token);  // Log the token for debugging

  try {
    // Decode the token and attach the user to the request object
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded token:', decoded);  // Log decoded token for debugging

    req.user = decoded.user;  // Attach user info to the request object
    console.log('Authenticated user:', req.user);  // Log authenticated user for debugging

    next();  // Proceed to the next middleware or controller
  } catch (error) {
    console.error('Token verification failed:', error);  // Log any verification errors

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }

    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Middleware to enforce agent role for certain routes (like posting a job)
const agentRoleMiddleware = (req, res, next) => {
  if (req.user.role !== 'agent') {
    return res.status(403).json({ message: 'Only agents can access this resource' });
  }
  next();  // Proceed to the next middleware or controller
};

export { authMiddleware, agentRoleMiddleware };
