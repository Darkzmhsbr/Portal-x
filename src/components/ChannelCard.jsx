import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Lock, 
  Unlock, 
  Users, 
  Eye, 
  TrendingUp, 
  Crown,
  MapPin,
  ExternalLink,
  Heart
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useTrackChannelClick } from '../hooks/useChannels'
import toast from 'react-hot-toast'
import './ChannelCard.css'

/**
 * Componente ChannelCard - O Card estilo Netflix
 * 
 * Imagine como um cartão de visita interativo:
 * - Imagem com blur para criar curiosidade
 * - Informações do canal/grupo
 * - Animações no hover
 * - Sistema de níveis visual
 * 
 * É a peça que faz os visitantes quererem clicar! 🔥
 */
const ChannelCard = ({ 
  channel, 
  variant = 'default', // default, featured, compact
  showStats = true,
  onUnlock 
}) => {
  const [isHovered, setIsHovered] = useState(false)
  const [imageError, setImageError] = useState(false)
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const trackClick = useTrackChannelClick()

  // Desestrutura dados do canal
  const {
    id,
    name,
    image,
    telegram_link,
    category,
    state,
    members_count = 0,
    level,
    is_premium = false,
    is_verified = false,
    clicks = 0,
    description
  } = channel

  // Função para lidar com clique no card
  const handleClick = async () => {
    // Rastreia o clique
    trackClick(id)

    // Se for premium e tiver callback de desbloqueio
    if (is_premium && onUnlock) {
      onUnlock(channel)
      return
    }

    // Se for premium sem callback, mostra mensagem
    if (is_premium && !isAuthenticated) {
      toast.error('Conteúdo premium! Faça login para acessar.')
      navigate('/login')
      return
    }

    // Abre o link do Telegram
    window.open(telegram_link, '_blank', 'noopener,noreferrer')
  }

  // Define cor e ícone do nível
  const getLevelInfo = (level) => {
    const levels = {
      iniciante: { color: '#6B7280', icon: '🔰', label: 'Iniciante' },
      mediano: { color: '#F59E0B', icon: '🔶', label: 'Mediano' },
      veterano: { color: '#3B82F6', icon: '🚀', label: 'Veterano' },
      mestre: { color: '#8B5CF6', icon: '⚜️', label: 'Mestre' },
      legendario: { color: '#DC2626', icon: '🔱', label: 'Legendário' }
    }
    return levels[level?.toLowerCase()] || levels.iniciante
  }

  const levelInfo = getLevelInfo(level)

  // Formata número de membros
  const formatMembers = (count) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`
    return count.toString()
  }

  // Componente de imagem com fallback
  const ChannelImage = () => (
    <div className="channel-card__image">
      {!imageError && image ? (
        <img 
          src={image} 
          alt={name}
          onError={() => setImageError(true)}
          loading="lazy"
        />
      ) : (
        <div className="image-placeholder">
          <Lock size={48} />
        </div>
      )}
      
      {/* Blur overlay para criar mistério */}
      <div className={`image-overlay ${isHovered ? 'hovered' : ''}`}>
        {is_premium && (
          <div className="premium-badge">
            <Crown size={16} />
            Premium
          </div>
        )}
      </div>

      {/* Botão de ação no hover */}
      <motion.div 
        className="hover-action"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 20 }}
        transition={{ duration: 0.2 }}
      >
        <button className="unlock-button" onClick={handleClick}>
          {is_premium ? (
            <>
              <Lock size={20} />
              Desbloquear
            </>
          ) : (
            <>
              <Unlock size={20} />
              Acessar Agora
            </>
          )}
        </button>
      </motion.div>
    </div>
  )

  // Renderização baseada na variante
  if (variant === 'compact') {
    return (
      <motion.article 
        className="channel-card channel-card--compact"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        onClick={handleClick}
      >
        <ChannelImage />
        <div className="channel-card__content">
          <h3 className="channel-name">{name}</h3>
          <div className="channel-stats-compact">
            <span><Users size={14} /> {formatMembers(members_count)}</span>
            <span className="level-badge" style={{ color: levelInfo.color }}>
              {levelInfo.icon}
            </span>
          </div>
        </div>
      </motion.article>
    )
  }

  return (
    <motion.article 
      className={`channel-card channel-card--${variant}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -8 }}
      transition={{ duration: 0.3 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <ChannelImage />

      <div className="channel-card__content">
        {/* Categoria e Estado */}
        <div className="channel-meta">
          <span className="channel-category">{category}</span>
          {state && (
            <span className="channel-location">
              <MapPin size={12} />
              {state}
            </span>
          )}
        </div>

        {/* Nome do canal */}
        <h3 className="channel-name">
          {name}
          {is_verified && (
            <span className="verified-badge" title="Verificado">
              ✓
            </span>
          )}
        </h3>

        {/* Descrição (apenas em featured) */}
        {variant === 'featured' && description && (
          <p className="channel-description">
            {description.length > 100 
              ? `${description.substring(0, 100)}...` 
              : description
            }
          </p>
        )}

        {/* Estatísticas */}
        {showStats && (
          <div className="channel-stats">
            <div className="stat-item">
              <Users size={16} />
              <span>{formatMembers(members_count)}</span>
            </div>
            <div className="stat-item">
              <Eye size={16} />
              <span>{formatMembers(clicks)}</span>
            </div>
            <div 
              className="stat-item level"
              style={{ color: levelInfo.color }}
              title={levelInfo.label}
            >
              <span className="level-icon">{levelInfo.icon}</span>
              <span className="level-label">{levelInfo.label}</span>
            </div>
          </div>
        )}

        {/* Botão de ação */}
        <motion.button 
          className={`channel-action ${is_premium ? 'premium' : 'free'}`}
          onClick={handleClick}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {is_premium ? (
            <>
              <Crown size={18} />
              Conteúdo Premium
            </>
          ) : (
            <>
              <ExternalLink size={18} />
              Acessar Grupo
            </>
          )}
        </motion.button>
      </div>

      {/* Indicadores visuais */}
      <div className="channel-indicators">
        {is_premium && (
          <div className="indicator premium">
            <Crown size={14} />
          </div>
        )}
        {members_count > 10000 && (
          <div className="indicator hot">
            <TrendingUp size={14} />
          </div>
        )}
      </div>
    </motion.article>
  )
}

// Componente de Skeleton Loading
export const ChannelCardSkeleton = () => (
  <div className="channel-card channel-card--skeleton">
    <div className="skeleton-image" />
    <div className="skeleton-content">
      <div className="skeleton-meta" />
      <div className="skeleton-title" />
      <div className="skeleton-stats" />
      <div className="skeleton-button" />
    </div>
  </div>
)

// Grid de cards com animação escalonada
export const ChannelGrid = ({ channels, loading, variant = 'default' }) => {
  if (loading) {
    return (
      <div className="channel-grid">
        {[...Array(6)].map((_, i) => (
          <ChannelCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  return (
    <motion.div 
      className="channel-grid"
      initial="hidden"
      animate="visible"
      variants={{
        visible: {
          transition: {
            staggerChildren: 0.05
          }
        }
      }}
    >
      {channels.map((channel) => (
        <ChannelCard 
          key={channel.id} 
          channel={channel}
          variant={variant}
        />
      ))}
    </motion.div>
  )
}

export default ChannelCard
