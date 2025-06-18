import db from '../database.js'
import { calculateLevel } from '../utils/levels.js'

class Channel {
  // Criar novo canal/grupo
  static async create(channelData) {
    const {
      name,
      link,
      telegram_id,
      category,
      state,
      description,
      image_url,
      user_id,
      is_premium = false,
      bot_link
    } = channelData

    try {
      const result = await db.query(
        `INSERT INTO channels 
         (name, link, telegram_id, category, state, description, 
          image_url, user_id, is_premium, bot_link, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING *`,
        [
          name, link, telegram_id, category, state, description,
          image_url, user_id, is_premium, bot_link, 'pending'
        ]
      )

      return result.rows[0]
    } catch (error) {
      if (error.code === '23505') {
        throw new Error('Canal já cadastrado')
      }
      throw error
    }
  }

  // Buscar por ID
  static async findById(id) {
    const result = await db.query(
      `SELECT c.*, u.name as user_name, u.email as user_email
       FROM channels c
       JOIN users u ON c.user_id = u.id
       WHERE c.id = $1`,
      [id]
    )
    return result.rows[0]
  }

  // Listar canais (com filtros)
  static async list(filters = {}) {
    let query = `
      SELECT c.*, u.name as user_name
      FROM channels c
      JOIN users u ON c.user_id = u.id
      WHERE 1=1
    `
    
    const params = []
    let paramCount = 0

    // Filtros
    if (filters.status) {
      paramCount++
      query += ` AND c.status = $${paramCount}`
      params.push(filters.status)
    }

    if (filters.category) {
      paramCount++
      query += ` AND c.category = $${paramCount}`
      params.push(filters.category)
    }

    if (filters.state) {
      paramCount++
      query += ` AND c.state = $${paramCount}`
      params.push(filters.state)
    }

    if (filters.user_id) {
      paramCount++
      query += ` AND c.user_id = $${paramCount}`
      params.push(filters.user_id)
    }

    if (filters.is_premium !== undefined) {
      paramCount++
      query += ` AND c.is_premium = $${paramCount}`
      params.push(filters.is_premium)
    }

    // Ordenação
    if (filters.order === 'popular') {
      query += ` ORDER BY c.clicks DESC, c.views DESC`
    } else if (filters.order === 'members') {
      query += ` ORDER BY c.members DESC`
    } else if (filters.order === 'recent') {
      query += ` ORDER BY c.created_at DESC`
    } else {
      query += ` ORDER BY c.created_at DESC`
    }

    // Paginação
    if (filters.limit) {
      paramCount++
      query += ` LIMIT $${paramCount}`
      params.push(filters.limit)
    }

    if (filters.offset) {
      paramCount++
      query += ` OFFSET $${paramCount}`
      params.push(filters.offset)
    }

    const result = await db.query(query, params)
    
    // Adicionar nível a cada canal
    return result.rows.map(channel => ({
      ...channel,
      level: calculateLevel(channel.members)
    }))
  }

  // Atualizar status do canal
  static async updateStatus(channelId, status) {
    const result = await db.query(
      `UPDATE channels 
       SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [status, channelId]
    )
    return result.rows[0]
  }

  // Atualizar métricas
  static async updateMetrics(channelId, metrics) {
    const { members, views, entries, exits } = metrics
    
    const result = await db.query(
      `UPDATE channels 
       SET members = COALESCE($1, members),
           views = views + COALESCE($2, 0),
           entries = entries + COALESCE($3, 0),
           exits = exits + COALESCE($4, 0),
           last_updated = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING *`,
      [members, views, entries, exits, channelId]
    )
    
    // Atualizar nível
    const channel = result.rows[0]
    if (channel) {
      const level = calculateLevel(channel.members)
      await db.query(
        'UPDATE channels SET level = $1 WHERE id = $2',
        [level.name, channelId]
      )
    }
    
    return channel
  }

  // Incrementar cliques
  static async incrementClicks(channelId) {
    const result = await db.query(
      `UPDATE channels 
       SET clicks = clicks + 1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING clicks`,
      [channelId]
    )
    return result.rows[0]
  }

  // Incrementar visualizações
  static async incrementViews(channelId) {
    const result = await db.query(
      `UPDATE channels 
       SET views = views + 1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING views`,
      [channelId]
    )
    return result.rows[0]
  }

  // Buscar canais por usuário
  static async findByUserId(userId) {
    const result = await db.query(
      `SELECT *, 
        (SELECT COUNT(*) FROM metrics WHERE channel_id = channels.id) as metrics_count
       FROM channels 
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    )
    
    return result.rows.map(channel => ({
      ...channel,
      level: calculateLevel(channel.members)
    }))
  }

