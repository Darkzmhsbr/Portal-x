/**
 * Rotas de Autenticação
 * Implementa login, registro, verificação e gerenciamento de sessões
 */

import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { asyncHandler, createError } from '../middleware/errorHandler.js'
import { authenticate, verifyAccessCode, clearTokenCache } from '../middleware/auth.js'
import { authRateLimiter } from '../middleware/rateLimiter.js'
import db from '../database.js'

const router = express.Router()

// Helpers para validação
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const passwordMinLength = 8

const validateEmail = (email) => emailRegex.test(email)
const validatePassword = (password) => password && password.length >= passwordMinLength

// Geração de token JWT otimizada
const generateToken = (user) => {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role
  }
  
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    issuer: 'portal-x',
    audience: 'portal-x-users'
  })
}

// Geração de código de referral único
const generateReferralCode = async () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code
  let attempts = 0
  
  do {
    code = Array.from({ length: 8 }, () => 
      characters[Math.floor(Math.random() * characters.length)]
    ).join('')
    
    const exists = await db.query(
      'SELECT id FROM users WHERE referral_code = $1',
      [code]
    )
    
    if (exists.rows.length === 0) break
    
    attempts++
  } while (attempts < 10)
  
  return code
}

/**
 * POST /api/auth/verify-code
 * Verifica código de acesso inicial
 */
