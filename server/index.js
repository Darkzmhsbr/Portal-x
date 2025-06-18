import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import { createServer } from 'http'

// Importações locais
import { initializeDatabase } from './database.js'
import { errorHandler } from './middleware/errorHandler.js'
import { rateLimiter } from './middleware/rateLimiter.js'
import authRoutes from './routes/auth.js'
import channelRoutes from './routes/channels.js'
import adminRoutes from './routes/admin.js'
import uploadRoutes from './routes/upload.js'

// Configurações de ambiente
dotenv.config()
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Inicialização do servidor
const app = express()
const server = createServer(app)
const PORT = process.env.PORT || 8080

// Middleware de segurança e performance
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.telegram.org"]
    }
  }
}))

app.use(compression({ level: 6 }))
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.SITE_URL 
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

// Parsers otimizados
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Rate limiting global
app.use('/api', rateLimiter)

// Servir arquivos estáticos em produção
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '..', 'dist')
  
  app.use(express.static(distPath, {
    maxAge: '1d',
    etag: true,
    lastModified: true,
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.js')) {
        res.setHeader('Content-Type', 'application/javascript')
      } else if (filePath.endsWith('.css')) {
        res.setHeader('Content-Type', 'text/css')
      }
    }
  }))
}

// Rotas da API
app.use('/api/auth', authRoutes)
app.use('/api/channels', channelRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/upload', uploadRoutes)

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'operational',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV
  })
})

// Rota catch-all para SPA em produção
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'))
  })
}

// Middleware de tratamento de erros
app.use(errorHandler)

// Inicialização assíncrona otimizada
const startServer = async () => {
  try {
    // Inicializar banco de dados
    await initializeDatabase()
    console.log('✅ Banco de dados conectado com sucesso')
    
    // Iniciar servidor
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Servidor rodando na porta ${PORT}`)
      console.log(`📦 Ambiente: ${process.env.NODE_ENV}`)
      console.log(`🌐 URL: ${process.env.SITE_URL || `http://localhost:${PORT}`}`)
    })
    
    // Graceful shutdown
    process.on('SIGTERM', gracefulShutdown)
    process.on('SIGINT', gracefulShutdown)
    
  } catch (error) {
    console.error('❌ Erro ao inicializar servidor:', error)
    process.exit(1)
  }
}

// Função de shutdown gracioso
const gracefulShutdown = async () => {
  console.log('\n🔄 Iniciando shutdown gracioso...')
  
  server.close(() => {
    console.log('✅ Servidor HTTP fechado')
  })
  
  // Aguardar conexões ativas finalizarem (timeout de 10s)
  setTimeout(() => {
    console.log('⚠️  Forçando shutdown após timeout')
    process.exit(0)
  }, 10000)
}

// Tratamento de erros não capturados
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason)
})

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error)
  gracefulShutdown()
})

// Iniciar servidor
startServer()