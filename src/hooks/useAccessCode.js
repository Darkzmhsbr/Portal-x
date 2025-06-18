import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import authService from '../services/auth'

/**
 * Hook para gerenciar código de acesso de 6 dígitos
 * 
 * Este hook é como um "porteiro digital" que verifica se o usuário
 * tem permissão para acessar páginas especiais (login, register, admin)
 * 
 * Códigos:
 * - Usuários: 492571
 * - Admin: 926357
 */
export function useAccessCode() {
  const [hasValidCode, setHasValidCode] = useState(false)
  const [isCheckingCode, setIsCheckingCode] = useState(true)
  const [codeType, setCodeType] = useState(null) // 'user' ou 'admin'
  const navigate = useNavigate()

  // Verifica se já tem código válido salvo
  useEffect(() => {
    checkStoredCode()
  }, [])

  // Função para verificar código armazenado
  const checkStoredCode = () => {
    try {
      // BYPASS PARA DESENVOLVIMENTO
      const isDev = import.meta.env.DEV
      const bypassCode = localStorage.getItem('dev_bypass_code')
      
      if (isDev && bypassCode === 'true') {
        const bypassType = localStorage.getItem('dev_code_type') || 'user'
        setHasValidCode(true)
        setCodeType(bypassType)
        setIsCheckingCode(false)
        return
      }
      
      // Verificação normal para produção
      const userCodeVerified = localStorage.getItem('userCodeVerified') === 'true'
      const adminCodeVerified = localStorage.getItem('adminCodeVerified') === 'true'
      
      // Determina o tipo baseado na URL atual
      const isAdminRoute = window.location.pathname.includes('/admin')
      
      if (isAdminRoute && adminCodeVerified) {
        setHasValidCode(true)
        setCodeType('admin')
      } else if (!isAdminRoute && userCodeVerified) {
        setHasValidCode(true)
        setCodeType('user')
      }
    } catch (error) {
      console.error('Erro ao verificar código:', error)
    } finally {
      setIsCheckingCode(false)
    }
  }

  // Função para verificar se tem acesso válido para um tipo específico
  const hasValidAccess = useCallback((requiredType) => {
    // BYPASS PARA DESENVOLVIMENTO
    const isDev = import.meta.env.DEV
    const bypassCode = localStorage.getItem('dev_bypass_code')
    
    if (isDev && bypassCode === 'true') {
      return true;
    }
    
    // Verificação normal
    if (requiredType === 'admin') {
      return localStorage.getItem('adminCodeVerified') === 'true';
    } else {
      return localStorage.getItem('userCodeVerified') === 'true';
    }
  }, []);

  // Função para verificar código digitado
  const verifyCode = useCallback(async (code, type = 'user') => {
    try {
      setIsCheckingCode(true)
      
      // BYPASS PARA DESENVOLVIMENTO
      const isDev = import.meta.env.DEV
      
      if (isDev && (code === 'dev123' || localStorage.getItem('dev_bypass_code') === 'true')) {
        // Código especial de desenvolvimento
        localStorage.setItem('dev_bypass_code', 'true')
        localStorage.setItem('dev_code_type', type)
        
        // Também define os códigos normais para compatibilidade
        if (type === 'admin') {
          localStorage.setItem('adminCodeVerified', 'true')
        } else {
          localStorage.setItem('userCodeVerified', 'true')
        }
        
        setHasValidCode(true)
        setCodeType(type)
        
        toast.success('Modo de desenvolvimento ativado!')
        return { success: true }
      }
      
      // Verificação local normal
      const validCodes = {
        user: '492571',
        admin: '926357'
      }
      
      const isValid = code === validCodes[type]
      
      if (isValid) {
        // Salva no localStorage
        if (type === 'admin') {
          localStorage.setItem('adminCodeVerified', 'true')
        } else {
          localStorage.setItem('userCodeVerified', 'true')
        }
        
        setHasValidCode(true)
        setCodeType(type)
        
        toast.success('Código válido! Acesso liberado.')
        return { success: true }
      } else {
        toast.error('Código inválido. Tente novamente.')
        return { success: false }
      }
    } catch (error) {
      toast.error('Erro ao verificar código')
      return { success: false }
    } finally {
      setIsCheckingCode(false)
    }
  }, [])

  // Função para limpar código (logout ou reset)
  const clearCode = useCallback((type = 'all') => {
    if (type === 'all' || type === 'user') {
      localStorage.removeItem('userCodeVerified')
    }
    if (type === 'all' || type === 'admin') {
      localStorage.removeItem('adminCodeVerified')
    }
    
    setHasValidCode(false)
    setCodeType(null)
  }, [])

  return {
    hasValidCode,
    isCheckingCode,
    codeType,
    verifyCode,
    clearCode,
    checkStoredCode,
    hasValidAccess
  }
}

/**
 * Hook para criar modal de código de acesso
 * Útil para páginas que precisam verificar código antes de acessar
 */
export function useAccessCodeModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState(null)
  const { verifyCode } = useAccessCode()

  // Abre modal e guarda ação pendente
  const requestCode = useCallback((action, type = 'user') => {
    setPendingAction({ action, type })
    setIsOpen(true)
  }, [])

  // Verifica código e executa ação se válido
  const handleVerify = useCallback(async (code) => {
    if (!pendingAction) return

    const result = await verifyCode(code, pendingAction.type)
    
    if (result.success) {
      setIsOpen(false)
      // Executa a ação pendente
      if (typeof pendingAction.action === 'function') {
        pendingAction.action()
      }
      setPendingAction(null)
    }
    
    return result
  }, [pendingAction, verifyCode])

  // Cancela modal
  const cancel = useCallback(() => {
    setIsOpen(false)
    setPendingAction(null)
  }, [])

  return {
    isOpen,
    requestCode,
    handleVerify,
    cancel,
    codeType: pendingAction?.type
  }
}

/**
 * Hook para proteger componentes com código de acesso
 * @param {string} requiredType - Tipo de código necessário ('user' ou 'admin')
 */
export function useRequireAccessCode(requiredType = 'user') {
  const { hasValidCode, codeType, isCheckingCode } = useAccessCode()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isCheckingCode && !hasValidCode) {
      // Redireciona para home se não tiver código válido
      toast.error('Acesso negado. Código necessário.')
      navigate('/')
    } else if (!isCheckingCode && hasValidCode && codeType !== requiredType) {
      // Tem código mas é do tipo errado
      toast.error('Código inválido para esta página.')
      navigate('/')
    }
  }, [hasValidCode, codeType, requiredType, isCheckingCode, navigate])

  return { hasAccess: hasValidCode && codeType === requiredType }
}