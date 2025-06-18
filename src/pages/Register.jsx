import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { 
  UserPlus, 
  Mail, 
  Lock, 
  User,
  Eye, 
  EyeOff,
  AlertCircle,
  CheckCircle,
  Loader,
  ArrowLeft,
  Shield,
  Info
} from 'lucide-react'
import toast from 'react-hot-toast'

// Componentes
import AccessCode from '../components/AccessCode'
import LoadingScreen from '../components/LoadingScreen'
import Modal from '../components/Modal'

// Hooks e Serviços
import { useAuth } from '../hooks/useAuth'
import { useAccessCode } from '../hooks/useAccessCode'

import './Register.css'

/**
 * Página de Cadastro - Criando sua Conta VIP
 * 
 * Funciona em 3 etapas simples:
 * 1. Verifica o código de acesso (primeira vez)
 * 2. Preenche os dados do cadastro
 * 3. Aguarda aprovação do admin
 * 
 * É como se inscrever em um clube exclusivo! 🎭
 */
const Register = () => {
  const navigate = useNavigate()
  const { register: registerUser, isLoading: authLoading } = useAuth()
  const { checkAccessCode, hasValidAccess } = useAccessCode()
  
  // Estados do componente
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  
  // React Hook Form - O maestro do formulário
  const { 
    register, 
    handleSubmit, 
    formState: { errors },
    watch,
    reset 
  } = useForm()

  // Observa a senha para validar confirmação
  const password = watch('password')

  // Verifica se já está logado
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      navigate('/dashboard')
    }
  }, [navigate])

  // Processa o cadastro
  const onSubmit = async (data) => {
    try {
      setIsSubmitting(true)
      
      // Validações extras
      if (!agreedToTerms) {
        toast.error('Você precisa aceitar os termos! 📋')
        return
      }

      // Tenta fazer o cadastro
      const response = await registerUser({
        name: data.name,
        email: data.email,
        password: data.password
      })
      
      if (response.success) {
        // Mostra modal de sucesso
        setShowSuccessModal(true)
        
        // Limpa o formulário
        reset()
        setAgreedToTerms(false)
      } else {
        throw new Error(response.message || 'Erro ao criar conta')
      }
    } catch (error) {
      console.error('Erro no cadastro:', error)
      
      // Mensagens de erro específicas
      if (error.message.includes('email já cadastrado')) {
        toast.error('Este email já está em uso! 📧', {
          duration: 4000
        })
      } else {
        toast.error('Erro ao criar conta. Tente novamente!', {
          duration: 4000
        })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // Callback quando o código é verificado
  const handleAccessVerified = () => {
    toast.success('Código verificado! Agora crie sua conta 🎉', {
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
        subtitle="Digite o código de acesso para criar sua conta"
      />
    )
  }

  // Loading
  if (authLoading) {
    return <LoadingScreen message="Preparando seu cadastro..." />
  }

  return (
    <div className="register-page">
      {/* Botão Voltar */}
      <button 
        className="back-button"
        onClick={() => navigate('/')}
      >
        <ArrowLeft size={20} />
        Voltar ao início
      </button>

      <div className="register-container">
        {/* Lado Esquerdo - Formulário */}
        <motion.div 
          className="register-form-section"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="register-header">
            <div className="logo-area">
              <div className="logo-circle">
                <span>18</span>
              </div>
            </div>
            
            <h1>Criar Conta</h1>
            <p>Cadastre-se para acessar</p>
          </div>

          <form 
            onSubmit={handleSubmit(onSubmit)}
            className="register-form"
          >
            {/* Campo Nome */}
            <div className="form-group">
              <label htmlFor="name">
                <User size={18} />
                Nome
              </label>
              <input
                id="name"
                type="text"
                placeholder="Seu nome completo"
                {...register('name', {
                  required: 'Nome é obrigatório',
                  minLength: {
                    value: 3,
                    message: 'Nome deve ter no mínimo 3 caracteres'
                  },
                  pattern: {
                    value: /^[A-Za-zÀ-ÿ\s]+$/,
                    message: 'Nome deve conter apenas letras'
                  }
                })}
                className={errors.name ? 'error' : ''}
              />
              {errors.name && (
                <span className="error-message">
                  <AlertCircle size={14} />
                  {errors.name.message}
                </span>
              )}
            </div>

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
                  placeholder="Mínimo 6 caracteres"
                  {...register('password', {
                    required: 'Senha é obrigatória',
                    minLength: {
                      value: 6,
                      message: 'Senha deve ter no mínimo 6 caracteres'
                    },
                    pattern: {
                      value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                      message: 'Senha deve ter letras maiúsculas, minúsculas e números'
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

            {/* Campo Confirmar Senha */}
            <div className="form-group">
              <label htmlFor="confirmPassword">
                <Lock size={18} />
                Confirmar Senha
              </label>
              <div className="password-input">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Digite a senha novamente"
                  {...register('confirmPassword', {
                    required: 'Confirmação de senha é obrigatória',
                    validate: value => 
                      value === password || 'As senhas não coincidem'
                  })}
                  className={errors.confirmPassword ? 'error' : ''}
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.confirmPassword && (
                <span className="error-message">
                  <AlertCircle size={14} />
                  {errors.confirmPassword.message}
                </span>
              )}
            </div>

            {/* Termos de Uso */}
            <div className="terms-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                />
                <span className="checkbox-text">
                  Confirmo ter <strong>mais de 18 anos</strong> e aceito os 
                  <button type="button" className="terms-link">
                    termos de uso
                  </button>
                </span>
              </label>
            </div>

            {/* Aviso importante */}
            <div className="warning-box">
              <Info size={18} />
              <p>
                Após o cadastro, sua conta ficará <strong>pendente</strong> até 
                ser aprovada pelo administrador. Você receberá um email quando 
                for liberada!
              </p>
            </div>

            {/* Botão de Cadastro */}
            <button 
              type="submit" 
              className="submit-button"
              disabled={isSubmitting || !agreedToTerms}
            >
              {isSubmitting ? (
                <>
                  <Loader className="spinner" size={20} />
                  Criando conta...
                </>
              ) : (
                <>
                  <UserPlus size={20} />
                  Cadastrar
                </>
              )}
            </button>

            {/* Link para Login */}
            <div className="form-footer">
              <p>
                Já tem conta? 
                <Link to="/login">Faça login</Link>
              </p>
            </div>
          </form>
        </motion.div>

        {/* Lado Direito - Informações */}
        <motion.div 
          className="register-info-section"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="info-content">
            <h2>Bem-vindo ao Clube! 🎉</h2>
            <p className="info-subtitle">
              Junte-se a milhares de usuários satisfeitos
            </p>

            <div className="benefits-list">
              <div className="benefit-item">
                <CheckCircle className="benefit-icon" />
                <div>
                  <h3>Acesso Exclusivo</h3>
                  <p>Grupos verificados e atualizados diariamente</p>
                </div>
              </div>
              
              <div className="benefit-item">
                <span className="benefit-icon">🚀</span>
                <div>
                  <h3>Sistema de Níveis</h3>
                  <p>Suba de ranking e destaque seus canais</p>
                </div>
              </div>
              
              <div className="benefit-item">
                <span className="benefit-icon">💎</span>
                <div>
                  <h3>Conteúdo Premium</h3>
                  <p>Acesso a seções exclusivas e VIP</p>
                </div>
              </div>
              
              <div className="benefit-item">
                <Shield className="benefit-icon" />
                <div>
                  <h3>100% Seguro</h3>
                  <p>Seus dados protegidos e criptografados</p>
                </div>
              </div>
            </div>

            <div className="info-stats">
              <div className="stat">
                <span className="stat-number">500+</span>
                <span className="stat-label">Grupos Ativos</span>
              </div>
              <div className="stat">
                <span className="stat-number">10k+</span>
                <span className="stat-label">Usuários</span>
              </div>
              <div className="stat">
                <span className="stat-number">24/7</span>
                <span className="stat-label">Novidades</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Modal de Sucesso */}
      <AnimatePresence>
        {showSuccessModal && (
          <Modal
            isOpen={showSuccessModal}
            onClose={() => {
              setShowSuccessModal(false)
              navigate('/login')
            }}
            title="Cadastro Realizado! 🎉"
            variant="success"
            size="medium"
          >
            <div className="success-content">
              <div className="success-icon">
                <CheckCircle size={64} />
              </div>
              
              <h3>Conta criada com sucesso!</h3>
              
              <p>
                Sua conta está <strong>pendente de aprovação</strong>. 
                Você receberá um email assim que for liberada pelo administrador.
              </p>
              
              <div className="status-info">
                <div className="status-badge pending">
                  <span className="status-dot"></span>
                  Status: Pendente
                </div>
              </div>
              
              <p className="success-note">
                Isso geralmente leva até 24 horas. Fique de olho no seu email!
              </p>
              
              <button 
                className="success-button"
                onClick={() => {
                  setShowSuccessModal(false)
                  navigate('/login')
                }}
              >
                Entendi
              </button>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Register
