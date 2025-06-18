/**
 * Middleware de Autorização Admin
 * Implementa verificações de permissão com cache e audit logging
 */

import { createError } from './errorHandler.js'
import db from '../database.js'

// Cache de permissões admin (evita verificações repetidas)
const adminCache = new Map()
const CACHE_TTL = 10 * 60 * 1000 // 10 minutos

/**
 * Verificação básica de admin
 */
export const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      throw createError.unauthorized('Autenticação necessária')
    }
    
    if (req.user.role !== 'admin') {
      // Log tentativa de acesso não autorizado
      await logAdminAccess(req, false)
      throw createError.forbidden('Acesso restrito a administradores')
    }
    
    // Verificar cache
    const cacheKey = `admin:${req.user.id}`
    const cached = adminCache.get(cacheKey)
    
    if (cached && cached.expires > Date.now()) {
      req.adminPermissions = cached.permissions
      return next()
    }
    
    // Verificar no banco se ainda é admin ativo
    const result = await db.query(
      'SELECT role, status FROM users WHERE id = $1 AND role = $2 AND status = $3',
      [req.user.id, 'admin', 'active']
    )
    
    if (result.rows.length === 0) {
      throw createError.forbidden('Permissões de admin revogadas')
    }
    
    // Cachear resultado
    const permissions = {
      canManageUsers: true,
      canManageChannels: true,
      canViewStats: true,
      canEditSettings: true
    }
    
    adminCache.set(cacheKey, {
      permissions,
      expires: Date.now() + CACHE_TTL
    })
    
    req.adminPermissions = permissions
    
    // Log acesso bem-sucedido
    await logAdminAccess(req, true)
    
    next()
  } catch (error) {
    next(error)
  }
}

/**
 * Verificação de código de acesso admin
 */
export const verifyAdminCode = async (req, res, next) => {
  try {
    const { accessCode } = req.body
    
    if (!accessCode) {
      throw createError.forbidden('Código de acesso admin necessário')
    }
    
    if (accessCode !== process.env.ADMIN_ACCESS_CODE) {
      // Log tentativa com código inválido
      await db.query(
        `INSERT INTO admin_access_logs (ip_address, user_agent, attempted_code, success, created_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        [req.ip, req.headers['user-agent'], accessCode.substring(0, 3) + '***', false]
      )
      
      throw createError.forbidden('Código de acesso admin inválido')
    }
    
    req.adminCodeVerified = true
    next()
  } catch (error) {
    next(error)
  }
}

/**
 * Middleware para ações específicas de admin
 */
export const requirePermission = (permission) => {
  return async (req, res, next) => {
    try {
      // Primeiro verifica se é admin
      await requireAdmin(req, res, () => {})
      
      // Verifica permissão específica
      if (!req.adminPermissions || !req.adminPermissions[permission]) {
        throw createError.forbidden(`Permissão '${permission}' necessária`)
      }
      
      next()
    } catch (error) {
      next(error)
    }
  }
}

/**
 * Rate limiter específico para ações admin
 */
export const adminRateLimit = {
  approve: createAdminRateLimiter('approve', 50, 60000), // 50 por minuto
  reject: createAdminRateLimiter('reject', 50, 60000),
  delete: createAdminRateLimiter('delete', 20, 60000), // 20 por minuto
  bulkAction: createAdminRateLimiter('bulk', 10, 60000) // 10 por minuto
}

function createAdminRateLimiter(action, limit, window) {
  const attempts = new Map()
  
  return (req, res, next) => {
    const key = `${req.user.id}:${action}`
    const now = Date.now()
    const userAttempts = attempts.get(key) || []
    
    // Filtrar tentativas dentro da janela
    const recentAttempts = userAttempts.filter(time => now - time < window)
    
    if (recentAttempts.length >= limit) {
      return next(createError.tooManyRequests(
        `Limite de ${limit} ações '${action}' por minuto excedido`
      ))
    }
    
    recentAttempts.push(now)
    attempts.set(key, recentAttempts)
    
    // Limpar tentativas antigas periodicamente
    if (Math.random() < 0.1) {
      for (const [k, v] of attempts.entries()) {
        const valid = v.filter(time => now - time < window * 2)
        if (valid.length === 0) {
          attempts.delete(k)
        } else {
          attempts.set(k, valid)
        }
      }
    }
    
    next()
  }
}

/**
 * Log de acessos admin para auditoria
 */
async function logAdminAccess(req, success) {
  try {
    const logQuery = `
      INSERT INTO admin_access_logs 
      (user_id, action, ip_address, user_agent, path, method, success, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
    `
    
    await db.query(logQuery, [
      req.user?.id || null,
      'access_attempt',
      req.ip,
      req.headers['user-agent'],
      req.path,
      req.method,
      success
    ])
  } catch (error) {
    console.error('Erro ao registrar log de admin:', error)
  }
}

/**
 * Validação de dados para ações admin
 */
export const validateAdminAction = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    })
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }))
      
      return next(createError.badRequest('Dados inválidos', { errors }))
    }
    
    req.validatedData = value
    next()
  }
}

/**
 * Limpar cache de admin (útil após mudanças de permissão)
 */
export const clearAdminCache = (userId = null) => {
  if (userId) {
    adminCache.delete(`admin:${userId}`)
  } else {
    adminCache.clear()
  }
}

// Tabela para logs (adicionar ao schema.sql)
export const adminLogSchema = `
  CREATE TABLE IF NOT EXISTS admin_access_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    path VARCHAR(255),
    method VARCHAR(10),
    attempted_code VARCHAR(10),
    success BOOLEAN DEFAULT TRUE,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  
  CREATE INDEX idx_admin_logs_user_id ON admin_access_logs(user_id);
  CREATE INDEX idx_admin_logs_created_at ON admin_access_logs(created_at DESC);
`