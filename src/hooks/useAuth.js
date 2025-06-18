import { useContext } from 'react'
import { AuthContext } from '../context/AuthContext'

/**
 * Hook customizado para autenticação
 * 
 * Como usar:
 * const { user, login, logout } = useAuth()
 * 
 * O que retorna:
 * - user: dados do usuário logado (ou null)
 * - isLoading: está carregando?
 * - isAuthenticated: está logado?
 * - isAdmin: é administrador?
 * - login: função para fazer login
 * - register: função para criar conta
 * - logout: função para sair
 * - updateProfile: função para atualizar perfil
 * - changePassword: função para trocar senha
 * - forgotPassword: função para recuperar senha
 */
export function useAuth() {
  // Pega o contexto de autenticação
  const context = useContext(AuthContext)
  
  // Se não tiver contexto, algo está errado!
  if (!context) {
    throw new Error(
      'useAuth deve ser usado dentro de um AuthProvider. ' +
      'Certifique-se de que seu componente está dentro do <AuthProvider>'
    )
  }
  
  return context
}

// Exporta também funções auxiliares úteis

/**
 * Verifica se usuário tem permissão específica
 * @param {Object} user - Usuário atual
 * @param {string} permission - Permissão necessária
 * @returns {boolean} Tem permissão?
 */
export function hasPermission(user, permission) {
  if (!user) return false
  
  // Admin tem todas as permissões
  if (user.role === 'admin') return true
  
  // Mapeamento de permissões por role
  const permissions = {
    user: [
      'channels.create',
      'channels.edit.own',
      'channels.delete.own',
      'profile.edit',
      'ranking.view',
    ],
    moderator: [
      'channels.create',
      'channels.edit.own',
      'channels.edit.others',
      'channels.delete.own',
      'profile.edit',
      'ranking.view',
      'reports.view',
    ],
    admin: ['*'], // Todas as permissões
  }
  
  const userPermissions = permissions[user.role] || []
  
  // Se tem wildcard (*), tem todas as permissões
  if (userPermissions.includes('*')) return true
  
  // Verifica se tem a permissão específica
  return userPermissions.includes(permission)
}

/**
 * Hook para verificar se está carregando a autenticação inicial
 * Útil para mostrar splash screen ou loading
 */
export function useAuthLoading() {
  const { isLoading } = useAuth()
  return isLoading
}

/**
 * Hook para pegar apenas o usuário atual
 * Útil quando você só precisa dos dados do usuário
 */
export function useCurrentUser() {
  const { user } = useAuth()
  return user
}

/**
 * Hook para verificar se é admin
 * Útil para mostrar/esconder elementos admin
 */
export function useIsAdmin() {
  const { isAdmin } = useAuth()
  return isAdmin
}