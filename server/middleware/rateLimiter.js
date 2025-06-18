/**
 * Rate Limiter Middleware com estratégias diferenciadas
 * Implementa sliding window com Redis-like memory store
 */

// Store em memória otimizado (pode ser substituído por Redis em produção)
class RateLimitStore {
  constructor() {
    this.requests = new Map()
    this.cleanup = this.cleanup.bind(this)
    
    // Limpeza automática a cada 5 minutos
    this.cleanupInterval = setInterval(this.cleanup, 5 * 60 * 1000)
  }
  
  increment(key, windowMs) {
    const now = Date.now()
    const windowStart = now - windowMs
    
    if (!this.requests.has(key)) {
      this.requests.set(key, [])
    }
    
    const timestamps = this.requests.get(key)
    
    // Remove timestamps antigos (sliding window)
    const validTimestamps = timestamps.filter(ts => ts > windowStart)
    validTimestamps.push(now)
    
    this.requests.set(key, validTimestamps)
    
    return validTimestamps.length
  }
  
  cleanup() {
    const now = Date.now()
    const maxAge = 15 * 60 * 1000 // 15 minutos
    
    for (const [key, timestamps] of this.requests.entries()) {
      const validTimestamps = timestamps.filter(ts => ts > now - maxAge)
      
      if (validTimestamps.length === 0) {
        this.requests.delete(key)
      } else {
        this.requests.set(key, validTimestamps)
      }
    }
  }
  
  destroy() {
    clearInterval(this.cleanupInterval)
    this.requests.clear()
  }
}

// Instância única do store
const store = new RateLimitStore()

// Função para gerar chave única baseada em IP e rota
const generateKey = (req, options) => {
  const ip = req.ip || req.connection.remoteAddress || 'unknown'
  const route = options.keyGenerator ? options.keyGenerator(req) : req.path
  return `${ip}:${route}`
}

// Configurações pré-definidas para diferentes tipos de rotas
export const rateLimitConfigs = {
  // API geral
  general: {
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100,
    message: 'Muitas requisições, tente novamente mais tarde'
  },
  
  // Autenticação (mais restritivo)
  auth: {
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: 'Muitas tentativas de autenticação, tente novamente em 15 minutos',
    skipSuccessfulRequests: true
  },
  
  // Upload de arquivos
  upload: {
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 20,
    message: 'Limite de uploads excedido'
  },
  
  // Cadastro de canais
  channels: {
    windowMs: 60 * 60 * 1000,
    max: 10,
    message: 'Limite de cadastro de canais excedido'
  },
  
  // Busca/pesquisa
  search: {
    windowMs: 1 * 60 * 1000, // 1 minuto
    max: 30,
    message: 'Muitas buscas, aguarde um momento'
  }
}

// Factory para criar rate limiters customizados
export const createRateLimiter = (options = {}) => {
  const config = {
    windowMs: options.windowMs || 15 * 60 * 1000,
    max: options.max || 100,
    message: options.message || 'Muitas requisições',
    skipSuccessfulRequests: options.skipSuccessfulRequests || false,
    keyGenerator: options.keyGenerator || null,
    skip: options.skip || null,
    handler: options.handler || null
  }
  
  return async (req, res, next) => {
    try {
      // Pular se configurado
      if (config.skip && await config.skip(req, res)) {
        return next()
      }
      
      const key = generateKey(req, config)
      const requests = store.increment(key, config.windowMs)
      
      // Headers informativos
      res.setHeader('X-RateLimit-Limit', config.max)
      res.setHeader('X-RateLimit-Remaining', Math.max(0, config.max - requests))
      res.setHeader('X-RateLimit-Reset', new Date(Date.now() + config.windowMs).toISOString())
      
      // Verificar limite
      if (requests > config.max) {
        res.setHeader('Retry-After', Math.ceil(config.windowMs / 1000))
        
        // Handler customizado
        if (config.handler) {
          return config.handler(req, res, next)
        }
        
        return res.status(429).json({
          success: false,
          error: {
            message: config.message,
            code: 'RATE_LIMIT_EXCEEDED',
            retryAfter: Math.ceil(config.windowMs / 1000)
          }
        })
      }
      
      // Se configurado, não contar requisições bem-sucedidas
      if (config.skipSuccessfulRequests) {
        res.on('finish', () => {
          if (res.statusCode < 400) {
            const timestamps = store.requests.get(key)
            if (timestamps && timestamps.length > 0) {
              timestamps.pop() // Remove última requisição
            }
          }
        })
      }
      
      next()
    } catch (error) {
      console.error('Rate limiter error:', error)
      next() // Em caso de erro, permite a requisição
    }
  }
}

// Rate limiter padrão para uso geral
export const rateLimiter = createRateLimiter(rateLimitConfigs.general)

// Rate limiters específicos
export const authRateLimiter = createRateLimiter(rateLimitConfigs.auth)
export const uploadRateLimiter = createRateLimiter(rateLimitConfigs.upload)
export const channelsRateLimiter = createRateLimiter(rateLimitConfigs.channels)
export const searchRateLimiter = createRateLimiter(rateLimitConfigs.search)

// Função para limpar o store (útil para testes)
export const resetRateLimiter = () => {
  store.requests.clear()
}

// Cleanup ao encerrar o processo
process.on('SIGTERM', () => store.destroy())
process.on('SIGINT', () => store.destroy())