/**
 * Rotas de Canais/Grupos
 * Implementa CRUD completo com filtros, cache e otimizações
 */

import express from 'express'
import { asyncHandler, createError } from '../middleware/errorHandler.js'
import { authenticate, optionalAuth } from '../middleware/auth.js'
import { channelsRateLimiter } from '../middleware/rateLimiter.js'
import db from '../database.js'

const router = express.Router()

// Cache em memória para queries frequentes
class ChannelCache {
  constructor(ttl = 60000) { // 1 minuto
    this.cache = new Map()
    this.ttl = ttl
  }
  
  generateKey(params) {
    return JSON.stringify(params, Object.keys(params).sort())
  }
  
  get(params) {
    const key = this.generateKey(params)
    const item = this.cache.get(key)
    
    if (!item || Date.now() > item.expires) {
      this.cache.delete(key)
      return null
    }
    
    return item.data
  }
  
  set(params, data) {
    const key = this.generateKey(params)
    this.cache.set(key, {
      data,
      expires: Date.now() + this.ttl
    })
  }
  
  invalidate() {
    this.cache.clear()
  }
}

const channelCache = new ChannelCache()

/**
 * Calcula nível baseado em membros
 */
const calculateLevel = (members) => {
  if (members >= 50000) return 'legendary'
  if (members >= 20000) return 'master'
  if (members >= 7000) return 'veteran'
  if (members >= 3000) return 'medium'
  return 'beginner'
}

/**
 * GET /api/channels
 * Lista canais com filtros avançados
 */
router.get('/',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const {
      category,
      state,
      level,
      search,
      premium,
      sort = 'members',
      order = 'desc',
      page = 1,
      limit = 20
    } = req.query
    
    // Parâmetros de cache
    const cacheParams = { category, state, level, search, premium, sort, order, page, limit }
    const cached = channelCache.get(cacheParams)
    
    if (cached && !req.user) { // Só usa cache para visitantes
      return res.json(cached)
    }
    
    // Validações
    const validSorts = ['members', 'views', 'created_at', 'updated_at']
    const validOrders = ['asc', 'desc']
    
    if (!validSorts.includes(sort)) {
      throw createError.badRequest('Ordenação inválida')
    }
    
    if (!validOrders.includes(order)) {
      throw createError.badRequest('Ordem inválida')
    }
    
    const offset = (parseInt(page) - 1) * parseInt(limit)
    
    // Query otimizada com índices
    let query = `
      SELECT 
        c.id,
        c.name,
        c.link,
        c.category,
        c.state,
        c.description,
        c.image_url,
        c.members,
        c.views,
        c.level,
        c.is_premium,
        c.created_at,
        u.name as user_name,
        u.username
      FROM channels c
      JOIN users u ON c.user_id = u.id
      WHERE c.status = 'active'
    `
    
    const params = []
    let paramCount = 0
    
    // Filtros dinâmicos
    if (category) {
      params.push(category)
      query += ` AND c.category = $${++paramCount}`
    }
    
    if (state) {
      params.push(state)
      query += ` AND c.state = $${++paramCount}`
    }
    
    if (level) {
      params.push(level)
      query += ` AND c.level = $${++paramCount}`
    }
    
    if (premium !== undefined) {
      params.push(premium === 'true')
      query += ` AND c.is_premium = $${++paramCount}`
    }
    
    if (search) {
      params.push(`%${search}%`)
      query += ` AND (c.name ILIKE $${++paramCount} OR c.description ILIKE $${paramCount})`
    }
    
    // Ordenação com índice
    query += ` ORDER BY c.${sort} ${order.toUpperCase()}`
    
    // Paginação
    params.push(parseInt(limit))
    query += ` LIMIT $${++paramCount}`
    params.push(offset)
    query += ` OFFSET $${++paramCount}`
    
    // Query para contagem total
    let countQuery = `
      SELECT COUNT(*) as total
      FROM channels c
      WHERE c.status = 'active'
    `
    
    // Aplicar mesmos filtros na contagem
    const countParams = params.slice(0, -2) // Remove limit e offset
    
    if (category) countQuery += ` AND c.category = $1`
    if (state) countQuery += ` AND c.state = $${category ? 2 : 1}`
    // ... aplicar outros filtros
    
    // Executar queries em paralelo
    const [channelsResult, countResult] = await Promise.all([
      db.query(query, params),
      db.query(countQuery, countParams)
    ])
    
    const channels = channelsResult.rows.map(channel => ({
      ...channel,
      views: channel.views + 1 // Incrementa view
    }))
    
    // Atualizar views de forma assíncrona (não bloqueia resposta)
    if (channels.length > 0) {
      const channelIds = channels.map(c => c.id)
      db.query(
        `UPDATE channels 
         SET views = views + 1 
         WHERE id = ANY($1::int[])`,
        [channelIds]
      ).catch(console.error)
    }
    
    const response = {
      success: true,
      channels,
      pagination: {
        total: parseInt(countResult.rows[0].total),
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(countResult.rows[0].total / parseInt(limit))
      }
    }
    
    // Cachear resposta
    if (!req.user) {
      channelCache.set(cacheParams, response)
    }
    
    res.json(response)
  })
)

