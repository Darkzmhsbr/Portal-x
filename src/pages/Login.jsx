import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { 
  LogIn, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff,
  AlertCircle,
  Loader,
  ArrowLeft,
  Shield
} from 'lucide-react'
import toast from 'react-hot-toast'

// Componentes
import AccessCode from '../components/AccessCode'
import LoadingScreen from '../components/LoadingScreen'

// Hooks e Serviços
import { useAuth } from '../hooks/useAuth'
import { useAccessCode } from '../hooks/useAccessCode'

import './Login.css'

/**
 * Página de Login - Portal de Entrada
 * 
 * Funciona em 2 etapas:
 * 1. Verificação do código de 6 dígitos (primeira vez)
 * 2. Login com email e senha
 * 
 * É como um cofre com 2 fechaduras! 🔐
 */
const Login = () => {
  const navigate = useNavigate()
  const { login, isLoading: authLoading } = useAuth()
  const { checkAccessCode, hasValidAccess } = useAccessCode()
  
  // Estados do componente
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  
  // React Hook Form - Gerencia o formulário
  const { 
    register, 
    handleSubmit, 
    formState: { errors },
    reset 
  } = useForm()

  // Verifica se já tem acesso ao fazer login
  useEffect(() => {
    // Se já estiver logado, redireciona
    const token = localStorage.getItem('token')
    if (token) {
      navigate('/dashboard')
    }
  }, [navigate])

  // Processa o login
  const onSubmit = async (data) => {
    try {
      setIsSubmitting(true)
      
      // Tenta fazer login
      const response = await login(data.email, data.password)
      
      if (response.success) {
        toast.success('Login realizado com sucesso! 🎉', {
          duration: 3000
        })
        
        // Redireciona baseado no tipo de usuário
        if (response.user.role === 'admin') {
          navigate('/admin')
        } else {
          navigate('/dashboard')
        }
      } else {
        throw new Error(response.message || 'Erro ao fazer login')
      }
    } catch (error) {
      console.error('Erro no login:', error)
      
      // Mensagens de erro específicas
      if (error.message.includes('pendente')) {
        toast.error('Sua conta está pendente de aprovação! ⏳', {
          duration: 5000
        })
      } else if (error.message.includes('senha')) {
        toast.error('Email ou senha incorretos! 🔐', {
          duration: 4000
        })
      } else {
        toast.error('Erro ao fazer login. Tente novamente!', {
          duration: 4000
        })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // Callback quando o código é verificado
  const handleAccessVerified = () => {
    toast.success('Código verificado! Agora faça login 🔓', {
      duration: 3000
    })
  }

  // Se não tem acesso válido, mostra tela de código
  if (!hasValidAccess('user')) {
    return (
      <AccessCode 
        requiredCode="492571"
        codeType="user"
        onSuccess={handleAccessVerified}
        title="Acesso Restrito"
        subtitle="Digite o código de acesso para continuar"
      />
    )
  }

  // Loading
  if (authLoading) {
    return <LoadingScreen message="Preparando seu acesso..." />
  }

  return (
    <div className="login-page">
      {/* Botão Voltar */}
      <button 
        className="back-button"
        onClick={() => navigate('/')}
      >
        <ArrowLeft size={20} />
        Voltar ao início
      </button>

      <div className="login-container">
        {/* Lado Esquerdo - Formulário */}
        <motion.div 
          className="login-form-section"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="login-header">
            <div className="logo-area">
              <div className="logo-circle">
                <span>18</span>
              </div>
            </div>
            
            <h1>Fazer Login</h1>
            <p>Entre para acessar os grupos</p>
          </div>

          <AnimatePresence mode="wait">
            {!showForgotPassword ? (
              <motion.form 
                key="login-form"
                onSubmit={handleSubmit(onSubmit)}
                className="login-form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {/* Campo Email */}
                <div className="form-group">
                  <label htmlFor="email">
                    <Mail size={18} />
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    {...register('email', {
                      required: 'Email é obrigatório',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Email inválido'
                      }
                    })}
                    className={errors.email ? 'error' : ''}
                  />
                  {errors.email && (
                    <span className="error-message">
                      <AlertCircle size={14} />
                      {errors.email.message}
                    </span>
                  )}
                </div>

                {/* Campo Senha */}
                <div className="form-group">
                  <label htmlFor="password">
                    <Lock size={18} />
                    Senha
                  </label>
                  <div className="password-input">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      {...register('password', {
                        required: 'Senha é obrigatória',
                        minLength: {
                          value: 6,
                          message: 'Senha deve ter no mínimo 6 caracteres'
                        }
                      })}
                      className={errors.password ? 'error' : ''}
                    />
                    <button
                      type="button"
                      className="toggle-password"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.password && (
                    <span className="error-message">
                      <AlertCircle size={14} />
                      {errors.password.message}
                    </span>
                  )}
                </div>

                {/* Esqueceu a senha */}
                <div className="form-options">
                  <button
                    type="button"
                    className="forgot-password-link"
                    onClick={() => setShowForgotPassword(true)}
                  >
                    Esqueceu sua senha?
                  </button>
                </div>

                {/* Botão de Login */}
                <button 
                  type="submit" 
                  className="submit-button"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader className="spinner" size={20} />
                      Entrando...
                    </>
                  ) : (
                    <>
                      <LogIn size={20} />
                      Entrar
                    </>
                  )}
                </button>

                {/* Link para Cadastro */}
                <div className="form-footer">
                  <p>
                    Não tem conta? 
                    <Link to="/register">Cadastre-se</Link>
                  </p>
                </div>
              </motion.form>
            ) : (
              <motion.div
                key="forgot-form"
                className="forgot-password-form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <ForgotPasswordForm 
                  onBack={() => setShowForgotPassword(false)}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Lado Direito - Informações */}
        <motion.div 
          className="login-info-section"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="info-content">
            <h2>Portal Secreto X 🔥</h2>
            <p className="info-subtitle">
              O maior acervo de grupos adultos do Telegram
            </p>

            <div className="features-list">
              <div className="feature-item">
                <Shield className="feature-icon" />
                <div>
                  <h3>100% Seguro</h3>
                  <p>Seus dados protegidos com criptografia</p>
                </div>
              </div>
              
              <div className="feature-item">
                <span className="feature-icon">🔥</span>
                <div>
                  <h3>+500 Grupos</h3>
                  <p>Conteúdo exclusivo atualizado diariamente</p>
                </div>
              </div>
              
              <div className="feature-item">
                <span className="feature-icon">⚡</span>
                <div>
                  <h3>Acesso Imediato</h3>
                  <p>Entre e navegue sem complicações</p>
                </div>
              </div>
            </div>

            <div className="info-footer">
              <p>
                Ao fazer login, você confirma ter 
                <strong> mais de 18 anos</strong> e concorda com nossos 
                termos de uso.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

/**
 * Componente de Recuperação de Senha
 * 
 * Um formulário separado para não bagunçar o código principal
 * É como ter uma gaveta organizada para cada coisa! 📁
 */
const ForgotPasswordForm = ({ onBack }) => {
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState(1) // 1: email, 2: código
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleEmailSubmit = async (e) => {
    e.preventDefault()
    
    if (!email) {
      toast.error('Digite seu email!')
      return
    }

    setIsSubmitting(true)
    
    // Simula envio (substituir por API real)
    setTimeout(() => {
      toast.success('Instruções enviadas para seu email! 📧')
      setStep(2)
      setIsSubmitting(false)
    }, 2000)
  }

  const handleCodeSubmit = async (e) => {
    e.preventDefault()
    
    if (code !== '492571') {
      toast.error('Código inválido!')
      return
    }

    toast.success('Código verificado! Redefinindo senha...')
    // Aqui redirecionaria para redefinir senha
  }

  return (
    <div className="forgot-password-container">
      <h2>Recuperar Senha</h2>
      <p>
        {step === 1 
          ? 'Digite seu email cadastrado'
          : 'Digite o código de verificação'
        }
      </p>

      <form onSubmit={step === 1 ? handleEmailSubmit : handleCodeSubmit}>
        {step === 1 ? (
          <div className="form-group">
            <label htmlFor="recovery-email">
              <Mail size={18} />
              Email cadastrado
            </label>
            <input
              id="recovery-email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        ) : (
          <div className="form-group">
            <label htmlFor="recovery-code">
              <Shield size={18} />
              Código de verificação
            </label>
            <input
              id="recovery-code"
              type="text"
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              maxLength={6}
              required
            />
          </div>
        )}

        <button 
          type="submit" 
          className="submit-button"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader className="spinner" size={20} />
              Enviando...
            </>
          ) : (
            step === 1 ? 'Enviar instruções' : 'Verificar código'
          )}
        </button>

        <button
          type="button"
          className="back-link"
          onClick={onBack}
        >
          <ArrowLeft size={16} />
          Voltar ao login
        </button>
      </form>
    </div>
  )
}

export default Login