router.post('/verify-code', 
  authRateLimiter,
  asyncHandler(async (req, res) => {
    const { code, type = 'user' } = req.body
    
    if (!code) {
      throw createError.badRequest('Código não fornecido')
    }
    
    const validCode = type === 'admin' 
      ? process.env.ADMIN_ACCESS_CODE 
      : process.env.USER_ACCESS_CODE
    
    if (code !== validCode) {
      throw createError.forbidden('Código inválido')
    }
    
    // Gerar token de sessão
    const sessionToken = Buffer.from(
      `${Date.now()}-${Math.random()}`
    ).toString('base64url')
    
    // Salvar sessão
    await db.query(
      `INSERT INTO access_sessions 
       (session_token, access_type, ip_address, user_agent, expires_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        sessionToken,
        type,
        req.ip,
        req.headers['user-agent'],
        new Date(Date.now() + 24 * 60 * 60 * 1000)
      ]
    )
    
    res.json({
      success: true,
      sessionToken,
      expiresIn: 86400
    })
  })
)

/**
 * POST /api/auth/register
 * Registro de novo usuário
 */
router.post('/register',
  authRateLimiter,
  verifyAccessCode('user'),
  asyncHandler(async (req, res) => {
    const { name, email, password } = req.body
    
    // Validações
    if (!name || name.trim().length < 3) {
      throw createError.badRequest('Nome deve ter pelo menos 3 caracteres')
    }
    
    if (!validateEmail(email)) {
      throw createError.badRequest('Email inválido')
    }
    
    if (!validatePassword(password)) {
      throw createError.badRequest(`Senha deve ter pelo menos ${passwordMinLength} caracteres`)
    }
    
    // Verificar email único
    const emailExists = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    )
    
    if (emailExists.rows.length > 0) {
      throw createError.conflict('Email já cadastrado')
    }
    
    // Hash da senha
    const hashedPassword = await bcrypt.hash(
      password,
      parseInt(process.env.BCRYPT_ROUNDS) || 10
    )
    
    // Gerar código de referral
    const referralCode = await generateReferralCode()
    
    // Criar usuário
    const result = await db.query(
      `INSERT INTO users 
       (name, email, password, referral_code, status, access_code_verified)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, email, referral_code, status, created_at`,
      [
        name.trim(),
        email.toLowerCase(),
        hashedPassword,
        referralCode,
        'pending',
        true
      ]
    )
    
    const newUser = result.rows[0]
    
    res.status(201).json({
      success: true,
      message: 'Conta criada com sucesso. Aguarde aprovação do administrador.',
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        referralCode: newUser.referral_code,
        status: newUser.status
      }
    })
  })
)

/**
 * POST /api/auth/login
 * Login de usuário
 */
router.post('/login',
  authRateLimiter,
  verifyAccessCode('user'),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body
    
    if (!email || !password) {
      throw createError.badRequest('Email e senha são obrigatórios')
    }
    
    // Buscar usuário com campos necessários
    const result = await db.query(
      `SELECT id, name, email, password, username, avatar_url, 
              role, status, referral_code
       FROM users 
       WHERE email = $1
       LIMIT 1`,
      [email.toLowerCase()]
    )
    
    if (result.rows.length === 0) {
      throw createError.unauthorized('Credenciais inválidas')
    }
    
    const user = result.rows[0]
    
    // Verificar senha
    const validPassword = await bcrypt.compare(password, user.password)
    
    if (!validPassword) {
      throw createError.unauthorized('Credenciais inválidas')
    }
    
    // Verificar status da conta
    if (user.status === 'pending') {
      throw createError.forbidden('Conta pendente de aprovação')
    }
    
    if (user.status === 'blocked') {
      throw createError.forbidden('Conta bloqueada')
    }
    
    // Gerar token
    const token = generateToken(user)
    
    // Atualizar último login
    await db.query(
      'UPDATE users SET updated_at = NOW() WHERE id = $1',
      [user.id]
    )
    
    // Resposta otimizada
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        username: user.username,
        avatarUrl: user.avatar_url,
        role: user.role,
        referralCode: user.referral_code,
        isAdmin: user.role === 'admin'
      }
    })
  })
)

/**
 * GET /api/auth/me
 * Obter dados do usuário autenticado
 */
router.get('/me',
  authenticate,
  asyncHandler(async (req, res) => {
    // Buscar dados atualizados incluindo estatísticas
    const userQuery = `
      SELECT 
        u.*,
        COUNT(DISTINCT c.id) as total_channels,
        COALESCE(SUM(c.members), 0) as total_members,
        COALESCE(SUM(c.views), 0) as total_views
      FROM users u
      LEFT JOIN channels c ON u.id = c.user_id AND c.status = 'active'
      WHERE u.id = $1
      GROUP BY u.id
    `
    
    const result = await db.query(userQuery, [req.user.id])
    
    if (result.rows.length === 0) {
      throw createError.notFound('Usuário não encontrado')
    }
    
    const user = result.rows[0]
    
    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        username: user.username,
        avatarUrl: user.avatar_url,
        role: user.role,
        status: user.status,
        referralCode: user.referral_code,
        referralPoints: user.referral_points,
        isAdmin: user.role === 'admin',
        stats: {
          totalChannels: parseInt(user.total_channels),
          totalMembers: parseInt(user.total_members),
          totalViews: parseInt(user.total_views)
        },
        createdAt: user.created_at
      }
    })
  })
)

/**
 * POST /api/auth/logout
 * Logout (limpa cache de token)
 */
router.post('/logout',
  authenticate,
  asyncHandler(async (req, res) => {
    // Limpar cache do token
    clearTokenCache(req.user.id)
    
    res.json({
      success: true,
      message: 'Logout realizado com sucesso'
    })
  })
)

/**
 * POST /api/auth/forgot-password
 * Recuperação de senha
 */
router.post('/forgot-password',
  authRateLimiter,
  asyncHandler(async (req, res) => {
    const { email, code } = req.body
    
    if (!email || !validateEmail(email)) {
      throw createError.badRequest('Email inválido')
    }
    
    if (!code || code !== process.env.USER_ACCESS_CODE) {
      throw createError.forbidden('Código de acesso inválido')
    }
    
    // Verificar se usuário existe
    const user = await db.query(
      'SELECT id, status FROM users WHERE email = $1',
      [email.toLowerCase()]
    )
    
    if (user.rows.length === 0) {
      // Não revelar se email existe
      res.json({
        success: true,
        message: 'Se o email existir, instruções serão enviadas'
      })
      return
    }
    
    // Gerar token de recuperação
    const resetToken = Buffer.from(
      `${user.rows[0].id}-${Date.now()}-${Math.random()}`
    ).toString('base64url')
    
    // Salvar token (válido por 1 hora)
    await db.query(
      `INSERT INTO password_resets (user_id, token, expires_at)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id) DO UPDATE
       SET token = $2, expires_at = $3, created_at = NOW()`,
      [user.rows[0].id, resetToken, new Date(Date.now() + 3600000)]
    )
    
    res.json({
      success: true,
      message: 'Token de recuperação gerado',
      resetToken // Em produção, enviar por email
    })
  })
)

/**
 * POST /api/auth/reset-password
 * Resetar senha com token
 */
router.post('/reset-password',
  authRateLimiter,
  asyncHandler(async (req, res) => {
    const { token, newPassword } = req.body
    
    if (!token) {
      throw createError.badRequest('Token não fornecido')
    }
    
    if (!validatePassword(newPassword)) {
      throw createError.badRequest(`Senha deve ter pelo menos ${passwordMinLength} caracteres`)
    }
    
    // Verificar token
    const result = await db.query(
      `SELECT user_id FROM password_resets 
       WHERE token = $1 AND expires_at > NOW()`,
      [token]
    )
    
    if (result.rows.length === 0) {
      throw createError.badRequest('Token inválido ou expirado')
    }
    
    const userId = result.rows[0].user_id
    
    // Hash nova senha
    const hashedPassword = await bcrypt.hash(
      newPassword,
      parseInt(process.env.BCRYPT_ROUNDS) || 10
    )
    
    // Atualizar senha em transação
    await db.transaction(async (client) => {
      await client.query(
        'UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2',
        [hashedPassword, userId]
      )
      
      await client.query(
        'DELETE FROM password_resets WHERE user_id = $1',
        [userId]
      )
    })
    
    // Limpar cache de tokens do usuário
    clearTokenCache(userId)
    
    res.json({
      success: true,
      message: 'Senha alterada com sucesso'
    })
  })
)

export default router