/**
 * GET /api/channels/categories
 * Lista categorias disponíveis com contadores
 */
router.get('/categories',
  asyncHandler(async (req, res) => {
    const cached = channelCache.get({ type: 'categories' })
    
    if (cached) {
      return res.json(cached)
    }
    
    const query = `
      SELECT 
        cat.name,
        cat.slug,
        cat.icon,
        cat.description,
        COUNT(c.id) as channel_count,
        COALESCE(SUM(c.members), 0) as total_members
      FROM categories cat
      LEFT JOIN channels c ON cat.slug = c.category AND c.status = 'active'
      WHERE cat.is_active = true
      GROUP BY cat.id, cat.name, cat.slug, cat.icon, cat.description, cat.order_index
      ORDER BY cat.order_index, cat.name
    `
    
    const result = await db.query(query)
    
    const response = {
      success: true,
      categories: result.rows.map(cat => ({
        name: cat.name,
        slug: cat.slug,
        icon: cat.icon,
        description: cat.description,
        channelCount: parseInt(cat.channel_count),
        totalMembers: parseInt(cat.total_members)
      }))
    }
    
    channelCache.set({ type: 'categories' }, response)
    
    res.json(response)
  })
)

/**
 * GET /api/channels/states
 * Lista estados com canais
 */
router.get('/states',
  asyncHandler(async (req, res) => {
    const cached = channelCache.get({ type: 'states' })
    
    if (cached) {
      return res.json(cached)
    }
    
    const query = `
      SELECT 
        state,
        COUNT(*) as channel_count
      FROM channels
      WHERE status = 'active' AND state IS NOT NULL
      GROUP BY state
      ORDER BY channel_count DESC
    `
    
    const result = await db.query(query)
    
    const response = {
      success: true,
      states: result.rows
    }
    
    channelCache.set({ type: 'states' }, response)
    
    res.json(response)
  })
)

/**
 * GET /api/channels/:id
 * Detalhes do canal
 */
router.get('/:id',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const { id } = req.params
    
    const query = `
      SELECT 
        c.*,
        u.name as user_name,
        u.username,
        u.avatar_url as user_avatar
      FROM channels c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = $1 AND c.status = 'active'
    `
    
    const result = await db.query(query, [id])
    
    if (result.rows.length === 0) {
      throw createError.notFound('Canal não encontrado')
    }
    
    const channel = result.rows[0]
    
    // Incrementar cliques
    await db.query(
      'UPDATE channels SET clicks = clicks + 1 WHERE id = $1',
      [id]
    )
    
    res.json({
      success: true,
      channel: {
        ...channel,
        clicks: channel.clicks + 1
      }
    })
  })
)

/**
 * POST /api/channels
 * Criar novo canal
 */
