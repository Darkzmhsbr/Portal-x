/**
 * Rotas Administrativas
 * Implementa dashboard, aprovações, estatísticas e controle total
 */

import express from 'express'
import { asyncHandler, createError } from '../middleware/errorHandler.js'
import { authenticate, verifyAccessCode } from '../middleware/auth.js'
import { requireAdmin, adminRateLimit } from '../middleware/admin.js'
import db from '../database.js'

const router = express.Router()

// Cache para estatísticas do dashboard
const statsCache = {
  data: null,
  expires: 0,
  ttl: 300000, // 5 minutos
  
  get() {
    return Date.now() < this.expires ? this.data : null
  },
  
  set(data) {
    this.data = data
    this.expires = Date.now() + this.ttl
  }
}

/**
 * POST /api/admin/verify-code
 * Verificação inicial do código admin
 */
router.post('/verify-code',
  verifyAccessCode('admin'),
  asyncHandler(async (req, res) => {
    res.json({
      success: true,
      message: 'Código admin verificado',
      sessionToken: req.sessionToken
    })
  })
)

/**
 * GET /api/admin/dashboard
 * Dashboard com estatísticas completas
 */
router.get('/dashboard',
  authenticate,
  requireAdmin,
  asyncHandler(async (req, res) => {
    // Verificar cache
    const cached = statsCache.get()
    if (cached) {
      return res.json({ success: true, ...cached })
    }
    
    // Queries otimizadas executadas em paralelo
    const [
      usersStats,
      channelsStats,
      recentActivity,
      growthData,
      topChannels,
      categoryStats
    ] = await Promise.all([
      // Estatísticas de usuários
      db.query(`
        SELECT 
          COUNT(*) FILTER (WHERE status = 'active') as active_users,
          COUNT(*) FILTER (WHERE status = 'pending') as pending_users,
          COUNT(*) FILTER (WHERE status = 'blocked') as blocked_users,
          COUNT(*) as total_users,
          COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as new_today,
          COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as new_week
        FROM users
      `),
      
      // Estatísticas de canais
      db.query(`
        SELECT 
          COUNT(*) FILTER (WHERE status = 'active') as active_channels,
          COUNT(*) FILTER (WHERE status = 'pending') as pending_channels,
          COUNT(*) FILTER (WHERE status = 'rejected') as rejected_channels,
          COUNT(*) as total_channels,
          SUM(members) FILTER (WHERE status = 'active') as total_members,
          SUM(views) FILTER (WHERE status = 'active') as total_views,
          AVG(members) FILTER (WHERE status = 'active') as avg_members
        FROM channels
      `),
      
      // Atividade recente
      db.query(`
        SELECT 
          'user' as type,
          id,
          name,
          email,
          status,
          created_at
        FROM users
        WHERE created_at > NOW() - INTERVAL '48 hours'
        UNION ALL
        SELECT 
          'channel' as type,
          c.id,
          c.name,
          u.email,
          c.status,
          c.created_at
        FROM channels c
        JOIN users u ON c.user_id = u.id
        WHERE c.created_at > NOW() - INTERVAL '48 hours'
        ORDER BY created_at DESC
        LIMIT 20
      `),
      
      // Dados de crescimento (últimos 30 dias)
      db.query(`
        WITH date_series AS (
          SELECT generate_series(
            CURRENT_DATE - INTERVAL '29 days',
            CURRENT_DATE,
            '1 day'::interval
          )::date AS date
        )
        SELECT 
          ds.date,
          COUNT(DISTINCT u.id) as new_users,
          COUNT(DISTINCT c.id) as new_channels
        FROM date_series ds
        LEFT JOIN users u ON DATE(u.created_at) = ds.date
        LEFT JOIN channels c ON DATE(c.created_at) = ds.date
        GROUP BY ds.date
        ORDER BY ds.date
      `),
      
      // Top canais por membros
      db.query(`
        SELECT 
          c.id,
          c.name,
          c.members,
          c.views,
          c.level,
          u.name as user_name
        FROM channels c
        JOIN users u ON c.user_id = u.id
        WHERE c.status = 'active'
        ORDER BY c.members DESC
        LIMIT 10
      `),
      
      // Estatísticas por categoria
      db.query(`
        SELECT 
          category,
          COUNT(*) as total,
          SUM(members) as total_members,
          AVG(members) as avg_members
        FROM channels
        WHERE status = 'active'
        GROUP BY category
        ORDER BY total DESC
      `)
    ])
    
    const dashboard = {
      users: {
        total: parseInt(usersStats.rows[0].total_users),
        active: parseInt(usersStats.rows[0].active_users),
        pending: parseInt(usersStats.rows[0].pending_users),
        blocked: parseInt(usersStats.rows[0].blocked_users),
        newToday: parseInt(usersStats.rows[0].new_today),
        newWeek: parseInt(usersStats.rows[0].new_week)
      },
      channels: {
        total: parseInt(channelsStats.rows[0].total_channels),
        active: parseInt(channelsStats.rows[0].active_channels),
        pending: parseInt(channelsStats.rows[0].pending_channels),
        rejected: parseInt(channelsStats.rows[0].rejected_channels),
        totalMembers: parseInt(channelsStats.rows[0].total_members || 0),
        totalViews: parseInt(channelsStats.rows[0].total_views || 0),
        avgMembers: Math.round(channelsStats.rows[0].avg_members || 0)
      },
      recentActivity: recentActivity.rows,
      growth: growthData.rows.map(row => ({
        date: row.date,
        users: parseInt(row.new_users),
        channels: parseInt(row.new_channels)
      })),
      topChannels: topChannels.rows,
      categoryStats: categoryStats.rows.map(row => ({
        category: row.category,
        total: parseInt(row.total),
        totalMembers: parseInt(row.total_members || 0),
        avgMembers: Math.round(row.avg_members || 0)
      }))
    }
    
    // Cachear resultado
    statsCache.set(dashboard)
    
    res.json({ success: true, ...dashboard })
  })
)

