import api from './api'

// Serviço de autenticação - cuida de login, registro, etc.
const authService = {
  /**
   * Login do usuário
   * @param {string} email - Email do usuário
   * @param {string} password - Senha do usuário
   * @returns {Promise} Dados do usuário e token
   */
  async login(email, password) {
    const response = await api.post('/auth/login', {
      email,
      password,
    })
    return response.data
  },

  /**
   * Registro de novo usuário
   * @param {Object} userData - Dados do usuário
   * @param {string} userData.name - Nome completo
   * @param {string} userData.email - Email
   * @param {string} userData.password - Senha
   * @returns {Promise} Dados do usuário criado
   */
  async register(userData) {
    const response = await api.post('/auth/register', userData)
    return response.data
  },

  /**
   * Verificar código de acesso (6 dígitos)
   * @param {string} code - Código de acesso
   * @param {string} type - Tipo: 'user' ou 'admin'
   * @returns {Promise} Resultado da verificação
   */
  async verifyAccessCode(code, type = 'user') {
    const response = await api.post('/auth/verify-code', {
      code,
      type,
    })
    return response.data
  },

  /**
   * Buscar perfil do usuário atual
   * @returns {Promise} Dados do perfil
   */
  async getProfile() {
    const response = await api.get('/auth/profile')
    return response.data
  },

  /**
   * Atualizar perfil do usuário
   * @param {Object} profileData - Dados para atualizar
   * @param {string} profileData.name - Nome
   * @param {string} profileData.username - Username
   * @param {File} profileData.avatar - Arquivo de imagem
   * @returns {Promise} Perfil atualizado
   */
  async updateProfile(profileData) {
    // Se tiver avatar, faz upload separado
    let avatarUrl = null
    if (profileData.avatar instanceof File) {
      const uploadResponse = await api.uploadFile('/upload/avatar', profileData.avatar)
      avatarUrl = uploadResponse.data.url
    }

    // Atualiza o perfil
    const response = await api.put('/auth/profile', {
      name: profileData.name,
      username: profileData.username,
      avatar_url: avatarUrl || profileData.avatar_url,
    })
    
    return response.data
  },

  /**
   * Alterar senha
   * @param {string} currentPassword - Senha atual
   * @param {string} newPassword - Nova senha
   * @returns {Promise} Resultado
   */
  async changePassword(currentPassword, newPassword) {
    const response = await api.put('/auth/change-password', {
      currentPassword,
      newPassword,
    })
    return response.data
  },

  /**
   * Recuperar senha (esqueci minha senha)
   * @param {string} email - Email do usuário
   * @param {string} accessCode - Código de acesso
   * @returns {Promise} Resultado
   */
  async forgotPassword(email, accessCode) {
    const response = await api.post('/auth/forgot-password', {
      email,
      accessCode,
    })
    return response.data
  },

  /**
   * Resetar senha com token
   * @param {string} token - Token recebido por email
   * @param {string} newPassword - Nova senha
   * @returns {Promise} Resultado
   */
  async resetPassword(token, newPassword) {
    const response = await api.post('/auth/reset-password', {
      token,
      newPassword,
    })
    return response.data
  },

  /**
   * Validar token JWT
   * @returns {Promise<boolean>} Token é válido?
   */
  async validateToken() {
    try {
      await api.get('/auth/validate')
      return true
    } catch {
      return false
    }
  },

  /**
   * Logout (apenas local)
   * Remove token e dados do localStorage
   */
  logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    delete api.defaults.headers.common['Authorization']
  },
}

export default authService