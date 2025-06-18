import React, { createContext, useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../services/api'

// Criando o contexto de autenticação
export const AuthContext = createContext({})

// Provider que vai envolver toda a aplicação
export function AuthProvider({ children }) {
  // Estados do usuário e loading
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()

  // Função para carregar usuário do localStorage
  const loadUserFromStorage = useCallback(() => {
    try {
      const token = localStorage.getItem('token')
      const userData = localStorage.getItem('user')

      if (token && userData) {
        // Configura o token no header das requisições
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`
        
        // Restaura os dados do usuário
        setUser(JSON.parse(userData))
      }
    } catch (error) {
      console.error('Erro ao carregar usuário:', error)
      // Limpa dados corrompidos
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Carrega usuário ao montar o componente
  useEffect(() => {
    loadUserFromStorage()
  }, [loadUserFromStorage])

  // Função de login
  const login = useCallback(async (email, password) => {
    try {
      setIsLoading(true)
      
      // Faz a requisição de login
      const response = await api.post('/auth/login', { email, password })
      const { token, user: userData } = response.data

      // Salva token e usuário no localStorage
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(userData))
      
      // Configura o token para próximas requisições
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      
      // Atualiza o estado
      setUser(userData)
      
      // Mostra mensagem de sucesso
      toast.success(`Bem-vindo de volta, ${userData.name}!`)
      
      // Redireciona baseado no role
      if (userData.role === 'admin') {
        navigate('/admin')
      } else {
        navigate('/dashboard')
      }
      
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.message || 'Erro ao fazer login'
      toast.error(message)
      return { success: false, message }
    } finally {
      setIsLoading(false)
    }
  }, [navigate])

  // Função de registro
  const register = useCallback(async (userData) => {
    try {
      setIsLoading(true)
      
      // Faz a requisição de registro
      const response = await api.post('/auth/register', userData)
      
      // Mostra mensagem de sucesso
      toast.success('Conta criada com sucesso! Aguarde aprovação do administrador.')
      
      // Redireciona para login
      navigate('/login')
      
      return { success: true, data: response.data }
    } catch (error) {
      const message = error.response?.data?.message || 'Erro ao criar conta'
      toast.error(message)
      return { success: false, message }
    } finally {
      setIsLoading(false)
    }
  }, [navigate])

  // Função de logout
  const logout = useCallback(() => {
    // Limpa localStorage
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    
    // Remove token dos headers
    delete api.defaults.headers.common['Authorization']
    
    // Limpa estado
    setUser(null)
    
    // Mostra mensagem
    toast.success('Você saiu da sua conta')
    
    // Redireciona para home
    navigate('/')
  }, [navigate])

  // Função para atualizar perfil
  const updateProfile = useCallback(async (profileData) => {
    try {
      setIsLoading(true)
      
      // Faz a requisição de atualização
      const response = await api.put('/auth/profile', profileData)
      const updatedUser = response.data
      
      // Atualiza localStorage e estado
      localStorage.setItem('user', JSON.stringify(updatedUser))
      setUser(updatedUser)
      
      toast.success('Perfil atualizado com sucesso!')
      
      return { success: true, data: updatedUser }
    } catch (error) {
      const message = error.response?.data?.message || 'Erro ao atualizar perfil'
      toast.error(message)
      return { success: false, message }
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Função para alterar senha
  const changePassword = useCallback(async (currentPassword, newPassword) => {
    try {
      setIsLoading(true)
      
      await api.put('/auth/change-password', { currentPassword, newPassword })
      
      toast.success('Senha alterada com sucesso!')
      
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.message || 'Erro ao alterar senha'
      toast.error(message)
      return { success: false, message }
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Função para recuperar senha
  const forgotPassword = useCallback(async (email, accessCode) => {
    try {
      setIsLoading(true)
      
      await api.post('/auth/forgot-password', { email, accessCode })
      
      toast.success('Instruções enviadas! Verifique seu email.')
      
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.message || 'Erro ao recuperar senha'
      toast.error(message)
      return { success: false, message }
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Verificar se é admin
  const isAdmin = user?.role === 'admin'

  // Verificar se está autenticado
  const isAuthenticated = !!user

  // Valor do contexto
  const contextValue = {
    user,
    isLoading,
    isAuthenticated,
    isAdmin,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    forgotPassword,
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}