  // Ranking de canais
  static async getRanking(period = 'all', limit = 50) {
    let query = ''
    const params = [limit]
    
    if (period === 'weekly') {
      query = `
        SELECT c.*, u.name as user_name,
               COALESCE(SUM(m.members_gained), 0) as period_growth
        FROM channels c
        JOIN users u ON c.user_id = u.id
        LEFT JOIN metrics m ON c.id = m.channel_id 
          AND m.date >= CURRENT_DATE - INTERVAL '7 days'
        WHERE c.status = 'active'
        GROUP BY c.id, u.name
        ORDER BY period_growth DESC, c.members DESC
        LIMIT $1
      `
    } else if (period === 'monthly') {
      query = `
        SELECT c.*, u.name as user_name,
               COALESCE(SUM(m.members_gained), 0) as period_growth
        FROM channels c
        JOIN users u ON c.user_id = u.id
        LEFT JOIN metrics m ON c.id = m.channel_id 
          AND m.date >= CURRENT_DATE - INTERVAL '30 days'
        WHERE c.status = 'active'
        GROUP BY c.id, u.name
        ORDER BY period_growth DESC, c.members DESC
        LIMIT $1
      `
    } else if (period === 'quarterly') {
      query = `
        SELECT c.*, u.name as user_name,
               COALESCE(SUM(m.members_gained), 0) as period_growth
        FROM channels c
        JOIN users u ON c.user_id = u.id
        LEFT JOIN metrics m ON c.id = m.channel_id 
          AND m.date >= CURRENT_DATE - INTERVAL '90 days'
        WHERE c.status = 'active'
        GROUP BY c.id, u.name
        ORDER BY period_growth DESC, c.members DESC
        LIMIT $1
      `
    } else if (period === 'yearly') {
      query = `
        SELECT c.*, u.name as user_name,
               COALESCE(SUM(m.members_gained), 0) as period_growth
        FROM channels c
        JOIN users u ON c.user_id = u.id
        LEFT JOIN metrics m ON c.id = m.channel_id 
          AND m.date >= CURRENT_DATE - INTERVAL '365 days'
        WHERE c.status = 'active'
        GROUP BY c.id, u.name
        ORDER BY period_growth DESC, c.members DESC
        LIMIT $1
      `
    } else {
      // Todo período
      query = `
        SELECT c.*, u.name as user_name, c.members as period_growth
        FROM channels c
        JOIN users u ON c.user_id = u.id
        WHERE c.status = 'active'
        ORDER BY c.members DESC
        LIMIT $1
      `
    }
    
    const result = await db.query(query, params)
    
    return result.rows.map((channel, index) => ({
      ...channel,
      level: calculateLevel(channel.members),
      rank: index + 1
    }))
  }

  // Estatísticas globais
  static async getGlobalStats() {
    const result = await db.query(`
      SELECT 
        COUNT(DISTINCT c.id) as total_channels,
        COUNT(DISTINCT c.id) FILTER (WHERE c.status = 'active') as active_channels,
        COUNT(DISTINCT c.id) FILTER (WHERE c.is_premium = true) as premium_channels,
        COALESCE(SUM(c.members), 0) as total_members,
        COALESCE(SUM(c.views), 0) as total_views,
        COALESCE(SUM(c.clicks), 0) as total_clicks,
        COUNT(DISTINCT c.category) as total_categories,
        COUNT(DISTINCT c.state) as total_states
      FROM channels c
    `)
    
    return result.rows[0]
  }

  // Salvar métricas diárias
  static async saveMetrics(channelId, metrics) {
    const { members_gained, members_lost, total_views, unique_views } = metrics
    
    await db.query(
      `INSERT INTO metrics 
       (channel_id, date, members_gained, members_lost, total_views, unique_views)
       VALUES ($1, CURRENT_DATE, $2, $3, $4, $5)
       ON CONFLICT (channel_id, date) 
       DO UPDATE SET 
         members_gained = metrics.members_gained + EXCLUDED.members_gained,
         members_lost = metrics.members_lost + EXCLUDED.members_lost,
         total_views = metrics.total_views + EXCLUDED.total_views,
         unique_views = EXCLUDED.unique_views`,
      [channelId, members_gained || 0, members_lost || 0, total_views || 0, unique_views || 0]
    )
  }

  // Deletar canal
  static async delete(channelId) {
    const result = await db.query(
      'DELETE FROM channels WHERE id = $1 RETURNING id',
      [channelId]
    )
    return result.rows[0]
  }

  // Buscar canais novos (novidades)
  static async getNewChannels(limit = 20) {
    const result = await db.query(
      `SELECT c.*, u.name as user_name
       FROM channels c
       JOIN users u ON c.user_id = u.id
       WHERE c.status = 'active'
         AND c.created_at >= CURRENT_DATE - INTERVAL '7 days'
       ORDER BY c.created_at DESC
       LIMIT $1`,
      [limit]
    )
    
    return result.rows.map(channel => ({
      ...channel,
      level: calculateLevel(channel.members)
    }))
  }

  // Buscar canais populares
  static async getPopularChannels(limit = 20) {
    const result = await db.query(
      `SELECT c.*, u.name as user_name,
              (c.clicks * 0.5 + c.views * 0.3 + c.members * 0.2) as popularity_score
       FROM channels c
       JOIN users u ON c.user_id = u.id
       WHERE c.status = 'active'
       ORDER BY popularity_score DESC
       LIMIT $1`,
      [limit]
    )
    
    return result.rows.map(channel => ({
      ...channel,
      level: calculateLevel(channel.members)
    }))
  }

  // Buscar canais premium
  static async getPremiumChannels(limit = 20) {
    const result = await db.query(
      `SELECT c.*, u.name as user_name
       FROM channels c
       JOIN users u ON c.user_id = u.id
       WHERE c.status = 'active' AND c.is_premium = true
       ORDER BY c.members DESC
       LIMIT $1`,
      [limit]
    )
    
    return result.rows.map(channel => ({
      ...channel,
      level: calculateLevel(channel.members)
    }))
  }
}

export default Channel