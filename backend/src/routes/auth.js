import express from 'express';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { body, validationResult } from 'express-validator';
import { User } from '../models/User.js';
import { logAuthAttempt } from '../config/logger.js';

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas tentativas de login. Tente novamente em alguns minutos.' },
});

const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas tentativas de cadastro. Tente novamente em alguns minutos.' },
});

function signToken(user) {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      tokenVersion: user.token_version ?? 0,
    },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
}

export async function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Nenhum token fornecido' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ error: 'Token inválido' });
    }

    const tokenVersion = decoded.tokenVersion ?? 0;
    const currentTokenVersion = user.token_version ?? 0;

    if (tokenVersion !== currentTokenVersion) {
      return res.status(401).json({ error: 'Token invalidated' });
    }

    req.userId = user.id;
    req.username = user.username;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido' });
  }
}

router.post(
  '/register',
  registerLimiter,
  body('username')
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage('Username deve ter entre 3 e 20 caracteres')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username pode conter apenas caracteres alfanuméricos e underscores'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password deve ter pelo menos 6 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password deve conter letras maiúsculas, minúsculas e números'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password } = req.body;
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'] || 'Unknown';

    try {
      const existingUser = await User.findByUsername(username);
      if (existingUser) {
        logAuthAttempt(username, 'FAILED_DUPLICATE', ipAddress, userAgent);
        return res.status(400).json({ error: 'Usuário já existe' });
      }

      const userId = await User.create(username, password);
      const user = await User.findById(userId);

      logAuthAttempt(username, 'REGISTERED', ipAddress, userAgent);

      const token = signToken(user);

      res.status(201).json({
        message: 'Usuário registrado com sucesso',
        token,
        user: { id: user.id, username: user.username },
      });
    } catch (error) {
      logAuthAttempt(username, 'FAILED_ERROR', ipAddress, userAgent);
      res.status(500).json({ error: 'Falha no registro' });
    }
  }
);

router.post(
  '/login',
  loginLimiter,
  body('username').trim().notEmpty().withMessage('Username é requerido'),
  body('password').notEmpty().withMessage('Password é requerido'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password } = req.body;
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'] || 'Unknown';

    try {
      const user = await User.findByUsername(username);

      if (!user) {
        logAuthAttempt(username, 'FAILED_NOT_FOUND', ipAddress, userAgent);
        return res.status(401).json({ error: 'Credenciais inválidas' });
      }

      const isValidPassword = await User.validatePassword(password, user.password);
      if (!isValidPassword) {
        logAuthAttempt(username, 'FAILED_WRONG_PASSWORD', ipAddress, userAgent);
        return res.status(401).json({ error: 'Credenciais inválidas' });
      }

      logAuthAttempt(username, 'SUCCESSO', ipAddress, userAgent);

      const token = signToken(user);

      res.json({
        message: 'Login bem sucedido!',
        token,
        user: { id: user.id, username: user.username },
      });
    } catch (error) {
      logAuthAttempt(username, 'FAILED_ERROR', ipAddress, userAgent);
      res.status(500).json({ error: 'Falha no login!' });
    }
  }
);

router.get('/verify', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(401).json({ error: 'Usuário não encontrado' });
    }

    res.json({ valid: true, user });
  } catch (error) {
    res.status(500).json({ error: 'Falha na verificação' });
  }
});

router.post('/logout', verifyToken, async (req, res) => {
  try {
    await User.bumpTokenVersion(req.userId);
    logAuthAttempt(req.username || 'unknown', 'LOGOUT', req.ip, req.headers['user-agent'] || 'Unknown');
    res.json({ message: 'Logout successful' });
  } catch (error) {
    res.status(500).json({ error: 'Falha no logout' });
  }
});

export default router;