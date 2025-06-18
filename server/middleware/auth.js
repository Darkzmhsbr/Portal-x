/**
 * Middleware de Autenticação JWT com cache e validações otimizadas
 * Implementa verificação de tokens com performance e segurança
 */

import jwt from 'jsonwebtoken'
import { createError } from './errorHandler.js'
import db from '../database.js'

// Cache em memória para tokens válidos (evita queries desnecessárias)
class TokenCache {
  constructor(maxSize = 1000, ttl = 300000) { // 5 minutos
    this.cache = new Map()
    this.maxSize = maxSize
    this.ttl = ttl
  }
  
  set(key, value) {
    // LRU: Remove entrada mais antiga se atingir limite
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
    }
    
    this.cache.set(key, {
      value,
      expires: Date.now() + this.ttl
    })
  }
  
  get(key) {
    const item = this.cache.get(key)
    
    if (!item) return null
    
    // Verifica expiração
    if (Date.now() > item.expires) {
      this.cache.delete(key)
      return null
    }
    
    return item.value
  }
  
  clear() {
    this.cache.clear()
  }
}

const tokenCache = new TokenCache()

// Extração otimizada de token
const extractToken = (authHeader) => {
  if (!authHeader) return null
  
  const parts = authHeader.split(' ')
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null
  
  return parts[1]
}

// Validação de payload JWT
const validatePayload = (payload) => {
  const required = ['id', 'email', 'role']
  return required.every(field => payload.hasOwnProperty(field))
}

/**
 * Middleware principal de autenticação
 * Verifica e valida tokens JWT com cache inteligente
 */
export const authenticate = async (req, res, next) => {
  try {
    const token = extractToken(req.headers.authorization)
    
    if (!token) {
      throw createError.unauthorized('Token não fornecido')
    }
    
    // Verificar cache primeiro
    const cachedUser = tokenCache.get(token)
    if (cachedUser) {
      req.user = cachedUser
      return next()
    }
    
    // Decodificar e verificar token
    let decoded
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET)
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw createError.unauthorized('Token expirado')
      }
      if (error.name === 'JsonWebTokenError') {
        throw createError.unauthorized('Token inválido')
      }
      throw error
    }
    
    // Validar estrutura do payload
    if (!validatePayload(decoded)) {
      throw createError.unauthorized('Token mal formado')
    }
    
    // Buscar usuário no banco (com campos otimizados)
    const query = `
      SELECT id, name, email, username, role, status, avatar_url, referral_code
      FROM users 
      WHERE id = $1 AND status = 'active'
      LIMIT 1
    `
    
    const result = await db.query(query, [decoded.id])
    
    if (result.rows.length === 0) {
      throw createError.unauthorized('Usuário não encontrado ou inativo')
    }
    
    const user = result.rows[0]
    
    // Adicionar informações úteis ao objeto user
    user.isAdmin = user.role === 'admin'
    user.token = token
    
    // Cachear resultado
    tokenCache.set(token, user)
    
    // Anexar usuário à requisição
    req.user = user
    next()
    
  } catch (error) {
    next(error)
  }
}

/**
 * Middleware para rotas opcionalmente autenticadas
 * Não bloqueia se não houver token, mas carrega usuário se disponível
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const token = extractToken(req.headers.authorization)
    
    if (!token) {
      req.user = null
      return next()
    }
    
    // Usar mesmo processo de autenticação, mas sem throw em caso de erro
    await authenticate(req, res, (error) => {
      if (error) {
        req.user = null
      }
      next()
    })
    
  } catch (error) {
    req.user = null
    next()
  }
}

/**
 * Middleware para verificar código de acesso
 * Usado para páginas restritas (login/register)
 */
export const verifyAccessCode = (codeType = 'user') => {
  return async (req, res, next) => {
    try {
      const sessionToken = req.headers['x-session-token'] || req.cookies?.sessionToken
      
      if (sessionToken) {
        // Verificar se já tem sessão válida
        const query = `
          SELECT * FROM access_sessions 
          WHERE session_token = $1 
            AND access_type = $2 
            AND expires_at > NOW()
          LIMIT 1
        `
        
        const result = await db.query(query, [sessionToken, codeType])
        
        if (result.rows.length > 0) {
          req.accessVerified = true
          return next()
        }
      }
      
      // Verificar código fornecido
      const { code } = req.body
      
      if (!code) {
        throw createError.forbidden('Código de acesso necessário')
      }
      
      const validCode = codeType === 'admin' 
        ? process.env.ADMIN_ACCESS_CODE 
        : process.env.USER_ACCESS_CODE
      
      if (code !== validCode) {
        throw createError.forbidden('Código de acesso inválido')
      }
      
      // Criar sessão de acesso
      const newSessionToken = generateSessionToken()
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 horas
      
      await db.query(
        `INSERT INTO access_sessions (session_token, access_type, ip_address, user_agent, expires_at)
         VALUES ($1, $2, $3, $4, $5)`,
        [newSessionToken, codeType, req.ip, req.headers['user-agent'], expiresAt]
      )
      
      // Definir cookie ou header
      res.setHeader('X-Session-Token', newSessionToken)
      req.accessVerified = true
      req.sessionToken = newSessionToken
      
      next()
      
    } catch (error) {
      next(error)
    }
  }
}

/**
 * Gera token de sessão seguro
 */
const generateSessionToken = () => {
  const randomBytes = new Array(32)
    .fill(0)
    .map(() => Math.floor(Math.random() * 256))
  
  return Buffer.from(randomBytes).toString('base64url')
}

/**
 * Middleware para verificar se usuário está verificado
 */
export const requireVerified = async (req, res, next) => {
  if (!req.user) {
    return next(createError.unauthorized('Autenticação necessária'))
  }
  
  if (req.user.status !== 'active') {
    return next(createError.forbidden('Conta não verificada ou bloqueada'))
  }
  
  next()
}

/**
 * Limpar cache de tokens (útil para logout global)
 */
export const clearTokenCache = (userId = null) => {
  if (userId) {
    // Limpar tokens específicos do usuário
    for (const [token, data] of tokenCache.cache.entries()) {
      if (data.value.id === userId) {
        tokenCache.cache.delete(token)
      }
    }
  } else {
    // Limpar todo o cache
    tokenCache.clear()
  }
}

// Limpar cache periodicamente
setInterval(() => {
  const now = Date.now()
  for (const [token, data] of tokenCache.cache.entries()) {
    if (now > data.expires) {
      tokenCache.cache.delete(token)
    }
  }
}, 5 * 60 * 1000) // 5 minutos