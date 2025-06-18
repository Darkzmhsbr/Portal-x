import db from '../database.js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'

class User {
  // Criar novo usuário
  static async create(userData) {
    const { name, email, password, role = 'user' } = userData
    
    try {
      // Hash da senha
      const hashedPassword = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS))
      
      // Gerar código de referência único
      const referralCode = crypto.randomBytes(4).toString('hex').toUpperCase()
      
      // Inserir usuário
      const result = await db.query(
        `INSERT INTO users (name, email, password, role, referral_code, status)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, name, email, role, status, referral_code, created_at`,
        [name, email, hashedPassword, role, referralCode, 'pending']
      )
      
      return result.rows[0]
    } catch (error) {
      if (error.code === '23505') {
        throw new Error('Email já cadastrado')
      }
      throw error
    }
  }

  // Buscar por email
  static async findByEmail(email) {
    const result = await db.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    )
    return result.rows[0]
  }

  // Buscar por ID
  static async findById(id) {
    const result = await db.query(
      `SELECT id, name, email, username, avatar_url, status, role, 
              access_code_verified, referral_code, referral_points, 
              created_at, updated_at
       FROM users WHERE id = $1`,
      [id]
    )
    return result.rows[0]
  }

  // Verificar senha
  static async verifyPassword(password, hashedPassword) {
    return bcrypt.compare(password, hashedPassword)
  }

  // Gerar token JWT
  static generateToken(userId, role) {
    return jwt.sign(
      { userId, role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    )
  }

  // Atualizar status do usuário
  static async updateStatus(userId, status) {
    const result = await db.query(
      `UPDATE users SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING id, name, email, status`,
      [status, userId]
    )
    return result.rows[0]
  }

  // Verificar código de acesso
  static async verifyAccessCode(userId) {
    const result = await db.query(
      `UPDATE users SET access_code_verified = true, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING id, access_code_verified`,
      [userId]
    )
    return result.rows[0]
  }

  // Atualizar perfil
  static async updateProfile(userId, profileData) {
    const { name, username, avatar_url } = profileData
    
    const result = await db.query(
      `UPDATE users 
       SET name = COALESCE($1, name),
           username = COALESCE($2, username),
           avatar_url = COALESCE($3, avatar_url),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING id, name, username, avatar_url`,
      [name, username, avatar_url, userId]
    )
    
    return result.rows[0]
  }

  // Atualizar senha
  static async updatePassword(userId, newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, parseInt(process.env.BCRYPT_ROUNDS))
    
    const result = await db.query(
      `UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING id`,
      [hashedPassword, userId]
    )
    
    return result.rows[0]
  }

  // Listar usuários (admin)
  static async list(filters = {}) {
    let query = `
      SELECT u.id, u.name, u.email, u.username, u.status, u.role,
             u.referral_points, u.created_at,
             COUNT(DISTINCT c.id) as channel_count,
             COALESCE(SUM(c.members), 0) as total_members
      FROM users u
      LEFT JOIN channels c ON u.id = c.user_id
      WHERE 1=1
    `
    
    const params = []
    let paramCount = 0

    // Filtros
    if (filters.status) {
      paramCount++
      query += ` AND u.status = $${paramCount}`
      params.push(filters.status)
    }
    
    if (filters.role) {
      paramCount++
      query += ` AND u.role = $${paramCount}`
      params.push(filters.role)
    }
    
    query += ` GROUP BY u.id ORDER BY u.created_at DESC`
    
    const result = await db.query(query, params)
    return result.rows
  }

  // Estatísticas do usuário
  static async getStats(userId) {
    const result = await db.query(
      `SELECT 
        COUNT(DISTINCT c.id) as total_channels,
        COALESCE(SUM(c.members), 0) as total_members,
        COALESCE(SUM(c.views), 0) as total_views,
        COALESCE(SUM(c.clicks), 0) as total_clicks,
        COALESCE(SUM(c.entries), 0) as total_entries,
        COALESCE(SUM(c.exits), 0) as total_exits
       FROM channels c
       WHERE c.user_id = $1 AND c.status = 'active'`,
      [userId]
    )
    
    return result.rows[0]
  }

  // Adicionar pontos de referência
  static async addReferralPoints(userId, points) {
    const result = await db.query(
      `UPDATE users 
       SET referral_points = referral_points + $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING referral_points`,
      [points, userId]
    )
    
    return result.rows[0]
  }

  // Buscar por código de referência
  static async findByReferralCode(referralCode) {
    const result = await db.query(
      'SELECT id, name, referral_code FROM users WHERE referral_code = $1',
      [referralCode]
    )
    return result.rows[0]
  }

  // Deletar usuário (admin)
  static async delete(userId) {
    const result = await db.query(
      'DELETE FROM users WHERE id = $1 RETURNING id',
      [userId]
    )
    return result.rows[0]
  }
}

export default User