/**
 * GET /api/admin/users
 * Lista usuários com filtros
 */
router.get('/users',
  authenticate,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const {
      status,
      search,
      sort = 'created_at',
      order = 'desc',
      page = 1,
      limit = 50
    } = req.query
    
    const offset = (parseInt(page) - 1) * parseInt(limit)
    
    let query = `
      SELECT 
        u.*,
        COUNT(DISTINCT c.id) as channel_count,
        COALESCE(SUM(c.members), 0) as total_members
      FROM users u
      LEFT JOIN channels c ON u.id = c.user_id AND c.status = 'active'
      WHERE 1=1
    `
    
    const params = []
    let paramCount = 0
    
    if (status) {
      params.push(status)
      query += ` AND u.status = $${++paramCount}`
    }
    
    if (search) {
      params.push(`%${search}%`)
      query += ` AND (u.name ILIKE $${++paramCount} OR u.email ILIKE $${paramCount})`
    }
    
    query += ` GROUP BY u.id`
    query += ` ORDER BY u.${sort} ${order.toUpperCase()}`
    
    params.push(parseInt(limit))
    query += ` LIMIT $${++paramCount}`
    params.push(offset)
    query += ` OFFSET $${++paramCount}`
    
    const [usersResult, countResult] = await Promise.all([
      db.query(query, params),
      db.query(
        'SELECT COUNT(*) FROM users WHERE 1=1' + 
        (status ? ` AND status = '${status}'` : '') +
        (search ? ` AND (name ILIKE '%${search}%' OR email ILIKE '%${search}%')` : '')
      )
    ])
    
    res.json({
      success: true,
      users: usersResult.rows.map(user => ({
        ...user,
        channelCount: parseInt(user.channel_count),
        totalMembers: parseInt(user.total_members)
      })),
      pagination: {
        total: parseInt(countResult.rows[0].count),
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(countResult.rows[0].count / parseInt(limit))
      }
    })
  })
)

/**
 * PUT /api/admin/users/:id/status
 * Atualizar status do usuário
 */
router.put('/users/:id/status',
  authenticate,
  requireAdmin,
  adminRateLimit.approve,
  asyncHandler(async (req, res) => {
    const { id } = req.params
    const { status } = req.body
    
    const validStatuses = ['active', 'pending', 'blocked']
    
    if (!validStatuses.includes(status)) {
      throw createError.badRequest('Status inválido')
    }
    
    const result = await db.query(
      `UPDATE users 
       SET status = $1, updated_at = NOW() 
       WHERE id = $2 
       RETURNING id, name, email, status`,
      [status, id]
    )
    
    if (result.rows.length === 0) {
      throw createError.notFound('Usuário não encontrado')
    }
    
    res.json({
      success: true,
      user: result.rows[0],
      message: `Status atualizado para ${status}`
    })
  })
)

/**
 * GET /api/admin/channels
 * Lista canais para aprovação
 */
router.get('/channels',
  authenticate,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { status = 'pending', page = 1, limit = 50 } = req.query
    const offset = (parseInt(page) - 1) * parseInt(limit)
    
    const query = `
      SELECT 
        c.*,
        u.name as user_name,
        u.email as user_email,
        u.status as user_status
      FROM channels c
      JOIN users u ON c.user_id = u.id
      WHERE c.status = $1
      ORDER BY c.created_at DESC
      LIMIT $2 OFFSET $3
    `
    
    const [channelsResult, countResult] = await Promise.all([
      db.query(query, [status, parseInt(limit), offset]),
      db.query('SELECT COUNT(*) FROM channels WHERE status = $1', [status])
    ])
    
    res.json({
      success: true,
      channels: channelsResult.rows,
      pagination: {
        total: parseInt(countResult.rows[0].count),
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(countResult.rows[0].count / parseInt(limit))
      }
    })
  })
)

/**
 * PUT /api/admin/channels/:id/approve
 * Aprovar canal
 */
