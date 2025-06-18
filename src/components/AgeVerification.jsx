import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, Lock, Unlock, Calendar } from 'lucide-react'
import toast from 'react-hot-toast'
import './AgeVerification.css'

/**
 * Componente de Verificação de Idade
 * 
 * Este é o "guardião" do portal! Ele garante que apenas
 * maiores de 18 anos possam acessar o conteúdo adulto.
 * 
 * Funciona em 3 etapas:
 * 1. Pergunta a idade
 * 2. Animação misteriosa de 7 segundos
 * 3. Libera ou bloqueia o acesso
 */
const AgeVerification = ({ onVerified, onDenied }) => {
  const [step, setStep] = useState('question') // question, loading, result
  const [isAdult, setIsAdult] = useState(null)
  const [countdown, setCountdown] = useState(7)
  const [loadingMessage, setLoadingMessage] = useState(0)

  // Mensagens misteriosas durante o carregamento
  const loadingMessages = [
    "Verificando sua idade... 🔍",
    "Acessando banco de dados... 📊",
    "Processando informações... ⚙️",
    "Analisando perfil... 👤",
    "Preparando conteúdo exclusivo... 🔐",
    "Carregando grupos secretos... 🤫",
    "Quase pronto... ⏳"
  ]

  // Efeito para o countdown e mensagens
  useEffect(() => {
    if (step === 'loading' && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1)
        
        // Troca a mensagem a cada segundo
        if (countdown > 1) {
          setLoadingMessage((prev) => (prev + 1) % loadingMessages.length)
        }
      }, 1000)

      return () => clearTimeout(timer)
    } else if (countdown === 0) {
      // Quando terminar, mostra o resultado
      setStep('result')
      
      // Aguarda um pouco e chama o callback apropriado
      setTimeout(() => {
        if (isAdult) {
          onVerified()
        } else {
          onDenied()
        }
      }, 1500)
    }
  }, [countdown, step, isAdult])

  // Função para confirmar idade
  const handleAgeConfirmation = (isOver18) => {
    setIsAdult(isOver18)
    setStep('loading')
    
    // Salva no localStorage para não perguntar novamente
    if (isOver18) {
      localStorage.setItem('ageVerified', 'true')
      localStorage.setItem('ageVerifiedDate', new Date().toISOString())
    }
  }

  // Animações do modal
  const modalVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { 
        type: "spring",
        damping: 25,
        stiffness: 300
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.8,
      transition: { duration: 0.3 }
    }
  }

  // Renderiza conteúdo baseado no passo atual
  const renderContent = () => {
    switch (step) {
      case 'question':
        return (
          <motion.div 
            className="age-verification__question"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="verification-icon">
              <AlertCircle size={64} className="icon-warning" />
            </div>
            
            <h2 className="verification-title">
              Conteúdo Adulto 🔞
            </h2>
            
            <p className="verification-subtitle">
              Este site contém conteúdo exclusivo para maiores de 18 anos.
            </p>
            
            <div className="verification-text">
              <p>
                <strong>Descobrimos os grupos mais insanos do Telegram em 2025.</strong>
              </p>
              <p className="highlight-text">
                Mas só libera se você for +18...
              </p>
            </div>

            <div className="age-buttons">
              <motion.button
                className="age-button age-button--confirm"
                onClick={() => handleAgeConfirmation(true)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Unlock size={20} />
                Tenho 18 anos ou mais
              </motion.button>
              
              <motion.button
                className="age-button age-button--deny"
                onClick={() => handleAgeConfirmation(false)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Lock size={20} />
                Tenho menos de 18 anos
              </motion.button>
            </div>

            <p className="verification-warning">
              Ao continuar, você confirma ter idade legal para visualizar conteúdo adulto.
            </p>
          </motion.div>
        )

      case 'loading':
        return (
          <motion.div 
            className="age-verification__loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="loading-content">
              {/* Círculo de progresso animado */}
              <div className="progress-circle">
                <svg width="120" height="120">
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    fill="none"
                    stroke="#333"
                    strokeWidth="8"
                  />
                  <motion.circle
                    cx="60"
                    cy="60"
                    r="50"
                    fill="none"
                    stroke="#DC2626"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={314}
                    initial={{ strokeDashoffset: 314 }}
                    animate={{ strokeDashoffset: 0 }}
                    transition={{ duration: 7, ease: "linear" }}
                  />
                </svg>
                <div className="countdown-number">
                  {countdown}
                </div>
              </div>

              <motion.p 
                className="loading-message"
                key={loadingMessage}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                {loadingMessages[loadingMessage]}
              </motion.p>
            </div>
          </motion.div>
        )

      case 'result':
        return (
          <motion.div 
            className="age-verification__result"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            {isAdult ? (
              <>
                <motion.div 
                  className="result-icon success"
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 0.5 }}
                >
                  <Unlock size={64} />
                </motion.div>
                <h3 className="result-title">Acesso Liberado! 🎉</h3>
                <p className="result-message">
                  Preparando os grupos mais quentes...
                </p>
              </>
            ) : (
              <>
                <div className="result-icon denied">
                  <Lock size={64} />
                </div>
                <h3 className="result-title">Acesso Negado ❌</h3>
                <p className="result-message">
                  Você precisa ter 18 anos ou mais para acessar este conteúdo.
                </p>
              </>
            )}
          </motion.div>
        )
    }
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div 
        className="age-verification-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div 
          className="age-verification-modal"
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {renderContent()}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// Função auxiliar para verificar se já foi verificado
export const checkAgeVerification = () => {
  const verified = localStorage.getItem('ageVerified')
  const verifiedDate = localStorage.getItem('ageVerifiedDate')
  
  if (verified && verifiedDate) {
    // Verifica se faz menos de 30 dias
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const verificationDate = new Date(verifiedDate)
    
    if (verificationDate > thirtyDaysAgo) {
      return true
    } else {
      // Limpa verificação antiga
      localStorage.removeItem('ageVerified')
      localStorage.removeItem('ageVerifiedDate')
    }
  }
  
  return false
}

export default AgeVerification
