import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export const checkToken = (req, res, next) => {
  const authHeader = req.headers['authorization']; // get auth from header

  // no auth or not is 'Bearer <TOKEN>'
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      ok: false,
      message: 'Access denied. Valid token required.'
    });
  }

    const token = authHeader.split(' ')[1];

  try {
    // verify the token using the secret key from env
    const payload = jwt.verify(token, env.JWT_SECRET);

    // insert user info into the request object
    req.usuarioLog = {
      id: payload.id,
      rol: payload.rol
    };

    next();
  } catch (error) {

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ ok: false, message: 'Token was expired.' });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({ ok: false, message: 'Invalid token or malformed.' });
    }

    next(error);  // global error handler
  }
};