router.post('/',
  authenticate,
  channelsRateLimiter,
  asyncHandler(async (req, res) => {
    const {
      name,
      link,
      category,
      state,
      description,
      imageUrl,
      isPremium,
      botLink
    } = req.body
    
    // Validações
    if (!name || name.length < 3) {
      throw createError.badRequest('Nome deve ter pelo menos 3 caracteres')
    }
    
    if (!link || !link.includes('t.me/')) {
      throw createError.badRequest('Link do Telegram inválido')
    }
    
    if (!category) {
      throw createError.badRequest('Categoria é obrigatória')
    }
    
    // Verificar categoria válida
    const categoryCheck = await db.query(
      'SELECT id FROM categories WHERE slug = $1 AND is_active = true',
      [category]
    )
    
    if (categoryCheck.rows.length === 0) {
      throw createError.badRequest('Categoria inválida')
    }
    
    // Verificar limite de canais do usuário
    const userChannels = await db.query(
      'SELECT COUNT(*) as total FROM channels WHERE user_id = $1',
      [req.user.id]
    )
    
    const maxChannels = req.user.isAdmin ? 100 : 10
    
    if (parseInt(userChannels.rows[0].total) >= maxChannels) {
      throw createError.badRequest(`Limite de ${maxChannels} canais atingido`)
    }
    
    // Extrair ID do Telegram do link
    const telegramId = link.match(/t\.me\/([a-zA-Z0-9_]+)/)?.[1] || null
    
    // Criar canal
    const result = await db.query(
      `INSERT INTO channels 
       (name, link, telegram_id, category, state, description, image_url, 
        user_id, is_premium, bot_link, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        name.trim(),
        link,
        telegramId,
        category,
        state || null,
        description?.trim() || null,
        imageUrl || null,
        req.user.id,
        isPremium || false,
        botLink || null,
        'pending'
      ]
    )
    
    const newChannel = result.rows[0]
    
    // Invalidar cache
    channelCache.invalidate()
    
    res.status(201).json({
      success: true,
      message: 'Canal criado com sucesso. Aguarde aprovação.',
      channel: newChannel
    })
  })
)

/**
 * PUT /api/channels/:id
 * Atualizar canal
 */
router.put('/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const { id } = req.params
    const updates = req.body
    
    // Verificar propriedade
    const ownership = await db.query(
      'SELECT user_id FROM channels WHERE id = $1',
      [id]
    )
    
    if (ownership.rows.length === 0) {
      throw createError.notFound('Canal não encontrado')
    }
    
    if (ownership.rows[0].user_id !== req.user.id && !req.user.isAdmin) {
      throw createError.forbidden('Sem permissão para editar este canal')
    }
    
    // Campos permitidos para atualização
    const allowedFields = [
      'name', 'description', 'image_url', 'state', 'bot_link'
    ]
    
    const updateFields = []
    const updateValues = []
    let paramCount = 1
    
    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key) && value !== undefined) {
        updateFields.push(`${key} = $${paramCount++}`)
        updateValues.push(value)
      }
    }
    
    if (updateFields.length === 0) {
      throw createError.badRequest('Nenhum campo válido para atualizar')
    }
    
    updateValues.push(id)
    
    const query = `
      UPDATE channels 
      SET ${updateFields.join(', ')}, updated_at = NOW()
      WHERE id = $${paramCount}
      RETURNING *
    `
    
    const result = await db.query(query, updateValues)
    
    // Invalidar cache
    channelCache.invalidate()
    
    res.json({
      success: true,
      channel: result.rows[0]
    })
  })
)

/**
 * DELETE /api/channels/:id
 * Excluir canal
 */
router.delete('/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const { id } = req.params
    
    // Verificar propriedade
    const ownership = await db.query(
      'SELECT user_id FROM channels WHERE id = $1',
      [id]
    )
    
    if (ownership.rows.length === 0) {
      throw createError.notFound('Canal não encontrado')
    }
    
    if (ownership.rows[0].user_id !== req.user.id && !req.user.isAdmin) {
      throw createError.forbidden('Sem permissão para excluir este canal')
    }
    
    await db.query('DELETE FROM channels WHERE id = $1', [id])
    
    // Invalidar cache
    channelCache.invalidate()
    
    res.json({
      success: true,
      message: 'Canal excluído com sucesso'
    })
  })
)

/**
 * GET /api/channels/user/:userId
 * Canais de um usuário específico
 */
router.get('/user/:userId',
  asyncHandler(async (req, res) => {
    const { userId } = req.params
    
    const query = `
      SELECT 
        c.*,
        calculate_channel_level(c.members) as calculated_level
      FROM channels c
      WHERE c.user_id = $1 AND c.status = 'active'
      ORDER BY c.members DESC
    `
    
    const result = await db.query(query, [userId])
    
    res.json({
      success: true,
      channels: result.rows
    })
  })
)

/**
 * POST /api/channels/:id/metrics
 * Atualizar métricas do canal (webhook Telegram)
 */
router.post('/:id/metrics',
  asyncHandler(async (req, res) => {
    const { id } = req.params
    const { members, entries, exits, secret } = req.body
    
    // Verificar secret para segurança
    if (secret !== process.env.WEBHOOK_SECRET) {
      throw createError.unauthorized('Secret inválido')
    }
    
    // Atualizar métricas
    await db.query(
      `UPDATE channels 
       SET members = $1, 
           entries = entries + $2, 
           exits = exits + $3,
           level = calculate_channel_level($1),
           last_updated = NOW()
       WHERE id = $4`,
      [members, entries || 0, exits || 0, id]
    )
    
    // Registrar métricas diárias
    await db.query(
      `INSERT INTO metrics (channel_id, date, members_gained, members_lost)
       VALUES ($1, CURRENT_DATE, $2, $3)
       ON CONFLICT (channel_id, date) 
       DO UPDATE SET 
         members_gained = metrics.members_gained + $2,
         members_lost = metrics.members_lost + $3`,
      [id, entries || 0, exits || 0]
    )
    
    // Invalidar cache
    channelCache.invalidate()
    
    res.json({ success: true })
  })
)

export default router