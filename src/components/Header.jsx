import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Menu, 
  X, 
  Home, 
  LogIn, 
  UserPlus, 
  User, 
  LayoutDashboard, 
  LogOut,
  TrendingUp,
  Crown,
  Sparkles,
  Shield
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import './Header.css'

/**
 * Componente Header - A Barra de Navegação
 * 
 * Imagine isso como o painel de controle do seu carro:
 * - Para visitantes: só o básico (home, novidades, populares)
 * - Para usuários: adiciona dashboard e perfil
 * - Para admin: acesso total com painel administrativo
 * 
 * Se adapta automaticamente ao tipo de usuário! 🎯
 */
const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  
  // Pega informações do usuário logado
  const { user, isAuthenticated, isAdmin, logout } = useAuth()

  // Detecta scroll para mudar aparência do header
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Fecha menu mobile ao mudar de página
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [location])

  // Função para fazer logout
  const handleLogout = async () => {
    await logout()
    navigate('/')
    toast.success('Até logo! 👋')
  }

  // Define itens do menu baseado no tipo de usuário
  const getMenuItems = () => {
    const baseItems = [
      { 
        path: '/', 
        label: 'Início', 
        icon: Home,
        public: true 
      },
      { 
        path: '/novidades', 
        label: 'Novidades', 
        icon: Sparkles,
        public: true 
      },
      { 
        path: '/populares', 
        label: 'Populares', 
        icon: TrendingUp,
        public: true 
      },
      { 
        path: '/premium', 
        label: 'Premium', 
        icon: Crown,
        public: true,
        highlight: true 
      }
    ]

    // Adiciona itens para usuários logados
    if (isAuthenticated) {
      baseItems.push(
        { 
          path: '/dashboard', 
          label: 'Dashboard', 
          icon: LayoutDashboard,
          userOnly: true 
        },
        { 
          path: '/ranking', 
          label: 'Ranking', 
          icon: TrendingUp,
          userOnly: true 
        }
      )
    }

    // Adiciona painel admin
    if (isAdmin) {
      baseItems.push({ 
        path: '/admin', 
        label: 'Admin', 
        icon: Shield,
        adminOnly: true,
        highlight: true 
      })
    }

    return baseItems
  }

  // Componente do menu mobile
  const MobileMenu = () => (
    <AnimatePresence>
      {isMobileMenuOpen && (
        <motion.div
          className="mobile-menu"
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'tween', duration: 0.3 }}
        >
          <div className="mobile-menu__header">
            <h3>Menu</h3>
            <button 
              onClick={() => setIsMobileMenuOpen(false)}
              className="mobile-menu__close"
            >
              <X size={24} />
            </button>
          </div>

          <nav className="mobile-menu__nav">
            {getMenuItems().map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`mobile-menu__link ${
                  location.pathname === item.path ? 'active' : ''
                } ${item.highlight ? 'highlight' : ''}`}
              >
                <item.icon size={20} />
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="mobile-menu__footer">
            {isAuthenticated ? (
              <>
                <Link to="/perfil" className="mobile-menu__profile">
                  <User size={20} />
                  <div>
                    <span className="profile-name">{user?.name}</span>
                    <span className="profile-role">
                      {isAdmin ? 'Administrador' : 'Usuário'}
                    </span>
                  </div>
                </Link>
                <button 
                  onClick={handleLogout}
                  className="mobile-menu__logout"
                >
                  <LogOut size={20} />
                  Sair
                </button>
              </>
            ) : (
              <div className="mobile-menu__auth">
                <Link to="/login" className="btn-login-mobile">
                  <LogIn size={20} />
                  Entrar
                </Link>
                <Link to="/register" className="btn-register-mobile">
                  <UserPlus size={20} />
                  Criar Conta
                </Link>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )

  return (
    <>
      <header className={`header ${isScrolled ? 'header--scrolled' : ''}`}>
        <div className="header__container">
          {/* Logo */}
          <Link to="/" className="header__logo">
            <motion.span 
              className="logo-x"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              X
            </motion.span>
            <span className="logo-text">Portal Secreto</span>
          </Link>

          {/* Navegação Desktop */}
          <nav className="header__nav desktop-only">
            {getMenuItems().map((item) => {
              // Pula itens que não devem aparecer para visitantes
              if (!isAuthenticated && (item.userOnly || item.adminOnly)) {
                return null
              }

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`nav-link ${
                    location.pathname === item.path ? 'active' : ''
                  } ${item.highlight ? 'highlight' : ''}`}
                >
                  {item.label}
                  {item.highlight && (
                    <span className="badge">
                      {item.adminOnly ? '⚡' : '🔥'}
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Ações do Usuário */}
          <div className="header__actions desktop-only">
            {isAuthenticated ? (
              <div className="user-menu">
                <motion.button 
                  className="user-menu__trigger"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="user-avatar">
                    {user?.avatar ? (
                      <img src={user.avatar} alt={user.name} />
                    ) : (
                      <User size={20} />
                    )}
                  </div>
                  <span className="user-name">{user?.name}</span>
                  {isAdmin && <Shield size={16} className="admin-badge" />}
                </motion.button>

                {/* Dropdown do usuário */}
                <div className="user-dropdown">
                  <Link to="/perfil" className="dropdown-item">
                    <User size={16} />
                    Meu Perfil
                  </Link>
                  <Link to="/dashboard" className="dropdown-item">
                    <LayoutDashboard size={16} />
                    Dashboard
                  </Link>
                  <hr className="dropdown-divider" />
                  <button onClick={handleLogout} className="dropdown-item">
                    <LogOut size={16} />
                    Sair
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Visitantes não veem botões de login/registro */}
                {location.pathname !== '/' && (
                  <div className="auth-buttons">
                    <Link to="/login" className="btn-login">
                      <LogIn size={18} />
                      Entrar
                    </Link>
                    <Link to="/register" className="btn-register">
                      <UserPlus size={18} />
                      Criar Conta
                    </Link>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Botão Menu Mobile */}
          <button 
            className="header__mobile-toggle"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {/* Menu Mobile */}
      <MobileMenu />

      {/* Overlay para fechar menu mobile */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            className="mobile-menu-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  )
}

// Componente de notificação para novos canais/usuários (Admin)
export const AdminNotificationBadge = () => {
  const [notifications, setNotifications] = useState(0)
  
  // Aqui você conectaria com seu sistema real
  useEffect(() => {
    // Exemplo: buscar notificações pendentes
    // const pending = await adminService.getPendingCount()
    setNotifications(3) // Exemplo
  }, [])

  if (notifications === 0) return null

  return (
    <span className="notification-badge">
      {notifications > 9 ? '9+' : notifications}
    </span>
  )
}

export default Header
