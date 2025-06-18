import api from './api'

// Serviço exclusivo para funções administrativas
const adminService = {
  /**
   * Dashboard - Estatísticas gerais
   * @returns {Promise} Estatísticas do sistema
   */
  async getDashboardStats() {
    const response = await api.get('/admin/dashboard')
    return response.data
  },

  /**
   * Listar usuários com filtros
   * @param {Object} filters - Filtros
   * @param {string} filters.status - Status (pending, active, blocked)
   * @param {string} filters.role - Role (user, admin)
   * @param {string} filters.search - Busca por nome/email
   * @param {number} filters.page - Página
   * @param {number} filters.limit - Itens por página
   * @returns {Promise} Lista paginada de usuários
   */
  async getUsers(filters = {}) {
    const response = await api.get('/admin/users', { params: filters })
    return response.data
  },

  /**
   * Aprovar usuário
   * @param {number} userId - ID do usuário
   * @returns {Promise} Usuário atualizado
   */
  async approveUser(userId) {
    const response = await api.put(`/admin/users/${userId}/approve`)
    return response.data
  },

  /**
   * Rejeitar usuário
   * @param {number} userId - ID do usuário
   * @param {string} reason - Motivo da rejeição
   * @returns {Promise} Usuário atualizado
   */
  async rejectUser(userId, reason) {
    const response = await api.put(`/admin/users/${userId}/reject`, { reason })
    return response.data
  },

  /**
   * Bloquear/Desbloquear usuário
   * @param {number} userId - ID do usuário
   * @param {boolean} blocked - Bloquear ou desbloquear
   * @returns {Promise} Usuário atualizado
   */
  async toggleUserBlock(userId, blocked) {
    const response = await api.put(`/admin/users/${userId}/block`, { blocked })
    return response.data
  },

  /**
   * Deletar usuário permanentemente
   * @param {number} userId - ID do usuário
   * @returns {Promise} Confirmação
   */
  async deleteUser(userId) {
    const response = await api.delete(`/admin/users/${userId}`)
    return response.data
  },

  /**
   * Listar canais pendentes de aprovação
   * @param {Object} filters - Filtros
   * @returns {Promise} Lista de canais pendentes
   */
  async getPendingChannels(filters = {}) {
    const response = await api.get('/admin/channels/pending', { params: filters })
    return response.data
  },

  /**
   * Aprovar canal
   * @param {number} channelId - ID do canal
   * @returns {Promise} Canal atualizado
   */
  async approveChannel(channelId) {
    const response = await api.put(`/admin/channels/${channelId}/approve`)
    return response.data
  },

  /**
   * Rejeitar canal
   * @param {number} channelId - ID do canal
   * @param {string} reason - Motivo da rejeição
   * @returns {Promise} Canal atualizado
   */
  async rejectChannel(channelId, reason) {
    const response = await api.put(`/admin/channels/${channelId}/reject`, { reason })
    return response.data
  },

  /**
   * Atualizar status de canal
   * @param {number} channelId - ID do canal
   * @param {string} status - Novo status
   * @returns {Promise} Canal atualizado
   */
  async updateChannelStatus(channelId, status) {
    const response = await api.put(`/admin/channels/${channelId}/status`, { status })
    return response.data
  },

  /**
   * Deletar canal permanentemente
   * @param {number} channelId - ID do canal
   * @returns {Promise} Confirmação
   */
  async deleteChannel(channelId) {
    const response = await api.delete(`/admin/channels/${channelId}`)
    return response.data
  },

  /**
   * Estatísticas detalhadas
   * @param {string} type - Tipo (users, channels, visits, revenue)
   * @param {string} period - Período (7d, 30d, 90d, 1y)
   * @returns {Promise} Estatísticas detalhadas
   */
  async getDetailedStats(type, period = '30d') {
    const response = await api.get('/admin/stats/detailed', {
      params: { type, period }
    })
    return response.data
  },

  /**
   * Logs de atividades
   * @param {Object} filters - Filtros
   * @param {string} filters.type - Tipo de log
   * @param {string} filters.user_id - ID do usuário
   * @param {Date} filters.start_date - Data inicial
   * @param {Date} filters.end_date - Data final
   * @returns {Promise} Lista de logs
   */
  async getActivityLogs(filters = {}) {
    const response = await api.get('/admin/logs', { params: filters })
    return response.data
  },

  /**
   * Exportar dados
   * @param {string} type - Tipo (users, channels, all)
   * @param {string} format - Formato (csv, json, xlsx)
   * @returns {Promise} Download do arquivo
   */
  async exportData(type, format = 'csv') {
    await apiHelpers.downloadFile(
      `/admin/export?type=${type}&format=${format}`,
      `export_${type}_${new Date().toISOString().split('T')[0]}.${format}`
    )
  },

  /**
   * Configurações do sistema
   * @returns {Promise} Configurações atuais
   */
  async getSettings() {
    const response = await api.get('/admin/settings')
    return response.data
  },

  /**
   * Atualizar configurações
   * @param {Object} settings - Novas configurações
   * @returns {Promise} Configurações atualizadas
   */
  async updateSettings(settings) {
    const response = await api.put('/admin/settings', settings)
    return response.data
  },

  /**
   * Enviar notificação global
   * @param {Object} notification - Dados da notificação
   * @param {string} notification.title - Título
   * @param {string} notification.message - Mensagem
   * @param {string} notification.type - Tipo (info, warning, success)
   * @param {Array} notification.target - Alvos (all, users, admins)
   * @returns {Promise} Confirmação
   */
  async sendNotification(notification) {
    const response = await api.post('/admin/notifications', notification)
    return response.data
  },

  /**
   * Estatísticas de performance do sistema
   * @returns {Promise} Métricas de performance
   */
  async getSystemHealth() {
    const response = await api.get('/admin/system/health')
    return response.data
  },
}

export default adminService