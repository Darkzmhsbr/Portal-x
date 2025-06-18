import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { 
  TrendingUp, 
  Star, 
  Crown,
  Lock,
  Eye,
  ChevronRight,
  Sparkles,
  Flame
} from 'lucide-react'

// Componentes
import Header from '../components/Header'
import AgeVerification from '../components/AgeVerification'
import ChannelCard from '../components/ChannelCard'
import LoadingScreen from '../components/LoadingScreen'
import FilterSidebar from '../components/FilterSidebar'

// Hooks e Serviços
import { useAuth } from '../hooks/useAuth'
import { useChannels } from '../hooks/useChannels'
import channelsService from '../services/channels'; // ✅ CERTO
import toast from 'react-hot-toast'

import './Home.css'

/**
 * Página Home - O Coração do Portal X
 * 
 * Funciona como uma Netflix adulta:
 * 1. Verificação de idade para visitantes
 * 2. Cards provocantes com blur
 * 3. Seções organizadas por categoria
 * 4. Sistema de desbloqueio progressivo
 */
const Home = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  
  // Estados principais
  const [isAgeVerified, setIsAgeVerified] = useState(false)
  const [showContent, setShowContent] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [activeFilters, setActiveFilters] = useState({
    categories: [],
    states: [],
    levels: [],
    memberRange: null,
    sort: 'newest'
  })

  // Hook para buscar canais
  const { 
    channels, 
    featuredChannels,
    newChannels,
    popularChannels,
    premiumChannels,
    isLoading, 
    error 
  } = useChannels(activeFilters)

  // Verifica se já passou pela verificação de idade
  useEffect(() => {
    const ageVerified = localStorage.getItem('ageVerified')
    const verificationTime = localStorage.getItem('ageVerificationTime')
    
    if (ageVerified && verificationTime) {
      const daysSinceVerification = 
        (Date.now() - parseInt(verificationTime)) / (1000 * 60 * 60 * 24)
      
      if (daysSinceVerification < 30) {
        setIsAgeVerified(true)
        setShowContent(true)
      } else {
        // Limpa verificação expirada
        localStorage.removeItem('ageVerified')
        localStorage.removeItem('ageVerificationTime')
      }
    }
  }, [])

  // Callback quando passa pela verificação
  const handleAgeVerified = () => {
    setIsAgeVerified(true)
    
    // Aguarda um pouco antes de mostrar o conteúdo
    setTimeout(() => {
      setShowContent(true)
      toast.success('Bem-vindo ao Portal X! 🔥', {
        duration: 3000,
        icon: '🔞'
      })
    }, 500)
  }

  // Aplica filtros
  const handleFilterChange = (type, value) => {
    setActiveFilters(prev => ({
      ...prev,
      [type]: value
    }))
  }

  // Reseta filtros
  const handleResetFilters = () => {
    setActiveFilters({
      categories: [],
      states: [],
      levels: [],
      memberRange: null,
      sort: 'newest'
    })
  }

  // Navega para categoria específica
  const navigateToCategory = (category) => {
    navigate(`/category/${category}`)
  }

  // Seções do site
  const sections = [
    {
      id: 'featured',
      title: '🔥 Em Destaque',
      subtitle: 'Os mais quentes do momento',
      channels: featuredChannels,
      variant: 'featured'
    },
    {
      id: 'new',
      title: '✨ Novidades',
      subtitle: 'Acabaram de chegar na plataforma',
      channels: newChannels,
      variant: 'default'
    },
    {
      id: 'popular',
      title: '📈 Populares',
      subtitle: 'Os favoritos da galera',
      channels: popularChannels,
      variant: 'default'
    },
    {
      id: 'premium',
      title: '👑 Premium',
      subtitle: 'Conteúdo exclusivo e verificado',
      channels: premiumChannels,
      variant: 'premium',
      locked: !user // Só mostra se estiver logado
    }
  ]

  // Categorias disponíveis
  const categories = [
    { id: 'amadoras', label: 'Amadoras', icon: '🔥', color: '#FF6B6B' },
    { id: 'famosas', label: 'Famosas', icon: '⭐', color: '#FFD93D' },
    { id: 'vazadas', label: 'Vazadas', icon: '💦', color: '#6BCF7F' },
    { id: 'cornos', label: 'Cornos', icon: '🤘', color: '#845EC2' },
    { id: 'universitarias', label: 'Universitárias', icon: '🎓', color: '#4E8BFF' },
    { id: 'influencers', label: 'Influencers', icon: '📱', color: '#FF6B9D' }
  ]

  // Se não verificou idade, mostra modal
  if (!isAgeVerified) {
    return <AgeVerification onVerified={handleAgeVerified} />
  }

  // Loading
  if (isLoading && !showContent) {
    return <LoadingScreen message="Carregando conteúdo exclusivo..." />
  }

  return (
    <div className="home-page">
      <Header />
      
      <div className="home-container">
        {/* Sidebar de Filtros (Desktop) */}
        <AnimatePresence>
          {isFilterOpen && (
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              className="home-sidebar"
            >
              <FilterSidebar
                filters={activeFilters}
                onFilterChange={handleFilterChange}
                onReset={handleResetFilters}
                isOpen={isFilterOpen}
                onToggle={() => setIsFilterOpen(!isFilterOpen)}
                totalResults={channels?.length || 0}
                showMobileToggle={false}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Conteúdo Principal */}
        <div className="home-content">
          {/* Hero Section */}
          <motion.section 
            className="hero-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="hero-background">
              <div className="hero-gradient" />
            </div>
            
            <div className="hero-content">
              <h1 className="hero-title">
                <Sparkles className="hero-icon" />
                Portal Secreto X
                <span className="hero-badge">+18</span>
              </h1>
              
              <p className="hero-subtitle">
                Os grupos mais <span className="highlight">quentes</span> e 
                <span className="highlight"> exclusivos</span> do Telegram em 2025
              </p>

              <div className="hero-stats">
                <div className="stat-item">
                  <Flame size={20} />
                  <span>{channels?.length || 0}</span>
                  <label>Grupos Ativos</label>
                </div>
                <div className="stat-item">
                  <Eye size={20} />
                  <span>24/7</span>
                  <label>Novidades</label>
                </div>
                <div className="stat-item">
                  <Lock size={20} />
                  <span>100%</span>
                  <label>Verificado</label>
                </div>
              </div>
            </div>
          </motion.section>

          {/* Categorias */}
          <section className="categories-section">
            <div className="section-header">
              <h2>Escolha sua Fantasia 🔥</h2>
              <p>Navegue pelas categorias mais procuradas</p>
            </div>

            <div className="categories-grid">
              {categories.map((category, index) => (
                <motion.div
                  key={category.id}
                  className="category-card"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => navigateToCategory(category.id)}
                  style={{ '--category-color': category.color }}
                >
                  <span className="category-icon">{category.icon}</span>
                  <h3>{category.label}</h3>
                  <ChevronRight className="category-arrow" />
                </motion.div>
              ))}
            </div>
          </section>

          {/* Seções de Canais */}
          {sections.map((section) => {
            // Pula seção se não tiver canais ou se for bloqueada
            if (!section.channels?.length || (section.locked && !user)) {
              return null
            }

            return (
              <motion.section 
                key={section.id}
                className="channels-section"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <div className="section-header">
                  <div>
                    <h2>{section.title}</h2>
                    <p>{section.subtitle}</p>
                  </div>
                  
                  <button 
                    className="see-more-btn"
                    onClick={() => navigate(`/${section.id}`)}
                  >
                    Ver todos
                    <ChevronRight size={18} />
                  </button>
                </div>

                <div className="channels-carousel">
                  <div className="channels-track">
                    {section.channels.map((channel) => (
                      <ChannelCard
                        key={channel.id}
                        channel={channel}
                        variant={section.variant}
                      />
                    ))}
                  </div>
                </div>
              </motion.section>
            )
          })}

          {/* CTA Final - Visitantes */}
          {!user && (
            <motion.section 
              className="cta-section"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              <div className="cta-content">
                <h2>Quer acesso total? 🔓</h2>
                <p>
                  Desbloqueie <strong>+500 grupos exclusivos</strong> agora mesmo!
                  <br />
                  Cadastre-se e tenha acesso a todo conteúdo premium.
                </p>
                
                <div className="cta-buttons">
                  <button 
                    className="cta-primary"
                    onClick={() => navigate('/register')}
                  >
                    <Crown size={20} />
                    Criar Conta Grátis
                  </button>
                  
                  <button 
                    className="cta-secondary"
                    onClick={() => navigate('/login')}
                  >
                    Já tenho conta
                  </button>
                </div>
              </div>
            </motion.section>
          )}
        </div>
      </div>

      {/* Botão de Filtros Mobile */}
      <FilterSidebar
        filters={activeFilters}
        onFilterChange={handleFilterChange}
        onReset={handleResetFilters}
        isOpen={false}
        onToggle={() => setIsFilterOpen(!isFilterOpen)}
        totalResults={channels?.length || 0}
        showMobileToggle={true}
      />
    </div>
  )
}

export default Home
