import api, { apiHelpers } from './api'

// Serviço para gerenciar canais/grupos do Telegram
const channelsService = {
  /**
   * Listar canais com filtros
   * @param {Object} filters - Filtros opcionais
   * @param {string} filters.category - Categoria (universitarias, amadoras, etc)
   * @param {string} filters.state - Estado (SP, RJ, etc)
   * @param {string} filters.status - Status (active, pending, rejected)
   * @param {string} filters.order - Ordenação (popular, members, recent)
   * @param {boolean} filters.is_premium - Apenas premium
   * @param {number} filters.limit - Limite de resultados
   * @param {number} filters.offset - Offset para paginação
   * @returns {Promise} Lista de canais
   */
  async getChannels(filters = {}) {
    const response = await api.get('/channels', { params: filters })
    return response.data
  },

  /**
   * Buscar canal por ID
   * @param {number} channelId - ID do canal
   * @returns {Promise} Dados do canal
   */
  async getChannelById(channelId) {
    const response = await api.get(`/channels/${channelId}`)
    return response.data
  },

  /**
   * Criar novo canal (usuário comum)
   * @param {Object} channelData - Dados do canal
   * @param {string} channelData.name - Nome do canal
   * @param {string} channelData.link - Link do Telegram
   * @param {string} channelData.category - Categoria
   * @param {string} channelData.state - Estado (opcional)
   * @param {string} channelData.description - Descrição
   * @param {File} channelData.image - Imagem (opcional)
   * @param {boolean} channelData.is_premium - É premium?
   * @param {string} channelData.bot_link - Link do bot (se premium)
   * @returns {Promise} Canal criado
   */
  async createChannel(channelData) {
    // Se tiver imagem, faz upload primeiro
    let imageUrl = null
    if (channelData.image instanceof File) {
      const uploadResponse = await apiHelpers.uploadFile(
        '/upload/channel-image', 
        channelData.image
      )
      imageUrl = uploadResponse.data.url
    }

    // Cria o canal
    const response = await api.post('/channels', {
      ...channelData,
      image_url: imageUrl,
    })
    
    return response.data
  },

  /**
   * Atualizar canal
   * @param {number} channelId - ID do canal
   * @param {Object} updateData - Dados para atualizar
   * @returns {Promise} Canal atualizado
   */
  async updateChannel(channelId, updateData) {
    const response = await api.put(`/channels/${channelId}`, updateData)
    return response.data
  },

  /**
   * Deletar canal
   * @param {number} channelId - ID do canal
   * @returns {Promise} Confirmação
   */
  async deleteChannel(channelId) {
    const response = await api.delete(`/channels/${channelId}`)
    return response.data
  },

  /**
   * Incrementar cliques do canal
   * @param {number} channelId - ID do canal
   * @returns {Promise} Novo total de cliques
   */
  async trackClick(channelId) {
    const response = await api.post(`/channels/${channelId}/click`)
    return response.data
  },

  /**
   * Buscar canais do usuário atual
   * @returns {Promise} Lista de canais do usuário
   */
  async getMyChannels() {
    const response = await api.get('/channels/my-channels')
    return response.data
  },

  /**
   * Buscar métricas de um canal
   * @param {number} channelId - ID do canal
   * @param {string} period - Período (7d, 30d, 90d, all)
   * @returns {Promise} Métricas do canal
   */
  async getChannelMetrics(channelId, period = '30d') {
    const response = await api.get(`/channels/${channelId}/metrics`, {
      params: { period }
    })
    return response.data
  },

  /**
   * Buscar ranking de canais
   * @param {string} period - Período (weekly, monthly, quarterly, yearly, all)
   * @param {number} limit - Limite de resultados
   * @returns {Promise} Lista ranqueada
   */
  async getRanking(period = 'all', limit = 50) {
    const response = await api.get('/channels/ranking', {
      params: { period, limit }
    })
    return response.data
  },

  /**
   * Buscar canais novos (novidades)
   * @param {number} limit - Limite de resultados
   * @returns {Promise} Lista de canais novos
   */
  async getNewChannels(limit = 20) {
    const response = await api.get('/channels/new', {
      params: { limit }
    })
    return response.data
  },

  /**
   * Buscar canais populares
   * @param {number} limit - Limite de resultados
   * @returns {Promise} Lista de canais populares
   */
  async getPopularChannels(limit = 20) {
    const response = await api.get('/channels/popular', {
      params: { limit }
    })
    return response.data
  },

  /**
   * Buscar canais premium
   * @param {number} limit - Limite de resultados
   * @returns {Promise} Lista de canais premium
   */
  async getPremiumChannels(limit = 20) {
    const response = await api.get('/channels/premium', {
      params: { limit }
    })
    return response.data
  },

  /**
   * Buscar categorias disponíveis
   * @returns {Promise} Lista de categorias
   */
  async getCategories() {
    const response = await api.get('/channels/categories')
    return response.data
  },

  /**
   * Buscar estados disponíveis
   * @returns {Promise} Lista de estados
   */
  async getStates() {
    const response = await api.get('/channels/states')
    return response.data
  },
}

export default channelsService