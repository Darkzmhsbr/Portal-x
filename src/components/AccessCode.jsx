import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, Shield, CheckCircle, XCircle, Loader } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAccessCode } from '../hooks/useAccessCode'
import './AccessCode.css'

/**
 * Componente de Código de Acesso
 * 
 * Funciona como um "cofre digital" com 6 dígitos.
 * Cada tipo de usuário tem seu código:
 * - Usuários: 492571
 * - Admin: 926357
 * 
 * É como o código PIN do seu cartão, mas mais bonito! 😊
 */
const AccessCode = ({ 
  type = 'user', // 'user' ou 'admin'
  onSuccess, 
  onCancel,
  title,
  message 
}) => {
  // Estado para cada dígito do código
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [isVerifying, setIsVerifying] = useState(false)
  const [error, setError] = useState(false)
  const [success, setSuccess] = useState(false)
  
  // Refs para cada input (para navegação automática)
  const inputRefs = [
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null)
  ]

  // Hook customizado para verificar código
  const { verifyCode } = useAccessCode()

  // Foca no primeiro input quando o componente monta
  useEffect(() => {
    inputRefs[0].current?.focus()
  }, [])

  // Títulos e mensagens padrão baseados no tipo
  const defaultTitle = type === 'admin' 
    ? '🛡️ Área Administrativa'
    : '🔐 Área Restrita'
    
  const defaultMessage = type === 'admin'
    ? 'Digite o código de administrador para continuar'
    : 'Digite o código de acesso para continuar'

  // Função para lidar com mudança em cada input
  const handleChange = (index, value) => {
    // Aceita apenas números
    if (value && !/^\d$/.test(value)) return

    const newCode = [...code]
    newCode[index] = value
    setCode(newCode)
    setError(false) // Remove erro ao digitar

    // Se digitou um número, pula para o próximo input
    if (value && index < 5) {
      inputRefs[index + 1].current?.focus()
    }

    // Se completou todos os 6 dígitos, verifica automaticamente
    if (value && index === 5) {
      const fullCode = newCode.join('')
      if (fullCode.length === 6) {
        handleVerification(fullCode)
      }
    }
  }

  // Função para lidar com tecla pressionada
  const handleKeyDown = (index, e) => {
    // Backspace - volta para o input anterior
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs[index - 1].current?.focus()
    }
    
    // Enter - tenta verificar o código
    if (e.key === 'Enter') {
      const fullCode = code.join('')
      if (fullCode.length === 6) {
        handleVerification(fullCode)
      }
    }
  }

  // Função para colar código completo
  const handlePaste = (e) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text')
    const numbers = pastedData.replace(/\D/g, '') // Remove não-números
    
    if (numbers.length >= 6) {
      const newCode = numbers.slice(0, 6).split('')
      setCode(newCode)
      
      // Foca no último input
      inputRefs[5].current?.focus()
      
      // Verifica automaticamente
      setTimeout(() => {
        handleVerification(newCode.join(''))
      }, 100)
    }
  }

  // Função principal de verificação
  const handleVerification = async (fullCode) => {
    setIsVerifying(true)
    setError(false)
    
    try {
      const result = await verifyCode(fullCode, type)
      
      if (result.success) {
        setSuccess(true)
        toast.success('Código válido! Acesso liberado.')
        
        // Aguarda um pouco para mostrar o sucesso
        setTimeout(() => {
          onSuccess && onSuccess()
        }, 1000)
      } else {
        setError(true)
        setCode(['', '', '', '', '', ''])
        inputRefs[0].current?.focus()
        
        // Vibra o modal (feedback visual)
        const modal = document.querySelector('.access-code-modal')
        modal?.classList.add('shake')
        setTimeout(() => {
          modal?.classList.remove('shake')
        }, 500)
      }
    } catch (err) {
      setError(true)
      toast.error('Erro ao verificar código')
    } finally {
      setIsVerifying(false)
    }
  }

  // Animações do modal
  const modalVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 20 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: { 
        type: "spring",
        damping: 25,
        stiffness: 300
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.9,
      y: 20,
      transition: { duration: 0.2 }
    }
  }

  return (
    <AnimatePresence>
      <motion.div 
        className="access-code-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={(e) => {
          if (e.target === e.currentTarget && onCancel) {
            onCancel()
          }
        }}
      >
        <motion.div 
          className={`access-code-modal ${error ? 'error' : ''} ${success ? 'success' : ''}`}
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {/* Ícone animado */}
          <motion.div 
            className="access-code__icon"
            animate={success ? { rotate: [0, 360] } : {}}
            transition={{ duration: 0.5 }}
          >
            {success ? (
              <CheckCircle size={64} className="icon-success" />
            ) : error ? (
              <XCircle size={64} className="icon-error" />
            ) : (
              <Shield size={64} className="icon-shield" />
            )}
          </motion.div>

          {/* Título e mensagem */}
          <h2 className="access-code__title">
            {title || defaultTitle}
          </h2>
          
          <p className="access-code__message">
            {message || defaultMessage}
          </p>

          {/* Inputs do código */}
          <div className="access-code__inputs">
            {code.map((digit, index) => (
              <motion.input
                key={index}
                ref={inputRefs[index]}
                type="text"
                inputMode="numeric"
                maxLength="1"
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                className={`code-input ${digit ? 'filled' : ''}`}
                disabled={isVerifying || success}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ 
                  delay: index * 0.05,
                  type: "spring",
                  damping: 20,
                  stiffness: 300
                }}
                whileFocus={{ scale: 1.1 }}
              />
            ))}
          </div>

          {/* Mensagem de erro */}
          <AnimatePresence>
            {error && (
              <motion.p 
                className="access-code__error"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                Código inválido. Tente novamente.
              </motion.p>
            )}
          </AnimatePresence>

          {/* Botões de ação */}
          <div className="access-code__actions">
            <button 
              className="btn-cancel"
              onClick={onCancel}
              disabled={isVerifying}
            >
              Cancelar
            </button>
            
            <button 
              className="btn-verify"
              onClick={() => handleVerification(code.join(''))}
              disabled={code.join('').length < 6 || isVerifying || success}
            >
              {isVerifying ? (
                <>
                  <Loader size={18} className="spinner" />
                  Verificando...
                </>
              ) : success ? (
                <>
                  <CheckCircle size={18} />
                  Liberado!
                </>
              ) : (
                <>
                  <Lock size={18} />
                  Verificar
                </>
              )}
            </button>
          </div>

          {/* Dica sutil */}
          <p className="access-code__hint">
            {type === 'admin' 
              ? 'Entre em contato com o administrador para obter o código.'
              : 'Não tem o código? Entre em contato com o administrador.'
            }
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// Componente simplificado para uso inline
export const InlineAccessCode = ({ onVerify, type = 'user' }) => {
  const [code, setCode] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const { verifyCode } = useAccessCode()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (code.length !== 6) return

    setIsVerifying(true)
    const result = await verifyCode(code, type)
    
    if (result.success) {
      onVerify(true)
    } else {
      setCode('')
      toast.error('Código inválido')
    }
    
    setIsVerifying(false)
  }

  return (
    <form className="inline-access-code" onSubmit={handleSubmit}>
      <input
        type="text"
        inputMode="numeric"
        placeholder="Digite o código de 6 dígitos"
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
        maxLength="6"
        disabled={isVerifying}
      />
      <button type="submit" disabled={code.length < 6 || isVerifying}>
        {isVerifying ? 'Verificando...' : 'Verificar'}
      </button>
    </form>
  )
}

export default AccessCode
