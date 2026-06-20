import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { initializeDatabase } from './src/config/database.js';
import authRoutes from './src/routes/auth.js';
import movieRoutes from './src/routes/movies.js';
import { logError } from './src/config/logger.js';

// Carrega variaveis de ambiente
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware de segurança
app.use(helmet());

// Configuração do CORS
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// middleware de compressão para respostas
app.use(compression());

// middleware de logging
app.use(morgan('combined'));

// Middleware de análise de body com limites de tamanho
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ limit: '10kb', extended: true }));

// Middleware de validação de requisição
app.use((req, res, next) => {
  const suspiciousPatterns = /<script|javascript:|onerror=|onclick=|<iframe/i;
  const payload = JSON.stringify({
    body: req.body ?? {},
    query: req.query ?? {},
  });

  if (suspiciousPatterns.test(payload)) {
    return res.status(400).json({ error: 'Dados de requisição inválidos' });
  }

  next();
});

// Rotas
app.use('/api/auth', authRoutes);
app.use('/api/movies', movieRoutes);

// checkar saúde endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// Erro global handler
app.use((error, req, res, next) => {
  logError(error, `${req.method} ${req.path}`);
  res.status(500).json({ error: 'Erro interno de servidor' });
});

// Inicializa database e inicia server
async function startServer() {
  try {
    await initializeDatabase();
    console.log('Database iniciado com sucesso');

    app.listen(PORT, () => {
      console.log(`Server rodando em http://localhost:${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    logError(error, 'Server startup');
    console.error('Falha ao iniciar server:', error);
    process.exit(1);
  }
}

startServer();

// Desligamento normal

process.on('SIGINT', () => {
  console.log('Server desligando...');
  process.exit(0);
});