router.put('/channels/:id/approve',
  authenticate,
  requireAdmin,
  adminRateLimit.approve,
  asyncHandler(async (req, res) => {
    const { id } = req.params
    
    await db.transaction(async (client) => {
      // Aprovar canal
      const channel = await client.query(
        `UPDATE channels 
         SET status = 'active', updated_at = NOW() 
         WHERE id = $1 AND status = 'pending'
         RETURNING *`,
        [id]
      )
      
      if (channel.rows.length === 0) {
        throw createError.notFound('Canal não encontrado ou já processado')
      }
      
      // Registrar ação
      await client.query(
        `INSERT INTO admin_actions (admin_id, action, target_type, target_id, metadata)
         VALUES ($1, $2, $3, $4, $5)`,
        [req.user.id, 'approve_channel', 'channel', id, JSON.stringify(channel.rows[0])]
      )
    })
    
    res.json({
      success: true,
      message: 'Canal aprovado com sucesso'
    })
  })
)

/**
 * PUT /api/admin/channels/:id/reject
 * Rejeitar canal
 */
router.put('/channels/:id/reject',
  authenticate,
  requireAdmin,
  adminRateLimit.reject,
  asyncHandler(async (req, res) => {
    const { id } = req.params
    const { reason } = req.body
    
    await db.transaction(async (client) => {
      const channel = await client.query(
        `UPDATE channels 
         SET status = 'rejected', updated_at = NOW() 
         WHERE id = $1 AND status = 'pending'
         RETURNING *`,
        [id]
      )
      
      if (channel.rows.length === 0) {
        throw createError.notFound('Canal não encontrado ou já processado')
      }
      
      await client.query(
        `INSERT INTO admin_actions (admin_id, action, target_type, target_id, metadata)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          req.user.id, 
          'reject_channel', 
          'channel', 
          id, 
          JSON.stringify({ channel: channel.rows[0], reason })
        ]
      )
    })
    
    res.json({
      success: true,
      message: 'Canal rejeitado'
    })
  })
)

/**
 * POST /api/admin/bulk-action
 * Ações em massa
 */
router.post('/bulk-action',
  authenticate,
  requireAdmin,
  adminRateLimit.bulkAction,
  asyncHandler(async (req, res) => {
    const { action, targetType, ids } = req.body
    
    if (!Array.isArray(ids) || ids.length === 0) {
      throw createError.badRequest('IDs inválidos')
    }
    
    if (ids.length > 100) {
      throw createError.badRequest('Máximo de 100 itens por vez')
    }
    
    const validActions = ['approve', 'reject', 'delete', 'block']
    const validTargets = ['user', 'channel']
    
    if (!validActions.includes(action) || !validTargets.includes(targetType)) {
      throw createError.badRequest('Ação ou tipo inválido')
    }
    
    let affectedRows = 0
    
    await db.transaction(async (client) => {
      if (targetType === 'user') {
        const result = await client.query(
          `UPDATE users 
           SET status = $1, updated_at = NOW() 
           WHERE id = ANY($2::int[])`,
          [action === 'approve' ? 'active' : 'blocked', ids]
        )
        affectedRows = result.rowCount
      } else {
        const result = await client.query(
          `UPDATE channels 
           SET status = $1, updated_at = NOW() 
           WHERE id = ANY($2::int[])`,
          [action === 'approve' ? 'active' : 'rejected', ids]
        )
        affectedRows = result.rowCount
      }
      
      // Registrar ação em massa
      await client.query(
        `INSERT INTO admin_actions (admin_id, action, target_type, metadata)
         VALUES ($1, $2, $3, $4)`,
        [
          req.user.id,
          `bulk_${action}`,
          targetType,
          JSON.stringify({ ids, affectedRows })
        ]
      )
    })
    
    res.json({
      success: true,
      message: `${affectedRows} itens processados`,
      affectedRows
    })
  })
)

/**
 * GET /api/admin/logs
 * Logs de ações administrativas
 */
router.get('/logs',
  authenticate,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 100 } = req.query
    const offset = (parseInt(page) - 1) * parseInt(limit)
    
    const query = `
      SELECT 
        al.*,
        u.name as admin_name
      FROM admin_actions al
      JOIN users u ON al.admin_id = u.id
      ORDER BY al.created_at DESC
      LIMIT $1 OFFSET $2
    `
    
    const [logsResult, countResult] = await Promise.all([
      db.query(query, [parseInt(limit), offset]),
      db.query('SELECT COUNT(*) FROM admin_actions')
    ])
    
    res.json({
      success: true,
      logs: logsResult.rows,
      pagination: {
        total: parseInt(countResult.rows[0].count),
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(countResult.rows[0].count / parseInt(limit))
      }
    })
  })
)

// Tabela para ações admin (adicionar ao schema)
export const adminActionsSchema = `
  CREATE TABLE IF NOT EXISTS admin_actions (
    id SERIAL PRIMARY KEY,
    admin_id INTEGER REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    target_type VARCHAR(50),
    target_id INTEGER,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  
  CREATE INDEX idx_admin_actions_admin_id ON admin_actions(admin_id);
  CREATE INDEX idx_admin_actions_created_at ON admin_actions(created_at DESC);
`

export default router