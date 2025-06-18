import React from 'react'
import { motion } from 'framer-motion'
import './LoadingScreen.css'

/**
 * Componente de Tela de Carregamento
 * 
 * Imagine isso como uma "cortina" elegante que aparece
 * enquanto o sistema está processando algo importante.
 * 
 * Usa animações suaves para dar aquele toque profissional!
 */
const LoadingScreen = ({ message = 'Carregando...', fullScreen = true }) => {
  // Variantes de animação para o logo
  const logoVariants = {
    initial: { 
      scale: 0.8, 
      opacity: 0 
    },
    animate: {
      scale: [0.8, 1.1, 1],
      opacity: 1,
      transition: {
        duration: 0.8,
        ease: "easeInOut"
      }
    }
  }

  // Animação dos pontos de carregamento
  const dotsVariants = {
    animate: {
      transition: {
        staggerChildren: 0.2
      }
    }
  }

  const dotVariants = {
    initial: { y: 0 },
    animate: {
      y: [-10, 0],
      transition: {
        duration: 0.5,
        repeat: Infinity,
        repeatType: "reverse",
        ease: "easeInOut"
      }
    }
  }

  return (
    <motion.div 
      className={`loading-screen ${fullScreen ? 'loading-screen--fullscreen' : ''}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="loading-screen__content">
        {/* Logo animado */}
        <motion.div 
          className="loading-screen__logo"
          variants={logoVariants}
          initial="initial"
          animate="animate"
        >
          <span className="logo-x">X</span>
          <span className="logo-text">Portal</span>
        </motion.div>

        {/* Pontos de carregamento animados */}
        <motion.div 
          className="loading-screen__dots"
          variants={dotsVariants}
          animate="animate"
        >
          {[...Array(3)].map((_, index) => (
            <motion.span
              key={index}
              className="loading-dot"
              variants={dotVariants}
            />
          ))}
        </motion.div>

        {/* Mensagem personalizada */}
        <motion.p 
          className="loading-screen__message"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          {message}
        </motion.p>

        {/* Barra de progresso (opcional) */}
        <motion.div 
          className="loading-screen__progress"
          initial={{ width: 0 }}
          animate={{ width: '100%' }}
          transition={{ 
            duration: 2, 
            ease: "easeInOut",
            repeat: Infinity 
          }}
        />
      </div>
    </motion.div>
  )
}

// Variação específica para verificação de idade
export const AgeVerificationLoading = () => {
  const messages = [
    "Verificando sua idade...",
    "Preparando conteúdo exclusivo...",
    "Carregando os grupos secretos...",
    "Quase lá..."
  ]

  const [currentMessage, setCurrentMessage] = React.useState(0)

  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessage(prev => (prev + 1) % messages.length)
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  return (
    <LoadingScreen 
      message={
        <span className="loading-message-animated">
          🔍 {messages[currentMessage]}
        </span>
      }
    />
  )
}

export default LoadingScreen
